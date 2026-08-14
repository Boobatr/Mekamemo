import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { MileageReadingScreen } from './MileageReadingScreen';

describe('MileageReadingScreen', () => {
  it('disables save until a value is chosen', async () => {
    await renderWithProviders(<MileageReadingScreen />, { withNavigationContainer: false });
    expect(screen.getByTestId('save-reading-button').props.accessibilityState.disabled).toBe(true);
  });

  it('saves a one-tap estimate as source estimate_tap', async () => {
    const onSave = jest.fn();
    await renderWithProviders(<MileageReadingScreen onSave={onSave} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('estimate-65400'));
    await fireEvent.press(screen.getByTestId('save-reading-button'));

    expect(onSave).toHaveBeenCalledWith({ valueKm: 65400, source: 'estimate_tap', autoTrackEnabled: false });
  });

  it('saves a manual "other" value as source manual', async () => {
    const onSave = jest.fn();
    await renderWithProviders(<MileageReadingScreen onSave={onSave} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('estimate-other'));
    await fireEvent.changeText(screen.getByTestId('input-manual-odometer'), '67000');
    await fireEvent.press(screen.getByTestId('save-reading-button'));

    expect(onSave).toHaveBeenCalledWith({ valueKm: 67000, source: 'manual', autoTrackEnabled: false });
  });

  it('fills the manual field from a mocked odometer photo read (OCR)', async () => {
    const onPhotographOdometer = jest.fn().mockResolvedValue(65900);
    const onSave = jest.fn();
    await renderWithProviders(
      <MileageReadingScreen onPhotographOdometer={onPhotographOdometer} onSave={onSave} />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('photograph-odometer'));
    await screen.findByDisplayValue('65900');
    await fireEvent.press(screen.getByTestId('save-reading-button'));

    expect(onSave).toHaveBeenCalledWith({ valueKm: 65900, source: 'manual', autoTrackEnabled: false });
  });

  it('includes the auto-track preference when enabled', async () => {
    const onSave = jest.fn();
    await renderWithProviders(<MileageReadingScreen onSave={onSave} />, {
      withNavigationContainer: false,
    });

    await fireEvent(screen.getByTestId('auto-track-switch'), 'valueChange', true);
    await fireEvent.press(screen.getByTestId('estimate-64900'));
    await fireEvent.press(screen.getByTestId('save-reading-button'));

    expect(onSave).toHaveBeenCalledWith({ valueKm: 64900, source: 'estimate_tap', autoTrackEnabled: true });
  });
});
