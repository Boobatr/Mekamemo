import { Injectable } from '@nestjs/common';
import { GeocodingProvider, GeoPoint } from './geocoding-provider.interface';

/** Montreal downtown — used when no GOOGLE_PLACES_API_KEY is configured. */
export const MONTREAL_DOWNTOWN: GeoPoint = { lat: 45.5017, lng: -73.5673 };

@Injectable()
export class FixedGeocodingProvider implements GeocodingProvider {
  async geocode(_postalCode: string): Promise<GeoPoint> {
    return MONTREAL_DOWNTOWN;
  }
}
