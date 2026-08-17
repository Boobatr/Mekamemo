import { Module } from '@nestjs/common';
import { GaragesService } from './garages.service';
import { GaragesController } from './garages.controller';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [GeocodingModule],
  providers: [GaragesService],
  controllers: [GaragesController],
  exports: [GaragesService],
})
export class GaragesModule {}
