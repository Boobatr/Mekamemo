import type { MaintenanceTask } from '../services/maintenance';

export type RootStackParamList = {
  OnboardingProfile: undefined;
  Login: undefined;
  ForgotPassword: { email?: string } | undefined;
  OnboardingVehicle: undefined;
  MainTabs: undefined;
};

export type MainTabsParamList = {
  Vehicles: undefined;
  Calendar: undefined;
  Garages: undefined;
  Settings: undefined;
};

/** Nested inside the "Vehicles" tab so the bottom tab bar stays visible while
 * drilling from the dashboard into a vehicle and its action screens. */
export type VehiclesStackParamList = {
  VehicleList: undefined;
  VehicleDetail: { vehicleId: string };
  AddVehicle: undefined;
  History: { vehicleId: string };
  ReportBreakdown: { vehicleId: string };
  Diagnosis: { reportId: string; vehicleId: string };
  MileageReading: { vehicleId: string };
  GarageProfile: { garageId: string; vehicleId: string; taskId?: string; diagnosisId?: string };
  BookingConfirmation: { quoteRequestId: string };
  Notifications: undefined;
};

/** Nested inside the "Calendar" tab, same tab-bar-visibility rationale. */
export type CalendarStackParamList = {
  CalendarHome: undefined;
  EditTask: { task: MaintenanceTask; vehicleId: string };
};

/** Nested inside the "Garages" tab — has its own GarageProfile/BookingConfirmation
 * copies, independent from the ones reachable via the Vehicles tab's diagnosis flow.
 * GarageList takes optional params so Dashboard/Calendar's "book" actions can carry a
 * task/diagnosis/vehicle across the tab switch instead of losing that context. */
export type GaragesStackParamList = {
  GarageList: { vehicleId?: string; taskId?: string; diagnosisId?: string } | undefined;
  GarageProfile: { garageId: string; vehicleId: string; taskId?: string; diagnosisId?: string };
  BookingConfirmation: { quoteRequestId: string };
};
