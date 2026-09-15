import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ReportBreakdownScreen } from './ReportBreakdownScreen';

describe('ReportBreakdownScreen', () => {
  it('disables analyze until a description is entered, and shows a hint why', async () => {
    await renderWithProviders(<ReportBreakdownScreen />, { withNavigationContainer: false });
    expect(screen.getByTestId('analyze-button').props.accessibilityState.disabled).toBe(true);
    expect(screen.getByTestId('analyze-hint')).toBeTruthy();

    await fireEvent.changeText(screen.getByTestId('input-description'), 'Bruit au freinage');
    expect(screen.getByTestId('analyze-button').props.accessibilityState.disabled).toBe(false);
    expect(screen.queryByTestId('analyze-hint')).toBeNull();
  });

  it('submits description, tags, and attachment flags on analyze', async () => {
    const onAnalyze = jest.fn();
    const onCapturePhoto = jest.fn().mockResolvedValue(true);
    await renderWithProviders(
      <ReportBreakdownScreen onAnalyze={onAnalyze} onCapturePhoto={onCapturePhoto} />,
      { withNavigationContainer: false },
    );

    await fireEvent.changeText(
      screen.getByTestId('input-description'),
      'Bruit de grincement au freinage',
    );
    await fireEvent.press(screen.getByTestId('tag-onBraking'));
    await fireEvent.press(screen.getByTestId('tag-warningLight'));
    await fireEvent.press(screen.getByTestId('attach-photo'));
    await fireEvent.press(screen.getByTestId('analyze-button'));

    expect(onAnalyze).toHaveBeenCalledWith({
      descriptionText: 'Bruit de grincement au freinage',
      tags: ['onBraking', 'warningLight'],
      hasPhoto: true,
      hasVideo: false,
      hasAudio: false,
    });
  });

  it('toggles a tag off when pressed twice', async () => {
    await renderWithProviders(<ReportBreakdownScreen />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('tag-odor'));
    await fireEvent.press(screen.getByTestId('tag-odor'));

    expect(screen.getByTestId('tag-odor').props.style).toEqual(
      expect.arrayContaining([expect.objectContaining({ color: expect.not.stringMatching('#ffffff') })]),
    );
  });
});
