import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ProfileScreen } from './ProfileScreen';

describe('ProfileScreen', () => {
  it('prefills fields and submits the current values on continue', async () => {
    const onContinue = jest.fn();
    await renderWithProviders(<ProfileScreen onContinue={onContinue} />);

    expect(screen.getByDisplayValue('Marc Lavoie')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('continue-button'));

    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({ fullName: 'Marc Lavoie', email: 'marc.lavoie@courriel.ca' }),
    );
  });

  it('lets the user edit a field before continuing', async () => {
    const onContinue = jest.fn();
    await renderWithProviders(<ProfileScreen onContinue={onContinue} />);

    await fireEvent.changeText(screen.getByTestId('input-fullName'), 'Julie Tremblay');
    await fireEvent.press(screen.getByTestId('continue-button'));

    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Julie Tremblay' }));
  });
});
