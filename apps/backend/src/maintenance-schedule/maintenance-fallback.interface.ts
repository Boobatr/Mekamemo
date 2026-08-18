export interface TaskSuggestion {
  name: string;
  description: string | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  estimatedCostMinCents: number | null;
  estimatedCostMaxCents: number | null;
}

export interface VehicleForSchedule {
  make: string;
  model: string;
  year: number;
  language: 'fr' | 'en';
}

export const MAINTENANCE_FALLBACK_PROVIDER = 'MAINTENANCE_FALLBACK_PROVIDER';

export interface MaintenanceFallbackProvider {
  readonly providerName: 'ai_estimate' | 'generic_estimate';
  suggest(vehicle: VehicleForSchedule): Promise<TaskSuggestion[]>;
}
