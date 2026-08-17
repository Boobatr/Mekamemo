import { apiGet, apiPost } from './api-client';

export interface Booking {
  id: string;
  quoteRequestId: string;
  garageId: string;
  vehicleId: string;
  confirmedSlotAt: string;
  priceCents: number;
  durationMinutes: number;
  status: 'pending_user_confirmation' | 'confirmed' | 'cancelled';
  confirmedByUserId: string | null;
  confirmedByUserAt: string | null;
  cancellationDeadlineAt: string | null;
}

export function getBooking(id: string): Promise<Booking> {
  return apiGet(`/bookings/${id}`);
}

/** The only call in the whole app that confirms a reservation — always an explicit user tap. */
export function confirmBooking(id: string): Promise<Booking> {
  return apiPost(`/bookings/${id}/confirm`);
}
