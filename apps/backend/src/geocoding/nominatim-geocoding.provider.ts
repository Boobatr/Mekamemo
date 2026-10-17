import { Injectable } from '@nestjs/common';
import { GeocodingError, GeocodingProvider, GeoPoint } from './geocoding-provider.interface';
import { fetchJson, nominatimLimiter } from '../osm/osm-http';

interface NominatimResult {
  lat: string;
  lon: string;
  type?: string;
}

interface ZippopotamResult {
  places?: { latitude: string; longitude: string }[];
}

const CANADIAN_FULL = /^[A-Z]\d[A-Z] ?\d[A-Z]\d$/;
const CANADIAN_FSA = /^[A-Z]\d[A-Z]$/;
const US_ZIP = /^\d{5}$/;

/** "h2x1y4" → "H2X 1Y4". Anything else is just trimmed, upper-cased and de-duplicated of spaces. */
export function normalizePostalCode(input: string): string {
  const code = input.trim().toUpperCase().replace(/\s+/g, ' ');
  return /^[A-Z]\d[A-Z]\d[A-Z]\d$/.test(code) ? `${code.slice(0, 3)} ${code.slice(3)}` : code;
}

/**
 * Free geocoding, no API key. Canadian postal codes go to OpenStreetMap's Nominatim
 * (street-level when it knows the exact code) and fall back to Zippopotam, which knows
 * every forward sortation area (the first three characters — a few km of precision,
 * plenty for a 10–50 km garage search).
 */
@Injectable()
export class NominatimGeocodingProvider implements GeocodingProvider {
  private readonly cache = new Map<string, GeoPoint>();

  async geocode(input: string): Promise<GeoPoint> {
    const code = normalizePostalCode(input);
    const cached = this.cache.get(code);
    if (cached) return cached;

    const point = await this.lookup(code);
    if (!point) throw new GeocodingError(input);
    this.cache.set(code, point);
    return point;
  }

  private async lookup(code: string): Promise<GeoPoint | null> {
    if (CANADIAN_FULL.test(code)) {
      return (
        (await this.nominatimPostcode(code, 'ca')) ??
        (await this.zippopotam('ca', code.slice(0, 3)))
      );
    }
    if (CANADIAN_FSA.test(code)) return this.zippopotam('ca', code);
    if (US_ZIP.test(code)) {
      return (await this.nominatimPostcode(code, 'us')) ?? (await this.zippopotam('us', code));
    }
    // City names or street addresses typed in the postal-code box: take Nominatim's best guess.
    return this.nominatimSearch(code, 'ca,us');
  }

  private async nominatimSearch(query: string, countries: string): Promise<(GeoPoint & { type?: string }) | null> {
    const url =
      `https://nominatim.openstreetmap.org/search?format=json&limit=1` +
      `&countrycodes=${countries}&q=${encodeURIComponent(query)}`;
    try {
      const [first] = await nominatimLimiter.run(() => fetchJson<NominatimResult[]>(url));
      return first ? { lat: Number(first.lat), lng: Number(first.lon), type: first.type } : null;
    } catch {
      return null;
    }
  }

  /** Only a result typed "postcode" counts — otherwise Nominatim may answer with an unrelated street. */
  private async nominatimPostcode(code: string, country: string): Promise<GeoPoint | null> {
    const found = await this.nominatimSearch(code, country);
    return found?.type === 'postcode' ? { lat: found.lat, lng: found.lng } : null;
  }

  private async zippopotam(country: string, code: string): Promise<GeoPoint | null> {
    try {
      const body = await fetchJson<ZippopotamResult>(
        `https://api.zippopotam.us/${country}/${encodeURIComponent(code)}`,
      );
      const place = body.places?.[0];
      return place ? { lat: Number(place.latitude), lng: Number(place.longitude) } : null;
    } catch {
      return null;
    }
  }
}
