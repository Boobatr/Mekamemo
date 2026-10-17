import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Button, StepProgress } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockUser } from '../../mocks/mockData';

const MIN_PASSWORD_LENGTH = 8;

interface ProfileScreenProps {
  onContinue: (profile: {
    fullName: string;
    email: string;
    password: string;
    phone: string;
    postalCode: string;
    searchRadiusKm: number;
    language: 'fr' | 'en';
  }) => void;
  onLogin?: () => void;
}

export function ProfileScreen({ onContinue, onLogin }: ProfileScreenProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [fullName, setFullName] = useState(mockUser.fullName);
  const [email, setEmail] = useState(mockUser.email);
  const [password, setPassword] = useState('');
  const [phone, setPhone] = useState(mockUser.phone);
  const [postalCode, setPostalCode] = useState(mockUser.postalCode);
  const [radiusKm, setRadiusKm] = useState(mockUser.searchRadiusKm);
  const [language, setLanguage] = useState<'fr' | 'en'>(mockUser.language);

  return (
    <Screen>
      <StepProgress current={1} total={3} />
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('onboarding.step', { current: 1, total: 3 })}
      </Text>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        {t('onboarding.profile.title')}
      </Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
        {t('onboarding.profile.subtitle')}
      </Text>

      <Card>
        <Field
          label={t('onboarding.profile.fullName')}
          value={fullName}
          onChangeText={setFullName}
          testID="input-fullName"
        />
        <Field
          label={t('onboarding.profile.email')}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
          testID="input-email"
        />
        <Field
          label={t('onboarding.profile.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete="new-password"
          testID="input-password"
        />
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginTop: -spacing.md, marginBottom: spacing.xl }]}>
          {t('onboarding.profile.passwordHint')}
        </Text>
        <Field
          label={t('onboarding.profile.phone')}
          value={phone}
          onChangeText={setPhone}
          keyboardType="phone-pad"
          testID="input-phone"
        />
        <View style={{ flexDirection: 'row', gap: spacing.md }}>
          <View style={{ flex: 1 }}>
            <Field
              label={t('onboarding.profile.postalCode')}
              value={postalCode}
              onChangeText={setPostalCode}
              autoCapitalize="characters"
              testID="input-postalCode"
            />
          </View>
          <View style={{ flex: 1 }}>
            <Field
              label={t('onboarding.profile.radius')}
              value={`${radiusKm} km`}
              onChangeText={(v) => {
                const parsed = parseInt(v, 10);
                if (!Number.isNaN(parsed)) setRadiusKm(parsed);
              }}
              keyboardType="numeric"
              testID="input-radius"
            />
          </View>
        </View>

        <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
          {t('common.language')}
        </Text>
        <View style={{ flexDirection: 'row', borderWidth: 1, borderColor: colors.hairlines[1] }}>
          <LanguageChip
            label={t('common.french')}
            selected={language === 'fr'}
            onPress={() => {
              setLanguage('fr');
              i18n.changeLanguage('fr');
            }}
          />
          <LanguageChip
            label={t('common.english')}
            selected={language === 'en'}
            onPress={() => {
              setLanguage('en');
              i18n.changeLanguage('en');
            }}
          />
        </View>
      </Card>

      <Button
        label={t('common.continue')}
        testID="continue-button"
        disabled={password.length < MIN_PASSWORD_LENGTH}
        onPress={() =>
          onContinue({ fullName, email, password, phone, postalCode, searchRadiusKm: radiusKm, language })
        }
      />

      {onLogin ? (
        <Text
          onPress={onLogin}
          testID="login-link"
          accessibilityRole="button"
          style={[
            textStyles.button,
            { color: colors.accentOnBackground, fontSize: 13, textAlign: 'center', marginTop: spacing.xl },
          ]}
        >
          {t('onboarding.profile.haveAccount')}
        </Text>
      ) : null}

      <Text
        style={[
          textStyles.bodySecondary,
          { color: colors.textMuted, textAlign: 'center', marginTop: spacing.xl },
        ]}
      >
        {t('onboarding.profile.privacyNote')}
      </Text>
    </Screen>
  );
}

function LanguageChip({
  label,
  selected,
  onPress,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
}) {
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      style={[
        textStyles.button,
        {
          flex: 1,
          textAlign: 'center',
          color: selected ? '#ffffff' : colors.textSecondary,
          backgroundColor: selected ? colors.accent : 'transparent',
          paddingVertical: spacing.md,
          fontSize: 13,
        },
      ]}
    >
      {label}
    </Text>
  );
}
