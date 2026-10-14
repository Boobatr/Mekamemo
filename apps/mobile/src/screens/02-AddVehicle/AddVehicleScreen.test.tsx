import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AddVehicleScreen } from './AddVehicleScreen';

const VALID_VIN = '2T3W1RFV8MW123456';

describe('AddVehicleScreen', () => {
  it('disables calendar generation until the VIN is decoded', async () => {
    const decodeVin = jest.fn().mockResolvedValue({
      make: 'Toyota',
      model: 'RAV4 LE',
      year: 2021,
      engine: '2,5 L I4',
    });
    await renderWithProviders(
      <AddVehicleScreen decodeVin={decodeVin} onGenerateCalendar={jest.fn()} />,
    );

    expect(screen.getByTestId('generate-calendar-button').props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.changeText(screen.getByTestId('input-vin'), VALID_VIN);

    expect(decodeVin).toHaveBeenCalledWith(VALID_VIN);
    expect(screen.getByText('Toyota')).toBeTruthy();
    expect(screen.getByTestId('generate-calendar-button').props.accessibilityState.disabled).toBe(
      false,
    );
  });

  it('passes the decoded vehicle and odometer reading to onGenerateCalendar', async () => {
    const decodeVin = jest.fn().mockResolvedValue({
      make: 'Toyota',
      model: 'RAV4 LE',
      year: 2021,
      engine: '2,5 L I4',
    });
    const onGenerateCalendar = jest.fn();
    await renderWithProviders(
      <AddVehicleScreen decodeVin={decodeVin} onGenerateCalendar={onGenerateCalendar} />,
    );

    await fireEvent.changeText(screen.getByTestId('input-vin'), VALID_VIN);
    await fireEvent.changeText(screen.getByTestId('input-odometer'), '64200');
    await fireEvent.press(screen.getByTestId('generate-calendar-button'));

    expect(onGenerateCalendar).toHaveBeenCalledWith({
      vin: VALID_VIN,
      make: 'Toyota',
      model: 'RAV4 LE',
      year: 2021,
      engine: '2,5 L I4',
      trim: undefined,
      odometerKm: 64200,
    });
  });

  it('does not decode until the VIN reaches 17 characters', async () => {
    const decodeVin = jest.fn();
    await renderWithProviders(<AddVehicleScreen decodeVin={decodeVin} onGenerateCalendar={jest.fn()} />);

    await fireEvent.changeText(screen.getByTestId('input-vin'), '2T3W1RFV8MW');
    expect(decodeVin).not.toHaveBeenCalled();
  });

  it('lets the user switch to manual entry when they have no VIN', async () => {
    const onGenerateCalendar = jest.fn();
    await renderWithProviders(
      <AddVehicleScreen decodeVin={jest.fn()} onGenerateCalendar={onGenerateCalendar} />,
    );

    expect(screen.getByTestId('generate-calendar-button').props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.press(screen.getByTestId('switch-to-manual-entry'));
    expect(screen.queryByTestId('input-vin')).toBeNull();
    expect(screen.getByTestId('generate-calendar-button').props.accessibilityState.disabled).toBe(
      true,
    );

    await fireEvent.changeText(screen.getByTestId('input-make'), 'Honda');
    await fireEvent.changeText(screen.getByTestId('input-model'), 'Civic');
    await fireEvent.changeText(screen.getByTestId('input-year'), '2018');
    await fireEvent.changeText(screen.getByTestId('input-odometer'), '80000');

    expect(screen.getByTestId('generate-calendar-button').props.accessibilityState.disabled).toBe(
      false,
    );

    await fireEvent.press(screen.getByTestId('generate-calendar-button'));
    expect(onGenerateCalendar).toHaveBeenCalledWith({
      make: 'Honda',
      model: 'Civic',
      year: 2018,
      engine: undefined,
      odometerKm: 80000,
    });
  });

  it('can switch back from manual entry to VIN entry', async () => {
    await renderWithProviders(
      <AddVehicleScreen decodeVin={jest.fn()} onGenerateCalendar={jest.fn()} />,
    );

    await fireEvent.press(screen.getByTestId('switch-to-manual-entry'));
    await fireEvent.press(screen.getByTestId('switch-to-vin-entry'));

    expect(screen.getByTestId('input-vin')).toBeTruthy();
    expect(screen.queryByTestId('input-make')).toBeNull();
  });
});
