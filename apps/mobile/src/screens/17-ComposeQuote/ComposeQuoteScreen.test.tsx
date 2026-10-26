import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ComposeQuoteScreen } from './ComposeQuoteScreen';

const recipients = [
  { id: 'g1', name: 'Garage Un', email: 'un@garage.ca' },
  { id: 'g2', name: 'Garage Deux', email: 'deux@garage.ca' },
];
const preview = {
  contactMethod: 'email' as const,
  to: 'un@garage.ca',
  phone: null,
  subject: 'Demande de soumission — Vidange',
  body: 'Bonjour, vidange svp.',
};

describe('ComposeQuoteScreen', () => {
  it('lists the recipients and says how many will receive the email', async () => {
    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} preview={preview} />, { withNavigationContainer: false });

    expect(screen.getByText('Garage Un')).toBeTruthy();
    expect(screen.getByText('deux@garage.ca')).toBeTruthy();
    expect(screen.getByText('Envoyer à 2 garages')).toBeTruthy();
  });

  it('starts from the standard subject and message', async () => {
    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} preview={preview} />, { withNavigationContainer: false });

    expect(screen.getByTestId('compose-subject').props.value).toBe(preview.subject);
    expect(screen.getByTestId('compose-message').props.value).toBe(preview.body);
  });

  it('sends the edited subject and message', async () => {
    const onSend = jest.fn();
    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} preview={preview} onSend={onSend} />, { withNavigationContainer: false });

    await fireEvent.changeText(screen.getByTestId('compose-subject'), 'Vidange samedi');
    await fireEvent.changeText(screen.getByTestId('compose-message'), 'Disponible samedi ?');
    await fireEvent.press(screen.getByTestId('compose-send'));

    expect(onSend).toHaveBeenCalledWith({ subject: 'Vidange samedi', message: 'Disponible samedi ?' });
  });

  it('restores the standard text on request', async () => {
    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} preview={preview} />, { withNavigationContainer: false });
    expect(screen.queryByTestId('compose-reset')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('compose-message'), 'Autre');
    await fireEvent.press(screen.getByTestId('compose-reset'));

    expect(screen.getByTestId('compose-message').props.value).toBe(preview.body);
  });

  it('lets the user drop a garage, and cannot send to nobody', async () => {
    const onRemoveRecipient = jest.fn();
    const onSend = jest.fn();
    await renderWithProviders(
      <ComposeQuoteScreen recipients={recipients} preview={preview} onRemoveRecipient={onRemoveRecipient} onSend={onSend} />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('remove-recipient-g2'));
    expect(onRemoveRecipient).toHaveBeenCalledWith('g2');

    await renderWithProviders(<ComposeQuoteScreen recipients={[]} preview={preview} onSend={onSend} />, { withNavigationContainer: false });
    expect(screen.getByTestId('no-recipients')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('compose-send'));
    expect(onSend).not.toHaveBeenCalled();
  });

  it('does not send an empty message', async () => {
    const onSend = jest.fn();
    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} preview={preview} onSend={onSend} />, { withNavigationContainer: false });

    await fireEvent.changeText(screen.getByTestId('compose-message'), '  ');
    await fireEvent.press(screen.getByTestId('compose-send'));

    expect(onSend).not.toHaveBeenCalled();
  });

  it('shows the item the email is about, loading, and errors', async () => {
    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} loading forLabel="Entretien : Vidange" />, { withNavigationContainer: false });
    expect(screen.getByText('Entretien : Vidange')).toBeTruthy();
    expect(screen.getByTestId('compose-loading')).toBeTruthy();
    expect(screen.queryByTestId('compose-send')).toBeNull();

    await renderWithProviders(<ComposeQuoteScreen recipients={recipients} error="Garage introuvable." sendError="Trop de demandes." preview={preview} />, {
      withNavigationContainer: false,
    });
    expect(screen.getByTestId('compose-error')).toBeTruthy();
    expect(screen.getByTestId('compose-send-error')).toBeTruthy();
  });
});
