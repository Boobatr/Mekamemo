import type { MaintenanceTask } from '../services/maintenance';

export type RootStackParamList = {
  OnboardingProfile: undefined;
  OnboardingVehicle: undefined;
  MainTabs: undefined;
  AddVehicle: undefined;
  EditTask: { task: MaintenanceTask; vehicleId: string };
  MileageReading: { vehicleId: string };
  Notifications: undefined;
  ReportBreakdown: { vehicleId: string };
  Diagnosis: { reportId: string };
  GarageProfile: { garageId: string; vehicleId: string; taskId?: string; diagnosisId?: string };
  BookingConfirmation: { quoteRequestId: string };
  History: { vehicleId: string };
};

export type MainTabsParamList = {
  Vehicles: undefined;
  Calendar: undefined;
  Garages: undefined;
  Settings: undefined;
};
