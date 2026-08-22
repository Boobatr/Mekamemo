import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { DashboardScreen } from './DashboardScreen';

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { get: () => os });
}

describe('DashboardScreen', () => {
  afterEach(() => setPlatform('ios'));

  it('shows the inline + and no FAB on iOS', async () => {
    setPlatform('ios');
    await renderWithProviders(<DashboardScreen />, { withNavigationContainer: false });

    expect(screen.getByTestId('add-vehicle-inline')).toBeTruthy();
    expect(screen.queryByTestId('fab-add-vehicle')).toBeNull();
  });

  it('shows the Android app bar and FAB, no inline +', async () => {
    setPlatform('android');
    await renderWithProviders(<DashboardScreen />, { withNavigationContainer: false });

    expect(screen.getByText('Mes véhicules')).toBeTruthy();
    expect(screen.getByTestId('fab-add-vehicle')).toBeTruthy();
    expect(screen.queryByTestId('add-vehicle-inline')).toBeNull();
  });

  it('lists every vehicle and forwards selection', async () => {
    const onSelectVehicle = jest.fn();
    await renderWithProviders(<DashboardScreen onSelectVehicle={onSelectVehicle} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText('Toyota RAV4 2021')).toBeTruthy();
    expect(screen.getByText('Honda Civic 2018')).toBeTruthy();
    expect(screen.getByText('Ford Transit 2019')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('vehicle-card-vehicle-rav4'));
    expect(onSelectVehicle).toHaveBeenCalledWith('vehicle-rav4');
  });

  it('triggers booking from the next-due panel', async () => {
    const onBookNextDue = jest.fn();
    await renderWithProviders(<DashboardScreen onBookNextDue={onBookNextDue} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('next-due-panel'));
    expect(onBookNextDue).toHaveBeenCalledTimes(1);
  });

  it('opens notifications from the iOS header bell', async () => {
    setPlatform('ios');
    const onOpenNotifications = jest.fn();
    await renderWithProviders(<DashboardScreen onOpenNotifications={onOpenNotifications} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('open-notifications'));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('opens notifications from the Android app bar bell', async () => {
    setPlatform('android');
    const onOpenNotifications = jest.fn();
    await renderWithProviders(<DashboardScreen onOpenNotifications={onOpenNotifications} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('open-notifications'));
    expect(onOpenNotifications).toHaveBeenCalledTimes(1);
  });

  it('labels the Android FAB', async () => {
    setPlatform('android');
    await renderWithProviders(<DashboardScreen />, { withNavigationContainer: false });

    expect(screen.getByText('+ Véhicule')).toBeTruthy();
  });
});
