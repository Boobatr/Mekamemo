import React from 'react';
import { ActivityIndicator, View } from 'react-native';
import { AiCalendarScreen } from './AiCalendarScreen';
import { useVehicles } from '../../hooks/useVehicles';
import { useMaintenanceTasks } from '../../hooks/useMaintenance';
import { MaintenanceTask } from '../../services/maintenance';

interface AiCalendarContainerProps {
  onOpenTask: (task: MaintenanceTask, vehicleId: string) => void;
  onBook: (vehicleId: string) => void;
}

function toDueDateLabel(task: MaintenanceTask): string {
  if (!task.projection?.projectedDueDate) return task.status === 'overdue' ? 'En retard' : '—';
  return new Date(task.projection.projectedDueDate).toLocaleDateString('fr-CA', {
    day: 'numeric',
    month: 'short',
  });
}

export function AiCalendarContainer({ onOpenTask, onBook }: AiCalendarContainerProps) {
  const { data: vehicles = [] } = useVehicles();
  const primaryVehicle = vehicles[0];
  const { data: tasks = [], isLoading } = useMaintenanceTasks(primaryVehicle?.id ?? '');

  if (!primaryVehicle) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <AiCalendarScreen
      vehicleLabel={`${primaryVehicle.make.toUpperCase()} ${primaryVehicle.model.toUpperCase()} ${primaryVehicle.year}`}
      odometerKm={0}
      tasks={
        (isLoading
          ? []
          : tasks.map((task) => ({
              id: task.id,
              name: task.name,
              dueDateLabel: toDueDateLabel(task),
              intervalKm: task.intervalKm ?? undefined,
              intervalMonths: task.intervalMonths ?? undefined,
              costMinCents: task.estimatedCostMinCents ?? undefined,
              costMaxCents: task.estimatedCostMaxCents ?? undefined,
            }))) as never
      }
      onOpenTask={(taskId) => {
        const task = tasks.find((t) => t.id === taskId);
        if (task) onOpenTask(task, primaryVehicle.id);
      }}
      onBook={() => onBook(primaryVehicle.id)}
    />
  );
}
