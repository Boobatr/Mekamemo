import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Maintenance calendar generation (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;

  const email = `calendar.${Date.now()}@courriel.ca`;

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
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('generates a calendar with fixed km targets computed from the current odometer', async () => {
    const vehicleRes = await request(app.getHttpServer())
      .post('/vehicles')
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ make: 'Toyota', model: 'RAV4', year: 2021, usageType: 'mixed', odometerKm: 64200 })
      .expect(201);

    const res = await request(app.getHttpServer())
      .post(`/vehicles/${vehicleRes.body.id}/generate-calendar`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(201);

    expect(res.body.length).toBeGreaterThan(0);
    const oilChange = res.body.find((t: { name: string }) => /vidange/i.test(t.name));
    expect(oilChange).toBeDefined();
    expect(oilChange.projection.projectedDueKm).toBe(64200 + oilChange.intervalKm);
    expect(oilChange.projection.projectedDueDate).not.toBeNull();
  });
});
