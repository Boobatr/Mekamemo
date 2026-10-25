import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { AddGarageScreen } from './AddGarageScreen';

async function fillRequired() {
  await fireEvent.changeText(screen.getByTestId('input-garage-name'), 'NAPA AUTOPRO – Atelier A et R');
  await fireEvent.changeText(screen.getByTestId('input-garage-street'), '485 Avenue Royale');
  await fireEvent.changeText(screen.getByTestId('input-garage-city'), 'Saint-Joachim');
}

describe('AddGarageScreen', () => {
  it('cannot be submitted until name, street and city are filled in', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<AddGarageScreen onSubmit={onSubmit} />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('add-garage-submit'));
    expect(onSubmit).not.toHaveBeenCalled();

    await fillRequired();
    await fireEvent.press(screen.getByTestId('add-garage-submit'));
    expect(onSubmit).toHaveBeenCalledTimes(1);
  });

  it('sends the trimmed fields and leaves the optional ones out when empty', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ garage: { id: 'g1', name: 'x', address: 'y' }, created: true });
    await renderWithProviders(<AddGarageScreen onSubmit={onSubmit} />, { withNavigationContainer: false });

    await fireEvent.changeText(screen.getByTestId('input-garage-name'), '  Garage Test  ');
    await fireEvent.changeText(screen.getByTestId('input-garage-street'), ' 485 Avenue Royale ');
    await fireEvent.changeText(screen.getByTestId('input-garage-city'), 'Saint-Joachim');
    await fireEvent.press(screen.getByTestId('add-garage-submit'));

    expect(onSubmit).toHaveBeenCalledWith({
      name: 'Garage Test',
      street: '485 Avenue Royale',
      city: 'Saint-Joachim',
      postalCode: undefined,
      phone: undefined,
      email: undefined,
    });
  });

  it('flags a malformed email or postal code and blocks submission', async () => {
    const onSubmit = jest.fn();
    await renderWithProviders(<AddGarageScreen onSubmit={onSubmit} />, { withNavigationContainer: false });
    await fillRequired();

    await fireEvent.changeText(screen.getByTestId('input-garage-email'), 'pas-un-courriel');
    expect(screen.getByTestId('garage-email-error')).toBeTruthy();
    await fireEvent.changeText(screen.getByTestId('input-garage-email'), 'garage@courriel.ca');
    expect(screen.queryByTestId('garage-email-error')).toBeNull();

    await fireEvent.changeText(screen.getByTestId('input-garage-postal-code'), '12345');
    expect(screen.getByTestId('garage-postal-code-error')).toBeTruthy();
    await fireEvent.press(screen.getByTestId('add-garage-submit'));
    expect(onSubmit).not.toHaveBeenCalled();

    await fireEvent.changeText(screen.getByTestId('input-garage-postal-code'), 'G0A 3X0');
    expect(screen.queryByTestId('garage-postal-code-error')).toBeNull();
  });

  it("shows the server's message when the garage can't be added, and keeps what was typed", async () => {
    const onSubmit = jest.fn().mockRejectedValue(new Error('Adresse introuvable. Vérifiez le numéro, la rue et la ville.'));
    await renderWithProviders(<AddGarageScreen onSubmit={onSubmit} />, { withNavigationContainer: false });
    await fillRequired();

    await fireEvent.press(screen.getByTestId('add-garage-submit'));

    await waitFor(() => expect(screen.getByTestId('add-garage-error')).toBeTruthy());
    expect(screen.getByText(/Adresse introuvable/)).toBeTruthy();
    expect(screen.getByTestId('input-garage-street').props.value).toBe('485 Avenue Royale');
  });

  it('confirms the addition and opens the new garage', async () => {
    const onOpenGarage = jest.fn();
    const onSubmit = jest.fn().mockResolvedValue({ garage: { id: 'g1', name: 'Garage Test', address: '485 Avenue Royale' }, created: true });
    await renderWithProviders(<AddGarageScreen onSubmit={onSubmit} onOpenGarage={onOpenGarage} />, { withNavigationContainer: false });
    await fillRequired();

    await fireEvent.press(screen.getByTestId('add-garage-submit'));

    await waitFor(() => expect(screen.getByTestId('add-garage-done')).toBeTruthy());
    expect(screen.getByText(/Garage ajouté/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('add-garage-view'));
    expect(onOpenGarage).toHaveBeenCalledWith('g1');
  });

  it('says so when the garage was already listed', async () => {
    const onSubmit = jest.fn().mockResolvedValue({ garage: { id: 'g9', name: 'Déjà là', address: 'x' }, created: false });
    await renderWithProviders(<AddGarageScreen onSubmit={onSubmit} />, { withNavigationContainer: false });
    await fillRequired();

    await fireEvent.press(screen.getByTestId('add-garage-submit'));

    await waitFor(() => expect(screen.getByText(/déjà dans la liste/)).toBeTruthy());
  });

  it('has a way out at the bottom of the form as well as at the top', async () => {
    const onBack = jest.fn();
    await renderWithProviders(<AddGarageScreen onBack={onBack} />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('add-garage-cancel'));
    await fireEvent.press(screen.getByTestId('screen-back-button'));

    expect(onBack).toHaveBeenCalledTimes(2);
  });

  it('can go back from the confirmation too', async () => {
    const onBack = jest.fn();
    const onSubmit = jest.fn().mockResolvedValue({ garage: { id: 'g1', name: 'Garage Test', address: 'x' }, created: true });
    await renderWithProviders(<AddGarageScreen onBack={onBack} onSubmit={onSubmit} />, { withNavigationContainer: false });
    await fillRequired();
    await fireEvent.press(screen.getByTestId('add-garage-submit'));
    await waitFor(() => expect(screen.getByTestId('add-garage-done')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('add-garage-back'));

    expect(onBack).toHaveBeenCalledTimes(1);
  });
});
