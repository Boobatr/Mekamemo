import { Injectable, Logger } from '@nestjs/common';
import { EmailMessage, EmailProvider } from './email-provider.interface';

@Injectable()
export class LoggingEmailProvider implements EmailProvider {
  private readonly logger = new Logger(LoggingEmailProvider.name);

  async send(message: EmailMessage): Promise<void> {
    this.logger.log(`[email:${message.to}] ${message.subject}\n${message.body}`);
  }
}
