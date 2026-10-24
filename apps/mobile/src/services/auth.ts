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

export interface ResetPasswordInput {
  email: string;
  /** The code from the e-mail, as typed. */
  code: string;
  newPassword: string;
}

/** Asks the server to e-mail a one-time code. It answers the same for unknown addresses. */
export function forgotPassword(email: string): Promise<{ ok: true }> {
  return apiPost('/auth/forgot-password', { email });
}

/** Sets a new password with the e-mailed code, and signs the user in. */
export async function resetPassword(input: ResetPasswordInput): Promise<AuthResponse> {
  const res = await apiPost<AuthResponse>('/auth/reset-password', input);
  await setStoredToken(res.accessToken);
  return res;
}

export async function logout(): Promise<void> {
  await clearStoredToken();
}
