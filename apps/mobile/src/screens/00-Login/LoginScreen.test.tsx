import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { LoginScreen } from './LoginScreen';

describe('LoginScreen', () => {
  it('keeps the button disabled until both fields are filled', async () => {
    await renderWithProviders(<LoginScreen onSubmit={jest.fn()} />, { withNavigationContainer: false });

    expect(screen.getByTestId('login-submit').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-login-email'), 'marc@courriel.ca');
    expect(screen.getByTestId('login-submit').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-login-password'), 'motdepasse123');
    expect(screen.getByTestId('login-submit').props.accessibilityState.disabled).toBe(false);
  });

  it('submits the trimmed email and the password', async () => {
    const onSubmit = jest.fn().mockResolvedValue(undefined);
    await renderWithProviders(<LoginScreen onSubmit={onSubmit} />, { withNavigationContainer: false });

    await fireEvent.changeText(screen.getByTestId('input-login-email'), '  marc@courriel.ca ');
    await fireEvent.changeText(screen.getByTestId('input-login-password'), 'motdepasse123');
    await fireEvent.press(screen.getByTestId('login-submit'));

    expect(onSubmit).toHaveBeenCalledWith({ email: 'marc@courriel.ca', password: 'motdepasse123' });
  });

  it('shows the server error in place when the credentials are refused', async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Identifiants invalides.'));
    await renderWithProviders(<LoginScreen onSubmit={onSubmit} />, { withNavigationContainer: false });

    await fireEvent.changeText(screen.getByTestId('input-login-email'), 'marc@courriel.ca');
    await fireEvent.changeText(screen.getByTestId('input-login-password'), 'mauvais');
    await fireEvent.press(screen.getByTestId('login-submit'));

    await waitFor(() => expect(screen.getByTestId('login-error')).toBeTruthy());
    expect(screen.getByText('Identifiants invalides.')).toBeTruthy();
    // The user can try again.
    expect(screen.getByTestId('login-submit').props.accessibilityState.disabled).toBe(false);
  });

  it('links to password recovery, carrying the e-mail typed so far', async () => {
    const onForgotPassword = jest.fn();
    await renderWithProviders(<LoginScreen onSubmit={jest.fn()} onForgotPassword={onForgotPassword} />, {
      withNavigationContainer: false,
    });

    await fireEvent.changeText(screen.getByTestId('input-login-email'), '  marc@courriel.ca ');
    await fireEvent.press(screen.getByTestId('forgot-password-link'));

    expect(onForgotPassword).toHaveBeenCalledWith('marc@courriel.ca');
  });

  it('hides the recovery link when no handler is given', async () => {
    await renderWithProviders(<LoginScreen onSubmit={jest.fn()} />, { withNavigationContainer: false });
    expect(screen.queryByTestId('forgot-password-link')).toBeNull();
  });

  it('links to account creation', async () => {
    const onCreateAccount = jest.fn();
    await renderWithProviders(<LoginScreen onSubmit={jest.fn()} onCreateAccount={onCreateAccount} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('create-account-link'));
    expect(onCreateAccount).toHaveBeenCalledTimes(1);
  });
});
