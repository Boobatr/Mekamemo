import { apiGet, apiPost, apiUpload } from './api-client';

export interface PaceSummary {
  currentKm: number;
  avgKmPerMonth: number;
  isPaceEstimated: boolean;
  readingsCount: number;
  monthlyBars: { month: string; km: number }[];
  suggestedReadings: number[];
}

export function getPace(vehicleId: string): Promise<PaceSummary> {
  return apiGet(`/vehicles/${vehicleId}/mileage/pace`);
}

export function recordReading(
  vehicleId: string,
  input: { valueKm: number; source: 'manual' | 'ocr' | 'estimate_tap' | 'gps'; recordedAt?: string },
) {
  return apiPost(`/vehicles/${vehicleId}/mileage/readings`, input);
}

export async function ocrOdometer(
  vehicleId: string,
  photo: { uri: string; name: string; type: string },
): Promise<{ valueKm: number | null }> {
  return apiUpload(`/vehicles/${vehicleId}/mileage/ocr-odometer`, photo);
}
