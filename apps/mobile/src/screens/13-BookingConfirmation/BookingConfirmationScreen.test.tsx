import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { BookingConfirmationScreen } from './BookingConfirmationScreen';

describe('BookingConfirmationScreen', () => {
  it('shows the confirm-note and does not call onConfirm on render alone', async () => {
    const onConfirm = jest.fn();
    await renderWithProviders(<BookingConfirmationScreen onConfirm={onConfirm} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText("Rien n'est réservé avant votre confirmation.")).toBeTruthy();
    expect(onConfirm).not.toHaveBeenCalled();
  });

  it('only confirms the booking on explicit user tap', async () => {
    const onConfirm = jest.fn();
    await renderWithProviders(<BookingConfirmationScreen onConfirm={onConfirm} />, {
      withNavigationContainer: false,
    });

    expect(onConfirm).not.toHaveBeenCalled();
    await fireEvent.press(screen.getByTestId('confirm-booking-button'));
    expect(onConfirm).toHaveBeenCalledWith('booking-1');
    expect(onConfirm).toHaveBeenCalledTimes(1);
  });

  it('shows the best option and the other available slots', async () => {
    await renderWithProviders(<BookingConfirmationScreen />, { withNavigationContainer: false });
    expect(screen.getByTestId('best-option-panel')).toBeTruthy();
    expect(screen.getByText('Samedi 15 août · 9:00')).toBeTruthy();
    expect(screen.getByText(/Atelier Rosemont/)).toBeTruthy();
    expect(screen.getByText(/Mécanique Papineau/)).toBeTruthy();
  });
});
