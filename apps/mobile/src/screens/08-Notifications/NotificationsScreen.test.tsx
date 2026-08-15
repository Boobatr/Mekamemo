import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { NotificationsScreen } from './NotificationsScreen';

describe('NotificationsScreen', () => {
  it('lists every notification', async () => {
    await renderWithProviders(<NotificationsScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Civic 2018 — freins en retard de 3 400 km')).toBeTruthy();
    expect(screen.getByText('Garage Précision a répondu')).toBeTruthy();
  });

  it('forwards the CHERCHER action with the notification id', async () => {
    const onAction = jest.fn();
    await renderWithProviders(<NotificationsScreen onAction={onAction} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('notification-notif-1-chercher'));
    expect(onAction).toHaveBeenCalledWith('notif-1', 'CHERCHER');
  });

  it('renders no action buttons for notifications without actions', async () => {
    await renderWithProviders(<NotificationsScreen />, { withNavigationContainer: false });
    expect(screen.queryByTestId('notification-notif-2-chercher')).toBeNull();
  });
});
