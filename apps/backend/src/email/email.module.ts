import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { EMAIL_PROVIDER } from '../quotes/email-provider.interface';
import { LoggingEmailProvider } from '../quotes/logging-email.provider';
import { ResendEmailProvider } from '../quotes/resend-email.provider';
import { BrevoEmailProvider } from './brevo-email.provider';

/**
 * One outgoing-mail provider for the whole app (quote requests, password resets):
 * Brevo when BREVO_API_KEY is set, Resend when EMAIL_PROVIDER_API_KEY is, otherwise the
 * messages are only written to the server log (development, or mail not set up yet).
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    BrevoEmailProvider,
    ResendEmailProvider,
    LoggingEmailProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, BrevoEmailProvider, ResendEmailProvider, LoggingEmailProvider],
      useFactory: (
        config: ConfigService,
        brevo: BrevoEmailProvider,
        resend: ResendEmailProvider,
        logging: LoggingEmailProvider,
      ) => {
        if (config.get<string>('BREVO_API_KEY')) return brevo;
        if (config.get<string>('EMAIL_PROVIDER_API_KEY')) return resend;
        return logging;
      },
    },
  ],
  exports: [EMAIL_PROVIDER],
})
export class EmailModule {}
