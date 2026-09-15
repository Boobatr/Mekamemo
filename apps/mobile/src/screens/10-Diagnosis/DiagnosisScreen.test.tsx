import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { DiagnosisScreen } from './DiagnosisScreen';
import { mockDiagnosis } from '../../mocks/mockData';

describe('DiagnosisScreen', () => {
  it('always shows the confirm-with-garage disclaimer', async () => {
    await renderWithProviders(<DiagnosisScreen />, { withNavigationContainer: false });
    expect(screen.getByTestId('diagnosis-disclaimer')).toBeTruthy();
    expect(screen.getByText('Estimation indicative : le garage confirme au diagnostic.')).toBeTruthy();
  });

  it('shows the primary cause and both secondary leads', async () => {
    await renderWithProviders(<DiagnosisScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Plaquettes de frein avant usées')).toBeTruthy();
    expect(screen.getByText('Disques voilés')).toBeTruthy();
    expect(screen.getByText('Étrier qui colle')).toBeTruthy();
  });

  it('triggers request-quotes and add-to-calendar callbacks', async () => {
    const onRequestQuotes = jest.fn();
    const onAddToCalendar = jest.fn();
    await renderWithProviders(
      <DiagnosisScreen onRequestQuotes={onRequestQuotes} onAddToCalendar={onAddToCalendar} />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('request-quotes-button'));
    await fireEvent.press(screen.getByTestId('add-to-calendar-button'));

    expect(onRequestQuotes).toHaveBeenCalledTimes(1);
    expect(onAddToCalendar).toHaveBeenCalledTimes(1);
  });

  it('forwards a tap on a nearby garage', async () => {
    const onSelectGarage = jest.fn();
    await renderWithProviders(<DiagnosisScreen onSelectGarage={onSelectGarage} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('diagnosis-garage-garage-precision'));
    expect(onSelectGarage).toHaveBeenCalledWith('garage-precision');
  });

  it('shows the quote count on the request-quotes button and disables it when no garages are found', async () => {
    await renderWithProviders(<DiagnosisScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Demander 2 soumissions')).toBeTruthy();
    expect(screen.getByTestId('request-quotes-button').props.accessibilityState.disabled).toBe(false);

    await renderWithProviders(
      <DiagnosisScreen diagnosis={{ ...mockDiagnosis, availableGarages: [] }} />,
      { withNavigationContainer: false },
    );
    expect(screen.getByTestId('request-quotes-button').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByText("Aucun garage trouvé pour l'instant.")).toBeTruthy();
  });
});
