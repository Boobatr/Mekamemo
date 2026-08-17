import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GEOCODING_PROVIDER } from './geocoding-provider.interface';
import { GoogleGeocodingProvider } from './google-geocoding.provider';
import { FixedGeocodingProvider } from './fixed-geocoding.provider';

@Module({
  imports: [ConfigModule],
  providers: [
    GoogleGeocodingProvider,
    FixedGeocodingProvider,
    {
      provide: GEOCODING_PROVIDER,
      inject: [ConfigService, GoogleGeocodingProvider, FixedGeocodingProvider],
      useFactory: (config: ConfigService, google: GoogleGeocodingProvider, fixed: FixedGeocodingProvider) =>
        config.get<string>('GOOGLE_PLACES_API_KEY') ? google : fixed,
    },
  ],
  exports: [GEOCODING_PROVIDER],
})
export class GeocodingModule {}
