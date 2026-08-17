import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('History, invoices, task completion, resale dossier (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let vehicleId: string;
  let taskId: string;

  const email = `history.${Date.now()}@courriel.ca`;

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

    const task = await prisma.maintenanceTask.create({
      data: {
        vehicleId,
        name: "Vidange d'huile + filtre",
        intervalKm: 8000,
        intervalMonths: 6,
        isRecurring: true,
        projection: { create: { projectedDueKm: 72000 } },
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('the OCR endpoint returns null without a configured ANTHROPIC_API_KEY (forces manual entry)', async () => {
    const res = await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/ocr-odometer`)
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from([0xff, 0xd8, 0xff, 0xd9]), {
        filename: 'odometer.jpg',
        contentType: 'image/jpeg',
      })
      .expect(201);

    expect(res.body.valueKm).toBeNull();
  });

  it('completing a recurring task logs history and reschedules from the service mileage, not today’s pace', async () => {
    const res = await request(app.getHttpServer())
      .post(`/maintenance-tasks/${taskId}/complete`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        performedAt: new Date().toISOString(),
        mileageAtServiceKm: 66000,
        costCents: 9600,
      })
      .expect(201);

    expect(res.body.taskName).toBe("Vidange d'huile + filtre");
    expect(res.body.mileageAtServiceKm).toBe(66000);

    const task = await prisma.maintenanceTask.findUniqueOrThrow({
      where: { id: taskId },
      include: { projection: true },
    });
    expect(task.status).toBe('upcoming');
    expect(task.projection!.projectedDueKm).toBe(66000 + 8000); // rescheduled from service mileage
  });

  it('lists the history entry and exports a non-empty PDF resale dossier', async () => {
    const listRes = await request(app.getHttpServer())
      .get(`/vehicles/${vehicleId}/history`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(listRes.body).toHaveLength(1);
    const entryId = listRes.body[0].id;

    const uploadRes = await request(app.getHttpServer())
      .post('/media/upload')
      .set('Authorization', `Bearer ${accessToken}`)
      .attach('file', Buffer.from('%PDF-1.4 fake invoice'), {
        filename: 'facture.pdf',
        contentType: 'application/pdf',
      });

    await request(app.getHttpServer())
      .post(`/history/${entryId}/invoices`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ fileUrl: uploadRes.body.url })
      .expect(201);

    // Resale dossier export is a MEKAMEMO+ feature — blocked on the free plan.
    await request(app.getHttpServer())
      .get(`/vehicles/${vehicleId}/history/export`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(403);

    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    await prisma.subscription.update({
      where: { userId: user.id },
      data: { plan: 'mekamemo_plus', status: 'active' },
    });

    const exportRes = await request(app.getHttpServer())
      .get(`/vehicles/${vehicleId}/history/export`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(exportRes.headers['content-type']).toContain('application/pdf');
    expect(exportRes.body.length).toBeGreaterThan(100);
  });

  it('forbids another user from reading this vehicle’s history', async () => {
    const otherEmail = `other-history.${Date.now()}@courriel.ca`;
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
      .get(`/vehicles/${vehicleId}/history`)
      .set('Authorization', `Bearer ${otherRes.body.accessToken}`)
      .expect(403);

    await prisma.user.deleteMany({ where: { email: otherEmail } });
  });
});
