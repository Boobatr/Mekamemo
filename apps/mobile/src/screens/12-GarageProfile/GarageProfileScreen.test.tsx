import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageProfileScreen } from './GarageProfileScreen';
import { mockGarages } from '../../mocks/mockData';

describe('GarageProfileScreen', () => {
  it('renders the garage name, rating, and contact email', async () => {
    await renderWithProviders(<GarageProfileScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Garage Précision')).toBeTruthy();
    expect(screen.getByText(/rendezvous@precision\.ca/)).toBeTruthy();
  });

  it('shows the rating tag only when the garage has a rating', async () => {
    await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });
    expect(screen.getByText(/4\.8 ★/)).toBeTruthy();
  });

  it('shows the distance when known and omits a meaningless "0 KM" when it is not', async () => {
    await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });
    expect(screen.getByText(/2\.4 KM/)).toBeTruthy();
  });

  it('does not show "0 KM" for a garage whose distance is unknown', async () => {
    const unknown = { ...mockGarages[0], distanceKm: 0 };
    await renderWithProviders(<GarageProfileScreen garage={unknown} />, { withNavigationContainer: false });
    expect(screen.queryByText(/0 KM/)).toBeNull();
  });

  it('omits the rating tag for a garage with no rating yet', async () => {
    const unrated = { ...mockGarages[0], rating: 0, reviewCount: 0 };
    await renderWithProviders(<GarageProfileScreen garage={unrated} />, { withNavigationContainer: false });
    expect(screen.queryByText(/★/)).toBeNull();
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
