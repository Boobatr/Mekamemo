import { Injectable } from '@nestjs/common';
import type { GeoPoint } from '../geocoding/geocoding-provider.interface';
import { fetchJson, nominatimLimiter } from './osm-http';
import type { OsmElement } from './osm-garage.mapper';

interface NominatimPlace {
  osm_type: 'node' | 'way' | 'relation';
  osm_id: number;
  lat: string;
  lon: string;
  name?: string;
  address?: Record<string, string>;
  extratags?: Record<string, string>;
}

/** Nominatim answers at most this many places per request. */
const PAGE_LIMIT = 40;
/** Boxes tried from the full radius inward, so the garages closest to the user are never the ones cut off. */
const BOX_FRACTIONS = [1, 0.65, 0.35, 0.15];

/**
 * Fallback garage source for when every Overpass mirror is down. Nominatim can list
 * points of interest in a box but caps the answer at 40 and doesn't order it by distance.
 * So: ask for the whole radius first; if that answer was cut off, ask again for smaller
 * and smaller boxes around the user, which fills in the nearby garages completely.
 */
@Injectable()
export class NominatimPoiClient {
  async fetchGarages(origin: GeoPoint, radiusKm: number): Promise<OsmElement[]> {
    const found = new Map<string, OsmElement>();

    for (const fraction of BOX_FRACTIONS) {
      const places = await this.fetchBox(origin, radiusKm * fraction);
      for (const place of places) found.set(`${place.type}/${place.id}`, place);
      if (places.length < PAGE_LIMIT) break; // this box wasn't truncated: nothing nearer is missing
    }

    return [...found.values()];
  }

  private async fetchBox(origin: GeoPoint, boxRadiusKm: number): Promise<OsmElement[]> {
    const dLat = boxRadiusKm / 111;
    const dLng = boxRadiusKm / (111 * Math.max(Math.cos((origin.lat * Math.PI) / 180), 0.01));
    const viewbox = [origin.lng - dLng, origin.lat + dLat, origin.lng + dLng, origin.lat - dLat].join(',');
    const url =
      `https://nominatim.openstreetmap.org/search?format=jsonv2&limit=${PAGE_LIMIT}&bounded=1` +
      `&addressdetails=1&extratags=1&viewbox=${viewbox}&q=${encodeURIComponent('[shop=car_repair]')}`;

    const places = await nominatimLimiter.run(() => fetchJson<NominatimPlace[]>(url));
    return places.map(toElement);
  }
}

function toElement(place: NominatimPlace): OsmElement {
  const address = place.address ?? {};
  const city = address.city ?? address.town ?? address.village;
  return {
    type: place.osm_type,
    id: place.osm_id,
    lat: Number(place.lat),
    lon: Number(place.lon),
    tags: {
      ...place.extratags,
      ...(place.name ? { name: place.name } : {}),
      ...(address.house_number ? { 'addr:housenumber': address.house_number } : {}),
      ...(address.road ? { 'addr:street': address.road } : {}),
      ...(city ? { 'addr:city': city } : {}),
      ...(address.postcode ? { 'addr:postcode': address.postcode } : {}),
    },
  };
}
