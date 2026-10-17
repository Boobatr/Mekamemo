import { GeocodingError } from './geocoding-provider.interface';
import { NominatimGeocodingProvider, normalizePostalCode } from './nominatim-geocoding.provider';
import { nominatimLimiter } from '../osm/osm-http';

function respond(body: unknown, ok = true): Response {
  return { ok, status: ok ? 200 : 404, json: async () => body } as Response;
}

describe('normalizePostalCode', () => {
  it('upper-cases and re-inserts the space of a Canadian postal code', () => {
    expect(normalizePostalCode('  h2x1y4 ')).toBe('H2X 1Y4');
    expect(normalizePostalCode('h2x   1y4')).toBe('H2X 1Y4');
    expect(normalizePostalCode('10001')).toBe('10001');
  });
});

describe('NominatimGeocodingProvider', () => {
  let fetchSpy: jest.SpyInstance;
  let provider: NominatimGeocodingProvider;

  beforeEach(() => {
    nominatimLimiter.minGapMs = 0;
    provider = new NominatimGeocodingProvider();
    fetchSpy = jest.spyOn(global, 'fetch');
  });

  afterEach(() => fetchSpy.mockRestore());

  const urls = () => fetchSpy.mock.calls.map(([url]) => String(url));

  it('uses the exact postal code from Nominatim when it knows it', async () => {
    fetchSpy.mockResolvedValueOnce(respond([{ lat: '45.5093547', lon: '-73.5694385', type: 'postcode' }]));

    await expect(provider.geocode('h2x1y4')).resolves.toEqual({ lat: 45.5093547, lng: -73.5694385 });
    expect(urls()).toHaveLength(1);
    expect(urls()[0]).toContain('nominatim.openstreetmap.org');
    expect(urls()[0]).toContain('H2X%201Y4');
  });

  it('falls back to the forward sortation area when Nominatim does not know the exact code', async () => {
    fetchSpy
      .mockResolvedValueOnce(respond([]))
      .mockResolvedValueOnce(respond({ places: [{ latitude: '45.5148', longitude: '-73.5739' }] }));

    await expect(provider.geocode('H2X 9Z9')).resolves.toEqual({ lat: 45.5148, lng: -73.5739 });
    expect(urls()[1]).toBe('https://api.zippopotam.us/ca/H2X');
  });

  it('ignores a Nominatim answer that is not a postcode (it would be an unrelated street)', async () => {
    fetchSpy
      .mockResolvedValueOnce(respond([{ lat: '1', lon: '2', type: 'residential' }]))
      .mockResolvedValueOnce(respond({ places: [{ latitude: '45.5', longitude: '-73.5' }] }));

    await expect(provider.geocode('H2X 1Y4')).resolves.toEqual({ lat: 45.5, lng: -73.5 });
  });

  it('survives a network failure on one service by using the next', async () => {
    fetchSpy
      .mockRejectedValueOnce(new Error('network down'))
      .mockResolvedValueOnce(respond({ places: [{ latitude: '46.8', longitude: '-71.2' }] }));

    await expect(provider.geocode('G1R 4P5')).resolves.toEqual({ lat: 46.8, lng: -71.2 });
  });

  it('goes straight to Zippopotam for a three-character area code', async () => {
    fetchSpy.mockResolvedValueOnce(respond({ places: [{ latitude: '45.5', longitude: '-73.5' }] }));

    await provider.geocode('h2x');
    expect(urls()).toEqual(['https://api.zippopotam.us/ca/H2X']);
  });

  it('remembers answers so each postal code is looked up once', async () => {
    fetchSpy.mockResolvedValueOnce(respond([{ lat: '45.5', lon: '-73.5', type: 'postcode' }]));

    await provider.geocode('H2X 1Y4');
    await provider.geocode('h2x1y4');
    expect(fetchSpy).toHaveBeenCalledTimes(1);
  });

  it('rejects with a GeocodingError when nothing can locate the code', async () => {
    fetchSpy.mockResolvedValue(respond({}, false));

    await expect(provider.geocode('Z9Z 9Z9')).rejects.toBeInstanceOf(GeocodingError);
  });
});
