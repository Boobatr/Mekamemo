import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from '../src/app.module';
import { PrismaService } from '../src/prisma/prisma.service';
import { EMAIL_PROVIDER } from '../src/quotes/email-provider.interface';

describe('Quote requests carry the maintenance item and the user edits (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  const sent: { to: string; subject: string; body: string }[] = [];

  let token: string;
  let userId: string;
  let vehicleId: string;
  let taskId: string;
  let diagnosisId: string;
  let withEmailId: string;
  let withoutEmailId: string;

  const email = `quote-message.${Date.now()}@courriel.ca`;
  const auth = () => ({ Authorization: `Bearer ${token}` });
  const api = () => request(app.getHttpServer());

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({ imports: [AppModule] })
      .overrideProvider(EMAIL_PROVIDER)
      .useValue({
        send: async (message: { to: string; subject: string; body: string }) => {
          sent.push(message);
        },
      })
      .compile();
    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
    prisma = app.get(PrismaService);

    const registerRes = await api().post('/auth/register').send({
      email,
      password: 'motdepasse123',
      fullName: 'Marc Lavoie',
      phone: '+1 514 555 0142',
      postalCode: 'H2X 1Y4',
      searchRadiusKm: 15,
      language: 'fr',
    });
    token = registerRes.body.accessToken;
    userId = registerRes.body.userId;

    const vehicleRes = await api()
      .post('/vehicles')
      .set(auth())
      .send({ make: 'Toyota', model: 'RAV4', year: 2021, usageType: 'mixed', odometerKm: 64200 });
    vehicleId = vehicleRes.body.id;

    const task = await prisma.maintenanceTask.create({
      data: {
        vehicleId,
        name: 'Vidange d’huile et filtre',
        notesForGarage: 'Huile 0W-20 synthétique',
        projection: { create: { projectedDueKm: 70000, projectedDueDate: new Date('2026-11-12T12:00:00Z') } },
      },
    });
    taskId = task.id;

    const report = await prisma.breakdownReport.create({ data: { vehicleId, descriptionText: 'Grincement au freinage', tags: [] } });
    const diagnosis = await prisma.diagnosis.create({
      data: {
        reportId: report.id,
        primaryCause: 'Plaquettes usées',
        confidence: 'medium',
        secondaryCauses: [],
        recommendedDelay: '1 semaine',
        costMinCents: 20000,
        costMaxCents: 40000,
        safetyNote: '',
        disclaimer: '',
        modelVersion: 'test',
      },
    });
    diagnosisId = diagnosis.id;

    withEmailId = (await prisma.garage.findFirstOrThrow({ where: { name: 'Garage Précision' } })).id;
    withoutEmailId = (await prisma.garage.findFirstOrThrow({ where: { name: 'Atelier Rosemont' } })).id;
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: { contains: email } } });
    await app.close();
  });

  beforeEach(() => {
    sent.length = 0;
  });

  describe('preview', () => {
    it('includes the maintenance item, its notes and the vehicle mileage', async () => {
      const res = await api().post('/quote-requests/preview').set(auth()).send({ vehicleId, garageId: withEmailId, taskId }).expect(201);

      expect(res.body.subject).toBe('Demande de soumission — Vidange d’huile et filtre — Toyota RAV4 2021');
      expect(res.body.body).toContain('Entretien : Vidange d’huile et filtre');
      expect(res.body.body).toContain('Précisions : Huile 0W-20 synthétique');
      expect(res.body.body).toMatch(/Kilométrage : 64\s200 km/);
      expect(res.body.body).toMatch(/Échéance : 12 novembre 2026/);
    });

    it('includes the reported breakdown when the request comes from a diagnosis', async () => {
      const res = await api().post('/quote-requests/preview').set(auth()).send({ vehicleId, garageId: withEmailId, diagnosisId }).expect(201);

      expect(res.body.body).toContain('Problème signalé : Grincement au freinage');
      expect(res.body.body).toContain('Plaquettes usées');
    });

    it("refuses an item or diagnosis that isn't on this vehicle", async () => {
      const unknown = '00000000-0000-4000-8000-000000000000';
      await api().post('/quote-requests/preview').set(auth()).send({ vehicleId, garageId: withEmailId, taskId: unknown }).expect(404);
      await api().post('/quote-requests/preview').set(auth()).send({ vehicleId, garageId: withEmailId, diagnosisId: unknown }).expect(404);
    });
  });

  describe('sending', () => {
    it('sends the standard message, with the maintenance item, when nothing was edited', async () => {
      const res = await api().post('/quote-requests').set(auth()).send({ vehicleId, taskId, garageIds: [withEmailId] }).expect(201);

      expect(sent).toHaveLength(1);
      expect(sent[0].to).toBe('rendezvous@precision.ca');
      expect(sent[0].subject).toContain('Vidange d’huile et filtre');
      expect(sent[0].body).toContain('Entretien : Vidange d’huile et filtre');
      expect(res.body.garages[0].messageContent).toBe(sent[0].body);
    });

    it('sends exactly what the user edited, and stores it', async () => {
      const res = await api()
        .post('/quote-requests')
        .set(auth())
        .send({ vehicleId, taskId, garageIds: [withEmailId], subject: '  Ma demande\nde vidange ', message: 'Bonjour, vidange samedi svp.' })
        .expect(201);

      expect(sent[0].subject).toBe('Ma demande de vidange'); // one line, trimmed
      expect(sent[0].body).toBe('Bonjour, vidange samedi svp.');
      expect(res.body.garages[0].messageContent).toBe('Bonjour, vidange samedi svp.');
    });

    it('falls back to the standard text when the edited text is empty', async () => {
      await api().post('/quote-requests').set(auth()).send({ vehicleId, taskId, garageIds: [withEmailId], subject: '  ', message: '   ' }).expect(201);

      expect(sent[0].subject).toContain('Vidange');
      expect(sent[0].body).toContain('Entretien : Vidange d’huile et filtre');
    });

    it('refuses an over-long message and an item that is not on the vehicle', async () => {
      await api().post('/quote-requests').set(auth()).send({ vehicleId, garageIds: [withEmailId], message: 'x'.repeat(2001) }).expect(400);
      await api()
        .post('/quote-requests')
        .set(auth())
        .send({ vehicleId, taskId: '00000000-0000-4000-8000-000000000000', garageIds: [withEmailId] })
        .expect(404);
      expect(sent).toHaveLength(0);
    });

    it('limits how many garages one person can contact per day', async () => {
      // Two garages per request: 3 requests above sent 3 messages; fill up to 20, then the next is refused.
      const garageIds = [withEmailId, withoutEmailId];
      let refused = 0;
      for (let i = 0; i < 12; i++) {
        const res = await api().post('/quote-requests').set(auth()).send({ vehicleId, garageIds });
        if (res.status === 429) refused++;
      }
      expect(refused).toBeGreaterThan(0);

      const count = await prisma.quoteRequestGarage.count({ where: { quoteRequest: { userId } } });
      expect(count).toBeLessThanOrEqual(20);
    });
  });
});
