import Anthropic from '@anthropic-ai/sdk';
import { ConfigService } from '@nestjs/config';
import { Provider } from '@nestjs/common';

export const ANTHROPIC_CLIENT = 'ANTHROPIC_CLIENT';

/**
 * Provides an Anthropic client when ANTHROPIC_API_KEY is configured, or null
 * otherwise. Consumers (maintenance-schedule fallback, breakdown diagnosis)
 * must fall back to a deterministic non-AI path when this is null — that is
 * how the app stays fully testable and runnable without a live API key.
 */
export const anthropicClientProvider: Provider = {
  provide: ANTHROPIC_CLIENT,
  inject: [ConfigService],
  useFactory: (config: ConfigService): Anthropic | null => {
    const apiKey = config.get<string>('ANTHROPIC_API_KEY');
    return apiKey ? new Anthropic({ apiKey }) : null;
  },
};
