import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as mileageApi from '../services/mileage';
import { maintenanceKeys } from './useMaintenance';

export const mileageKeys = {
  pace: (vehicleId: string) => ['mileage-pace', vehicleId] as const,
};

export function usePace(vehicleId: string) {
  return useQuery({
    queryKey: mileageKeys.pace(vehicleId),
    queryFn: () => mileageApi.getPace(vehicleId),
    enabled: Boolean(vehicleId),
  });
}

export function useRecordReading(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: Parameters<typeof mileageApi.recordReading>[1]) =>
      mileageApi.recordReading(vehicleId, input),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: mileageKeys.pace(vehicleId) });
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.forVehicle(vehicleId) });
    },
  });
}

export function useOcrOdometer(vehicleId: string) {
  return useMutation({
    mutationFn: (photo: { uri: string; name: string; type: string }) =>
      mileageApi.ocrOdometer(vehicleId, photo),
  });
}
