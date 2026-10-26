import React from 'react';
import { Alert } from 'react-native';
import { useTranslation } from 'react-i18next';
import { EditTaskScreen, EditableTask } from './EditTaskScreen';
import { useDeleteTask, useUpdateTask } from '../../hooks/useMaintenance';
import { MaintenanceTask } from '../../services/maintenance';

interface EditTaskContainerProps {
  task: MaintenanceTask;
  vehicleId: string;
  onBack: () => void;
  onDeleted: () => void;
  onSaved: () => void;
  /** Opens the garage search for this item, once the edits are saved. */
  onFindGarage?: (task: MaintenanceTask, vehicleId: string) => void;
}

function toEditable(task: MaintenanceTask, language: 'fr' | 'en', unknownDateLabel: string): EditableTask {
  const dateLabel = task.projection?.projectedDueDate
    ? new Date(task.projection.projectedDueDate).toLocaleDateString(language === 'fr' ? 'fr-CA' : 'en-CA', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      })
    : unknownDateLabel;
  const kmLabel = task.projection?.projectedDueKm
    ? ` · ${task.projection.projectedDueKm.toLocaleString(language === 'fr' ? 'fr-CA' : 'en-CA')} km`
    : '';

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
    nextDueLabel: `${dateLabel}${kmLabel}`,
    notesForGarage: task.notesForGarage ?? '',
    groupWithTireRotation: Boolean(task.groupWithTaskId),
  };
}

export function EditTaskContainer({ task, vehicleId, onBack, onDeleted, onSaved, onFindGarage }: EditTaskContainerProps) {
  const { t, i18n } = useTranslation();
  const updateTask = useUpdateTask(vehicleId);
  const deleteTask = useDeleteTask(vehicleId);

  async function save(edited: EditableTask): Promise<boolean> {
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
      return true;
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
      return false;
    }
  }

  return (
    <EditTaskScreen
      task={toEditable(task, i18n.language as 'fr' | 'en', t('taskEdit.dateUnknown'))}
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
        if (await save(edited)) onSaved();
      }}
      onFindGarage={
        onFindGarage
          ? async (edited) => {
              // The notes typed here are part of the email: save them before leaving.
              if (await save(edited)) onFindGarage(task, vehicleId);
            }
          : undefined
      }
    />
  );
}
