import { apiGet, apiPost } from './api-client';

export interface GarageSearchResult {
  id: string;
  name: string;
  address: string;
  distanceKm: number;
  lat: number;
  lng: number;
  rating: number | null;
  reviewCount: number | null;
  specialties: string[];
  email: string | null;
  phone: string | null;
  certifications: string[];
  hours: Record<string, string> | null;
}

export interface GarageSearchResponse {
  assistantSummary: string;
  origin: { lat: number; lng: number };
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

export interface QuoteEmailPreview {
  /** "email" when the garage has an address on file; otherwise a voice call (MEKAMEMO+) would carry the message. */
  contactMethod: 'email' | 'voice';
  to: string | null;
  phone: string | null;
  subject: string;
  body: string;
}

/** The message a quote request to this garage would send — nothing is sent or saved. */
export function previewQuoteEmail(input: { vehicleId: string; garageId: string }): Promise<QuoteEmailPreview> {
  return apiPost('/quote-requests/preview', input);
}

export interface AddGarageInput {
  name: string;
  street: string;
  city: string;
  postalCode?: string;
  phone?: string;
  email?: string;
}

export interface AddGarageResult {
  garage: { id: string; name: string; address: string };
  /** False when that garage was already listed: the existing one is returned. */
  created: boolean;
}

export function addGarage(input: AddGarageInput): Promise<AddGarageResult> {
  return apiPost('/garages', input);
}
