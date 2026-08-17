import { Inject, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_CLIENT } from '../ai/anthropic-client.provider';
import { OdometerOcrProvider } from './odometer-ocr-provider.interface';

const READ_ODOMETER_TOOL: Anthropic.Tool = {
  name: 'report_odometer_reading',
  description: 'Report the number displayed on the vehicle odometer in the photo.',
  input_schema: {
    type: 'object',
    properties: {
      valueKm: { type: ['number', 'null'], description: 'The odometer reading in km, or null if unreadable.' },
    },
    required: ['valueKm'],
  },
};

@Injectable()
export class ClaudeOdometerOcrProvider implements OdometerOcrProvider {
  constructor(@Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null) {}

  async read(imageBuffer: Buffer, mimeType: string): Promise<number | null> {
    if (!this.client) return null;

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 256,
      tools: [READ_ODOMETER_TOOL],
      tool_choice: { type: 'tool', name: 'report_odometer_reading' },
      messages: [
        {
          role: 'user',
          content: [
            {
              type: 'image',
              source: { type: 'base64', media_type: mimeType as 'image/jpeg', data: imageBuffer.toString('base64') },
            },
            { type: 'text', text: "Lis le nombre affiché sur l'odomètre de ce véhicule." },
          ],
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    const value = (toolUse?.input as { valueKm: number | null } | undefined)?.valueKm;
    return typeof value === 'number' ? Math.round(value) : null;
  }
}
