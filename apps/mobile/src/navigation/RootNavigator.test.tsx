import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../test-utils/renderWithProviders';
import { RootNavigator } from './RootNavigator';

describe('RootNavigator end-to-end flow', () => {
  it('walks through onboarding into the main tabs', async () => {
    await renderWithProviders(<RootNavigator />);

    // Step 1: profile
    expect(screen.getByText('Vos informations')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('continue-button'));

    // Step 2: vehicle — decode then generate calendar
    await fireEvent.changeText(screen.getByTestId('input-vin'), '2T3W1RFV8MW123456');
    await screen.findByTestId('decoded-card');
    await fireEvent.press(screen.getByTestId('generate-calendar-button'));

    // Lands on the main tabs dashboard
    await screen.findByText('Mes véhicules');
    expect(screen.getByText('Toyota RAV4 2021')).toBeTruthy();
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
