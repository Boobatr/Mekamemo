import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface ForgotPasswordScreenProps {
  initialEmail?: string;
  /** Asks for a code to be e-mailed. Rejects only when the server can't be reached. */
  onRequestCode: (email: string) => Promise<void>;
  /** Rejects with the server's message when the code is wrong or expired. */
  onReset: (input: { email: string; code: string; newPassword: string }) => Promise<void>;
  onBackToLogin?: () => void;
}

const MIN_PASSWORD_LENGTH = 8;
const MIN_CODE_LENGTH = 6;

export function ForgotPasswordScreen({
  initialEmail = '',
  onRequestCode,
  onReset,
  onBackToLogin = () => {},
}: ForgotPasswordScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [step, setStep] = useState<'request' | 'reset'>('request');
  const [email, setEmail] = useState(initialEmail);
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const emailIsValid = /^\S+@\S+\.\S+$/.test(email.trim());
  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canReset =
    code.replace(/[^A-Za-z0-9]/g, '').length >= MIN_CODE_LENGTH &&
    newPassword.length >= MIN_PASSWORD_LENGTH &&
    newPassword === confirmPassword;

  async function requestCode(message: string) {
    if (!emailIsValid || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onRequestCode(email.trim());
      setNotice(message);
      setStep('reset');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  async function reset() {
    if (!canReset || busy) return;
    setBusy(true);
    setError(null);
    try {
      await onReset({ email: email.trim(), code: code.trim(), newPassword });
      // Signed in: the navigator replaces this screen, nothing more to do here.
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
      setBusy(false);
    }
  }

  return (
    <Screen>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        {t('forgotPassword.title')}
      </Text>

      {step === 'request' ? (
        <>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
            {t('forgotPassword.subtitle')}
          </Text>
          <Card>
            <Field
              label={t('forgotPassword.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="email"
              onSubmitEditing={() => requestCode(t('forgotPassword.codeSent', { email: email.trim() }))}
              testID="input-forgot-email"
            />
            {error ? (
              <Text testID="forgot-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
                {error}
              </Text>
            ) : null}
          </Card>
          <Button
            label={t('forgotPassword.sendCode')}
            disabled={!emailIsValid}
            loading={busy}
            testID="forgot-send-code"
            onPress={() => requestCode(t('forgotPassword.codeSent', { email: email.trim() }))}
          />
        </>
      ) : (
        <>
          {notice ? (
            <Text testID="forgot-notice" style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
              {notice}
            </Text>
          ) : null}
          <Card>
            <Field
              label={t('forgotPassword.code')}
              value={code}
              onChangeText={setCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={12}
              testID="input-forgot-code"
            />
            <Field
              label={t('forgotPassword.newPassword')}
              value={newPassword}
              onChangeText={setNewPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              testID="input-forgot-new-password"
            />
            <Field
              label={t('forgotPassword.confirmPassword')}
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="new-password"
              testID="input-forgot-confirm-password"
            />
            <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{t('forgotPassword.passwordHint')}</Text>
            {passwordsMismatch ? (
              <Text testID="forgot-mismatch" style={[textStyles.body, { color: colors.accentOnBackground }]}>
                {t('forgotPassword.mismatch')}
              </Text>
            ) : null}
            {error ? (
              <Text testID="forgot-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
                {error}
              </Text>
            ) : null}
          </Card>
          <Button
            label={t('forgotPassword.reset')}
            disabled={!canReset}
            loading={busy}
            testID="forgot-reset"
            onPress={reset}
          />
          <Text
            onPress={() => requestCode(t('forgotPassword.resent'))}
            testID="forgot-resend"
            accessibilityRole="button"
            style={[
              textStyles.button,
              { color: colors.accentOnBackground, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
            ]}
          >
            {t('forgotPassword.resend')}
          </Text>
        </>
      )}

      <Text
        onPress={onBackToLogin}
        testID="forgot-back-to-login"
        accessibilityRole="button"
        style={[
          textStyles.button,
          { color: colors.accentOnBackground, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
        ]}
      >
        {t('forgotPassword.backToLogin')}
      </Text>
    </Screen>
  );
}
