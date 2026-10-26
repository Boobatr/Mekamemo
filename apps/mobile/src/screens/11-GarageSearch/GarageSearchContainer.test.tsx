import React from 'react';
import { Text } from 'react-native';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageSearchContainer } from './GarageSearchContainer';
import * as garagesApi from '../../services/garages';
import * as usersApiModule from '../../services/users';
import { useUpdateProfile } from '../../hooks/useProfile';
import * as maintenanceApiModule from '../../services/maintenance';
import * as currentPosition from '../../utils/currentPosition';

jest.mock('../../services/garages');
jest.mock('../../services/users');
jest.mock('../../services/maintenance');
jest.mock('../../utils/currentPosition', () => ({
  canLocate: true,
  getCurrentPosition: jest.fn(),
}));

const api = jest.mocked(garagesApi);
const maintenance = jest.mocked(maintenanceApiModule);
const users = jest.mocked(usersApiModule);
const position = jest.mocked(currentPosition.getCurrentPosition);

const PROFILE = { postalCode: 'G0A 1E0', searchRadiusKm: 15 } as usersApiModule.UserProfile;

/** Stands in for the Settings screen: saves a new postal code or radius through the real hook. */
function SettingsStandIn({ change }: { change: usersApiModule.UpdateProfileInput }) {
  const updateProfile = useUpdateProfile();
  return <Text testID="save-settings" onPress={() => updateProfile.mutate(change)}>save</Text>;
}

const response = (overrides = {}) => ({
  assistantSummary: '1 garage trouvé dans 15 km. Voici les plus proches.',
  origin: { lat: 47.04, lng: -70.9 },
  radiusKm: 15,
  results: [],
  ...overrides,
});

describe('GarageSearchContainer', () => {
  beforeEach(() => {
    jest.resetAllMocks();
    api.searchGarages.mockResolvedValue(response());
    users.getProfile.mockResolvedValue(PROFILE);
  });

  it('searches from the postal code at first, without a position', async () => {
    await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });

    await waitFor(() => expect(api.searchGarages).toHaveBeenCalled());
    expect(api.searchGarages.mock.calls[0][1]).toBeUndefined();
  });

  it('searches again from the device position when asked, and can go back to the postal code', async () => {
    position.mockResolvedValue({ lat: 47.059, lng: -70.849 });
    await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });
    await waitFor(() => expect(screen.getByTestId('use-my-position')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('use-my-position'));

    await waitFor(() => expect(api.searchGarages).toHaveBeenCalledWith(expect.any(String), { lat: 47.059, lng: -70.849 }));
    await waitFor(() => expect(screen.getByTestId('use-postal-code')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('use-postal-code'));
    await waitFor(() => expect(screen.getByTestId('use-my-position')).toBeTruthy());
  });

  it('keeps the postal-code search and explains when the position is refused', async () => {
    position.mockRejectedValue(new Error('User denied Geolocation'));
    await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });
    await waitFor(() => expect(screen.getByTestId('use-my-position')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('use-my-position'));

    await waitFor(() => expect(screen.getByTestId('location-error')).toBeTruthy());
    expect(screen.getByTestId('use-my-position')).toBeTruthy();
  });

  it('shows the radius that was really searched when the server widened it', async () => {
    api.searchGarages.mockResolvedValue(
      response({ radiusKm: 60, assistantSummary: "Peu de garages dans 15 km : j'ai élargi la recherche à 60 km." }),
    );
    await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });

    await waitFor(() => expect(screen.getByText(/élargi la recherche à 60 km/)).toBeTruthy());
    expect(screen.getByText(/dans 60 km/i)).toBeTruthy();
  });

  it('names the maintenance item the search is for, with a way to drop it', async () => {
    maintenance.listMaintenanceTasks.mockResolvedValue([{ id: 't1', vehicleId: 'v1', name: "Vidange d'huile" }] as never);
    const onClearContext = jest.fn();
    await renderWithProviders(
      <GarageSearchContainer onSelectGarage={jest.fn()} vehicleId="v1" taskId="t1" onClearContext={onClearContext} />,
      { withNavigationContainer: false },
    );

    await waitFor(() => expect(screen.getByText("Entretien : Vidange d'huile")).toBeTruthy());
    await fireEvent.press(screen.getByTestId('clear-search-context'));
    expect(onClearContext).toHaveBeenCalled();
  });

  it('has no context line without a maintenance item', async () => {
    await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });

    await waitFor(() => expect(api.searchGarages).toHaveBeenCalled());
    expect(screen.queryByTestId('search-context')).toBeNull();
  });

  describe('follows the postal code and radius from Settings', () => {
    it('does not search until the profile is known, so the server never answers for a stale one', async () => {
      users.getProfile.mockReturnValue(new Promise(() => {})); // still loading
      await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });

      await new Promise((resolve) => setTimeout(resolve, 50));
      expect(api.searchGarages).not.toHaveBeenCalled();
    });

    it('searches again when a new postal code is saved, without leaving the screen', async () => {
      await renderWithProviders(
        <>
          <GarageSearchContainer onSelectGarage={jest.fn()} />
          <SettingsStandIn change={{ postalCode: 'G1R 4P5' }} />
        </>,
        { withNavigationContainer: false },
      );
      await waitFor(() => expect(api.searchGarages).toHaveBeenCalledTimes(1));

      users.updateProfile.mockResolvedValue({ ...PROFILE, postalCode: 'G1R 4P5' });
      users.getProfile.mockResolvedValue({ ...PROFILE, postalCode: 'G1R 4P5' });
      await fireEvent.press(screen.getByTestId('save-settings'));

      await waitFor(() => expect(api.searchGarages).toHaveBeenCalledTimes(2));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(api.searchGarages).toHaveBeenCalledTimes(2); // one new search, not a stale refetch on top
    });

    it('searches again when only the radius changes', async () => {
      await renderWithProviders(
        <>
          <GarageSearchContainer onSelectGarage={jest.fn()} />
          <SettingsStandIn change={{ searchRadiusKm: 50 }} />
        </>,
        { withNavigationContainer: false },
      );
      await waitFor(() => expect(api.searchGarages).toHaveBeenCalledTimes(1));

      users.updateProfile.mockResolvedValue({ ...PROFILE, searchRadiusKm: 50 });
      users.getProfile.mockResolvedValue({ ...PROFILE, searchRadiusKm: 50 });
      await fireEvent.press(screen.getByTestId('save-settings'));

      await waitFor(() => expect(api.searchGarages).toHaveBeenCalledTimes(2));
      await new Promise((resolve) => setTimeout(resolve, 100));
      expect(api.searchGarages).toHaveBeenCalledTimes(2); // one new search, not a stale refetch on top
    });

    it('stops using the current position once the postal code is changed', async () => {
      position.mockResolvedValue({ lat: 47.059, lng: -70.849 });
      await renderWithProviders(
        <>
          <GarageSearchContainer onSelectGarage={jest.fn()} />
          <SettingsStandIn change={{ postalCode: 'G1R 4P5' }} />
        </>,
        { withNavigationContainer: false },
      );
      await waitFor(() => expect(screen.getByTestId('use-my-position')).toBeTruthy());
      await fireEvent.press(screen.getByTestId('use-my-position'));
      await waitFor(() => expect(screen.getByTestId('use-postal-code')).toBeTruthy());

      users.updateProfile.mockResolvedValue({ ...PROFILE, postalCode: 'G1R 4P5' });
      users.getProfile.mockResolvedValue({ ...PROFILE, postalCode: 'G1R 4P5' });
      await fireEvent.press(screen.getByTestId('save-settings'));

      await waitFor(() => expect(screen.getByTestId('use-my-position')).toBeTruthy());
      const last = api.searchGarages.mock.calls[api.searchGarages.mock.calls.length - 1];
      expect(last[1]).toBeUndefined();
    });

    it('tells the user when the list is built around their current position, not their postal code', async () => {
      position.mockResolvedValue({ lat: 47.059, lng: -70.849 });
      await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} />, { withNavigationContainer: false });
      await waitFor(() => expect(screen.getByTestId('use-my-position')).toBeTruthy());
      expect(screen.queryByTestId('position-in-use')).toBeNull();

      await fireEvent.press(screen.getByTestId('use-my-position'));

      await waitFor(() => expect(screen.getByTestId('position-in-use')).toBeTruthy());
    });
  });

  it('hands the picked garages, with their emails, to the compose screen', async () => {
    api.searchGarages.mockResolvedValue(
      response({
        results: [
          { id: 'g1', name: 'Garage Un', address: 'a', distanceKm: 1, lat: 47, lng: -70, email: 'un@garage.ca', phone: null, specialties: [], certifications: [] },
          { id: 'g2', name: 'Garage Deux', address: 'b', distanceKm: 2, lat: 47, lng: -70, email: 'deux@garage.ca', phone: null, specialties: [], certifications: [] },
          { id: 'g3', name: 'Garage Trois', address: 'c', distanceKm: 3, lat: 47, lng: -70, email: null, phone: '+1 418-000-0000', specialties: [], certifications: [] },
        ],
      }),
    );
    const onWriteToGarages = jest.fn();
    await renderWithProviders(<GarageSearchContainer onSelectGarage={jest.fn()} onWriteToGarages={onWriteToGarages} />, {
      withNavigationContainer: false,
    });
    await waitFor(() => expect(screen.getByTestId('multi-select-toggle')).toBeTruthy());

    await fireEvent.press(screen.getByTestId('multi-select-toggle'));
    await fireEvent.press(screen.getByTestId('garage-result-g1'));
    await fireEvent.press(screen.getByTestId('garage-result-g2'));
    await fireEvent.press(screen.getByTestId('garage-result-g3')); // no email: not tickable
    await fireEvent.press(screen.getByTestId('write-to-selected'));

    expect(onWriteToGarages).toHaveBeenCalledWith([
      { id: 'g1', name: 'Garage Un', email: 'un@garage.ca' },
      { id: 'g2', name: 'Garage Deux', email: 'deux@garage.ca' },
    ]);
  });
});
