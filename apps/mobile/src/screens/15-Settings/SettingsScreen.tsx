import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockUser } from '../../mocks/mockData';

interface SettingsScreenProps {
  userName?: string;
  userEmail?: string;
  isPlus?: boolean;
  planPriceLabel?: string;
  onEditProfile?: () => void;
  onChangeLanguage?: (language: 'fr' | 'en') => void;
  onChangeUnits?: (units: 'km' | 'mi') => void;
  onToggleAutoContact?: (value: boolean) => void;
  onToggleVoiceFallback?: (value: boolean) => void;
  onManageSubscription?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void;
}

export function SettingsScreen({
  userName = mockUser.fullName,
  userEmail = mockUser.email,
  isPlus = false,
  planPriceLabel,
  onEditProfile = () => {},
  onChangeLanguage = () => {},
  onChangeUnits = () => {},
  onToggleAutoContact = () => {},
  onToggleVoiceFallback = () => {},
  onManageSubscription = () => {},
  onOpenPrivacy = () => {},
  onOpenHelp = () => {},
  onLogout = () => {},
}: SettingsScreenProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const [language, setLanguage] = useState<'fr' | 'en'>(mockUser.language);
  const [units, setUnits] = useState<'km' | 'mi'>(mockUser.units);
  const [autoContact, setAutoContact] = useState(true);
  const [voiceFallback, setVoiceFallback] = useState(false);

  const initials = userName
    .split(' ')
    .map((part) => part[0])
    .join('')
    .toUpperCase();

  return (
    <Screen>
      <Text style={[textStyles.screenTitle, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
        {t('settings.title')}
      </Text>

      <Card withMarks={false} testID="profile-summary" style={{ flexDirection: 'row', alignItems: 'center' }}>
        <View
          style={{
            width: 40,
            height: 40,
            backgroundColor: colors.accent,
            alignItems: 'center',
            justifyContent: 'center',
            marginRight: spacing.lg,
          }}
        >
          <Text style={[textStyles.button, { color: '#ffffff', fontSize: 14 }]}>{initials}</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>{userName}</Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{userEmail}</Text>
        </View>
        <Text onPress={onEditProfile} testID="edit-profile" style={[textStyles.button, { color: colors.accentOnBackground }]}>
          ›
        </Text>
      </Card>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('settings.preferences')}
      </Text>
      <Card>
        <SettingRow label={t('common.language')}>
          <TwoWayToggle
            leftLabel="FR"
            rightLabel="EN"
            value={language}
            leftValue="fr"
            rightValue="en"
            onChange={(v) => {
              setLanguage(v);
              i18n.changeLanguage(v);
              onChangeLanguage(v);
            }}
            testIDPrefix="language"
          />
        </SettingRow>
        <SettingRow label={t('settings.units')}>
          <TwoWayToggle
            leftLabel="KM"
            rightLabel="MI"
            value={units}
            leftValue="km"
            rightValue="mi"
            onChange={(v) => {
              setUnits(v);
              onChangeUnits(v);
            }}
            testIDPrefix="units"
          />
        </SettingRow>
        <SettingRow label={t('settings.autoContact')}>
          <Switch
            testID="switch-auto-contact"
            value={autoContact}
            onValueChange={(v) => {
              setAutoContact(v);
              onToggleAutoContact(v);
            }}
          />
        </SettingRow>
        <SettingRow label={t('settings.voiceFallback')}>
          <Switch
            testID="switch-voice-fallback"
            value={voiceFallback}
            onValueChange={(v) => {
              setVoiceFallback(v);
              onToggleVoiceFallback(v);
            }}
          />
        </SettingRow>
        <SettingRow label={t('settings.confirmBeforeBooking')}>
          {/* Always on: no reservation is ever confirmed without the user's explicit tap — this is a
              hard product invariant (see BookingConfirmationScreen), not a user preference. */}
          <Switch testID="switch-confirm-before-booking" value={true} disabled />
        </SettingRow>
      </Card>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('settings.currentPlan')}
      </Text>
      <Card>
        <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          {isPlus ? t('settings.plusTitle') : planPriceLabel ?? t('settings.freeTitle')}
        </Text>
        <Text style={[textStyles.bodySecondary, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
          {isPlus ? t('settings.plusDescription') : t('settings.freeDescription')}
        </Text>
        <Button label={t('settings.manageSubscription')} testID="manage-subscription-button" onPress={onManageSubscription} />
      </Card>

      <LinkRow label={t('settings.privacy')} onPress={onOpenPrivacy} testID="link-privacy" />
      <LinkRow label={t('settings.help')} onPress={onOpenHelp} testID="link-help" />
      <LinkRow label={t('settings.logout')} onPress={onLogout} testID="link-logout" />
    </Screen>
  );
}

function SettingRow({ label, children }: { label: string; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
      <Text style={[textStyles.body, { color: colors.textPrimary, flexShrink: 1 }]}>{label}</Text>
      {children}
    </View>
  );
}

function TwoWayToggle<T extends string>({
  leftLabel,
  rightLabel,
  leftValue,
  rightValue,
  value,
  onChange,
  testIDPrefix,
}: {
  leftLabel: string;
  rightLabel: string;
  leftValue: T;
  rightValue: T;
  value: T;
  onChange: (value: T) => void;
  testIDPrefix: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row' }}>
      {[
        [leftLabel, leftValue],
        [rightLabel, rightValue],
      ].map(([label, v]) => (
        <Text
          key={v}
          onPress={() => onChange(v as T)}
          testID={`${testIDPrefix}-${v}`}
          style={[
            textStyles.button,
            {
              color: value === v ? '#ffffff' : colors.textSecondary,
              backgroundColor: value === v ? colors.accent : 'transparent',
              borderWidth: 1,
              borderColor: value === v ? colors.accent : colors.hairlines[1],
              paddingHorizontal: spacing.lg,
              paddingVertical: spacing.xs,
              marginLeft: spacing.sm,
              fontSize: 12,
            },
          ]}
        >
          {label}
        </Text>
      ))}
    </View>
  );
}

function LinkRow({ label, onPress, testID }: { label: string; onPress: () => void; testID: string }) {
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      testID={testID}
      style={[
        textStyles.body,
        { color: colors.textSecondary, paddingVertical: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.hairlines[3] },
      ]}
    >
      {label} ›
    </Text>
  );
}
