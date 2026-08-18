import { Injectable } from '@nestjs/common';
import {
  MaintenanceFallbackProvider,
  TaskSuggestion,
  VehicleForSchedule,
} from './maintenance-fallback.interface';

/**
 * Industry-standard generic intervals, used when no curated manufacturer
 * template matches and no Claude API key is configured. Deterministic and
 * fully testable without any external service.
 */
@Injectable()
export class GenericFallbackProvider implements MaintenanceFallbackProvider {
  readonly providerName = 'generic_estimate' as const;

  async suggest(_vehicle: VehicleForSchedule): Promise<TaskSuggestion[]> {
    const isFr = _vehicle.language === 'fr';
    return [
      {
        name: isFr ? "Vidange d'huile + filtre" : 'Oil change + filter',
        description: null,
        intervalKm: 8000,
        intervalMonths: 6,
        estimatedCostMinCents: 9000,
        estimatedCostMaxCents: 13000,
      },
      {
        name: isFr ? 'Rotation des pneus' : 'Tire rotation',
        description: null,
        intervalKm: 8000,
        intervalMonths: 6,
        estimatedCostMinCents: 4000,
        estimatedCostMaxCents: 4000,
      },
      {
        name: isFr ? "Filtre à air d'habitacle" : 'Cabin air filter',
        description: null,
        intervalKm: 24000,
        intervalMonths: 12,
        estimatedCostMinCents: 5500,
        estimatedCostMaxCents: 5500,
      },
      {
        name: isFr ? 'Inspection des freins' : 'Brake inspection',
        description: null,
        intervalKm: 40000,
        intervalMonths: 24,
        estimatedCostMinCents: null,
        estimatedCostMaxCents: null,
      },
      {
        name: isFr ? 'Liquide de refroidissement' : 'Coolant',
        description: null,
        intervalKm: 96000,
        intervalMonths: 60,
        estimatedCostMinCents: 14000,
        estimatedCostMaxCents: 14000,
      },
    ];
  }
}
