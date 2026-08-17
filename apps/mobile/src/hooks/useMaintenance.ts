import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import * as maintenanceApi from '../services/maintenance';
import { vehicleKeys } from './useVehicles';

export const maintenanceKeys = {
  forVehicle: (vehicleId: string) => ['maintenance-tasks', vehicleId] as const,
};

export function useMaintenanceTasks(vehicleId: string) {
  return useQuery({
    queryKey: maintenanceKeys.forVehicle(vehicleId),
    queryFn: () => maintenanceApi.listMaintenanceTasks(vehicleId),
    enabled: Boolean(vehicleId),
  });
}

export function useGenerateCalendar() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (vehicleId: string) => maintenanceApi.generateCalendar(vehicleId),
    onSuccess: (_data, vehicleId) => {
      queryClient.invalidateQueries({ queryKey: maintenanceKeys.forVehicle(vehicleId) });
      queryClient.invalidateQueries({ queryKey: vehicleKeys.all });
    },
  });
}

export function useUpdateTask(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: maintenanceApi.UpdateTaskInput }) =>
      maintenanceApi.updateTask(taskId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.forVehicle(vehicleId) }),
  });
}

export function useDeleteTask(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => maintenanceApi.deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.forVehicle(vehicleId) }),
  });
}

export function useCompleteTask(vehicleId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ taskId, input }: { taskId: string; input: maintenanceApi.CompleteTaskInput }) =>
      maintenanceApi.completeTask(taskId, input),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: maintenanceKeys.forVehicle(vehicleId) }),
  });
}
