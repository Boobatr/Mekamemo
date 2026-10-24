import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface LoginScreenProps {
  /** Rejects with the server's message (e.g. wrong credentials) so it can be shown inline. */
  onSubmit: (credentials: { email: string; password: string }) => Promise<void>;
  onCreateAccount?: () => void;
  /** Receives the e-mail typed so far, so the next screen can start from it. */
  onForgotPassword?: (email: string) => void;
}

export function LoginScreen({ onSubmit, onCreateAccount = () => {}, onForgotPassword }: LoginScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const canSubmit = email.trim().length > 0 && password.length > 0;

  async function handleSubmit() {
    if (!canSubmit || submitting) return;
    setSubmitting(true);
    setError(null);
    try {
      await onSubmit({ email: email.trim(), password });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setSubmitting(false);
    }
  }

  return (
    <Screen>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        {t('login.title')}
      </Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
        {t('login.subtitle')}
      </Text>

      <Card>
        <Field
          label={t('login.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="email"
          testID="input-login-email"
        />
        <Field
          label={t('login.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="current-password"
          onSubmitEditing={handleSubmit}
          testID="input-login-password"
        />
        {error ? (
          <Text testID="login-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
            {error}
          </Text>
        ) : null}
      </Card>

      <Button
        label={t('login.submit')}
        disabled={!canSubmit}
        loading={submitting}
        testID="login-submit"
        onPress={handleSubmit}
      />

      {onForgotPassword ? (
        <Text
          onPress={() => onForgotPassword(email.trim())}
          testID="forgot-password-link"
          accessibilityRole="button"
          style={[
            textStyles.button,
            { color: colors.accentOnBackground, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
          ]}
        >
          {t('forgotPassword.link')}
        </Text>
      ) : null}

      <Text
        onPress={onCreateAccount}
        testID="create-account-link"
        accessibilityRole="button"
        style={[
          textStyles.button,
          { color: colors.accentOnBackground, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
        ]}
      >
        {t('login.createAccount')}
      </Text>
    </Screen>
  );
}
