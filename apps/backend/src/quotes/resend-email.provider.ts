import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EmailMessage, EmailProvider } from './email-provider.interface';
import { formatSender, parseSender } from '../email/sender';

/** Sends via Resend's HTTP API — no SDK needed for a single endpoint call. */
@Injectable()
export class ResendEmailProvider implements EmailProvider {
  private readonly logger = new Logger(ResendEmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    const apiKey = this.config.get<string>('EMAIL_PROVIDER_API_KEY');
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { authorization: `Bearer ${apiKey}`, 'content-type': 'application/json' },
      body: JSON.stringify({
        from: formatSender(parseSender(this.config.get<string>('MAIL_FROM'))),
        to: [message.to],
        subject: message.subject,
        text: message.body,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Resend send failed with status ${response.status}`);
    }
  }
}
