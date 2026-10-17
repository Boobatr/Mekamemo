import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as vehiclesApi from '../services/vehicles';

export const vehicleKeys = {
  all: ['vehicles'] as const,
  detail: (id: string) => ['vehicles', id] as const,
};

export function useVehicles() {
  return useQuery({ queryKey: vehicleKeys.all, queryFn: vehiclesApi.listVehicles });
}

export function useVehicle(id: string) {
  return useQuery({ queryKey: vehicleKeys.detail(id), queryFn: () => vehiclesApi.getVehicle(id) });
}

export function useCreateVehicle() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: vehiclesApi.createVehicle,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useUpdateVehicle(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: vehiclesApi.UpdateVehicleInput) => vehiclesApi.updateVehicle(id, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: vehicleKeys.all }),
  });
}

export function useDecodeVin() {
  return useMutation({ mutationFn: vehiclesApi.decodeVin });
}
