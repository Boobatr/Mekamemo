import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GARAGE_DISCOVERY, NoopGarageDiscovery } from './garage-discovery.interface';
import { OsmGarageDiscovery } from './osm-garage-discovery.service';
import { OverpassClient } from '../osm/overpass.client';
import { NominatimPoiClient } from '../osm/nominatim-poi.client';

/** Real garages from OpenStreetMap when OSM_ENABLED=true, otherwise only what's already stored. */
@Module({
  imports: [ConfigModule],
  providers: [
    OverpassClient,
    NominatimPoiClient,
    OsmGarageDiscovery,
    {
      provide: GARAGE_DISCOVERY,
      inject: [ConfigService, OsmGarageDiscovery],
      useFactory: (config: ConfigService, osm: OsmGarageDiscovery) =>
        config.get<string>('OSM_ENABLED') === 'true' ? osm : new NoopGarageDiscovery(),
    },
  ],
  exports: [GARAGE_DISCOVERY],
})
export class GarageDiscoveryModule {}
