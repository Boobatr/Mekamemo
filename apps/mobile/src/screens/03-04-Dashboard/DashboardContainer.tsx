import React, { useMemo } from 'react';
import { useQueries } from '@tanstack/react-query';
import { DashboardScreen } from './DashboardScreen';
import { useVehicles } from '../../hooks/useVehicles';
import { maintenanceKeys } from '../../hooks/useMaintenance';
import { listMaintenanceTasks, MaintenanceTask } from '../../services/maintenance';
import { mileageKeys } from '../../hooks/useMileage';
import { getPace } from '../../services/mileage';
import { historyKeys } from '../../hooks/useHistory';
import { getHistorySummary } from '../../services/history';
import { useTranslation } from 'react-i18next';

interface DashboardContainerProps {
  userName: string;
  onSelectVehicle: (vehicleId: string) => void;
  onAddVehicle: () => void;
  onBookNextDue: (vehicleId: string, taskId: string) => void;
  onOpenNotifications: () => void;
}

function earliestUpcoming(tasks: MaintenanceTask[]) {
  return tasks
    .filter((t) => t.status === 'upcoming' || t.status === 'overdue')
    .filter((t) => t.projection?.projectedDueDate)
    .sort(
      (a, b) =>
        new Date(a.projection!.projectedDueDate!).getTime() -
        new Date(b.projection!.projectedDueDate!).getTime(),
    )[0];
}

export function DashboardContainer({
  userName,
  onSelectVehicle,
  onAddVehicle,
  onBookNextDue,
  onOpenNotifications,
}: DashboardContainerProps) {
  const { t } = useTranslation();
  const { data: vehicles = [] } = useVehicles();

  const taskQueries = useQueries({
    queries: vehicles.map((v) => ({
      queryKey: maintenanceKeys.forVehicle(v.id),
      queryFn: () => listMaintenanceTasks(v.id),
      enabled: Boolean(v.id),
    })),
  });

  const paceQueries = useQueries({
    queries: vehicles.map((v) => ({
      queryKey: mileageKeys.pace(v.id),
      queryFn: () => getPace(v.id),
      enabled: Boolean(v.id),
    })),
  });

  const historySummaryQueries = useQueries({
    queries: vehicles.map((v) => ({
      queryKey: historyKeys.summary(v.id),
      queryFn: () => getHistorySummary(v.id),
      enabled: Boolean(v.id),
    })),
  });

  const vehiclesWithStatus = useMemo(
    () =>
      vehicles.map((vehicle, i) => {
        const tasks = taskQueries[i]?.data ?? [];
        const overdue = tasks.find((task) => task.status === 'overdue');
        const nextTask = earliestUpcoming(tasks);
        const statusLabel = overdue
          ? overdue.name.toUpperCase()
          : nextTask
            ? nextTask.name.toUpperCase()
            : t('dashboard.tabs.vehicles') === 'Vehicles'
              ? 'UP TO DATE'
              : 'À JOUR';
        return {
          id: vehicle.id,
          make: vehicle.make,
          model: vehicle.model,
          year: vehicle.year,
          engine: vehicle.engine,
          odometerKm: paceQueries[i]?.data?.currentKm ?? 0,
          usageType: vehicle.usageType,
          statusLabel,
          isOverdue: Boolean(overdue),
          tasksCount: tasks.filter((task) => task.status === 'upcoming' || task.status === 'overdue')
            .length,
          photoUrl: vehicle.photoUrl,
        };
      }),
    [vehicles, taskQueries, t],
  );

  const allTasks = taskQueries.flatMap((q) => q.data ?? []);
  const globalNextTask = earliestUpcoming(allTasks);
  const globalNextVehicle = vehicles.find((v) =>
    taskQueries.some((q) => q.data?.some((task) => task.id === globalNextTask?.id)),
  );
  const daysUntil = globalNextTask?.projection?.projectedDueDate
    ? Math.max(
        0,
        Math.round(
          (new Date(globalNextTask.projection.projectedDueDate).getTime() - Date.now()) /
            (1000 * 60 * 60 * 24),
        ),
      )
    : 0;

  const upcoming30d = allTasks.filter((task) => {
    const due = task.projection?.projectedDueDate;
    if (!due) return false;
    const days = (new Date(due).getTime() - Date.now()) / (1000 * 60 * 60 * 24);
    return days >= 0 && days <= 30;
  }).length;

  const costThisYearCents = historySummaryQueries.reduce(
    (sum, q) => sum + (q.data?.totalThisYearCents ?? 0),
    0,
  );

  return (
    <DashboardScreen
      userName={userName}
      vehicles={vehiclesWithStatus as never}
      nextDue={{
        vehicleId: globalNextVehicle?.id ?? '',
        taskName: globalNextTask?.name ?? '',
        vehicleLabel: globalNextVehicle ? `${globalNextVehicle.make} ${globalNextVehicle.model}` : '',
        daysUntilDue: daysUntil,
      }}
      fleetSummary={{ vehiclesCount: vehicles.length, upcoming30d, costThisYearCents }}
      onSelectVehicle={onSelectVehicle}
      onAddVehicle={onAddVehicle}
      onOpenNotifications={onOpenNotifications}
      onBookNextDue={() => {
        if (globalNextVehicle && globalNextTask) onBookNextDue(globalNextVehicle.id, globalNextTask.id);
      }}
    />
  );
}
