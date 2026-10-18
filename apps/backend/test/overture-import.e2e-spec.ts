import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import { gzipSync } from 'zlib';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { PrismaClient } from '@prisma/client';
import { AppModule } from '../src/app.module';
import { importOvertureGarages } from '../src/garage-import/overture-import';

// The e2e suite geocodes every postal code to downtown Montreal (no network), so fixture
// garages are placed a few hundred metres from there.
const NEAR_MONTREAL = { lat: 45.503, lng: -73.568 };

// Importing a file replaces the whole Overture dataset, so this suite must own every
// `overture` row in the test database while it runs (other suites don't create any).
describe('Overture garage import (e2e)', () => {
  const prisma = new PrismaClient();
  const dir = mkdtempSync(join(tmpdir(), 'garages-'));
  const run = `t${Date.now()}`;
  const email = `import.${run}@courriel.ca`;
  let app: INestApplication<App>;

  // Every fixture gets its own phone number: two listings with the same number at the same
  // spot are (rightly) merged into one by the search.
  let phoneCounter = 0;
  const record = (id: string, overrides: Record<string, unknown> = {}) => ({
    id: `${run}-${id}`,
    name: `Garage ${id}`,
    category: 'automotive_repair',
    street: '1 Rue Test',
    city: 'Montreal',
    region: 'QC',
    postcode: 'h2x 1y4',
    phone: `+1514555${String(1000 + phoneCounter++)}`,
    email: null,
    website: null,
    ...NEAR_MONTREAL,
    confidence: 0.9,
    ...overrides,
  });

  const dataFile = (release: string, records: object[]) => {
    const file = join(dir, `${release}.ndjson.gz`);
    const lines = [{ release, minConfidence: 0.5 }, ...records].map((line) => JSON.stringify(line));
    writeFileSync(file, gzipSync(lines.join('\n')));
    return file;
  };

  const stored = () => prisma.garage.findMany({ where: { source: 'overture' }, orderBy: { name: 'asc' } });
  const garageNamed = async (id: string) => (await stored()).find((g) => g.externalPlaceId === `${run}-${id}`);

  beforeAll(async () => {
    await prisma.garage.deleteMany({ where: { source: 'overture' } });
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, forbidNonWhitelisted: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await prisma.garage.deleteMany({ where: { source: 'overture' } });
    await prisma.garageAreaFetch.deleteMany({ where: { cellKey: { startsWith: 'overture:' + run } } });
    await prisma.user.deleteMany({ where: { email } });
    await prisma.$disconnect();
    await app.close();
    rmSync(dir, { recursive: true, force: true });
  });

  it('loads garages with normalised details and remembers the file it loaded', async () => {
    const file = dataFile(`${run}-r1`, [
      record('a', { email: 'Info@Garage-A.ca' }),
      record('b', { category: 'tire_dealer_and_repair', phone: null }),
      record('unnamed', { name: ' ' }),
    ]);

    const result = await importOvertureGarages(prisma, file);

    expect(result).toEqual({ release: `${run}-r1`, skipped: false, imported: 2, removed: 0 });
    expect(await stored()).toHaveLength(2);
    expect(await garageNamed('a')).toMatchObject({
      name: 'Garage a',
      address: '1 Rue Test, Montreal H2X 1Y4',
      phone: '+1 514-555-1000',
      email: 'info@garage-a.ca',
      specialties: [],
      certifications: [],
      source: 'overture',
    });
    expect(await garageNamed('b')).toMatchObject({ phone: null, specialties: ['Pneus'] });
  });

  it('does nothing the second time for the same file', async () => {
    const before = await stored();

    const result = await importOvertureGarages(prisma, join(dir, `${run}-r1.ndjson.gz`));

    expect(result).toMatchObject({ skipped: true, imported: 0, removed: 0 });
    expect(await stored()).toHaveLength(before.length);
  });

  it('loads a changed file even when it carries the same release name, updating rows in place', async () => {
    const before = await garageNamed('a');
    // Same release label as the first file, different content (the data was cleaned, say).
    const file = join(dir, `${run}-r1-reissue.ndjson.gz`);
    const lines = [{ release: `${run}-r1`, minConfidence: 0.5 }, record('a', { phone: '+15145551234' }), record('b')];
    writeFileSync(file, gzipSync(lines.map((l) => JSON.stringify(l)).join('\n')));

    const result = await importOvertureGarages(prisma, file);

    expect(result).toMatchObject({ skipped: false, imported: 2 });
    expect((await garageNamed('a'))?.id).toBe(before?.id);
    expect((await garageNamed('a'))?.phone).toBe('+1 514-555-1234');
  });

  it('skips only the rows the database refuses, not the whole batch', async () => {
    const real = new PrismaClient();
    const refusedBatches = jest.fn();
    // A database that rejects one bad row hidden among many: multi-row statements fail.
    const flaky = {
      garageAreaFetch: real.garageAreaFetch,
      $executeRaw: ((strings: TemplateStringsArray, ...values: unknown[]) => {
        const names = values[1] as string[]; // values[0] is the source label, then the column arrays
        if (names.length > 1) {
          refusedBatches();
          return Promise.reject(new Error('invalid byte sequence'));
        }
        if (names[0] === 'Garage bad') return Promise.reject(new Error('invalid byte sequence'));
        return real.$executeRaw(strings, ...values);
      }) as unknown as PrismaClient['$executeRaw'],
    };
    const file = dataFile(`${run}-flaky`, [record('a'), record('bad', { name: 'Garage bad' }), record('ok2')]);

    const result = await importOvertureGarages(flaky, file, { removeStale: false });

    expect(refusedBatches).toHaveBeenCalledTimes(1);
    expect(result.imported).toBe(2);
    const names = (await stored()).map((g) => g.name);
    expect(names).toContain('Garage ok2');
    expect(names).not.toContain('Garage bad');
    await real.$disconnect();
  });

  it('removes garages that left the dataset when nothing refers to them', async () => {
    expect(await garageNamed('b')).toBeDefined();
    expect(await garageNamed('ok2')).toBeDefined();

    const result = await importOvertureGarages(prisma, dataFile(`${run}-r2`, [record('a'), record('c')]));

    expect(result).toMatchObject({ skipped: false, imported: 2, removed: 2 }); // b and ok2
    expect((await stored()).map((g) => g.name)).toEqual(['Garage a', 'Garage c']);
  });

  it('keeps a garage that left the dataset if a quote request still points at it', async () => {
    const garage = (await garageNamed('a'))!;
    const registered = await request(app.getHttpServer()).post('/auth/register').send({
      email,
      password: 'motdepasse123',
      fullName: 'Import Test',
      phone: '+1 514 555 0000',
      postalCode: 'H2X 1Y4',
      searchRadiusKm: 15,
      language: 'fr',
    });
    expect(registered.status).toBe(201);
    const user = await prisma.user.findUniqueOrThrow({ where: { email } });
    const vehicle = await prisma.vehicle.create({
      data: { userId: user.id, make: 'Honda', model: 'Civic', year: 2018, usageType: 'mixed' },
    });
    await prisma.quoteRequest.create({
      data: {
        userId: user.id,
        vehicleId: vehicle.id,
        garages: { create: { garageId: garage.id, contactMethod: 'voice', language: 'fr' } },
      },
    });

    // The new file no longer lists "a", but the user's quote request refers to it.
    const result = await importOvertureGarages(prisma, dataFile(`${run}-r3`, [record('c')]));

    expect(result.removed).toBe(0);
    expect(await prisma.quoteRequestGarage.count({ where: { garageId: garage.id } })).toBe(1);
    expect((await garageNamed('a'))?.id).toBe(garage.id);
  });

  it('never wipes the dataset when given an empty file', async () => {
    const before = (await stored()).length;

    const result = await importOvertureGarages(prisma, dataFile(`${run}-empty`, []));

    expect(result).toMatchObject({ imported: 0, removed: 0 });
    expect(await stored()).toHaveLength(before);
  });

  it('serves the imported garages through the search endpoint, nearest first', async () => {
    await prisma.garage.updateMany({
      where: { externalPlaceId: `${run}-c` },
      data: { lat: 45.5017, lng: -73.5673 }, // exactly at the (fixed) search origin
    });
    const login = await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'motdepasse123' })
      .expect(200);

    const res = await request(app.getHttpServer())
      .get('/garages/search?query=garage')
      .set('Authorization', `Bearer ${login.body.accessToken}`)
      .expect(200);

    const names = res.body.results.map((r: { name: string }) => r.name);
    expect(names[0]).toBe('Garage c');
    expect(names).toContain('Garage a');
    expect(res.body.results[0].distanceKm).toBeLessThan(0.1);
  });
});
