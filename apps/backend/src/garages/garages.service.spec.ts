import { GaragesService } from './garages.service';

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
  const discovery = { enabled: discoveryEnabled, ensureNear: jest.fn().mockResolvedValue(undefined) };
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
