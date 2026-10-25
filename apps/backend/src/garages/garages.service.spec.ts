import { GaragesService } from './garages.service';
import { GeocodingError } from '../geocoding/geocoding-provider.interface';

const ORIGIN = { lat: 45.5, lng: -73.5 };

/** `n` km north of the origin (1° of latitude ≈ 111 km). */
const garageAt = (n: number, overrides: Record<string, unknown> = {}) => ({
  id: `g-${n}-${Math.random()}`,
  name: `Garage ${n}`,
  address: 'x',
  lat: ORIGIN.lat + n / 111,
  lng: ORIGIN.lng,
  rating: null,
  reviewCount: null,
  specialties: [] as string[],
  email: null,
  phone: null,
  certifications: [],
  hours: null,
  ...overrides,
});

function setup(rows: ReturnType<typeof garageAt>[], discoveryEnabled: boolean) {
  const prisma = { garage: { findMany: jest.fn().mockResolvedValue(rows) } };
  const geocoding = { geocode: jest.fn().mockResolvedValue(ORIGIN) };
  const discovery = { usesRealGarageData: discoveryEnabled, ensureNear: jest.fn().mockResolvedValue(undefined) };
  const service = new GaragesService(prisma as never, geocoding as never, discovery as never);
  return { prisma, geocoding, discovery, service };
}

describe('GaragesService.searchNearPostalCode', () => {
  it('discovers garages around the origin before reading them', async () => {
    const { discovery, service } = setup([], true);

    await service.searchNearPostalCode('H2X 1Y4', 25);

    expect(discovery.ensureNear).toHaveBeenCalledWith(ORIGIN, 25);
  });

  it('hides demo garages only when real discovery is on', async () => {
    const on = setup([], true);
    await on.service.searchNearPostalCode('H2X 1Y4', 15);
    expect(on.prisma.garage.findMany.mock.calls[0][0].where.source).toEqual({ not: 'demo' });

    const off = setup([], false);
    await off.service.searchNearPostalCode('H2X 1Y4', 15);
    expect(off.prisma.garage.findMany.mock.calls[0][0].where.source).toBeUndefined();
  });

  it('keeps only garages within the radius, nearest first', async () => {
    const { service } = setup([garageAt(12), garageAt(3), garageAt(40)], false);

    const { results } = await service.searchNearPostalCode('H2X 1Y4', 15);

    expect(results.map((r) => r.distanceKm)).toEqual([3, 12]);
  });

  it('keeps garages that list no services when filtering by specialty, and drops mismatches', async () => {
    const { service } = setup(
      [
        garageAt(1, { name: 'Unknown services' }),
        garageAt(2, { name: 'Brakes', specialties: ['Freins'] }),
        garageAt(3, { name: 'Tyres only', specialties: ['Pneus'] }),
      ],
      true,
    );

    const { results } = await service.searchNearPostalCode('H2X 1Y4', 15, 'freins');

    expect(results.map((r) => r.name)).toEqual(['Unknown services', 'Brakes']);
  });

  it('returns at most the 30 nearest garages', async () => {
    const rows = Array.from({ length: 45 }, (_, i) => garageAt((i + 1) / 5));
    const { service } = setup(rows, true);

    const { results } = await service.searchNearPostalCode('H2X 1Y4', 50);

    expect(results).toHaveLength(30);
    expect(results[0].distanceKm).toBeLessThanOrEqual(results[29].distanceKm);
    expect(results[29].distanceKm).toBeLessThanOrEqual(6.1);
  });
});

describe('GaragesService.addByUser', () => {
  const POINT = { lat: 47.0598, lng: -70.8493 };
  const dto = { name: 'NAPA AUTOPRO – Atelier A et R', street: '485 Avenue Royale', city: 'Saint-Joachim', postalCode: 'g0a 3x0', phone: '4188275939' };

  function setupAdd(nearby: Record<string, unknown>[] = [], addedToday = 0) {
    const prisma = {
      garage: {
        count: jest.fn().mockResolvedValue(addedToday),
        findMany: jest.fn().mockResolvedValue(nearby),
        create: jest.fn().mockImplementation(({ data }) => Promise.resolve({ id: 'new-id', ...data })),
      },
    };
    const geocoding = { geocode: jest.fn().mockResolvedValue(POINT) };
    const service = new GaragesService(prisma as never, geocoding as never, {} as never);
    return { prisma, geocoding, service };
  }

  it('geocodes the full address and stores a user garage at that spot', async () => {
    const { prisma, geocoding, service } = setupAdd();

    const { garage, created } = await service.addByUser('user-1', dto);

    expect(geocoding.geocode).toHaveBeenCalledWith('485 Avenue Royale, Saint-Joachim G0A 3X0, Canada');
    expect(created).toBe(true);
    expect(garage).toMatchObject({
      name: 'NAPA AUTOPRO – Atelier A et R',
      address: '485 Avenue Royale, Saint-Joachim G0A 3X0',
      lat: POINT.lat,
      lng: POINT.lng,
      phone: '+1 418-827-5939',
      source: 'user',
    });
    expect(prisma.garage.create.mock.calls[0][0].data.externalPlaceId).toMatch(/^user-1:/);
  });

  it('returns the existing garage instead of a duplicate (same name, next door)', async () => {
    const existing = { id: 'old', name: 'Napa Autopro – Atelier A et R', phone: null, lat: POINT.lat + 0.0003, lng: POINT.lng };
    const { prisma, service } = setupAdd([existing]);

    const result = await service.addByUser('user-1', dto);

    expect(result).toEqual({ garage: existing, created: false });
    expect(prisma.garage.create).not.toHaveBeenCalled();
  });

  it('treats the same phone number nearby as the same garage even under another name', async () => {
    const existing = { id: 'old', name: 'Mécanique A&R', phone: '+1 418-827-5939', lat: POINT.lat, lng: POINT.lng };
    const { service } = setupAdd([existing]);

    expect((await service.addByUser('user-1', dto)).created).toBe(false);
  });

  it('adds a garage that merely shares a name with one far away', async () => {
    const farAway = { id: 'far', name: dto.name, phone: null, lat: POINT.lat + 0.5, lng: POINT.lng };
    const { service } = setupAdd([farAway]);

    expect((await service.addByUser('user-1', dto)).created).toBe(true);
  });

  it('refuses an address it cannot find, with a message the user can act on', async () => {
    const { geocoding, service } = setupAdd();
    geocoding.geocode.mockRejectedValue(new GeocodingError('x'));

    await expect(service.addByUser('user-1', dto)).rejects.toThrow(/Adresse introuvable/);
  });

  it('limits how many garages one person adds per day', async () => {
    const { prisma, service } = setupAdd([], 10);

    await expect(service.addByUser('user-1', dto)).rejects.toMatchObject({ status: 429 });
    expect(prisma.garage.create).not.toHaveBeenCalled();
  });
});
