import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import { RootNavigator } from './RootNavigator';

// This suite exercises real navigation + TanStack Query wiring end-to-end,
// with only the network boundary (services/*) mocked — everything above
// that layer (hooks, containers, screens, navigation) is the real thing.
jest.mock('../services/auth');
jest.mock('../services/vehicles');
jest.mock('../services/maintenance');
jest.mock('../services/mileage');
jest.mock('../services/users');

import * as authApi from '../services/auth';
import * as vehiclesApi from '../services/vehicles';
import * as maintenanceApi from '../services/maintenance';
import * as mileageApi from '../services/mileage';
import * as usersApi from '../services/users';

const NOW = new Date('2026-08-14T00:00:00Z');
const FUTURE = new Date(NOW.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString();

const mockVehicle = {
  id: 'vehicle-1',
  userId: 'user-1',
  vin: '2T3W1RFV8MW123456',
  make: 'Toyota',
  model: 'RAV4',
  trim: 'LE',
  year: 2021,
  engine: '2,5 L I4',
  usageType: 'mixed' as const,
  photoUrl: null,
  createdAt: NOW.toISOString(),
};

const mockTask = {
  id: 'task-oil-change',
  vehicleId: 'vehicle-1',
  name: "Vidange d'huile + filtre",
  description: null,
  intervalKm: 8000,
  intervalMonths: 6,
  priority: 'normal' as const,
  isRecurring: true,
  editedByUser: false,
  notesForGarage: null,
  groupWithTaskId: null,
  status: 'upcoming' as const,
  estimatedCostMinCents: 9000,
  estimatedCostMaxCents: 13000,
  projection: {
    id: 'projection-1',
    projectedDueDate: FUTURE,
    projectedDueKm: 72000,
    avgKmPerMonthUsed: null,
  },
};

beforeEach(() => {
  jest.mocked(authApi.register).mockResolvedValue({ accessToken: 'test-token', userId: 'user-1' });
  jest.mocked(vehiclesApi.decodeVin).mockResolvedValue({
    make: 'Toyota',
    model: 'RAV4',
    trim: 'LE',
    year: 2021,
    engine: '2,5 L I4',
  });
  jest.mocked(vehiclesApi.createVehicle).mockResolvedValue(mockVehicle);
  jest.mocked(vehiclesApi.listVehicles).mockResolvedValue([mockVehicle]);
  jest.mocked(maintenanceApi.generateCalendar).mockResolvedValue([mockTask]);
  jest.mocked(maintenanceApi.listMaintenanceTasks).mockResolvedValue([mockTask]);
  jest.mocked(mileageApi.getPace).mockResolvedValue({
    currentKm: 64200,
    avgKmPerMonth: 1200,
    isPaceEstimated: true,
    readingsCount: 1,
    monthlyBars: [],
    suggestedReadings: [64900, 65400, 65900],
  });
  jest.mocked(usersApi.getProfile).mockResolvedValue({
    id: 'user-1',
    email: 'marc.lavoie@courriel.ca',
    fullName: 'Marc Lavoie',
    phone: '+1 514 555 0142',
    postalCode: 'H2X 1Y4',
    searchRadiusKm: 15,
    language: 'fr',
    units: 'km',
    autoContactGarages: true,
    voiceFallbackEnabled: false,
    confirmBeforeBooking: true,
  });
  jest.mocked(usersApi.getSubscription).mockResolvedValue({
    plan: 'free',
    status: 'none',
    currentPeriodEnd: null,
  });
});

describe('RootNavigator end-to-end flow', () => {
  it('walks through onboarding into the main tabs', async () => {
    await renderWithProviders(<RootNavigator />);

    // Step 1: profile
    expect(screen.getByText('Vos informations')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('continue-button'));
    expect(authApi.register).toHaveBeenCalled();

    // Step 2: vehicle — decode then generate calendar
    await fireEvent.changeText(screen.getByTestId('input-vin'), '2T3W1RFV8MW123456');
    await screen.findByTestId('decoded-card');
    await fireEvent.press(screen.getByTestId('generate-calendar-button'));

    // Lands on the main tabs dashboard
    await screen.findByText('Mes véhicules');
    await screen.findByText('Toyota RAV4 2021');
    expect(vehiclesApi.createVehicle).toHaveBeenCalled();
    expect(maintenanceApi.generateCalendar).toHaveBeenCalledWith('vehicle-1');
  });

  it('navigates from the dashboard into a vehicle detail flow and back', async () => {
    await renderWithProviders(<RootNavigator />);

    await fireEvent.press(screen.getByTestId('continue-button'));
    await fireEvent.changeText(screen.getByTestId('input-vin'), '2T3W1RFV8MW123456');
    await screen.findByTestId('decoded-card');
    await fireEvent.press(screen.getByTestId('generate-calendar-button'));
    await screen.findByText('Mes véhicules');

    // Switch to the Calendar tab and open a task
    await fireEvent.press(screen.getByTestId('tab-Calendar'));
    await screen.findByText("Vidange d'huile + filtre");
    await fireEvent.press(screen.getByTestId('task-row-task-oil-change'));

    await screen.findByTestId('back-to-calendar');
    await fireEvent.press(screen.getByTestId('back-to-calendar'));

    await screen.findByText("Vidange d'huile + filtre");
  });
});
