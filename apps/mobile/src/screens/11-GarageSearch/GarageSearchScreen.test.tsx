import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageSearchScreen } from './GarageSearchScreen';
import { mockGarages } from '../../mocks/mockData';

describe('GarageSearchScreen', () => {
  it('lists garage results ordered as provided', async () => {
    await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Garage Précision')).toBeTruthy();
    expect(screen.getByText('Atelier Rosemont')).toBeTruthy();
    expect(screen.getByText('Mécanique Papineau')).toBeTruthy();
  });

  it('shows rating and price when a garage has them, and omits them when it has none', async () => {
    const real = { ...mockGarages[0], id: 'osm-1', name: 'Garage OSM', rating: 0, reviewCount: 0, priceCents: 0 };
    await renderWithProviders(<GarageSearchScreen results={[mockGarages[0], real] as never} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText(/4\.8 ★ · 95 \$/)).toBeTruthy();
    expect(screen.getByText(`${real.distanceKm} km · courriel`)).toBeTruthy();
    expect(screen.queryByText(/0 ★/)).toBeNull();
  });

  it('credits Overture Maps and OpenStreetMap for the garage data', async () => {
    await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });
    expect(screen.getByTestId('osm-attribution')).toBeTruthy();
    expect(screen.getByText(/Overture Maps Foundation/)).toBeTruthy();
    expect(screen.getByText(/OpenStreetMap/)).toBeTruthy();
  });

  it("shows each garage's address, but not a placeholder when the address is unknown", async () => {
    const known = { ...mockGarages[0], id: 'with-address', neighbourhood: '11280 Bd Sainte-Anne, Beaupré G0A 1E0' };
    const unknown = { ...mockGarages[1], id: 'no-address', neighbourhood: 'Adresse non disponible' };
    await renderWithProviders(<GarageSearchScreen results={[known, unknown] as never} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByTestId('garage-address-with-address')).toBeTruthy();
    expect(screen.getByText('11280 Bd Sainte-Anne, Beaupré G0A 1E0')).toBeTruthy();
    expect(screen.queryByTestId('garage-address-no-address')).toBeNull();
  });

  it('forwards garage selection', async () => {
    const onSelectGarage = jest.fn();
    await renderWithProviders(<GarageSearchScreen onSelectGarage={onSelectGarage} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('garage-result-garage-precision'));
    expect(onSelectGarage).toHaveBeenCalledWith('garage-precision');
  });

  it('sends a typed query and clears the input', async () => {
    const onSendQuery = jest.fn();
    await renderWithProviders(<GarageSearchScreen onSendQuery={onSendQuery} />, {
      withNavigationContainer: false,
    });

    await fireEvent.changeText(
      screen.getByTestId('garage-search-input'),
      'Un garage ouvert dimanche ?',
    );
    await fireEvent.press(screen.getByTestId('garage-search-send'));

    expect(onSendQuery).toHaveBeenCalledWith('Un garage ouvert dimanche ?');
    expect(screen.getByTestId('garage-search-input').props.value).toBe('');
  });

  it('does not send an empty query', async () => {
    const onSendQuery = jest.fn();
    await renderWithProviders(<GarageSearchScreen onSendQuery={onSendQuery} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('garage-search-send'));
    expect(onSendQuery).not.toHaveBeenCalled();
  });

  it('renders the map with a pin per garage and highlights on tap', async () => {
    await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });

    expect(screen.getByTestId('garage-map')).toBeTruthy();
    expect(screen.getByTestId('garage-pin-garage-precision')).toBeTruthy();
    expect(screen.getByTestId('garage-pin-garage-rosemont')).toBeTruthy();
    expect(screen.getByTestId('garage-pin-garage-papineau')).toBeTruthy();

    await fireEvent.press(screen.getByTestId('garage-pin-garage-rosemont'));
    // Tapping a pin highlights the matching result card without navigating away.
    expect(screen.getByText('Atelier Rosemont')).toBeTruthy();
  });
});
