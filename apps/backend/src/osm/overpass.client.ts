import { Injectable, Logger } from '@nestjs/common';
import type { GeoPoint } from '../geocoding/geocoding-provider.interface';
import { fetchJson } from './osm-http';
import type { OsmElement } from './osm-garage.mapper';

const ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
  'https://overpass.private.coffee/api/interpreter',
];

const PER_ENDPOINT_TIMEOUT_MS = 20_000;
const TOTAL_BUDGET_MS = 40_000;

/** Finds every car-repair shop around a point. The public instances are shared, so try the mirrors in turn. */
@Injectable()
export class OverpassClient {
  private readonly logger = new Logger(OverpassClient.name);

  async fetchGarages(origin: GeoPoint, radiusKm: number): Promise<OsmElement[]> {
    const around = `around:${Math.round(radiusKm * 1000)},${origin.lat},${origin.lng}`;
    const query =
      `[out:json][timeout:25];` +
      `(nwr["shop"="car_repair"](${around});nwr["amenity"="car_repair"](${around}););` +
      `out center tags;`;

    const startedAt = Date.now();
    let lastError: unknown;
    for (const endpoint of ENDPOINTS) {
      if (Date.now() - startedAt > TOTAL_BUDGET_MS) break;
      try {
        const body = await fetchJson<{ elements?: OsmElement[] }>(endpoint, {
          method: 'POST',
          body: `data=${encodeURIComponent(query)}`,
          headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          timeoutMs: PER_ENDPOINT_TIMEOUT_MS,
        });
        return body.elements ?? [];
      } catch (err) {
        lastError = err;
        this.logger.warn(`Overpass ${new URL(endpoint).host} failed: ${(err as Error).message}`);
      }
    }
    throw lastError instanceof Error ? lastError : new Error('Overpass unavailable');
  }
}
