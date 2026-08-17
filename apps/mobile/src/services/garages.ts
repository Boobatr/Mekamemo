import { apiGet, apiPost } from './api-client';

export interface GarageSearchResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  rating: number | null;
  reviewCount: number | null;
  specialties: string[];
  email: string | null;
  phone: string | null;
  certifications: string[];
}

export interface GarageSearchResponse {
  assistantSummary: string;
  results: GarageSearchResult[];
}

export function searchGarages(query: string): Promise<GarageSearchResponse> {
  return apiGet('/garages/search', { query });
}

export function getGarage(id: string) {
  return apiGet(`/garages/${id}`);
}

export interface CreateQuoteRequestInput {
  vehicleId: string;
  taskId?: string;
  diagnosisId?: string;
  garageIds: string[];
}

export function createQuoteRequest(input: CreateQuoteRequestInput) {
  return apiPost('/quote-requests', input);
}

export function getQuoteRequest(id: string) {
  return apiGet(`/quote-requests/${id}`);
}
