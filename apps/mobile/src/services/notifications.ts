import { apiGet, apiPatch, apiPost } from './api-client';

export interface Notification {
  id: string;
  userId: string;
  vehicleId: string | null;
  type: 'mileage_prompt' | 'maintenance_reminder_7d' | 'maintenance_reminder_due' | 'garage_response';
  payload: Record<string, unknown>;
  scheduledFor: string;
  sentAt: string | null;
  readAt: string | null;
}

export function listNotifications(): Promise<Notification[]> {
  return apiGet('/notifications');
}

export function markNotificationRead(id: string) {
  return apiPatch(`/notifications/${id}/read`);
}

export function registerPushToken(pushToken: string) {
  return apiPost('/notifications/push-token', { pushToken });
}
