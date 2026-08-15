import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { PgBossService } from '../jobs/pg-boss.service';
import { NotificationsService } from './notifications.service';

const DISPATCH_QUEUE = 'dispatch-due-notifications';
const MILEAGE_PROMPT_QUEUE = 'schedule-mileage-prompts';

/** Registers the two recurring notification jobs against the shared pg-boss instance. */
@Injectable()
export class NotificationsScheduler implements OnModuleInit {
  private readonly logger = new Logger(NotificationsScheduler.name);

  constructor(
    private readonly pgBoss: PgBossService,
    private readonly notificationsService: NotificationsService,
  ) {}

  async onModuleInit() {
    const { boss } = this.pgBoss;

    await boss.createQueue(DISPATCH_QUEUE);
    await boss.createQueue(MILEAGE_PROMPT_QUEUE);

    await boss.schedule(DISPATCH_QUEUE, '*/15 * * * *');
    await boss.schedule(MILEAGE_PROMPT_QUEUE, '0 8 * * *');

    await boss.work(DISPATCH_QUEUE, async () => {
      const count = await this.notificationsService.dispatchDue();
      if (count > 0) this.logger.log(`Dispatched ${count} due notification(s).`);
    });

    await boss.work(MILEAGE_PROMPT_QUEUE, async () => {
      await this.notificationsService.scheduleDueMileagePrompts();
    });
  }
}
