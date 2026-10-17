import { NominatimPoiClient } from './nominatim-poi.client';
import { nominatimLimiter } from './osm-http';

const ORIGIN = { lat: 45.5, lng: -73.5 };

const place = (id: number) => ({
  osm_type: 'node',
  osm_id: id,
  lat: '45.5',
  lon: '-73.5',
  name: `Garage ${id}`,
  address: { house_number: '10', road: 'Rue Test', city: 'Montréal', postcode: 'H2X 1Y4' },
  extratags: { phone: '+1 514 555 0000', opening_hours: 'Mo-Fr 08:00-17:00' },
});

const respond = (places: unknown[]) => ({ ok: true, status: 200, json: async () => places }) as Response;

describe('NominatimPoiClient', () => {
  let fetchSpy: jest.SpyInstance;

  beforeEach(() => {
    nominatimLimiter.minGapMs = 0;
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  it('makes a single request when the whole radius fits in one answer', async () => {
    fetchSpy.mockResolvedValueOnce(respond([place(1), place(2)]));

    const elements = await new NominatimPoiClient().fetchGarages(ORIGIN, 15);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(elements).toHaveLength(2);
  });

  it('converts a Nominatim place into the tags the mapper understands', async () => {
    fetchSpy.mockResolvedValueOnce(respond([place(7)]));

    const [element] = await new NominatimPoiClient().fetchGarages(ORIGIN, 15);

    expect(element).toMatchObject({ type: 'node', id: 7, lat: 45.5, lon: -73.5 });
    expect(element.tags).toMatchObject({
      name: 'Garage 7',
      'addr:housenumber': '10',
      'addr:street': 'Rue Test',
      'addr:city': 'Montréal',
      'addr:postcode': 'H2X 1Y4',
      phone: '+1 514 555 0000',
      opening_hours: 'Mo-Fr 08:00-17:00',
    });
  });

  it('shrinks the search box when an answer is cut off, so nearby garages are all found', async () => {
    const full = Array.from({ length: 40 }, (_, i) => place(i));
    fetchSpy
      .mockResolvedValueOnce(respond(full)) // whole radius: truncated at 40
      .mockResolvedValueOnce(respond(full.slice(0, 40).map((p) => ({ ...p, osm_id: p.osm_id + 100 })))) // 65%: still truncated
      .mockResolvedValueOnce(respond([place(500), place(501)])); // 35%: complete → stop

    const elements = await new NominatimPoiClient().fetchGarages(ORIGIN, 15);

    expect(fetchSpy).toHaveBeenCalledTimes(3);
    expect(elements).toHaveLength(82);
    const boxes = fetchSpy.mock.calls.map(([url]) => new URL(String(url)).searchParams.get('viewbox')!.split(',').map(Number));
    const widths = boxes.map(([left, , right]) => right - left);
    expect(widths[0]).toBeGreaterThan(widths[1]);
    expect(widths[1]).toBeGreaterThan(widths[2]);
  });

  it('counts a garage once even when several boxes return it', async () => {
    const full = Array.from({ length: 40 }, (_, i) => place(i));
    fetchSpy.mockResolvedValueOnce(respond(full)).mockResolvedValueOnce(respond(full.slice(0, 5)));

    const elements = await new NominatimPoiClient().fetchGarages(ORIGIN, 15);

    expect(elements).toHaveLength(40);
  });
});
