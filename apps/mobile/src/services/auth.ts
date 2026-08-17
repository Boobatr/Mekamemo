import { apiPost } from './api-client';
import { setStoredToken, clearStoredToken } from './auth-storage';

export interface RegisterInput {
  email: string;
  password: string;
  fullName: string;
  phone: string;
  postalCode: string;
  searchRadiusKm: number;
  language: 'fr' | 'en';
}

export interface AuthResponse {
  accessToken: string;
  userId: string;
}

export async function register(input: RegisterInput): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/register', input);
  await setStoredToken(res.accessToken);
  return res;
}

export async function login(email: string, password: string): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/login', { email, password });
  await setStoredToken(res.accessToken);
  return res;
}

export async function logout(): Promise<void> {
  await clearStoredToken();
}
