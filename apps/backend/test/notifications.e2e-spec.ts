import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { NotificationsService } from '../src/notifications/notifications.service';

describe('Notifications (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let notificationsService: NotificationsService;
  let accessToken: string;
  let userId: string;
  let vehicleId: string;
  let taskId: string;

  const email = `notifications.${Date.now()}@courriel.ca`;

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
    notificationsService = app.get(NotificationsService);

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
        projection: { create: { projectedDueKm: 72000 } },
      },
    });
    taskId = task.id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email } });
    await app.close();
  });

  it('creates both reminders once the task has a projected date', async () => {
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/readings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valueKm: 65580, source: 'manual', recordedAt: new Date().toISOString() })
      .expect(201);

    const reminders = await prisma.notification.findMany({
      where: { relatedEntityId: taskId },
    });
    expect(reminders).toHaveLength(2);
    expect(reminders.map((r) => r.type).sort()).toEqual([
      'maintenance_reminder_7d',
      'maintenance_reminder_due',
    ]);

    const dueReminder = reminders.find((r) => r.type === 'maintenance_reminder_due')!;
    const sevenDayReminder = reminders.find((r) => r.type === 'maintenance_reminder_7d')!;
    expect(sevenDayReminder.scheduledFor.getTime()).toBeLessThan(dueReminder.scheduledFor.getTime());
  });

  it('updates the existing reminders in place rather than duplicating them', async () => {
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/readings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valueKm: 65900, source: 'manual', recordedAt: new Date().toISOString() })
      .expect(201);

    const reminders = await prisma.notification.findMany({ where: { relatedEntityId: taskId } });
    expect(reminders).toHaveLength(2);
  });

  it('removes pending reminders once the task becomes overdue (no date to remind about)', async () => {
    await request(app.getHttpServer())
      .post(`/vehicles/${vehicleId}/mileage/readings`)
      .set('Authorization', `Bearer ${accessToken}`)
      .send({ valueKm: 72500, source: 'manual', recordedAt: new Date().toISOString() })
      .expect(201);

    const reminders = await prisma.notification.findMany({ where: { relatedEntityId: taskId } });
    expect(reminders).toHaveLength(0);
  });

  it('dispatches due notifications and marks them sent, skipping future ones', async () => {
    const past = await prisma.notification.create({
      data: {
        userId,
        vehicleId,
        type: 'mileage_prompt',
        scheduledFor: new Date(Date.now() - 60_000),
        locale: 'fr',
        payload: { vehicleLabel: 'RAV4' },
      },
    });
    const future = await prisma.notification.create({
      data: {
        userId,
        vehicleId,
        type: 'mileage_prompt',
        scheduledFor: new Date(Date.now() + 60 * 60 * 1000),
        locale: 'fr',
        payload: { vehicleLabel: 'RAV4' },
      },
    });

    const dispatchedCount = await notificationsService.dispatchDue();
    expect(dispatchedCount).toBeGreaterThanOrEqual(1);

    const pastAfter = await prisma.notification.findUnique({ where: { id: past.id } });
    const futureAfter = await prisma.notification.findUnique({ where: { id: future.id } });
    expect(pastAfter!.sentAt).not.toBeNull();
    expect(futureAfter!.sentAt).toBeNull();
  });

  it('exposes notifications through the authenticated list endpoint and supports marking read', async () => {
    const res = await request(app.getHttpServer())
      .get('/notifications')
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);
    expect(res.body.length).toBeGreaterThan(0);

    const notificationId = res.body[0].id;
    await request(app.getHttpServer())
      .patch(`/notifications/${notificationId}/read`)
      .set('Authorization', `Bearer ${accessToken}`)
      .expect(200);

    const updated = await prisma.notification.findUnique({ where: { id: notificationId } });
    expect(updated!.readAt).not.toBeNull();
  });
});
