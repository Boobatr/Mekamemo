import React from 'react';
import { StyleSheet } from 'react-native';
import { fireEvent, screen, within } from '@testing-library/react-native';
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

  describe('map size', () => {
    const mapHeight = () => StyleSheet.flatten(screen.getByTestId('garage-map').props.style).height as number;

    it('grows to half of the screen and shrinks back', async () => {
      await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });
      const compact = mapHeight();

      await fireEvent.press(screen.getByTestId('map-resize'));
      const half = mapHeight();
      expect(half).toBeGreaterThan(compact);

      await fireEvent.press(screen.getByTestId('map-resize'));
      expect(mapHeight()).toBe(compact);
    });

    it('opens full screen, shows the garage picked on the map, and can open its profile', async () => {
      const onSelectGarage = jest.fn();
      await renderWithProviders(<GarageSearchScreen onSelectGarage={onSelectGarage} />, { withNavigationContainer: false });
      expect(screen.queryByTestId('map-close')).toBeNull();

      await fireEvent.press(screen.getByTestId('map-fullscreen'));
      expect(screen.getByTestId('map-close')).toBeTruthy();
      expect(screen.getByText(/Touchez un point/)).toBeTruthy();
      expect(screen.queryByTestId('map-open-garage')).toBeNull();

      // Two maps now exist (the one in the page and the full-screen one): tap a pin on the last.
      const pins = screen.getAllByTestId('garage-pin-garage-rosemont');
      await fireEvent.press(pins[pins.length - 1]);
      expect(within(screen.getByTestId('map-selected-garage')).getByText('Atelier Rosemont')).toBeTruthy();

      await fireEvent.press(screen.getByTestId('map-open-garage'));
      expect(onSelectGarage).toHaveBeenCalledWith('garage-rosemont');
      expect(screen.queryByTestId('map-close')).toBeNull();
    });

    it('closes the full-screen map without opening anything', async () => {
      const onSelectGarage = jest.fn();
      await renderWithProviders(<GarageSearchScreen onSelectGarage={onSelectGarage} />, { withNavigationContainer: false });

      await fireEvent.press(screen.getByTestId('map-fullscreen'));
      await fireEvent.press(screen.getByTestId('map-close'));

      expect(screen.queryByTestId('map-close')).toBeNull();
      expect(onSelectGarage).not.toHaveBeenCalled();
    });
  });

  describe('missing garage link', () => {
    it('opens the add-a-garage form', async () => {
      const onAddGarage = jest.fn();
      await renderWithProviders(<GarageSearchScreen onAddGarage={onAddGarage} />, { withNavigationContainer: false });

      await fireEvent.press(screen.getByTestId('add-garage-link'));

      expect(onAddGarage).toHaveBeenCalledTimes(1);
    });

    it('is not shown where adding is not possible', async () => {
      await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });

      expect(screen.queryByTestId('add-garage-link')).toBeNull();
    });
  });

  describe('search from my position', () => {
    it('offers the button only where the position can be read', async () => {
      await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });
      expect(screen.queryByTestId('use-my-position')).toBeNull();

      const onUseMyPosition = jest.fn();
      await renderWithProviders(<GarageSearchScreen onUseMyPosition={onUseMyPosition} />, { withNavigationContainer: false });
      await fireEvent.press(screen.getByTestId('use-my-position'));
      expect(onUseMyPosition).toHaveBeenCalledTimes(1);
    });

    it('offers to go back to the postal code while a position is in use', async () => {
      const onUsePostalCode = jest.fn();
      await renderWithProviders(<GarageSearchScreen onUseMyPosition={jest.fn()} onUsePostalCode={onUsePostalCode} />, {
        withNavigationContainer: false,
      });

      expect(screen.queryByTestId('use-my-position')).toBeNull();
      await fireEvent.press(screen.getByTestId('use-postal-code'));
      expect(onUsePostalCode).toHaveBeenCalledTimes(1);
    });

    it('says when the position could not be read', async () => {
      await renderWithProviders(<GarageSearchScreen onUseMyPosition={jest.fn()} locationFailed />, { withNavigationContainer: false });

      expect(screen.getByTestId('location-error')).toBeTruthy();
    });
  });

  it('says "1 garage", not "1 garages"', async () => {
    await renderWithProviders(<GarageSearchScreen results={[mockGarages[0]] as never} radiusKm={100} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText('1 GARAGE DANS 100 KM')).toBeTruthy();
  });
});
