import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Garage search, quotes, and bookings (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let vehicleId: string;
  let precisionGarageId: string;
  let rosemontGarageId: string;

  const email = `garages.${Date.now()}@courriel.ca`;

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

    const registerRes = await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: 'motdepasse123',
      fullName: 'Marc Lavoie',
      phone: '+1 514 555 0142',
      postalCode: 'H2X 1Y4',
      searchRadiusKm: 15,
      language: 'fr',
    });
    accessToken = registerRes.body.accessToken;

    const vehicleRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ make: 'Toyota', model: 'RAV4', year: 2021, usageType: 'mixed', odometerKm: 64200 });
    vehicleId = vehicleRes.body.id;

    const precision = await prisma.garage.findFirstOrThrow({ where: { name: 'Garage Précision' } });
    const rosemont = await prisma.garage.findFirstOrThrow({ where: { name: 'Atelier Rosemont' } });
    precisionGarageId = precision.id;
    rosemontGarageId = rosemont.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('finds seeded garages within the user’s radius, filtered by specialty keyword', async () => {
    const res = await request(app.getHttpServer())
      .get('/garages/search')
      .query({ query: 'vidange svp' })
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.results.length).toBeGreaterThanOrEqual(3);
    expect(res.body.assistantSummary).toMatch(/garage/i);
    const names = res.body.results.map((g: { name: string }) => g.name);
    expect(names).toContain('Garage Précision');
  });

  let quoteRequestId: string;
  let bookingId: string;

  it('creates a quote request and dispatches to garages by contact method', async () => {
    const res = await request(app.getHttpServer())
      .post('/quote-requests')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ vehicleId, garageIds: [precisionGarageId, rosemontGarageId] })
      .expect(201);

    quoteRequestId = res.body.id;
    const links = res.body.garages;
    expect(links).toHaveLength(2);

    const precisionLink = links.find((l: { garageId: string }) => l.garageId === precisionGarageId);
    const rosemontLink = links.find((l: { garageId: string }) => l.garageId === rosemontGarageId);
    expect(precisionLink.contactMethod).toBe('email'); // has an email on file
    expect(rosemontLink.contactMethod).toBe('voice'); // no email on file
  });

  it('auto-proposes a pending (unconfirmed) booking once a garage response arrives', async () => {
    const quoteRequest = await prisma.quoteRequest.findUniqueOrThrow({
      where: { id: quoteRequestId },
      include: { garages: true },
    });
    const precisionLink = quoteRequest.garages.find((g) => g.garageId === precisionGarageId)!;

    const slotDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    await request(app.getHttpServer())
      .post('/webhooks/garage-response')
      .send({
        quoteRequestGarageId: precisionLink.id,
        rawContent: 'Disponible samedi 9h, 95$',
        parsedSlots: [{ startsAt: slotDate, priceCents: 9500 }],
        priceCents: 9500,
        channel: 'email',
      })
      .expect(201);

    const booking = await prisma.booking.findFirst({ where: { quoteRequestId } });
    expect(booking).not.toBeNull();
    expect(booking!.status).toBe('pending_user_confirmation');
    expect(booking!.confirmedByUserId).toBeNull();
    expect(booking!.priceCents).toBe(9500);
    bookingId = booking!.id;
  });

  it('forbids another user from confirming this booking', async () => {
    const otherEmail = `other-garages.${Date.now()}@courriel.ca`;
    const otherRes = await request(app.getHttpServer()).post('/auth/register').send({
      email: otherEmail,
      password: 'motdepasse123',
      fullName: 'Julie Tremblay',
      phone: '+1 514 555 9999',
      postalCode: 'H1A 1A1',
      searchRadiusKm: 10,
      language: 'fr',
    });

    await request(app.getHttpServer())
      .post(`/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
      .expect(403);

    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });

  it('never auto-confirms — the booking stays pending until the explicit confirm call', async () => {
    const booking = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    expect(booking.status).toBe('pending_user_confirmation');
  });

  it('confirms the booking only via the explicit endpoint, setting the cancellation deadline', async () => {
    const res = await request(app.getHttpServer())
      .post(`/bookings/${bookingId}/confirm`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.status).toBe('confirmed');
    expect(res.body.confirmedByUserId).not.toBeNull();
    expect(new Date(res.body.cancellationDeadlineAt).getTime()).toBeLessThan(
      new Date(res.body.confirmedSlotAt).getTime(),
    );
  });

  it('a later, cheaper response never touches an already-confirmed booking', async () => {
    const quoteRequest = await prisma.quoteRequest.findUniqueOrThrow({
      where: { id: quoteRequestId },
      include: { garages: true },
    });
    const rosemontLink = quoteRequest.garages.find((g) => g.garageId === rosemontGarageId)!;

    await request(app.getHttpServer())
      .post('/webhooks/garage-response')
      .send({
        quoteRequestGarageId: rosemontLink.id,
        rawContent: 'On peut vous prendre demain, 60$',
        parsedSlots: [{ startsAt: new Date(Date.now() + 86400000).toISOString(), priceCents: 6000 }],
        priceCents: 6000,
        channel: 'email',
      })
      .expect(201);

    const bookingAfter = await prisma.booking.findUniqueOrThrow({ where: { id: bookingId } });
    expect(bookingAfter.status).toBe('confirmed');
    expect(bookingAfter.priceCents).toBe(9500); // unchanged despite the cheaper later offer

    // No pending_user_confirmation booking existed to update, so the new offer becomes
    // its own separate pending proposal — it never overwrites the confirmed one.
    const allBookings = await prisma.booking.findMany({ where: { quoteRequestId } });
    expect(allBookings).toHaveLength(2);
    expect(allBookings.filter((b) => b.status === 'confirmed')).toHaveLength(1);
    expect(allBookings.filter((b) => b.status === 'pending_user_confirmation')).toHaveLength(1);
  });
});
