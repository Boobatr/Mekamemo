import React from 'react';
import { Alert } from 'react-native';
import { SettingsScreen } from './SettingsScreen';
import { useProfile, useSubscription, useUpdateProfile } from '../../hooks/useProfile';
import { useLogout } from '../../hooks/useAuth';
import { useTheme } from '../../theme';

interface SettingsContainerProps {
  onLoggedOut: () => void;
}

export function SettingsContainer({ onLoggedOut }: SettingsContainerProps) {
  const { data: profile } = useProfile();
  const { data: subscription } = useSubscription();
  const updateProfile = useUpdateProfile();
  const logout = useLogout();
  const { mode: themeMode, setMode: setThemeMode } = useTheme();

  return (
    <SettingsScreen
      userName={profile?.fullName}
      userEmail={profile?.email}
      isPlus={subscription?.plan === 'mekamemo_plus'}
      themeMode={themeMode}
      onChangeTheme={setThemeMode}
      onChangeLanguage={(language) => updateProfile.mutate({ language })}
      onChangeUnits={(units) => updateProfile.mutate({ units })}
      onToggleAutoContact={(value) => updateProfile.mutate({ autoContactGarages: value })}
      onToggleVoiceFallback={(value) => updateProfile.mutate({ voiceFallbackEnabled: value })}
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
