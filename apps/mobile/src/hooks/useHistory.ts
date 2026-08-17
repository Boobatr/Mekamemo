import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as historyApi from '../services/history';

export const historyKeys = {
  forVehicle: (vehicleId: string) => ['history', vehicleId] as const,
};

export function useHistory(vehicleId: string) {
  return useQuery({
    queryKey: historyKeys.forVehicle(vehicleId),
    queryFn: () => historyApi.listHistory(vehicleId),
    enabled: Boolean(vehicleId),
  });
}

export function useCreateHistoryEntry(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: historyApi.CreateHistoryEntryInput) => historyApi.createHistoryEntry(vehicleId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: historyKeys.forVehicle(vehicleId) }),
  });
}
