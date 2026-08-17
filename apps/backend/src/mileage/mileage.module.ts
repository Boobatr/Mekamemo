import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { MileageService } from './mileage.service';
import { MileageController } from './mileage.controller';
import { VehiclesModule } from '../vehicles/vehicles.module';
import { NotificationsModule } from '../notifications/notifications.module';
import { ODOMETER_OCR_PROVIDER } from './odometer-ocr-provider.interface';
import { ClaudeOdometerOcrProvider } from './claude-odometer-ocr.provider';
import { NullOdometerOcrProvider } from './null-odometer-ocr.provider';

@Module({
  imports: [VehiclesModule, NotificationsModule, ConfigModule],
  providers: [
    MileageService,
    ClaudeOdometerOcrProvider,
    NullOdometerOcrProvider,
    {
      provide: ODOMETER_OCR_PROVIDER,
      inject: [ConfigService, ClaudeOdometerOcrProvider, NullOdometerOcrProvider],
      useFactory: (config: ConfigService, real: ClaudeOdometerOcrProvider, fake: NullOdometerOcrProvider) =>
        config.get<string>('ANTHROPIC_API_KEY') ? real : fake,
    },
  ],
  controllers: [MileageController],
  exports: [MileageService],
})
export class MileageModule {}
