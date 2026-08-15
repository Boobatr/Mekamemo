import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MaintenanceScheduleService } from './maintenance-schedule.service';
import { MaintenanceScheduleController } from './maintenance-schedule.controller';
import { GenericFallbackProvider } from './generic-fallback.provider';
import { ClaudeFallbackProvider } from './claude-fallback.provider';
import { MAINTENANCE_FALLBACK_PROVIDER } from './maintenance-fallback.interface';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { MileageModule } from '../mileage/mileage.module';

@Module({
  imports: [ConfigModule, VehiclesModule, MileageModule],
  providers: [
    GenericFallbackProvider,
    ClaudeFallbackProvider,
    {
      provide: MAINTENANCE_FALLBACK_PROVIDER,
      inject: [ConfigService, GenericFallbackProvider, ClaudeFallbackProvider],
      useFactory: (
        config: ConfigService,
        generic: GenericFallbackProvider,
        claude: ClaudeFallbackProvider,
      ) => (config.get<string>('ANTHROPIC_API_KEY') ? claude : generic),
    },
    MaintenanceScheduleService,
  ],
  controllers: [MaintenanceScheduleController],
  exports: [MaintenanceScheduleService],
})
export class MaintenanceScheduleModule {}
