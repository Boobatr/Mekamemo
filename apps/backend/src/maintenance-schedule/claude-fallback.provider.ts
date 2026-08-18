import { Inject, Injectable } from '@nestjs/common';
import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_CLIENT } from '../ai/anthropic-client.provider';
import {
  MaintenanceFallbackProvider,
  TaskSuggestion,
  VehicleForSchedule,
} from './maintenance-fallback.interface';

const SUGGEST_SCHEDULE_TOOL: Anthropic.Tool = {
  name: 'suggest_maintenance_schedule',
  description: 'Return the manufacturer-recommended maintenance schedule for this vehicle.',
  input_schema: {
    type: 'object',
    properties: {
      tasks: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            description: { type: 'string' },
            intervalKm: { type: 'number' },
            intervalMonths: { type: 'number' },
            estimatedCostMinCents: { type: 'number' },
            estimatedCostMaxCents: { type: 'number' },
          },
          required: ['name', 'intervalKm', 'intervalMonths'],
        },
      },
    },
    required: ['tasks'],
  },
};

/** Used for vehicles with no curated template in our database. */
@Injectable()
export class ClaudeFallbackProvider implements MaintenanceFallbackProvider {
  readonly providerName = 'ai_estimate' as const;

  constructor(@Inject(ANTHROPIC_CLIENT) private readonly client: Anthropic | null) {}

  async suggest(vehicle: VehicleForSchedule): Promise<TaskSuggestion[]> {
    if (!this.client) {
      throw new Error('ClaudeFallbackProvider used without a configured ANTHROPIC_API_KEY.');
    }

    const language = vehicle.language === 'fr' ? 'français' : 'English';
    const message = await this.client.messages.create({
      model: 'claude-sonnet-4-5',
      max_tokens: 1024,
      tools: [SUGGEST_SCHEDULE_TOOL],
      tool_choice: { type: 'tool', name: 'suggest_maintenance_schedule' },
      messages: [
        {
          role: 'user',
          content: `Véhicule : ${vehicle.make} ${vehicle.model} ${vehicle.year}. Donne le calendrier d'entretien recommandé par le fabricant (nom de la tâche, intervalle en km, intervalle en mois, coût estimé en cents CAD). Réponds en ${language}.`,
        },
      ],
    });

    const toolUse = message.content.find(
      (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use',
    );
    const tasks = (toolUse?.input as { tasks?: TaskSuggestion[] } | undefined)?.tasks ?? [];

    return tasks.map((task) => ({
      name: task.name,
      description: task.description ?? null,
      intervalKm: task.intervalKm ?? null,
      intervalMonths: task.intervalMonths ?? null,
      estimatedCostMinCents: task.estimatedCostMinCents ?? null,
      estimatedCostMaxCents: task.estimatedCostMaxCents ?? null,
    }));
  }
}
