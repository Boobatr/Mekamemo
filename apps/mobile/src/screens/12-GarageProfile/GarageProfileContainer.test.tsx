import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageProfileContainer } from './GarageProfileContainer';
import * as garagesApi from '../../services/garages';
import * as maintenanceApiModule from '../../services/maintenance';

jest.mock('../../services/garages');
jest.mock('../../services/maintenance');
const api = jest.mocked(garagesApi);
const maintenance = jest.mocked(maintenanceApiModule);

const GARAGE = {
  id: 'g1',
  name: 'Garage David Lavoie',
  address: '11280 Bd Sainte-Anne, Beaupré G0A 1E0',
  lat: 47.04,
  lng: -70.9,
  rating: null,
  reviewCount: null,
  specialties: [],
  email: 'garagedlavoie@videotron.ca',
  phone: '+1 418-827-3551',
  certifications: [],
};

function renderContainer() {
  return renderWithProviders(
    <GarageProfileContainer garageId="g1" vehicleId="v1" onRequestedAppointment={jest.fn()} />,
    { withNavigationContainer: false },
  );
}

const TASK = { id: 't1', vehicleId: 'v1', name: "Vidange d'huile", projection: null };

describe('GarageProfileContainer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    api.getGarage.mockResolvedValue(GARAGE);
  });

  it('opens the email preview for this vehicle and garage, and sends nothing', async () => {
    api.previewQuoteEmail.mockResolvedValue({
      contactMethod: 'email',
      to: GARAGE.email,
      phone: GARAGE.phone,
      subject: 'Demande de soumission — MekaMemo',
      body: 'Bonjour, je suis Marc.',
    });
    await renderContainer();
    await waitFor(() => expect(screen.getByTestId('view-email-button')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('view-email-button'));

    await waitFor(() => expect(screen.getByTestId('email-preview-body')).toBeTruthy());
    expect(api.previewQuoteEmail.mock.calls[0][0]).toEqual({ vehicleId: 'v1', garageId: 'g1' });
    expect(screen.getByTestId('email-preview-to').props.children).toBe(GARAGE.email);
    expect(api.createQuoteRequest).not.toHaveBeenCalled();
  });

  it('shows the server error in the window when the preview fails', async () => {
    api.previewQuoteEmail.mockRejectedValue(new Error('Garage introuvable.'));
    await renderContainer();
    await waitFor(() => expect(screen.getByTestId('view-email-button')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('view-email-button'));

    await waitFor(() => expect(screen.getByTestId('email-preview-error')).toBeTruthy());
    expect(screen.getByText('Garage introuvable.')).toBeTruthy();
  });

  it('closes the window', async () => {
    api.previewQuoteEmail.mockResolvedValue({ contactMethod: 'email', to: 'a@b.ca', phone: null, subject: 's', body: 'b' });
    await renderContainer();
    await waitFor(() => expect(screen.getByTestId('view-email-button')).toBeTruthy());
    await fireEvent.press(screen.getByTestId('view-email-button'));
    await waitFor(() => expect(screen.getByTestId('email-preview-close')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('email-preview-close'));

    expect(screen.queryByTestId('email-preview-close')).toBeNull();
  });

  describe('for a maintenance item from the calendar', () => {
    function renderForTask() {
      return renderWithProviders(
        <GarageProfileContainer garageId="g1" vehicleId="v1" taskId="t1" onRequestedAppointment={jest.fn()} />,
        { withNavigationContainer: false },
      );
    }

    beforeEach(() => {
      maintenance.listMaintenanceTasks.mockResolvedValue([TASK] as never);
      api.createQuoteRequest.mockResolvedValue({ id: 'q1' });
    });

    it('names the item on the page', async () => {
      await renderForTask();

      await waitFor(() => expect(screen.getByText("Entretien : Vidange d'huile")).toBeTruthy());
    });

    it('asks for the preview of the message about that item', async () => {
      api.previewQuoteEmail.mockResolvedValue({ contactMethod: 'email', to: GARAGE.email, phone: null, subject: 's', body: 'b' });
      await renderForTask();
      await waitFor(() => expect(screen.getByTestId('view-email-button')).toBeTruthy());

      await fireEvent.press(screen.getByTestId('view-email-button'));

      await waitFor(() => expect(api.previewQuoteEmail).toHaveBeenCalled());
      expect(api.previewQuoteEmail.mock.calls[0][0]).toEqual({ vehicleId: 'v1', garageId: 'g1', taskId: 't1', diagnosisId: undefined });
    });

    it('sends the request for that item with the text the user edited', async () => {
      api.previewQuoteEmail.mockResolvedValue({ contactMethod: 'email', to: GARAGE.email, phone: null, subject: 'Sujet', body: 'Texte' });
      await renderForTask();
      await waitFor(() => expect(screen.getByTestId('view-email-button')).toBeTruthy());
      await fireEvent.press(screen.getByTestId('view-email-button'));
      await waitFor(() => expect(screen.getByTestId('email-preview-body')).toBeTruthy());

      await fireEvent.changeText(screen.getByTestId('email-preview-body'), 'Texte modifié');
      await fireEvent.press(screen.getByTestId('email-preview-send'));

      await waitFor(() => expect(api.createQuoteRequest).toHaveBeenCalled());
      expect(api.createQuoteRequest.mock.calls[0][0]).toEqual({
        vehicleId: 'v1',
        garageIds: ['g1'],
        taskId: 't1',
        diagnosisId: undefined,
        subject: 'Sujet',
        message: 'Texte modifié',
      });
    });

    it('sends the standard text (no edit) when the user requests the appointment directly', async () => {
      await renderForTask();
      await waitFor(() => expect(screen.getByTestId('request-appointment-button')).toBeTruthy());

      await fireEvent.press(screen.getByTestId('request-appointment-button'));

      await waitFor(() => expect(api.createQuoteRequest).toHaveBeenCalled());
      const sent = api.createQuoteRequest.mock.calls[0][0];
      expect(sent.taskId).toBe('t1');
      expect(sent.subject).toBeUndefined();
      expect(sent.message).toBeUndefined();
    });
  });

  it("shows the garage's phone number from its record", async () => {
    await renderContainer();

    await waitFor(() => expect(screen.getByTestId('garage-phone')).toBeTruthy());
  });
});
