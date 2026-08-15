import { Module } from '@nestjs/common';
import { MileageService } from './mileage.service';
import { MileageController } from './mileage.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';

@Module({
  imports: [VehiclesModule],
  providers: [MileageService],
  controllers: [MileageController],
  exports: [MileageService],
})
export class MileageModule {}
