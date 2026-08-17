import React from 'react';
import { Alert } from 'react-native';
import { ProfileScreen } from './ProfileScreen';
import { useRegister } from '../../hooks/useAuth';

function generateLocalPassword(): string {
  const segment = () => Math.random().toString(36).slice(2);
  return `${segment()}${segment()}${Date.now().toString(36)}`;
}

interface ProfileContainerProps {
  onContinue: () => void;
}

/**
 * The 15-screen mockup has no password field, so this generates one locally
 * and never surfaces it — the backend's real email/password auth stays
 * intact (useful for a future second-device/reinstall login screen), but
 * this device's first-run flow is effectively passwordless.
 */
export function ProfileContainer({ onContinue }: ProfileContainerProps) {
  const register = useRegister();

  return (
    <ProfileScreen
      onContinue={async (profile) => {
        try {
          await register.mutateAsync({
            email: profile.email,
            password: generateLocalPassword(),
            fullName: profile.fullName,
            phone: profile.phone,
            postalCode: profile.postalCode,
            searchRadiusKm: profile.searchRadiusKm,
            language: profile.language,
          });
          onContinue();
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : "Une erreur est survenue.");
        }
      }}
    />
  );
}
