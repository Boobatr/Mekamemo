import React from 'react';
import { Linking } from 'react-native';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageProfileScreen } from './GarageProfileScreen';
import { mockGarages } from '../../mocks/mockData';

describe('GarageProfileScreen', () => {
  it('renders the garage name, rating, and contact email', async () => {
    await renderWithProviders(<GarageProfileScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Garage Précision')).toBeTruthy();
    expect(screen.getByText(/rendezvous@precision\.ca/)).toBeTruthy();
  });

  it('shows the rating tag only when the garage has a rating', async () => {
    await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });
    expect(screen.getByText(/4\.8 ★/)).toBeTruthy();
  });

  it('shows the distance when known and omits a meaningless "0 KM" when it is not', async () => {
    await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });
    expect(screen.getByText(/2\.4 km/)).toBeTruthy();
  });

  it('does not show "0 KM" for a garage whose distance is unknown', async () => {
    const unknown = { ...mockGarages[0], distanceKm: 0 };
    await renderWithProviders(<GarageProfileScreen garage={unknown} />, { withNavigationContainer: false });
    expect(screen.queryByText(/^0 km/)).toBeNull();
  });

  it('omits the rating tag for a garage with no rating yet', async () => {
    const unrated = { ...mockGarages[0], rating: 0, reviewCount: 0 };
    await renderWithProviders(<GarageProfileScreen garage={unrated} />, { withNavigationContainer: false });
    expect(screen.queryByText(/★/)).toBeNull();
  });

  it('triggers request-appointment and view-email callbacks', async () => {
    const onRequestAppointment = jest.fn();
    const onViewEmailBeforeSending = jest.fn();
    await renderWithProviders(
      <GarageProfileScreen
        onRequestAppointment={onRequestAppointment}
        onViewEmailBeforeSending={onViewEmailBeforeSending}
      />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('request-appointment-button'));
    await fireEvent.press(screen.getByTestId('view-email-button'));

    expect(onRequestAppointment).toHaveBeenCalledTimes(1);
    expect(onViewEmailBeforeSending).toHaveBeenCalledTimes(1);
  });

  it('shows the garage on a map in the first frame', async () => {
    await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });

    expect(screen.getByTestId('garage-location-map')).toBeTruthy();
    expect(screen.getByTestId(`garage-pin-${mockGarages[0].id}`)).toBeTruthy();
    expect(screen.queryByTestId('garage-map-origin')).toBeNull();
  });

  describe('address and directions', () => {
    it('shows the address in readable type, not as small upper-case text', async () => {
      await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });

      expect(screen.getByText(mockGarages[0].neighbourhood)).toBeTruthy();
      expect(screen.queryByText(mockGarages[0].neighbourhood.toUpperCase())).toBeNull();
    });

    it('offers the map apps when the address is tapped and opens the route in the chosen one', async () => {
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });
      expect(screen.queryByTestId('directions-google')).toBeNull();

      await fireEvent.press(screen.getByTestId('garage-address'));
      expect(screen.getByTestId('directions-apple')).toBeTruthy();
      expect(screen.getByTestId('directions-waze')).toBeTruthy();

      await fireEvent.press(screen.getByTestId('directions-google'));
      expect(openURL).toHaveBeenCalledWith(expect.stringContaining('google.com/maps/dir/'));
      expect(openURL).toHaveBeenCalledWith(expect.stringContaining(mockGarages[0].lat.toFixed(6)));
      expect(screen.queryByTestId('directions-google')).toBeNull();
      openURL.mockRestore();
    });

    it('can be dismissed without opening anything', async () => {
      const openURL = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
      await renderWithProviders(<GarageProfileScreen garage={mockGarages[0]} />, { withNavigationContainer: false });

      await fireEvent.press(screen.getByTestId('garage-address'));
      await fireEvent.press(screen.getByTestId('directions-cancel'));

      expect(screen.queryByTestId('directions-google')).toBeNull();
      expect(openURL).not.toHaveBeenCalled();
      openURL.mockRestore();
    });

    it('has no address row when the address is unknown', async () => {
      const unknown = { ...mockGarages[0], neighbourhood: 'Adresse non disponible' };
      await renderWithProviders(<GarageProfileScreen garage={unknown} />, { withNavigationContainer: false });

      expect(screen.queryByTestId('garage-address')).toBeNull();
    });
  });

  describe('contact', () => {
    it('says so when no email is known instead of printing an empty one', async () => {
      const noEmail = { ...mockGarages[0], email: undefined };
      await renderWithProviders(<GarageProfileScreen garage={noEmail} />, { withNavigationContainer: false });

      expect(screen.getByText(/Aucun courriel connu/)).toBeTruthy();
      expect(screen.queryByText(/undefined/)).toBeNull();
    });

    it('shows the phone number when there is one', async () => {
      await renderWithProviders(<GarageProfileScreen garage={{ ...mockGarages[0], phone: '+1 418-827-5939' }} />, {
        withNavigationContainer: false,
      });

      expect(screen.getByTestId('garage-phone')).toBeTruthy();
      expect(screen.getByText(/418-827-5939/)).toBeTruthy();
    });
  });

  describe('email preview window', () => {
    const preview = {
      contactMethod: 'email' as const,
      to: 'rendezvous@precision.ca',
      phone: null,
      subject: 'Demande de soumission — MekaMemo',
      body: 'Bonjour, je suis Marc.',
    };

    it('is closed by default', async () => {
      await renderWithProviders(<GarageProfileScreen />, { withNavigationContainer: false });
      expect(screen.queryByTestId('email-preview-close')).toBeNull();
    });

    it('shows the recipient, subject and message that would be sent', async () => {
      await renderWithProviders(<GarageProfileScreen emailPreviewOpen emailPreview={preview} />, { withNavigationContainer: false });

      expect(screen.getByTestId('email-preview-to').props.children).toBe('rendezvous@precision.ca');
      expect(screen.getByTestId('email-preview-subject').props.children).toBe(preview.subject);
      expect(screen.getByTestId('email-preview-body').props.children).toBe(preview.body);
    });

    it('explains that no email goes out when the garage has none', async () => {
      const voice = { ...preview, contactMethod: 'voice' as const, to: null, phone: '+1 418-827-5939' };
      await renderWithProviders(<GarageProfileScreen emailPreviewOpen emailPreview={voice} />, { withNavigationContainer: false });

      expect(screen.getByText(/aucun courriel ne sera envoyé/)).toBeTruthy();
      expect(screen.getByText(/418-827-5939/)).toBeTruthy();
      expect(screen.queryByTestId('email-preview-to')).toBeNull();
    });

    it('shows a spinner while loading', async () => {
      await renderWithProviders(<GarageProfileScreen emailPreviewOpen emailPreviewLoading />, { withNavigationContainer: false });
      expect(screen.getByTestId('email-preview-loading')).toBeTruthy();
    });

    it('shows the error when the preview fails', async () => {
      await renderWithProviders(<GarageProfileScreen emailPreviewOpen emailPreviewError="Garage introuvable." />, {
        withNavigationContainer: false,
      });
      expect(screen.getByTestId('email-preview-error')).toBeTruthy();
    });

    it('closes without sending, and sends the request from inside the window', async () => {
      const onClose = jest.fn();
      const onRequestAppointment = jest.fn();
      await renderWithProviders(
        <GarageProfileScreen
          emailPreviewOpen
          emailPreview={preview}
          onCloseEmailPreview={onClose}
          onRequestAppointment={onRequestAppointment}
        />,
        { withNavigationContainer: false },
      );

      await fireEvent.press(screen.getByTestId('email-preview-close'));
      expect(onClose).toHaveBeenCalledTimes(1);
      expect(onRequestAppointment).not.toHaveBeenCalled();

      await fireEvent.press(screen.getByTestId('email-preview-send'));
      expect(onRequestAppointment).toHaveBeenCalledTimes(1);
    });
  });
});
