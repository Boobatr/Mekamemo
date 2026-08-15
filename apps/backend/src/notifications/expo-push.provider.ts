import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PushMessage, PushProvider } from './push-provider.interface';

/** Wraps the Expo push HTTP API — one endpoint covers both iOS and Android. */
@Injectable()
export class ExpoPushProvider implements PushProvider {
  private readonly logger = new Logger(ExpoPushProvider.name);

  constructor(private readonly config: ConfigService) {}

  async send(message: PushMessage): Promise<void> {
    const accessToken = this.config.get<string>('EXPO_PUSH_ACCESS_TOKEN');
    const response = await fetch('https://exp.host/--/api/v2/push/send', {
      method: 'POST',
      headers: {
        'content-type': 'application/json',
        accept: 'application/json',
        ...(accessToken ? { authorization: `Bearer ${accessToken}` } : {}),
      },
      body: JSON.stringify({
        to: message.pushToken,
        title: message.title,
        body: message.body,
        data: message.data,
      }),
    });

    if (!response.ok) {
      this.logger.error(`Expo push failed with status ${response.status}`);
    }
  }
}
