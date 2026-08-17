import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { UPLOADS_DIR } from '../src/media/local-disk-storage.provider';

describe('Breakdown + diagnosis (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let vehicleId: string;

  const email = `breakdown.${Date.now()}@courriel.ca`;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestExpressApplication>();
    app.useGlobalPipes(
      new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }),
    );
    app.useStaticAssets(UPLOADS_DIR, { prefix: '/uploads/' });
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
      .send({ make: 'Toyota', model: 'RAV4', year: 2021, usageType: 'mixed', odometerKm: 65400 });
    vehicleId = vehicleRes.body.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('uploads a photo and returns a servable URL', async () => {
    const res = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: 'odometer.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(res.body.url).toMatch(/^\/uploads\/.+\.jpg$/);

    await request(app.getHttpServer()).get(res.body.url).expect(200).expect('Content-Type', /image\/jpeg/);
  });

  it('creates a breakdown report with attachments', async () => {
    const uploadRes = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: 'brakes.jpg',
        contentType: 'image/jpeg',
      });

    const res = await request(app.getHttpServer())
      .post('/breakdown-reports')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vehicleId,
        descriptionText: 'Bruit de grincement quand je freine à basse vitesse.',
        tags: ['onBraking', 'sinceWhen'],
        urgent: false,
        attachments: [{ type: 'photo', url: uploadRes.body.url }],
      })
      .expect(201);

    expect(res.body.attachments).toHaveLength(1);
  });

  it('always returns the disclaimer, even from the fallback (no API key) provider', async () => {
    const reportRes = await request(app.getHttpServer())
      .post('/breakdown-reports')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        vehicleId,
        descriptionText: 'Odeur de brûlé sous le capot.',
        tags: ['odor'],
        urgent: true,
        attachments: [],
      });

    const diagnosisRes = await request(app.getHttpServer())
      .post(`/breakdown-reports/${reportRes.body.id}/analyze`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(diagnosisRes.body.disclaimer).toBe('Estimation indicative : le garage confirme au diagnostic.');
    expect(diagnosisRes.body.confidence).toBe('low');
  });

  it('forbids another user from reading this report', async () => {
    const reportRes = await request(app.getHttpServer())
      .post('/breakdown-reports')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ vehicleId, descriptionText: 'Test', tags: [], urgent: false, attachments: [] });

    const otherEmail = `other-breakdown.${Date.now()}@courriel.ca`;
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
      .get(`/breakdown-reports/${reportRes.body.id}`)
      .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
      .expect(403);

    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });
});
