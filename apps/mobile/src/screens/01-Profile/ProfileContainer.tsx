import React from 'react';
import { Alert } from 'react-native';
import { ProfileScreen } from './ProfileScreen';
import { useRegister } from '../../hooks/useAuth';

interface ProfileContainerProps {
  onContinue: () => void;
  onLogin?: () => void;
}

/** Account creation. The user picks their own password so they can sign back in on any device. */
export function ProfileContainer({ onContinue, onLogin }: ProfileContainerProps) {
  const register = useRegister();

  return (
    <ProfileScreen
      onLogin={onLogin}
      onContinue={async (profile) => {
        try {
          await register.mutateAsync({
            email: profile.email,
            password: profile.password,
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
