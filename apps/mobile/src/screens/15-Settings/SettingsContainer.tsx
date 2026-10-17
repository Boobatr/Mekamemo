import React from 'react';
import { Alert } from 'react-native';
import { SettingsScreen } from './SettingsScreen';
import { useChangePassword, useProfile, useSubscription, useUpdateProfile } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import { useTheme } from '../../theme';

interface SettingsContainerProps {
  onLoggedOut: () => void;
}

export function SettingsContainer({ onLoggedOut }: SettingsContainerProps) {
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  const updateProfile = useUpdateProfile();
  const changePassword = useChangePassword();
  const logout = useLogout();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  return (
    <SettingsScreen
      userName={profile?.fullName}
      userEmail={profile?.email}
      userPhone={profile?.phone}
      userPostalCode={profile?.postalCode}
      hasChosenPassword={profile?.hasChosenPassword}
      onChangePassword={async (input) => {
        await changePassword.mutateAsync(input);
      }}
      isPlus={subscription?.plan === 'mekamemo_plus'}
      themeMode={themeMode}
      onChangeTheme={setThemeMode}
      onSaveProfile={(data) =>
        updateProfile.mutate(data, {
          onError: (err) =>
            Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.'),
        })
      }
      onChangeLanguage={(language) => updateProfile.mutate({ language })}
      onChangeUnits={(units) => updateProfile.mutate({ units })}
      onToggleAutoContact={(value) => updateProfile.mutate({ autoContactGarages: value })}
      onToggleVoiceFallback={(value) => updateProfile.mutate({ voiceFallbackEnabled: value })}
      searchRadiusKm={profile?.searchRadiusKm}
      onChangeSearchRadius={(km) => updateProfile.mutate({ searchRadiusKm: km })}
      onManageSubscription={() => {}}
      onOpenPrivacy={() => {}}
      onOpenHelp={() => {}}
      onLogout={async () => {
        try {
          await logout.mutateAsync();
          onLoggedOut();
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
    />
  );
}
