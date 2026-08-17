import { Module } from '@nestjs/common';
import { HistoryService } from './history.service';
import { HistoryController } from './history.controller';
import { ResaleDossierService } from './resale-dossier.service';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [SubscriptionsModule],
  providers: [HistoryService, ResaleDossierService],
  controllers: [HistoryController],
  exports: [HistoryService],
})
export class HistoryModule {}
