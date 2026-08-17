export const GEOCODING_PROVIDER = 'GEOCODING_PROVIDER';

export interface GeoPoint {
  lat: number;
  lng: number;
}

export interface GeocodingProvider {
  geocode(postalCode: string): Promise<GeoPoint>;
}

/** Haversine distance in km — used by both the fallback and real search providers. */
export function distanceKm(a: GeoPoint, b: GeoPoint): number {
  const R = 6371;
  const dLat = toRad(b.lat - a.lat);
  const dLng = toRad(b.lng - a.lng);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);

  const h =
    Math.sin(dLat / 2) ** 2 + Math.sin(dLng / 2) ** 2 * Math.cos(lat1) * Math.cos(lat2);
  return R * 2 * Math.asin(Math.sqrt(h));
}

function toRad(deg: number): number {
  return (deg * Math.PI) / 180;
}
