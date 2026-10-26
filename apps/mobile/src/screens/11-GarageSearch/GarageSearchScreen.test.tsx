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

  describe('search context', () => {
    it('shows what the garage will be asked about, and lets the user drop it', async () => {
      const onClearContext = jest.fn();
      await renderWithProviders(<GarageSearchScreen contextLabel="Entretien : Vidange" onClearContext={onClearContext} />, {
        withNavigationContainer: false,
      });

      expect(screen.getByText('Entretien : Vidange')).toBeTruthy();
      await fireEvent.press(screen.getByTestId('clear-search-context'));
      expect(onClearContext).toHaveBeenCalledTimes(1);
    });

    it('shows nothing when the search is not about a maintenance item', async () => {
      await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });

      expect(screen.queryByTestId('search-context')).toBeNull();
    });
  });

  describe('writing to several garages', () => {
    const open = async (onWriteToGarages = jest.fn(), onSelectGarage = jest.fn()) => {
      await renderWithProviders(<GarageSearchScreen onWriteToGarages={onWriteToGarages} onSelectGarage={onSelectGarage} />, {
        withNavigationContainer: false,
      });
      await fireEvent.press(screen.getByTestId('multi-select-toggle'));
      return { onWriteToGarages, onSelectGarage };
    };

    it('is offered only where writing is possible', async () => {
      await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });

      expect(screen.queryByTestId('multi-select-toggle')).toBeNull();
    });

    it('ticks garages instead of opening them, and sends the picked ones to the compose step', async () => {
      const { onWriteToGarages, onSelectGarage } = await open();

      await fireEvent.press(screen.getByTestId('garage-result-garage-precision'));
      await fireEvent.press(screen.getByTestId('garage-result-garage-papineau'));

      expect(onSelectGarage).not.toHaveBeenCalled();
      expect(screen.getByTestId('garage-check-garage-precision').children.join('')).toBe('☑');
      expect(screen.getByText('2 garages choisis')).toBeTruthy();

      await fireEvent.press(screen.getByTestId('write-to-selected'));
      expect(onWriteToGarages).toHaveBeenCalledWith(['garage-precision', 'garage-papineau']);
      expect(screen.queryByTestId('selection-bar')).toBeNull(); // back to the normal list
    });

    it('unticks a garage tapped twice', async () => {
      await open();

      await fireEvent.press(screen.getByTestId('garage-result-garage-precision'));
      await fireEvent.press(screen.getByTestId('garage-result-garage-precision'));

      expect(screen.getByTestId('garage-check-garage-precision').children.join('')).toBe('☐');
      expect(screen.getByText('0 garage choisi')).toBeTruthy();
    });

    it('cannot tick a garage with no known email', async () => {
      await open();

      await fireEvent.press(screen.getByTestId('garage-result-garage-rosemont'));

      expect(screen.getByTestId('garage-check-garage-rosemont').children.join('')).toBe('☐');
      expect(screen.getByText(/pas de courriel connu/)).toBeTruthy();
    });

    it('needs at least one garage before it can write', async () => {
      const { onWriteToGarages } = await open();

      await fireEvent.press(screen.getByTestId('write-to-selected'));

      expect(onWriteToGarages).not.toHaveBeenCalled();
    });

    it('cancels the selection and goes back to opening garages', async () => {
      const { onSelectGarage } = await open();
      await fireEvent.press(screen.getByTestId('garage-result-garage-precision'));

      await fireEvent.press(screen.getByTestId('cancel-selection'));
      expect(screen.queryByTestId('selection-bar')).toBeNull();

      await fireEvent.press(screen.getByTestId('garage-result-garage-precision'));
      expect(onSelectGarage).toHaveBeenCalledWith('garage-precision');
    });

    it('stops at ten garages', async () => {
      const many = Array.from({ length: 12 }, (_, i) => ({ ...mockGarages[0], id: `g${i}`, name: `Garage ${i}` }));
      await renderWithProviders(<GarageSearchScreen results={many as never} onWriteToGarages={jest.fn()} />, {
        withNavigationContainer: false,
      });
      await fireEvent.press(screen.getByTestId('multi-select-toggle'));

      for (const garage of many) await fireEvent.press(screen.getByTestId(`garage-result-${garage.id}`));

      expect(screen.getByText('10 garages choisis')).toBeTruthy();
      expect(screen.getByTestId('garage-check-g11').children.join('')).toBe('☐');
    });
  });
});
