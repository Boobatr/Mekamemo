import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as notificationsApi from '../services/notifications';

const notificationsKey = ['notifications'] as const;

export function useNotifications() {
  return useQuery({ queryKey: notificationsKey, queryFn: notificationsApi.listNotifications });
}

export function useMarkNotificationRead() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: notificationsApi.markNotificationRead,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: notificationsKey }),
  });
}
