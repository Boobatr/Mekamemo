import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { GeocodingProvider, GeoPoint } from './geocoding-provider.interface';

@Injectable()
export class GoogleGeocodingProvider implements GeocodingProvider {
  constructor(private readonly config: ConfigService) {}

  async geocode(postalCode: string): Promise<GeoPoint> {
    const apiKey = this.config.get<string>('GOOGLE_PLACES_API_KEY');
    const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${encodeURIComponent(postalCode)},Canada&key=${apiKey}`;
    const response = await fetch(url);
    const body = (await response.json()) as {
      results?: { geometry: { location: GeoPoint } }[];
    };
    const location = body.results?.[0]?.geometry.location;
    if (!location) throw new Error(`Could not geocode postal code ${postalCode}`);
    return location;
  }
}
