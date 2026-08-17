import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Subscriptions and plan gating (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let userId: string;

  const email = `subs.${Date.now()}@courriel.ca`;

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
    userId = registerRes.body.userId;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('starts on the free plan with no active status', async () => {
    const res = await request(app.getHttpServer())
      .get('/users/me/subscription')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.plan).toBe('free');
    expect(res.body.status).toBe('none');
  });

  it('allows exactly one vehicle on the free plan, then blocks a second', async () => {
    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ make: 'Toyota', model: 'RAV4', year: 2021, usageType: 'mixed', odometerKm: 64200 })
      .expect(201);

    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ make: 'Honda', model: 'Civic', year: 2018, usageType: 'mixed', odometerKm: 128940 })
      .expect(403);
  });

  it('upgrades to MEKAMEMO+ via the RevenueCat webhook, then lifts the vehicle limit', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/revenuecat')
      .send({
        event: {
          type: 'INITIAL_PURCHASE',
          app_user_id: userId,
          store: 'APP_STORE',
          expiration_at_ms: Date.now() + 365 * 24 * 60 * 60 * 1000,
        },
      })
      .expect(201);

    const subRes = await request(app.getHttpServer())
      .get('/users/me/subscription')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(subRes.body.plan).toBe('mekamemo_plus');
    expect(subRes.body.status).toBe('active');

    await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ make: 'Honda', model: 'Civic', year: 2018, usageType: 'mixed', odometerKm: 128940 })
      .expect(201);
  });

  it('reverts to free on an EXPIRATION event', async () => {
    await request(app.getHttpServer())
      .post('/webhooks/revenuecat')
      .send({ event: { type: 'EXPIRATION', app_user_id: userId } })
      .expect(201);

    const subRes = await request(app.getHttpServer())
      .get('/users/me/subscription')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(subRes.body.plan).toBe('free');
    expect(subRes.body.status).toBe('expired');
  });
});
