import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';

describe('Mileage projection (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let accessToken: string;
  let vehicleId: string;
  let taskId: string;

  const email = `mileage.${Date.now()}@courriel.ca`;

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
      .send({
        make: 'Toyota',
        model: 'RAV4',
        year: 2021,
        usageType: 'mixed',
        odometerKm: 64200,
      });
    vehicleId = vehicleRes.body.id;

    // Calendar generation is a separate module (task #5); here we seed the task
    // this projection engine operates on directly, exactly as that module will.
    const task = await prisma.maintenanceTask.create({
      data: {
        vehicleId,
        name: "Vidange d'huile + filtre",
        intervalKm: 8000,
        intervalMonths: 6,
        projection: { create: { projectedDueKm: 72000 } },
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('has no average yet from a single reading, and projects from the default assumed pace', async () => {
    const res = await request(app.getHttpServer())
      .get(`/vehicles/${vehicleId}/mileage/pace`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    expect(res.body.readingsCount).toBe(1);
    expect(res.body.isPaceEstimated).toBe(true);
    expect(res.body.currentKm).toBe(64200);
  });

  it('computes a real average and a fixed km target once a second reading arrives', async () => {
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/readings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({
        valueKm: 65580,
        source: 'manual',
        recordedAt: new Date().toISOString(),
      })
      .expect(201);

    const projection = await prisma.taskProjection.findUnique({ where: { taskId } });
    expect(projection!.projectedDueKm).toBe(72000); // km target untouched by the reading
    expect(projection!.avgKmPerMonthUsed).not.toBeNull();
    expect(projection!.projectedDueDate).not.toBeNull();
  });

  it('the projected date recedes on its own when a later reading shows a slower pace', async () => {
    const beforeProjection = await prisma.taskProjection.findUnique({ where: { taskId } });
    const dateBefore = beforeProjection!.projectedDueDate!.getTime();

    // Barely any distance covered since the last reading — pace drops sharply.
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/readings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valueKm: 65600, source: 'manual', recordedAt: new Date().toISOString() })
      .expect(201);

    const afterProjection = await prisma.taskProjection.findUnique({ where: { taskId } });
    expect(afterProjection!.projectedDueDate!.getTime()).toBeGreaterThan(dateBefore);
  });

  it('marks the task overdue once the odometer passes the fixed km target, without moving the target', async () => {
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/readings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valueKm: 72500, source: 'manual', recordedAt: new Date().toISOString() })
      .expect(201);

    const task = await prisma.maintenanceTask.findUnique({
      where: { id: taskId },
      include: { projection: true },
    });
    expect(task!.status).toBe('overdue');
    expect(task!.projection!.projectedDueKm).toBe(72000);
    expect(task!.projection!.projectedDueDate).toBeNull();
  });
});
