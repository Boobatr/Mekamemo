import { OsmGarageDiscovery } from './osm-garage-discovery.service';
import type { OsmElement } from '../osm/osm-garage.mapper';

const ORIGIN = { lat: 45.5094, lng: -73.5694 };

const shop = (id: number, name?: string): OsmElement => ({
  type: 'node',
  id,
  lat: 45.5,
  lon: -73.5,
  tags: name ? { name } : {},
});

function setup(previousFetch: { fetchedAt: Date; partial: boolean } | null = null) {
  const prisma = {
    garageAreaFetch: {
      findUnique: jest.fn().mockResolvedValue(previousFetch),
      upsert: jest.fn().mockResolvedValue(undefined),
    },
    garage: { createMany: jest.fn().mockResolvedValue({ count: 0 }) },
  };
  const overpass = { fetchGarages: jest.fn().mockResolvedValue([shop(1, 'A'), shop(2, 'B'), shop(3)]) };
  const nominatim = { fetchGarages: jest.fn().mockResolvedValue([shop(4, 'C')]) };
  const service = new OsmGarageDiscovery(prisma as never, overpass as never, nominatim as never);
  return { prisma, overpass, nominatim, service };
}

describe('OsmGarageDiscovery', () => {
  it('stores the named garages Overpass finds and remembers the area', async () => {
    const { prisma, overpass, nominatim, service } = setup();

    await service.ensureNear(ORIGIN, 15);

    expect(overpass.fetchGarages).toHaveBeenCalledWith(ORIGIN, 15);
    expect(nominatim.fetchGarages).not.toHaveBeenCalled();
    const { data, skipDuplicates } = prisma.garage.createMany.mock.calls[0][0];
    expect(skipDuplicates).toBe(true);
    expect(data.map((g: { name: string }) => g.name)).toEqual(['A', 'B']); // the unnamed shop is dropped
    expect(prisma.garageAreaFetch.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: { cellKey: '45.51:-73.57:15', partial: false } }),
    );
  });

  it('does not query again while the area is fresh', async () => {
    const { overpass, service } = setup({ fetchedAt: new Date(), partial: false });

    await service.ensureNear(ORIGIN, 15);

    expect(overpass.fetchGarages).not.toHaveBeenCalled();
  });

  it('refreshes a stale area, and a partial one much sooner than a complete one', async () => {
    const threeDaysAgo = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const complete = setup({ fetchedAt: threeDaysAgo, partial: false });
    await complete.service.ensureNear(ORIGIN, 15);
    expect(complete.overpass.fetchGarages).not.toHaveBeenCalled();

    const partial = setup({ fetchedAt: threeDaysAgo, partial: true });
    await partial.service.ensureNear(ORIGIN, 15);
    expect(partial.overpass.fetchGarages).toHaveBeenCalled();
  });

  it('falls back to Nominatim when Overpass is down, and marks the area partial', async () => {
    const { prisma, overpass, nominatim, service } = setup();
    overpass.fetchGarages.mockRejectedValue(new Error('all mirrors down'));

    await service.ensureNear(ORIGIN, 15);

    expect(nominatim.fetchGarages).toHaveBeenCalled();
    expect(prisma.garage.createMany.mock.calls[0][0].data).toHaveLength(1);
    expect(prisma.garageAreaFetch.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ create: expect.objectContaining({ partial: true }) }),
    );
  });

  it('stops hitting Overpass for a while once it has failed', async () => {
    const { overpass, service } = setup();
    overpass.fetchGarages.mockRejectedValue(new Error('down'));

    await service.ensureNear(ORIGIN, 15);
    await service.ensureNear({ lat: 46.8, lng: -71.2 }, 15);

    expect(overpass.fetchGarages).toHaveBeenCalledTimes(1);
  });

  it('never throws and records nothing when every source fails', async () => {
    const { prisma, overpass, nominatim, service } = setup();
    overpass.fetchGarages.mockRejectedValue(new Error('down'));
    nominatim.fetchGarages.mockRejectedValue(new Error('down too'));

    await expect(service.ensureNear(ORIGIN, 15)).resolves.toBeUndefined();

    expect(prisma.garage.createMany).not.toHaveBeenCalled();
    expect(prisma.garageAreaFetch.upsert).not.toHaveBeenCalled();
  });

  it('saves the other garages one by one when the database rejects a row in the batch', async () => {
    const { prisma, service } = setup();
    prisma.garage.createMany.mockImplementation(async ({ data }: { data: { name: string }[] }) => {
      if (data.length > 1 || data[0].name === 'B') throw new Error('invalid byte sequence');
      return { count: 1 };
    });

    await service.ensureNear(ORIGIN, 15);

    // 1 failed batch + one attempt per garage (A saved, B rejected) — and the area is still recorded.
    expect(prisma.garage.createMany).toHaveBeenCalledTimes(3);
    expect(prisma.garageAreaFetch.upsert).toHaveBeenCalled();
  });

  it('shares one fetch between simultaneous searches of the same area', async () => {
    const { overpass, service } = setup();

    await Promise.all([service.ensureNear(ORIGIN, 15), service.ensureNear(ORIGIN, 15)]);

    expect(overpass.fetchGarages).toHaveBeenCalledTimes(1);
  });
});
