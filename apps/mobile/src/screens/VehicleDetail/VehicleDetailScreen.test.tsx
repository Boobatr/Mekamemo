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

  it('offers to add a VIN when the vehicle has none, and rejects malformed ones', async () => {
    const onSaveVin = jest.fn();
    await renderWithProviders(<VehicleDetailScreen vin={null} onSaveVin={onSaveVin} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText('Non renseigné')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-vin'));

    // Too short, and "O" is never valid in a VIN.
    await fireEvent.changeText(screen.getByTestId('input-edit-vin'), '2T3W1RFV8MW12345');
    expect(screen.getByTestId('save-edit-vin').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-edit-vin'), '2T3W1RFV8MW12345O');
    expect(screen.getByTestId('save-edit-vin').props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByTestId('input-edit-vin'), '2t3w1rfv8mw123456');
    expect(screen.getByTestId('save-edit-vin').props.accessibilityState.disabled).toBe(false);
    await fireEvent.press(screen.getByTestId('save-edit-vin'));

    expect(onSaveVin).toHaveBeenCalledWith('2T3W1RFV8MW123456');
    expect(screen.queryByTestId('vin-edit-card')).toBeNull();
  });

  it('shows an existing VIN and lets the user cancel an edit', async () => {
    const onSaveVin = jest.fn();
    await renderWithProviders(<VehicleDetailScreen vin="2T3W1RFV8MW123456" onSaveVin={onSaveVin} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText('2T3W1RFV8MW123456')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('edit-vin'));
    expect(screen.getByTestId('input-edit-vin').props.value).toBe('2T3W1RFV8MW123456');
    await fireEvent.press(screen.getByTestId('cancel-edit-vin'));

    expect(onSaveVin).not.toHaveBeenCalled();
    expect(screen.getByTestId('vin-card')).toBeTruthy();
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
