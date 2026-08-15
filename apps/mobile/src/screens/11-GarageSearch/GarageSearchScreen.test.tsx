import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { GarageSearchScreen } from './GarageSearchScreen';

describe('GarageSearchScreen', () => {
  it('lists garage results ordered as provided', async () => {
    await renderWithProviders(<GarageSearchScreen />, { withNavigationContainer: false });
    expect(screen.getByText('Garage Précision')).toBeTruthy();
    expect(screen.getByText('Atelier Rosemont')).toBeTruthy();
    expect(screen.getByText('Mécanique Papineau')).toBeTruthy();
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
});
