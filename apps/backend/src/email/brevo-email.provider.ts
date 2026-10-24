import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { EmailMessage, EmailProvider } from '../quotes/email-provider.interface';
import { parseSender } from './sender';

/**
 * Sends through Brevo's HTTPS API (free plan: 300 emails a day). It has to be an HTTP API:
 * Render's free web services block outbound SMTP (ports 25/465/587).
 */
@Injectable()
export class BrevoEmailProvider implements EmailProvider {
  private readonly logger = new Logger(BrevoEmailProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: EmailMessage): Promise<void> {
    try {
      const response = await fetch('https://api.brevo.com/v3/smtp/email', {
        method: 'POST',
        headers: {
          'api-key': this.config.get<string>('BREVO_API_KEY') ?? '',
          'content-type': 'application/json',
          accept: 'application/json',
        },
        body: JSON.stringify({
          sender: parseSender(this.config.get<string>('MAIL_FROM')),
          to: [{ email: message.to }],
          subject: message.subject,
          textContent: message.body,
        }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!response.ok) {
        this.logger.error(`Brevo send failed with status ${response.status}: ${await response.text()}`);
      }
    } catch (err) {
      this.logger.error(`Brevo send failed: ${(err as Error).message}`);
    }
  }
}
