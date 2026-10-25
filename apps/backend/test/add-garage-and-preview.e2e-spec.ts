import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Adding a garage and previewing the quote email (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let token: string;
  let vehicleId: string;
  let withEmailId: string;
  let withoutEmailId: string;

  const email = `add-garage.${Date.now()}@courriel.ca`;
  const auth = () => ({ Authorization: `Bearer ${token}` });

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: 'motdepasse123',
      fullName: 'Marc Lavoie',
      phone: '+1 514 555 0142',
      postalCode: 'H2X 1Y4',
      searchRadiusKm: 15,
      language: 'fr',
    });
    token = registerRes.body.accessToken;

    const vehicleRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set(auth())
      .send({ make: 'Toyota', model: 'RAV4', year: 2021, usageType: 'mixed', odometerKm: 64200 });
    vehicleId = vehicleRes.body.id;

    withEmailId = (await prisma.garage.findFirstOrThrow({ where: { name: 'Garage Précision' } })).id;
    withoutEmailId = (await prisma.garage.findFirstOrThrow({ where: { name: 'Atelier Rosemont' } })).id;
  });

  afterAll(async () => {
    await prisma.garage.deleteMany({ where: { source: 'user', name: { startsWith: 'E2E ' } } });
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  describe('quote email preview', () => {
    it('shows the message that would be sent, without creating a request', async () => {
      const before = await prisma.quoteRequest.count();

      const res = await request(app.getHttpServer())
        .post('/quote-requests/preview')
        .set(auth())
        .send({ vehicleId, garageId: withEmailId })
        .expect(201);

      expect(res.body).toMatchObject({ contactMethod: 'email', to: 'rendezvous@precision.ca' });
      expect(res.body.subject).toMatch(/soumission/i);
      expect(res.body.body).toMatch(/Marc Lavoie/);
      expect(res.body.body).toMatch(/Toyota RAV4 2021/);
      expect(await prisma.quoteRequest.count()).toBe(before);
    });

    it('says a voice call would be used when the garage has no email', async () => {
      const res = await request(app.getHttpServer())
        .post('/quote-requests/preview')
        .set(auth())
        .send({ vehicleId, garageId: withoutEmailId })
        .expect(201);

      expect(res.body.contactMethod).toBe('voice');
      expect(res.body.to).toBeNull();
    });

    it("refuses someone else's vehicle and an unknown garage", async () => {
      const other = await request(app.getHttpServer()).post('/auth/register').send({
        email: `other.${email}`,
        password: 'motdepasse123',
        fullName: 'Autre',
        phone: '+1 514 555 0100',
        postalCode: 'H2X 1Y4',
        searchRadiusKm: 15,
        language: 'fr',
      });
      await request(app.getHttpServer())
        .post('/quote-requests/preview')
        .set({ Authorization: `Bearer ${other.body.accessToken}` })
        .send({ vehicleId, garageId: withEmailId })
        .expect(403);
      await request(app.getHttpServer())
        .post('/quote-requests/preview')
        .set(auth())
        .send({ vehicleId, garageId: '00000000-0000-4000-8000-000000000000' })
        .expect(404);
      await prisma.user.deleteMany({ where: { email: `other.${email}` } });
    });
  });

  describe('POST /garages', () => {
    const body = { name: 'E2E Garage Test', street: '485 Avenue Royale', city: 'Saint-Joachim', postalCode: 'G0A 3X0', phone: '4188275939' };

    it('adds a garage that then shows up in the garage list and can be opened', async () => {
      const res = await request(app.getHttpServer()).post('/garages').set(auth()).send(body).expect(201);

      expect(res.body.created).toBe(true);
      expect(res.body.garage).toMatchObject({ name: 'E2E Garage Test', phone: '+1 418-827-5939', source: 'user' });
      expect(res.body.garage.address).toBe('485 Avenue Royale, Saint-Joachim G0A 3X0');

      const one = await request(app.getHttpServer()).get(`/garages/${res.body.garage.id}`).set(auth()).expect(200);
      expect(one.body.name).toBe('E2E Garage Test');
    });

    it('does not add the same garage twice', async () => {
      const again = await request(app.getHttpServer()).post('/garages').set(auth()).send(body).expect(201);

      expect(again.body.created).toBe(false);
      expect(await prisma.garage.count({ where: { name: 'E2E Garage Test' } })).toBe(1);
    });

    it('rejects incomplete or malformed input', async () => {
      await request(app.getHttpServer()).post('/garages').set(auth()).send({ name: 'E2E x' }).expect(400);
      await request(app.getHttpServer())
        .post('/garages')
        .set(auth())
        .send({ ...body, name: 'E2E Bad', postalCode: '12345' })
        .expect(400);
    });

    it('requires a signed-in user', async () => {
      await request(app.getHttpServer()).post('/garages').send(body).expect(401);
    });
  });

  describe('search around the current position', () => {
    it('uses the given position instead of the postal code, and reports the radius searched', async () => {
      const res = await request(app.getHttpServer())
        .get('/garages/search')
        .query({ query: 'garage', lat: 45.54, lng: -73.57 })
        .set(auth())
        .expect(200);

      expect(res.body.origin).toEqual({ lat: 45.54, lng: -73.57 });
      // Only the three sample garages exist near Montreal in the test database: fewer than five,
      // so the radius is widened (the real search is covered by the unit tests).
      expect(res.body.radiusKm).toBeGreaterThanOrEqual(15);
      expect(res.body.results.length).toBeGreaterThan(0);
    });

    it('widens the radius in the middle of nowhere and says so', async () => {
      const res = await request(app.getHttpServer())
        .get('/garages/search')
        .query({ query: 'garage', lat: 60, lng: -100 })
        .set(auth())
        .expect(200);

      expect(res.body.radiusKm).toBe(100);
      expect(res.body.results).toEqual([]);
      expect(res.body.assistantSummary).toMatch(/100 km/);
    });

    it('rejects a position that is not a number', async () => {
      await request(app.getHttpServer())
        .get('/garages/search')
        .query({ query: 'garage', lat: 'ici', lng: -73.57 })
        .set(auth())
        .expect(400);
    });
  });
});
