import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { GARAGE_DISCOVERY, NoopGarageDiscovery } from './garage-discovery.interface';
import { OsmGarageDiscovery } from './osm-garage-discovery.service';
import { OverpassClient } from '../osm/overpass.client';
import { NominatimPoiClient } from '../osm/nominatim-poi.client';

/**
 * OSM_ENABLED=true means the database holds real garages (imported from Overture, see
 * prisma/data), so demo garages are hidden. Live OpenStreetMap discovery on top of that is
 * opt-in with OSM_GARAGE_DISCOVERY=true: it adds the few services/opening hours OSM knows,
 * but costs a few seconds on the first search of an area.
 */
@Module({
  imports: [ConfigModule],
  providers: [
    OverpassClient,
    NominatimPoiClient,
    OsmGarageDiscovery,
    {
      provide: GARAGE_DISCOVERY,
      inject: [ConfigService, OsmGarageDiscovery],
      useFactory: (config: ConfigService, osm: OsmGarageDiscovery) => {
        if (config.get<string>('OSM_ENABLED') !== 'true') return new NoopGarageDiscovery(false);
        return config.get<string>('OSM_GARAGE_DISCOVERY') === 'true' ? osm : new NoopGarageDiscovery(true);
      },
    },
  ],
  exports: [GARAGE_DISCOVERY],
})
export class GarageDiscoveryModule {}
