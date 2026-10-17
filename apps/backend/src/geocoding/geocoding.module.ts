import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GEOCODING_PROVIDER } from './geocoding-provider.interface';
import { GoogleGeocodingProvider } from './google-geocoding.provider';
import { NominatimGeocodingProvider } from './nominatim-geocoding.provider';
import { FixedGeocodingProvider } from './fixed-geocoding.provider';

/**
 * Google when a key is configured, else free OpenStreetMap geocoding when OSM_ENABLED=true,
 * else a fixed point in Montreal (dev and tests, no network needed).
 */
@Module({
  imports: [ConfigModule],
  providers: [
    GoogleGeocodingProvider,
    NominatimGeocodingProvider,
    FixedGeocodingProvider,
    {
      provide: GEOCODING_PROVIDER,
      inject: [ConfigService, GoogleGeocodingProvider, NominatimGeocodingProvider, FixedGeocodingProvider],
      useFactory: (
        config: ConfigService,
        google: GoogleGeocodingProvider,
        nominatim: NominatimGeocodingProvider,
        fixed: FixedGeocodingProvider,
      ) => {
        if (config.get<string>('GOOGLE_PLACES_API_KEY')) return google;
        return config.get<string>('OSM_ENABLED') === 'true' ? nominatim : fixed;
      },
    },
  ],
  exports: [GEOCODING_PROVIDER],
})
export class GeocodingModule {}
