import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { ComposeQuoteContainer } from './ComposeQuoteContainer';
import * as garagesApi from '../../services/garages';
import * as maintenanceApiModule from '../../services/maintenance';

jest.mock('../../services/garages');
jest.mock('../../services/maintenance');
const api = jest.mocked(garagesApi);
const maintenance = jest.mocked(maintenanceApiModule);

const recipients = [
  { id: 'g1', name: 'Garage Un', email: 'un@garage.ca' },
  { id: 'g2', name: 'Garage Deux', email: 'deux@garage.ca' },
];

function renderCompose(props = {}) {
  const onSent = jest.fn();
  return renderWithProviders(
    <ComposeQuoteContainer vehicleId="v1" recipients={recipients} taskId="t1" onSent={onSent} {...props} />,
    { withNavigationContainer: false },
  ).then(() => ({ onSent }));
}

describe('ComposeQuoteContainer', () => {
  beforeEach(() => {
    api.previewQuoteEmail.mockReset();
    api.createQuoteRequest.mockReset();
    maintenance.listMaintenanceTasks.mockReset();
    api.previewQuoteEmail.mockResolvedValue({ contactMethod: 'email', to: 'un@garage.ca', phone: null, subject: 'Sujet', body: 'Texte' });
    api.createQuoteRequest.mockResolvedValue({ id: 'q1' });
    maintenance.listMaintenanceTasks.mockResolvedValue([{ id: 't1', vehicleId: 'v1', name: "Vidange d'huile" }] as never);
  });

  it('has the standard message written for this item, using the first garage', async () => {
    await renderCompose();

    await waitFor(() => expect(screen.getByTestId('compose-message')).toBeTruthy());
    expect(api.previewQuoteEmail.mock.calls[0][0]).toEqual({ vehicleId: 'v1', garageId: 'g1', taskId: 't1', diagnosisId: undefined });
    await waitFor(() => expect(screen.getByText("Entretien : Vidange d'huile")).toBeTruthy());
  });

  it('sends one request to every remaining garage with the edited text', async () => {
    const { onSent } = await renderCompose();
    await waitFor(() => expect(screen.getByTestId('compose-message')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('remove-recipient-g2'));
    await fireEvent.changeText(screen.getByTestId('compose-message'), 'Texte modifié');
    await fireEvent.press(screen.getByTestId('compose-send'));

    await waitFor(() => expect(onSent).toHaveBeenCalledWith('q1'));
    expect(api.createQuoteRequest.mock.calls[0][0]).toEqual({
      vehicleId: 'v1',
      garageIds: ['g1'],
      taskId: 't1',
      diagnosisId: undefined,
      subject: 'Sujet',
      message: 'Texte modifié',
    });
  });

  it('sends to all the garages when none were removed', async () => {
    await renderCompose();
    await waitFor(() => expect(screen.getByTestId('compose-send')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('compose-send'));

    await waitFor(() => expect(api.createQuoteRequest).toHaveBeenCalled());
    expect(api.createQuoteRequest.mock.calls[0][0].garageIds).toEqual(['g1', 'g2']);
  });

  it("stays on the screen and shows the server's message when sending is refused", async () => {
    api.createQuoteRequest.mockRejectedValue(new Error('Trop de demandes envoyées aujourd’hui. Réessayez demain.'));
    const { onSent } = await renderCompose();
    await waitFor(() => expect(screen.getByTestId('compose-send')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('compose-send'));

    await waitFor(() => expect(screen.getByTestId('compose-send-error')).toBeTruthy());
    expect(screen.getByText(/Trop de demandes/)).toBeTruthy();
    expect(onSent).not.toHaveBeenCalled();
  });
});
