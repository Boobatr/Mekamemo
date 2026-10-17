import { Module } from '@nestjs/common';
import { GaragesService } from './garages.service';
import { GaragesController } from './garages.controller';
import { GeocodingModule } from '../geocoding/geocoding.module';
import { GarageDiscoveryModule } from '../garage-discovery/garage-discovery.module';

@Module({
  imports: [GeocodingModule, GarageDiscoveryModule],
  providers: [GaragesService],
  controllers: [GaragesController],
  exports: [GaragesService],
})
export class GaragesModule {}
