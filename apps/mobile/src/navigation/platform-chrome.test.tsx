import React from 'react';
import { Platform } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import { FabAndroid } from './FabAndroid';
import { AndroidAppBar } from './AndroidAppBar';

function setPlatform(os: 'ios' | 'android') {
  Object.defineProperty(Platform, 'OS', { get: () => os });
}

describe('platform-specific chrome', () => {
  afterEach(() => setPlatform('ios'));

  it('renders the FAB on Android', async () => {
    setPlatform('android');
    const onPress = jest.fn();
    await renderWithProviders(<FabAndroid onPress={onPress} testID="fab" />, {
      withNavigationContainer: false,
    });
    fireEvent.press(screen.getByTestId('fab'));
    expect(onPress).toHaveBeenCalledTimes(1);
  });

  it('renders nothing on iOS (iOS uses the inline + instead)', async () => {
    setPlatform('ios');
    await renderWithProviders(<FabAndroid onPress={jest.fn()} testID="fab" />, {
      withNavigationContainer: false,
    });
    expect(screen.queryByTestId('fab')).toBeNull();
  });

  it('AndroidAppBar shows the title and triggers the menu callback', async () => {
    const onMenuPress = jest.fn();
    await renderWithProviders(
      <AndroidAppBar title="Mes véhicules" onMenuPress={onMenuPress} />,
      { withNavigationContainer: false },
    );
    expect(screen.getByText('Mes véhicules')).toBeTruthy();
    fireEvent.press(screen.getByLabelText('menu'));
    expect(onMenuPress).toHaveBeenCalledTimes(1);
  });
});
