import React from 'react';
import { LoginScreen } from './LoginScreen';
import { useLogin } from '../../hooks/useAuth';

interface LoginContainerProps {
  onLoggedIn: () => void;
  onCreateAccount: () => void;
  onForgotPassword?: (email: string) => void;
}

export function LoginContainer({ onLoggedIn, onCreateAccount, onForgotPassword }: LoginContainerProps) {
  const login = useLogin();

  return (
    <LoginScreen
      onCreateAccount={onCreateAccount}
      onForgotPassword={onForgotPassword}
      onSubmit={async (credentials) => {
        await login.mutateAsync(credentials);
        onLoggedIn();
      }}
    />
  );
}
