import React from 'react';
import { ForgotPasswordScreen } from './ForgotPasswordScreen';
import { useForgotPassword, useResetPassword } from '../../hooks/useAuth';

interface ForgotPasswordContainerProps {
  initialEmail?: string;
  onLoggedIn: () => void;
  onBackToLogin: () => void;
}

export function ForgotPasswordContainer({ initialEmail, onLoggedIn, onBackToLogin }: ForgotPasswordContainerProps) {
  const forgotPassword = useForgotPassword();
  const resetPassword = useResetPassword();

  return (
    <ForgotPasswordScreen
      initialEmail={initialEmail}
      onBackToLogin={onBackToLogin}
      onRequestCode={async (email) => {
        await forgotPassword.mutateAsync(email);
      }}
      onReset={async (input) => {
        await resetPassword.mutateAsync(input);
        onLoggedIn();
      }}
    />
  );
}
