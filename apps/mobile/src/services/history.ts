import { apiGet, apiPost } from './api-client';
import { API_BASE_URL } from './config';
import { getStoredToken } from './auth-storage';

export interface HistoryEntry {
  id: string;
  vehicleId: string;
  taskName: string;
  performedAt: string;
  mileageAtServiceKm: number;
  garageId: string | null;
  costCents: number;
  invoices: { id: string; fileUrl: string }[];
}

export function listHistory(vehicleId: string): Promise<HistoryEntry[]> {
  return apiGet(`/vehicles/${vehicleId}/history`);
}

export interface CreateHistoryEntryInput {
  taskName: string;
  performedAt: string;
  mileageAtServiceKm: number;
  garageId?: string;
  costCents: number;
}

export function createHistoryEntry(vehicleId: string, input: CreateHistoryEntryInput) {
  return apiPost(`/vehicles/${vehicleId}/history`, input);
}

export function attachInvoice(entryId: string, fileUrl: string) {
  return apiPost(`/history/${entryId}/invoices`, { fileUrl });
}

/**
 * Returns a URL the OS file viewer/share sheet can open directly (React Native's
 * fetch-based client isn't used here since this needs a real downloadable file,
 * not a parsed JSON body).
 */
export async function getResaleDossierExportUrl(vehicleId: string): Promise<string> {
  const token = await getStoredToken();
  return `${API_BASE_URL}/vehicles/${vehicleId}/history/export${token ? `?access_token=${token}` : ''}`;
}
