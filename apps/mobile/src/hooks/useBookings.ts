import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as bookingsApi from '../services/bookings';

export function useBooking(id: string) {
  return useQuery({ queryKey: ['booking', id], queryFn: () => bookingsApi.getBooking(id), enabled: Boolean(id) });
}

export function useConfirmBooking() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: bookingsApi.confirmBooking,
    onSuccess: (booking) => queryClient.invalidateQueries({ queryKey: ['booking', booking.id] }),
  });
}
