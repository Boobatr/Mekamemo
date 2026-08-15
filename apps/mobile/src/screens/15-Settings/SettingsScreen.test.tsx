import React from 'react';
import { fireEvent, screen } from '@testing-library/react-native';
import { renderWithProviders } from '../../test-utils/renderWithProviders';
import { SettingsScreen } from './SettingsScreen';

describe('SettingsScreen', () => {
  it('locks "confirm before booking" permanently on — this is a hard product invariant', async () => {
    await renderWithProviders(<SettingsScreen />, { withNavigationContainer: false });

    const toggle = screen.getByTestId('switch-confirm-before-booking');
    expect(toggle.props.value).toBe(true);
    expect(toggle.props.disabled).toBe(true);
  });

  it('switches language and forwards the change', async () => {
    const onChangeLanguage = jest.fn();
    await renderWithProviders(<SettingsScreen onChangeLanguage={onChangeLanguage} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('language-en'));
    expect(onChangeLanguage).toHaveBeenCalledWith('en');
  });

  it('switches units and forwards the change', async () => {
    const onChangeUnits = jest.fn();
    await renderWithProviders(<SettingsScreen onChangeUnits={onChangeUnits} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('units-mi'));
    expect(onChangeUnits).toHaveBeenCalledWith('mi');
  });

  it('toggles auto-contact and voice-fallback switches independently', async () => {
    const onToggleAutoContact = jest.fn();
    const onToggleVoiceFallback = jest.fn();
    await renderWithProviders(
      <SettingsScreen
        onToggleAutoContact={onToggleAutoContact}
        onToggleVoiceFallback={onToggleVoiceFallback}
      />,
      { withNavigationContainer: false },
    );

    await fireEvent(screen.getByTestId('switch-voice-fallback'), 'valueChange', true);
    expect(onToggleVoiceFallback).toHaveBeenCalledWith(true);
    expect(onToggleAutoContact).not.toHaveBeenCalled();
  });

  it('shows the MEKAMEMO+ upsell and triggers manage-subscription', async () => {
    const onManageSubscription = jest.fn();
    await renderWithProviders(<SettingsScreen onManageSubscription={onManageSubscription} />, {
      withNavigationContainer: false,
    });

    expect(screen.getByText(/Véhicules illimités/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('manage-subscription-button'));
    expect(onManageSubscription).toHaveBeenCalledTimes(1);
  });

  it('triggers logout', async () => {
    const onLogout = jest.fn();
    await renderWithProviders(<SettingsScreen onLogout={onLogout} />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('link-logout'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
