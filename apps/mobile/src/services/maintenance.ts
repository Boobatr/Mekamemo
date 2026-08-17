import { apiDelete, apiPatch, apiPost } from './api-client';
import { apiGet } from './api-client';

export interface TaskProjection {
  id: string;
  projectedDueDate: string | null;
  projectedDueKm: number | null;
  avgKmPerMonthUsed: number | null;
}

export interface MaintenanceTask {
  id: string;
  vehicleId: string;
  name: string;
  description: string | null;
  intervalKm: number | null;
  intervalMonths: number | null;
  priority: 'low' | 'normal' | 'critical';
  isRecurring: boolean;
  editedByUser: boolean;
  notesForGarage: string | null;
  groupWithTaskId: string | null;
  status: 'upcoming' | 'done' | 'skipped' | 'overdue';
  estimatedCostMinCents: number | null;
  estimatedCostMaxCents: number | null;
  projection: TaskProjection | null;
}

export function generateCalendar(vehicleId: string): Promise<MaintenanceTask[]> {
  return apiPost(`/vehicles/${vehicleId}/generate-calendar`);
}

export function listMaintenanceTasks(vehicleId: string): Promise<MaintenanceTask[]> {
  return apiGet(`/vehicles/${vehicleId}/maintenance-tasks`);
}

export interface UpdateTaskInput {
  intervalKm?: number;
  intervalMonths?: number;
  priority?: 'low' | 'normal' | 'critical';
  notesForGarage?: string;
  groupWithTaskId?: string;
}

export function updateTask(taskId: string, input: UpdateTaskInput): Promise<MaintenanceTask> {
  return apiPatch(`/maintenance-tasks/${taskId}`, input);
}

export function deleteTask(taskId: string): Promise<void> {
  return apiDelete(`/maintenance-tasks/${taskId}`);
}

export interface CompleteTaskInput {
  performedAt: string;
  mileageAtServiceKm: number;
  garageId?: string;
  costCents: number;
}

export function completeTask(taskId: string, input: CompleteTaskInput) {
  return apiPost(`/maintenance-tasks/${taskId}/complete`, input);
}
