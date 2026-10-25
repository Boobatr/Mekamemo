import React, { useState } from 'react';
import { Text } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { AddGarageInput, AddGarageResult } from '../../services/garages';

interface AddGarageScreenProps {
  /** Rejects with the server's message (unknown address, too many additions today…). */
  onSubmit?: (input: AddGarageInput) => Promise<AddGarageResult>;
  onOpenGarage?: (garageId: string) => void;
  onBack?: () => void;
}

const EMAIL = /^\S+@\S+\.\S+$/;
const POSTAL_CODE = /^[A-Za-z]\d[A-Za-z] ?\d[A-Za-z]\d$/;

export function AddGarageScreen({
  onSubmit = async () => ({ garage: { id: '', name: '', address: '' }, created: true }),
  onOpenGarage = () => {},
  onBack,
}: AddGarageScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [name, setName] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [postalCode, setPostalCode] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [result, setResult] = useState<AddGarageResult | null>(null);

  const emailInvalid = email.trim().length > 0 && !EMAIL.test(email.trim());
  const postalCodeInvalid = postalCode.trim().length > 0 && !POSTAL_CODE.test(postalCode.trim());
  const canSubmit =
    name.trim().length >= 2 && street.trim().length >= 3 && city.trim().length >= 2 && !emailInvalid && !postalCodeInvalid;

  async function submit() {
    if (!canSubmit || busy) return;
    setBusy(true);
    setError(null);
    try {
      setResult(
        await onSubmit({
          name: name.trim(),
          street: street.trim(),
          city: city.trim(),
          postalCode: postalCode.trim() || undefined,
          phone: phone.trim() || undefined,
          email: email.trim() || undefined,
        }),
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setBusy(false);
    }
  }

  return (
    <Screen>
      {onBack ? (
        <Text
          onPress={onBack}
          testID="screen-back-button"
          accessibilityRole="button"
          style={[textStyles.button, { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.lg }]}
        >
          ‹ {t('common.back')}
        </Text>
      ) : null}
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        {t('addGarage.title')}
      </Text>

      {result ? (
        <>
          <Text testID="add-garage-done" style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
            {result.created ? t('addGarage.added') : t('addGarage.alreadyListed')}
          </Text>
          <Card>
            <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginBottom: spacing.xs }]}>{result.garage.name}</Text>
            <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{result.garage.address}</Text>
          </Card>
          <Button label={t('addGarage.view')} testID="add-garage-view" onPress={() => onOpenGarage(result.garage.id)} />
          {onBack ? <Button label={t('common.back')} variant="secondary" testID="add-garage-back" onPress={onBack} /> : null}
        </>
      ) : (
        <>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>{t('addGarage.subtitle')}</Text>
          <Card>
            <Field label={t('addGarage.name')} value={name} onChangeText={setName} testID="input-garage-name" />
            <Field
              label={t('addGarage.street')}
              value={street}
              onChangeText={setStreet}
              autoComplete="street-address"
              testID="input-garage-street"
            />
            <Field label={t('addGarage.city')} value={city} onChangeText={setCity} testID="input-garage-city" />
            <Field
              label={t('addGarage.postalCode')}
              value={postalCode}
              onChangeText={setPostalCode}
              autoCapitalize="characters"
              autoCorrect={false}
              maxLength={7}
              testID="input-garage-postal-code"
            />
            {postalCodeInvalid ? (
              <Text testID="garage-postal-code-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
                {t('addGarage.invalidPostalCode')}
              </Text>
            ) : null}
            <Field
              label={t('addGarage.phone')}
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
              autoComplete="tel"
              testID="input-garage-phone"
            />
            <Field
              label={t('addGarage.email')}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              testID="input-garage-email"
            />
            {emailInvalid ? (
              <Text testID="garage-email-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
                {t('addGarage.invalidEmail')}
              </Text>
            ) : null}
            {error ? (
              <Text testID="add-garage-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
                {error}
              </Text>
            ) : null}
          </Card>
          <Button label={t('addGarage.submit')} disabled={!canSubmit} loading={busy} testID="add-garage-submit" onPress={submit} />
          {/* A way out at the bottom too: the form is long, and the top bar scrolls out of sight. */}
          {onBack ? <Button label={t('common.cancel')} variant="secondary" testID="add-garage-cancel" onPress={onBack} /> : null}
        </>
      )}
    </Screen>
  );
}
