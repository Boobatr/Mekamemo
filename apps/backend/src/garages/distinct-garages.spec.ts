import { pickNearestDistinct } from './distinct-garages';
import type { GarageWithDistance } from './garages.service';

let counter = 0;
const garage = (overrides: Partial<GarageWithDistance>): GarageWithDistance => ({
  id: `g-${counter++}`,
  name: 'Garage X',
  address: 'x',
  distanceKm: 1,
  lat: 47.0489,
  lng: -70.8926,
  rating: null,
  reviewCount: null,
  specialties: [],
  email: null,
  phone: null,
  certifications: [],
  hours: null,
  ...overrides,
});

/** `metres` east of the Beaupré reference point (1° of longitude ≈ 76 km at this latitude). */
const eastOf = (metres: number) => -70.8926 + metres / 1000 / 76;

describe('pickNearestDistinct', () => {
  it('keeps unrelated garages in their nearest-first order', () => {
    const list = [
      garage({ name: 'Garage David Lavoie', distanceKm: 0.3 }),
      garage({ name: 'Garage Paul Fortin', distanceKm: 0.9, lng: eastOf(500) }),
    ];

    expect(pickNearestDistinct(list, 10).map((g) => g.name)).toEqual(['Garage David Lavoie', 'Garage Paul Fortin']);
  });

  it('shows a business listed by two sources once, with the details of both', () => {
    const fromOverture = garage({ name: 'Garage Laurier', phone: '+1 514-843-3378', distanceKm: 0.5 });
    const fromOsm = garage({
      name: 'GARAGE LAURIER inc.',
      specialties: ['Freins', 'Vidange'],
      hours: { osm: 'Mo-Fr 08:00-17:00' },
      lng: eastOf(40),
      distanceKm: 0.52,
    });

    const [only, ...rest] = pickNearestDistinct([fromOverture, fromOsm], 10);

    expect(rest).toHaveLength(0);
    expect(only).toMatchObject({
      name: 'Garage Laurier',
      phone: '+1 514-843-3378',
      specialties: ['Freins', 'Vidange'],
      hours: { osm: 'Mo-Fr 08:00-17:00' },
    });
  });

  it('treats an accent or a missing "Inc." as the same name', () => {
    const list = [
      garage({ name: 'Mécanique Rémy Ferland inc.', distanceKm: 1 }),
      garage({ name: 'Mecanique Remy Ferland', distanceKm: 1.01, lng: eastOf(30) }),
    ];

    expect(pickNearestDistinct(list, 10)).toHaveLength(1);
  });

  it('merges two listings with the same phone number at the same spot even if the names differ', () => {
    const list = [
      garage({ name: 'Pneus Jobidon', phone: '+1 418-824-4351', distanceKm: 1 }),
      garage({ name: 'Service de Pneus Jobidon Inc', phone: '(418) 824-4351', distanceKm: 1, lng: eastOf(20) }),
      garage({ name: 'Supreme Flèche', phone: '+1 438-531-4138', distanceKm: 1, lng: eastOf(20) }),
    ];

    expect(pickNearestDistinct(list, 10).map((g) => g.name)).toEqual(['Pneus Jobidon', 'Supreme Flèche']);
  });

  it('does not merge garages that merely share a generic word or sit in different places', () => {
    const list = [
      garage({ name: 'Garage Gagnon', distanceKm: 1 }),
      garage({ name: 'Garage Lebrun', distanceKm: 1, lng: eastOf(20) }), // same spot, different name
      garage({ name: 'Garage Gagnon', distanceKm: 6, lng: eastOf(6000) }), // same name, 6 km away
    ];

    expect(pickNearestDistinct(list, 10)).toHaveLength(3);
  });

  it('returns at most `limit` of the nearest', () => {
    const list = Array.from({ length: 12 }, (_, i) =>
      garage({ name: `Garage ${String.fromCharCode(65 + i)}${i}`, distanceKm: i, lng: eastOf(i * 1000) }),
    );

    const picked = pickNearestDistinct(list, 5);

    expect(picked).toHaveLength(5);
    expect(picked.map((g) => g.distanceKm)).toEqual([0, 1, 2, 3, 4]);
  });
});
