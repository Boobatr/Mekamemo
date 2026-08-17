import { Injectable, Logger } from '@nestjs/common';
import { VoiceCallRequest, VoiceProvider } from './voice-provider.interface';

@Injectable()
export class LoggingVoiceProvider implements VoiceProvider {
  private readonly logger = new Logger(LoggingVoiceProvider.name);

  async call(request: VoiceCallRequest): Promise<void> {
    this.logger.log(`[voice call:${request.toPhoneNumber}] "${request.message}"`);
  }
}
