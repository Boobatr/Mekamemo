import { readFile } from 'fs/promises';
import { join } from 'path';
import { Inject, Injectable, Logger } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_CLIENT } from '../ai/anthropic-client.provider';
import { UPLOADS_DIR } from '../media/local-disk-storage.provider';
import { DiagnosisInput, DiagnosisProvider, DiagnosisResult } from './diagnosis-provider.interface';

const DIAGNOSE_TOOL: Anthropic.Tool = {
  name: 'report_diagnosis',
  description:
    'Report the most likely cause of a vehicle breakdown, with secondary hypotheses and a safety assessment. This is always an estimate to be confirmed by a garage — never a certainty.',
  input_schema: {
    type: 'object',
    properties: {
      primaryCause: { type: 'string' },
      confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
      explanation: { type: 'string' },
      secondaryCauses: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            cause: { type: 'string' },
            confidence: { type: 'string', enum: ['low', 'medium', 'high'] },
          },
          required: ['cause', 'confidence'],
        },
      },
      recommendedDelay: { type: 'string' },
      costMinCents: { type: 'number' },
      costMaxCents: { type: 'number' },
      safetyNote: { type: 'string' },
    },
    required: [
      'primaryCause',
      'confidence',
      'explanation',
      'secondaryCauses',
      'recommendedDelay',
      'costMinCents',
      'costMaxCents',
      'safetyNote',
    ],
  },
};

const MIME_BY_EXTENSION: Record<string, string> = {
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  png: 'image/png',
  webp: 'image/webp',
};

@Injectable()
export class ClaudeDiagnosisProvider implements DiagnosisProvider {
  private readonly logger = new Logger(ClaudeDiagnosisProvider.name);

  constructor(@Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null) {}

  async diagnose(input: DiagnosisInput): Promise<DiagnosisResult> {
    if (!this.client) {
      throw new Error('ClaudeDiagnosisProvider used without a configured ANTHROPIC_API_KEY.');
    }

    const content: Anthropic.ContentBlockParam[] = [{ type: 'text', text: this.buildPrompt(input) }];

    for (const attachment of input.attachments) {
      if (attachment.type !== 'photo') continue;
      const imageBlock = await this.tryLoadImage(attachment.url);
      if (imageBlock) content.push(imageBlock);
    }

    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      tools: [DIAGNOSE_TOOL],
      tool_choice: { type: 'tool', name: 'report_diagnosis' },
      messages: [{ role: 'user', content }],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    if (!toolUse) {
      throw new Error('Claude did not return a structured diagnosis.');
    }

    return toolUse.input as DiagnosisResult;
  }

  private buildPrompt(input: DiagnosisInput): string {
    const isFr = input.language === 'fr';
    const historyLines = input.recentServiceHistory
      .slice(0, 5)
      .map(
        (h) =>
          `- ${h.taskName} (${h.performedAt.toISOString().slice(0, 10)}, ${h.mileageAtServiceKm} km)`,
      )
      .join('\n');

    const videoOrAudioNote = input.attachments.some((a) => a.type === 'video' || a.type === 'audio')
      ? isFr
        ? "\nL'utilisateur a aussi fourni un enregistrement vidéo ou audio du problème (non transcrit dans cette analyse)."
        : '\nThe user also provided a video or audio recording of the problem (not transcribed in this analysis).'
      : '';

    return [
      `Véhicule : ${input.vehicle.make} ${input.vehicle.model} ${input.vehicle.year}.`,
      `Description du problème : ${input.descriptionText}`,
      input.tags.length > 0 ? `Précisions : ${input.tags.join(', ')}` : '',
      input.urgent ? "L'utilisateur indique que c'est urgent." : '',
      historyLines ? `Historique d'entretien récent :\n${historyLines}` : '',
      videoOrAudioNote,
      isFr
        ? "Donne la cause la plus probable, 2-3 hypothèses secondaires, un délai conseillé, une fourchette de coût en cents CAD, et une note de sécurité. Réponds en français."
        : 'Give the most likely cause, 2-3 secondary hypotheses, a recommended delay, a cost range in CAD cents, and a safety note. Respond in English.',
    ]
      .filter(Boolean)
      .join('\n');
  }

  private async tryLoadImage(url: string): Promise<Anthropic.ImageBlockParam | null> {
    if (!url.startsWith('/uploads/')) return null;
    const extension = url.split('.').pop()?.toLowerCase() ?? '';
    const mimeType = MIME_BY_EXTENSION[extension];
    if (!mimeType) return null;

    try {
      const filePath = join(UPLOADS_DIR, url.replace('/uploads/', ''));
      const buffer = await readFile(filePath);
      return {
        type: 'image',
        source: { type: 'base64', media_type: mimeType as 'image/jpeg', data: buffer.toString('base64') },
      };
    } catch (err) {
      this.logger.warn(`Could not load attachment ${url} for diagnosis`, err as Error);
      return null;
    }
  }
}
