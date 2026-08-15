import { Injectable, Logger } from '@nestjs/common';
import { PushMessage, PushProvider } from './push-provider.interface';

/** Dev/test fallback used when the vehicle owner has no registered push token. */
@Injectable()
export class LoggingPushProvider implements PushProvider {
  private readonly logger = new Logger(LoggingPushProvider.name);

  async send(message: PushMessage): Promise<void> {
    this.logger.log(`[push:${message.pushToken}] ${message.title} — ${message.body}`);
  }
}
