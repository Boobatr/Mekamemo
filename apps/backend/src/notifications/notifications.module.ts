import { Module } from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { NotificationsController } from './notifications.controller';
import { NotificationsScheduler } from './notifications.scheduler';
import { ExpoPushProvider } from './expo-push.provider';
import { PUSH_PROVIDER } from './push-provider.interface';

@Module({
  providers: [
    NotificationsService,
    NotificationsScheduler,
    ExpoPushProvider,
    { provide: PUSH_PROVIDER, useExisting: ExpoPushProvider },
  ],
  controllers: [NotificationsController],
  exports: [NotificationsService],
})
export class NotificationsModule {}
