import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { EMAIL_PROVIDER } from './email-provider.interface';
import { VOICE_PROVIDER } from './voice-provider.interface';
import { ResendEmailProvider } from './resend-email.provider';
import { LoggingEmailProvider } from './logging-email.provider';
import { TwilioVoiceProvider } from './twilio-voice.provider';
import { LoggingVoiceProvider } from './logging-voice.provider';
import { BookingsModule } from '../bookings/bookings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';

@Module({
  imports: [ConfigModule, BookingsModule, SubscriptionsModule],
  providers: [
    QuotesService,
    ResendEmailProvider,
    LoggingEmailProvider,
    TwilioVoiceProvider,
    LoggingVoiceProvider,
    {
      provide: EMAIL_PROVIDER,
      inject: [ConfigService, ResendEmailProvider, LoggingEmailProvider],
      useFactory: (config: ConfigService, real: ResendEmailProvider, fake: LoggingEmailProvider) =>
        config.get<string>('EMAIL_PROVIDER_API_KEY') ? real : fake,
    },
    {
      provide: VOICE_PROVIDER,
      inject: [ConfigService, TwilioVoiceProvider, LoggingVoiceProvider],
      useFactory: (config: ConfigService, real: TwilioVoiceProvider, fake: LoggingVoiceProvider) =>
        config.get<string>('TWILIO_ACCOUNT_SID') ? real : fake,
    },
  ],
  controllers: [QuotesController],
  exports: [QuotesService],
})
export class QuotesModule {}
