import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';

const props = () => ({
  onRequestCode: jest.fn().mockResolvedValue(undefined),
  onReset: jest.fn().mockResolvedValue(undefined),
});

async function goToResetStep(handlers = props()) {
  await renderWithProviders(<ForgotPasswordScreen {...handlers} />, { withNavigationContainer: false });
  await fireEvent.changeText(screen.getByTestId('input-forgot-email'), 'marc@courriel.ca');
  await fireEvent.press(screen.getByTestId('forgot-send-code'));
  await screen.findByTestId('input-forgot-code');
  return handlers;
}

describe('ForgotPasswordScreen', () => {
  it('starts from the e-mail the user already typed on the login screen', async () => {
    await renderWithProviders(<ForgotPasswordScreen {...props()} initialEmail="marc@courriel.ca" />, {
      withNavigationContainer: false,
    });

    expect(screen.getByTestId('input-forgot-email').props.value).toBe('marc@courriel.ca');
  });

  it('only lets the user ask for a code with a plausible e-mail address', async () => {
    const handlers = props();
    await renderWithProviders(<ForgotPasswordScreen {...handlers} />, { withNavigationContainer: false });

    expect(screen.getByTestId('forgot-send-code').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-forgot-email'), 'pas-un-courriel');
    expect(screen.getByTestId('forgot-send-code').props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-forgot-email'), 'marc@courriel.ca');
    expect(screen.getByTestId('forgot-send-code').props.accessibilityState.disabled).toBe(false);
  });

  it('asks for a code, then shows a neutral notice and the code and password fields', async () => {
    const handlers = await goToResetStep();

    expect(handlers.onRequestCode).toHaveBeenCalledWith('marc@courriel.ca');
    // Says "if an account exists": it must not reveal whether the address is registered.
    expect(screen.getByTestId('forgot-notice')).toHaveTextContent(/Si un compte existe pour marc@courriel\.ca/);
    expect(screen.getByTestId('input-forgot-new-password')).toBeTruthy();
  });

  it('keeps the reset button disabled until the code, a long enough password and its confirmation are right', async () => {
    await goToResetStep();
    const reset = () => screen.getByTestId('forgot-reset');

    expect(reset().props.accessibilityState.disabled).toBe(true);
    await fireEvent.changeText(screen.getByTestId('input-forgot-code'), 'ABCD-EFGH');
    await fireEvent.changeText(screen.getByTestId('input-forgot-new-password'), 'court');
    await fireEvent.changeText(screen.getByTestId('input-forgot-confirm-password'), 'court');
    expect(reset().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByTestId('input-forgot-new-password'), 'nouveaumdp123');
    expect(screen.getByTestId('forgot-mismatch')).toBeTruthy();
    expect(reset().props.accessibilityState.disabled).toBe(true);

    await fireEvent.changeText(screen.getByTestId('input-forgot-confirm-password'), 'nouveaumdp123');
    expect(reset().props.accessibilityState.disabled).toBe(false);
  });

  it('sends the e-mail, the code as typed and the new password to reset', async () => {
    const handlers = await goToResetStep();

    await fireEvent.changeText(screen.getByTestId('input-forgot-code'), ' abcd-efgh ');
    await fireEvent.changeText(screen.getByTestId('input-forgot-new-password'), 'nouveaumdp123');
    await fireEvent.changeText(screen.getByTestId('input-forgot-confirm-password'), 'nouveaumdp123');
    await fireEvent.press(screen.getByTestId('forgot-reset'));

    expect(handlers.onReset).toHaveBeenCalledWith({
      email: 'marc@courriel.ca',
      code: 'abcd-efgh',
      newPassword: 'nouveaumdp123',
    });
  });

  it("shows the server's message in place when the code is wrong, and lets the user try again", async () => {
    const handlers = props();
    handlers.onReset.mockRejectedValue(new Error('Code invalide ou expiré.'));
    await goToResetStep(handlers);

    await fireEvent.changeText(screen.getByTestId('input-forgot-code'), 'ZZZZ-ZZZZ');
    await fireEvent.changeText(screen.getByTestId('input-forgot-new-password'), 'nouveaumdp123');
    await fireEvent.changeText(screen.getByTestId('input-forgot-confirm-password'), 'nouveaumdp123');
    await fireEvent.press(screen.getByTestId('forgot-reset'));

    await waitFor(() => expect(screen.getByTestId('forgot-error')).toHaveTextContent('Code invalide ou expiré.'));
    expect(screen.getByTestId('forgot-reset').props.accessibilityState.disabled).toBe(false);
  });

  it('can send a new code and goes back to the login screen', async () => {
    const onBackToLogin = jest.fn();
    const handlers = { ...props(), onBackToLogin };
    await goToResetStep(handlers);

    await fireEvent.press(screen.getByTestId('forgot-resend'));
    await waitFor(() => expect(handlers.onRequestCode).toHaveBeenCalledTimes(2));
    expect(screen.getByTestId('forgot-notice')).toHaveTextContent(/nouveau code/);

    await fireEvent.press(screen.getByTestId('forgot-back-to-login'));
    expect(onBackToLogin).toHaveBeenCalledTimes(1);
  });

  it('tells the user when the server could not be reached', async () => {
    const handlers = props();
    handlers.onRequestCode.mockRejectedValue(new Error('Network request failed'));
    await renderWithProviders(<ForgotPasswordScreen {...handlers} />, { withNavigationContainer: false });

    await fireEvent.changeText(screen.getByTestId('input-forgot-email'), 'marc@courriel.ca');
    await fireEvent.press(screen.getByTestId('forgot-send-code'));

    await waitFor(() => expect(screen.getByTestId('forgot-error')).toHaveTextContent('Network request failed'));
    expect(screen.queryByTestId('input-forgot-code')).toBeNull(); // still on the first step
  });
});
