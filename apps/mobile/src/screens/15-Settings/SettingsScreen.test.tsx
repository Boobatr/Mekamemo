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

  it('switches theme and forwards the change', async () => {
    const onChangeTheme = jest.fn();
    await renderWithProviders(<SettingsScreen themeMode="dark" onChangeTheme={onChangeTheme} />, {
      withNavigationContainer: false,
    });

    await fireEvent.press(screen.getByTestId('theme-light'));
    expect(onChangeTheme).toHaveBeenCalledWith('light');

    await fireEvent.press(screen.getByTestId('theme-ember'));
    expect(onChangeTheme).toHaveBeenCalledWith('ember');
  });

  it('changes the search radius and forwards the new value', async () => {
    const onChangeSearchRadius = jest.fn();
    await renderWithProviders(
      <SettingsScreen searchRadiusKm={15} onChangeSearchRadius={onChangeSearchRadius} />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('radius-25'));
    expect(onChangeSearchRadius).toHaveBeenCalledWith(25);
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

    expect(screen.getByText(/MEKAMEMO\+/)).toBeTruthy();
    await fireEvent.press(screen.getByTestId('manage-subscription-button'));
    expect(onManageSubscription).toHaveBeenCalledTimes(1);
  });

  it('shows the plan feature list when already on MEKAMEMO+', async () => {
    await renderWithProviders(<SettingsScreen isPlus />, { withNavigationContainer: false });

    expect(screen.getByText(/Véhicules illimités/)).toBeTruthy();
  });

  it('lets the user edit and save their name, phone, and postal code', async () => {
    const onSaveProfile = jest.fn();
    await renderWithProviders(
      <SettingsScreen
        userName="Marc Lavoie"
        userPhone="+1 514 555 0142"
        userPostalCode="H2X 1Y4"
        onSaveProfile={onSaveProfile}
      />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('edit-profile'));

    expect(screen.getByTestId('input-edit-fullName').props.value).toBe('Marc Lavoie');
    expect(screen.getByTestId('input-edit-phone').props.value).toBe('+1 514 555 0142');
    expect(screen.getByTestId('input-edit-postalCode').props.value).toBe('H2X 1Y4');

    await fireEvent.changeText(screen.getByTestId('input-edit-phone'), '+1 514 555 9999');
    await fireEvent.press(screen.getByTestId('save-edit-profile'));

    expect(onSaveProfile).toHaveBeenCalledWith({
      fullName: 'Marc Lavoie',
      phone: '+1 514 555 9999',
      postalCode: 'H2X 1Y4',
    });
    expect(screen.queryByTestId('profile-edit')).toBeNull();
  });

  it('discards changes when cancelling the profile edit', async () => {
    const onSaveProfile = jest.fn();
    await renderWithProviders(
      <SettingsScreen userName="Marc Lavoie" onSaveProfile={onSaveProfile} />,
      { withNavigationContainer: false },
    );

    await fireEvent.press(screen.getByTestId('edit-profile'));
    await fireEvent.changeText(screen.getByTestId('input-edit-fullName'), 'Someone Else');
    await fireEvent.press(screen.getByTestId('cancel-edit-profile'));

    expect(onSaveProfile).not.toHaveBeenCalled();
    expect(screen.queryByTestId('profile-edit')).toBeNull();
    expect(screen.getByText('Marc Lavoie')).toBeTruthy();
  });

  it('triggers logout', async () => {
    const onLogout = jest.fn();
    await renderWithProviders(<SettingsScreen onLogout={onLogout} />, { withNavigationContainer: false });

    await fireEvent.press(screen.getByTestId('link-logout'));
    expect(onLogout).toHaveBeenCalledTimes(1);
  });
});
