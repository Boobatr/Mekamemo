import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageProfileScreen } from './GarageProfileScreen';

describe('GarageProfileScreen', () => {
  it('renders the garage name, rating, and contact email', async () => {
    await renderWithProviders(<GarageProfileScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Garage Précision')).toBeTruthy();
    expect(screen.getByText(/rendezvous@precision\.ca/)).toBeTruthy();
  });

  it('triggers request-appointment and view-email callbacks', async () => {
    const onRequestAppointment = jest.fn();
    const onViewEmailBeforeSending = jest.fn();
    await renderWithProviders(
      <GarageProfileScreen
        onRequestAppointment={onRequestAppointment}
        onViewEmailBeforeSending={onViewEmailBeforeSending}
      />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('request-appointment-button'));
    await fireEvent.press(screen.getByTestId('view-email-button'));

    expect(onRequestAppointment).toHaveBeenCalledTimes(1);
    expect(onViewEmailBeforeSending).toHaveBeenCalledTimes(1);
  });
});
