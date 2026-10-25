import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageProfileContainer } from './GarageProfileContainer';
import * as garagesApi from '../../services/garages';

jest.mock('../../services/garages');
const api = jest.mocked(garagesApi);

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

  it("shows the garage's phone number from its record", async () => {
    await renderContainer();

    await waitFor(() => expect(screen.getByTestId('garage-phone')).toBeTruthy());
  });
});
