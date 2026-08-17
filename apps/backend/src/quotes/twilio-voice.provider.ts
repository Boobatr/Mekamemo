import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { VoiceCallRequest, VoiceProvider } from './voice-provider.interface';

/** Places an outbound call reading `message` via text-to-speech (Twilio TwiML <Say>). */
@Injectable()
export class TwilioVoiceProvider implements VoiceProvider {
  private readonly logger = new Logger(TwilioVoiceProvider.name);

  constructor(private readonly config: ConfigService) {}

  async call(request: VoiceCallRequest): Promise<void> {
    const accountSid = this.config.get<string>('TWILIO_ACCOUNT_SID');
    const authToken = this.config.get<string>('TWILIO_AUTH_TOKEN');
    const twilioFromNumber = this.config.get<string>('TWILIO_FROM_NUMBER');

    const twiml = `<Response><Say language="fr-CA">${escapeXml(request.message)}</Say></Response>`;
    const body = new URLSearchParams({
      To: request.toPhoneNumber,
      From: twilioFromNumber ?? '',
      Twiml: twiml,
    });

    const response = await fetch(
      `https://api.twilio.com/2010-04-01/Accounts/${accountSid}/Calls.json`,
      {
        method: 'POST',
        headers: {
          authorization: `Basic ${Buffer.from(`${accountSid}:${authToken}`).toString('base64')}`,
          'content-type': 'application/x-www-form-urlencoded',
        },
        body,
      },
    );

    if (!response.ok) {
      this.logger.error(`Twilio call failed with status ${response.status}`);
    }
  }
}

function escapeXml(text: string): string {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
