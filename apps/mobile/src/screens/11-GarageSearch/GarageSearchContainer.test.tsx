import React from 'react';
import { fireEvent, screen, waitFor } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageSearchContainer } from './GarageSearchContainer';
import * as garagesApi from '../../services/garages';
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
const position = jest.mocked(currentPosition.getCurrentPosition);

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
});
