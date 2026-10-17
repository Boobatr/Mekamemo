import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ProfileScreen } from './ProfileScreen';

describe('ProfileScreen', () => {
  it('prefills fields and submits the current values on continue', async () => {
    const onContinue = jest.fn();
    await renderWithProviders(<ProfileScreen onContinue={onContinue} />);

    expect(screen.getByDisplayValue('Marc Lavoie')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('input-password'), 'motdepasse123');
    await fireEvent.press(screen.getByTestId('continue-button'));

    expect(onContinue).toHaveBeenCalledWith(
      expect.objectContaining({
        fullName: 'Marc Lavoie',
        email: 'marc.lavoie@courriel.ca',
        password: 'motdepasse123',
      }),
    );
  });

  it('lets the user edit a field before continuing', async () => {
    const onContinue = jest.fn();
    await renderWithProviders(<ProfileScreen onContinue={onContinue} />);

    await fireEvent.changeText(screen.getByTestId('input-fullName'), 'Julie Tremblay');
    await fireEvent.changeText(screen.getByTestId('input-password'), 'motdepasse123');
    await fireEvent.press(screen.getByTestId('continue-button'));

    expect(onContinue).toHaveBeenCalledWith(expect.objectContaining({ fullName: 'Julie Tremblay' }));
  });

  it('does not let the user continue without a password of at least 8 characters', async () => {
    const onContinue = jest.fn();
    await renderWithProviders(<ProfileScreen onContinue={onContinue} />);

    expect(screen.getByTestId('continue-button').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-password'), 'court');
    expect(screen.getByTestId('continue-button').props.accessibilityState.disabled).toBe(true);
    await fireEvent.press(screen.getByTestId('continue-button'));
    expect(onContinue).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('input-password'), '12345678');
    expect(screen.getByTestId('continue-button').props.accessibilityState.disabled).toBe(false);
  });

  it('offers a way to sign in to an existing account', async () => {
    const onLogin = jest.fn();
    await renderWithProviders(<ProfileScreen onContinue={jest.fn()} onLogin={onLogin} />);

    await fireEvent.press(screen.getByTestId('login-link'));
    expect(onLogin).toHaveBeenCalledTimes(1);
  });
});
