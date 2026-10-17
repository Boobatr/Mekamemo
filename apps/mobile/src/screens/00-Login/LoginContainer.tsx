import React from 'react';
import { LoginScreen } from './LoginScreen';
import { useLogin } from '../../hooks/useAuth';

interface LoginContainerProps {
  onLoggedIn: () => void;
  onCreateAccount: () => void;
}

export function LoginContainer({ onLoggedIn, onCreateAccount }: LoginContainerProps) {
  const login = useLogin();

  return (
    <LoginScreen
      onCreateAccount={onCreateAccount}
      onSubmit={async (credentials) => {
        await login.mutateAsync(credentials);
        onLoggedIn();
      }}
    />
  );
}
