import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { AiModule } from './ai/ai.module';
import { JobsModule } from './jobs/jobs.module';
import { AuthModule } from './auth/auth.module';
import { UsersModule } from './users/users.module';
import { VehiclesModule } from './vehicles/vehicles.module';
import { NotificationsModule } from './notifications/notifications.module';
import { MileageModule } from './mileage/mileage.module';
import { VinDecodeModule } from './vin-decode/vin-decode.module';
import { MaintenanceScheduleModule } from './maintenance-schedule/maintenance-schedule.module';
import { MediaModule } from './media/media.module';
import { BreakdownModule } from './breakdown/breakdown.module';
import { GeocodingModule } from './geocoding/geocoding.module';
import { EmailModule } from './email/email.module';
import { GaragesModule } from './garages/garages.module';
import { BookingsModule } from './bookings/bookings.module';
import { QuotesModule } from './quotes/quotes.module';
import { MaintenanceTasksModule } from './maintenance-tasks/maintenance-tasks.module';
import { HistoryModule } from './history/history.module';
import { SubscriptionsModule } from './subscriptions/subscriptions.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    AiModule,
    JobsModule,
    AuthModule,
    UsersModule,
    SubscriptionsModule,
    VehiclesModule,
    NotificationsModule,
    MileageModule,
    VinDecodeModule,
    MaintenanceScheduleModule,
    MediaModule,
    BreakdownModule,
    GeocodingModule,
    EmailModule,
    GaragesModule,
    BookingsModule,
    QuotesModule,
    MaintenanceTasksModule,
    HistoryModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
