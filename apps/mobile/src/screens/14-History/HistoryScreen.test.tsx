import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { HistoryScreen } from './HistoryScreen';

describe('HistoryScreen', () => {
  it('groups entries by year', async () => {
    await renderWithProviders(<HistoryScreen />, { withNavigationContainer: false });
    expect(screen.getByText('2026')).toBeTruthy();
    expect(screen.getByText('2025')).toBeTruthy();
    expect(screen.getByText('Pneus d’été + équilibrage')).toBeTruthy();
  });

  it('triggers export and open-resale-dossier callbacks', async () => {
    const onExport = jest.fn();
    const onOpenResaleDossier = jest.fn();
    await renderWithProviders(
      <HistoryScreen onExport={onExport} onOpenResaleDossier={onOpenResaleDossier} />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('export-history-button'));
    await fireEvent.press(screen.getByTestId('open-resale-dossier-button'));

    expect(onExport).toHaveBeenCalledTimes(1);
    expect(onOpenResaleDossier).toHaveBeenCalledTimes(1);
  });
});
