import { apiGet, apiPatch } from './api-client';

export interface UserProfile {
  id: string;
  email: string;
  fullName: string;
  phone: string;
  postalCode: string;
  searchRadiusKm: number;
  language: 'fr' | 'en';
  units: 'km' | 'mi';
  autoContactGarages: boolean;
  voiceFallbackEnabled: boolean;
  confirmBeforeBooking: true;
}

export function getProfile(): Promise<UserProfile> {
  return apiGet('/users/me');
}

export interface UpdateProfileInput {
  fullName?: string;
  phone?: string;
  postalCode?: string;
  searchRadiusKm?: number;
  language?: 'fr' | 'en';
  units?: 'km' | 'mi';
  autoContactGarages?: boolean;
  voiceFallbackEnabled?: boolean;
}

export function updateProfile(input: UpdateProfileInput): Promise<UserProfile> {
  return apiPatch('/users/me', input);
}

export interface Subscription {
  plan: 'free' | 'mekamemo_plus';
  status: 'active' | 'expired' | 'trialing' | 'none';
  currentPeriodEnd: string | null;
}

export function getSubscription(): Promise<Subscription> {
  return apiGet('/users/me/subscription');
}
