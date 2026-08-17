import React from 'react';
import { Alert } from 'react-native';
import { EditTaskScreen, EditableTask } from './EditTaskScreen';
import { useDeleteTask, useUpdateTask } from '../../hooks/useMaintenance';
import { MaintenanceTask } from '../../services/maintenance';

interface EditTaskContainerProps {
  task: MaintenanceTask;
  vehicleId: string;
  onBack: () => void;
  onDeleted: () => void;
  onSaved: () => void;
}

function toEditable(task: MaintenanceTask): EditableTask {
  return {
    id: task.id,
    name: task.name,
    editedByUser: task.editedByUser,
    isRecurring: task.isRecurring,
    manufacturerIntervalKm: task.intervalKm ?? 8000,
    manufacturerIntervalMonths: task.intervalMonths ?? 6,
    intervalKm: task.intervalKm ?? 8000,
    intervalMonths: task.intervalMonths ?? 6,
    priority: task.priority,
    nextDueLabel: task.projection?.projectedDueDate
      ? new Date(task.projection.projectedDueDate).toLocaleDateString('fr-CA', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        })
      : 'À déterminer',
    notesForGarage: task.notesForGarage ?? '',
    groupWithTireRotation: Boolean(task.groupWithTaskId),
  };
}

export function EditTaskContainer({ task, vehicleId, onBack, onDeleted, onSaved }: EditTaskContainerProps) {
  const updateTask = useUpdateTask(vehicleId);
  const deleteTask = useDeleteTask(vehicleId);

  return (
    <EditTaskScreen
      task={toEditable(task)}
      onBack={onBack}
      onDelete={async () => {
        try {
          await deleteTask.mutateAsync(task.id);
          onDeleted();
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
      onSave={async (edited) => {
        try {
          await updateTask.mutateAsync({
            taskId: task.id,
            input: {
              intervalKm: edited.intervalKm,
              intervalMonths: edited.intervalMonths,
              priority: edited.priority,
              notesForGarage: edited.notesForGarage,
            },
          });
          onSaved();
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
    />
  );
}
