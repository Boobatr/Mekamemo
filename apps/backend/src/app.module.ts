import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { MileageModule } from './mileage/mileage.module';
import { VinDecodeModule } from './vin-decode/vin-decode.module';
import { MaintenanceScheduleModule } from './maintenance-schedule/maintenance-schedule.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    AuthModule,
    UsersModule,
    VehiclesModule,
    MileageModule,
    VinDecodeModule,
    MaintenanceScheduleModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
