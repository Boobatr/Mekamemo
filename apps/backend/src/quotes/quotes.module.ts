import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { QuotesService } from './quotes.service';
import { QuotesController } from './quotes.controller';
import { VOICE_PROVIDER } from './voice-provider.interface';
import { TwilioVoiceProvider } from './twilio-voice.provider';
import { LoggingVoiceProvider } from './logging-voice.provider';
import { BookingsModule } from '../bookings/bookings.module';
import { SubscriptionsModule } from '../subscriptions/subscriptions.module';
import { GeocodingModule } from '../geocoding/geocoding.module';

@Module({
  imports: [ConfigModule, BookingsModule, SubscriptionsModule, GeocodingModule],
  providers: [
    QuotesService,
    TwilioVoiceProvider,
    LoggingVoiceProvider,
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
