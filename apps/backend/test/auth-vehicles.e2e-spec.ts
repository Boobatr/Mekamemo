import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Auth + Vehicles (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;

  const email = `marc.lavoie.${Date.now()}@courriel.ca`;
  const password = 'motdepasse123';

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    await app.init();
    prisma = app.get(PrismaService);
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  let accessToken: string;

  it('registers a new user and returns a JWT', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        fullName: 'Marc Lavoie',
        phone: '+1 514 555 0142',
        postalCode: 'H2X 1Y4',
        searchRadiusKm: 15,
        language: 'fr',
      })
      .expect(201);

    expect(res.body.accessToken).toEqual(expect.any(String));
    accessToken = res.body.accessToken;
  });

  it('rejects a second registration with the same email', async () => {
    await request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password,
        fullName: 'Marc Lavoie',
        phone: '+1 514 555 0142',
        postalCode: 'H2X 1Y4',
        searchRadiusKm: 15,
        language: 'fr',
      })
      .expect(409);
  });

  it('logs in with correct credentials', async () => {
    const res = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password })
      .expect(200);
    expect(res.body.accessToken).toEqual(expect.any(String));
  });

  it('rejects login with a wrong password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrong-password' })
      .expect(401);
  });

  it('rejects unauthenticated access to the profile', async () => {
    await request(app.getHttpServer()).get('/users/me').expect(401);
  });

  it('returns the profile with confirmBeforeBooking locked to true', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.email).toBe(email);
    expect(res.body.confirmBeforeBooking).toBe(true);
  });

  it('rejects an attempt to set confirmBeforeBooking via the update endpoint', async () => {
    await request(app.getHttpServer())
      .patch('/users/me')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ confirmBeforeBooking: false })
      .expect(400);
  });

  let vehicleId: string;

  it('creates a vehicle with an initial mileage reading', async () => {
    const res = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vin: '2T3W1RFV8MW123456',
        make: 'Toyota',
        model: 'RAV4',
        trim: 'LE',
        year: 2021,
        engine: '2,5 L I4',
        usageType: 'mixed',
        odometerKm: 64200,
      })
      .expect(201);

    expect(res.body.make).toBe('Toyota');
    vehicleId = res.body.id;

    const readings = await prisma.mileageReading.findMany({ where: { vehicleId } });
    expect(readings).toHaveLength(1);
    expect(readings[0].valueKm).toBe(64200);
    expect(readings[0].source).toBe('manual');
  });

  it('lists only the current user’s vehicles', async () => {
    const res = await request(app.getHttpServer())
      .get('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body).toHaveLength(1);
    expect(res.body[0].id).toBe(vehicleId);
  });

  it('forbids another user from reading this vehicle', async () => {
    const otherEmail = `other.${Date.now()}@courriel.ca`;
    const otherRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: otherEmail,
      password,
      fullName: 'Julie Tremblay',
      phone: '+1 514 555 9999',
      postalCode: 'H1A 1A1',
      searchRadiusKm: 10,
      language: 'fr',
    });

    await request(app.getHttpServer())
      .get(`/vehicles/${vehicleId}`)
      .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
      .expect(403);

    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });
});
