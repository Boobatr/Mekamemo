import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { VehicleDetailScreen } from './VehicleDetailScreen';

describe('VehicleDetailScreen', () => {
  it('shows report-breakdown first, then update-mileage, then history', async () => {
    await renderWithProviders(<VehicleDetailScreen vehicleLabel="TOYOTA RAV4 2021" />, {
      withNavigationContainer: false,
    });

    const sections = screen.getAllByTestId(/^vehicle-detail-/);
    expect(sections.map((el) => el.props.testID)).toEqual([
      'vehicle-detail-report-breakdown',
      'vehicle-detail-update-mileage',
      'vehicle-detail-history',
    ]);

    expect(screen.getByText('Signaler une panne')).toBeTruthy();
    expect(screen.getByText('Mettre à jour le kilométrage')).toBeTruthy();
    expect(screen.getByText('Historique')).toBeTruthy();
  });

  it('forwards the three navigation callbacks', async () => {
    const onReportBreakdown = jest.fn();
    const onUpdateMileage = jest.fn();
    const onOpenHistory = jest.fn();
    await renderWithProviders(
      <VehicleDetailScreen
        onReportBreakdown={onReportBreakdown}
        onUpdateMileage={onUpdateMileage}
        onOpenHistory={onOpenHistory}
      />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('vehicle-detail-report-breakdown'));
    await fireEvent.press(screen.getByTestId('vehicle-detail-update-mileage'));
    await fireEvent.press(screen.getByTestId('vehicle-detail-history'));

    expect(onReportBreakdown).toHaveBeenCalledTimes(1);
    expect(onUpdateMileage).toHaveBeenCalledTimes(1);
    expect(onOpenHistory).toHaveBeenCalledTimes(1);
  });
});
