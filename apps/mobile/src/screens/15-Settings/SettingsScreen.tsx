import React, { useState } from 'react';
import { Switch, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Button, Field } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockUser } from '../../mocks/mockData';
import { ThemeMode } from '../../theme';

interface SettingsScreenProps {
  userName?: string;
  userEmail?: string;
  userPhone?: string;
  userPostalCode?: string;
  isPlus?: boolean;
  planPriceLabel?: string;
  onSaveProfile?: (profile: { fullName: string; email: string; phone: string; postalCode: string }) => void;
  /** false for accounts created before passwords existed: no current password to confirm. */
  hasChosenPassword?: boolean;
  /** Should reject with the server's message when refused, so it can be shown in place. */
  onChangePassword?: (input: { currentPassword?: string; newPassword: string }) => Promise<void>;
  onChangeLanguage?: (language: 'fr' | 'en') => void;
  onChangeUnits?: (units: 'km' | 'mi') => void;
  themeMode?: ThemeMode;
  onChangeTheme?: (mode: ThemeMode) => void;
  onToggleAutoContact?: (value: boolean) => void;
  onToggleVoiceFallback?: (value: boolean) => void;
  searchRadiusKm?: number;
  onChangeSearchRadius?: (km: number) => void;
  onManageSubscription?: () => void;
  onOpenPrivacy?: () => void;
  onOpenHelp?: () => void;
  onLogout?: () => void;
}

export function SettingsScreen({
  userName = mockUser.fullName,
  userEmail = mockUser.email,
  userPhone = mockUser.phone,
  userPostalCode = mockUser.postalCode,
  isPlus = false,
  planPriceLabel,
  onSaveProfile = () => {},
  hasChosenPassword = true,
  onChangePassword = async () => {},
  onChangeLanguage = () => {},
  onChangeUnits = () => {},
  themeMode = 'dark',
  onChangeTheme = () => {},
  onToggleAutoContact = () => {},
  onToggleVoiceFallback = () => {},
  searchRadiusKm = 15,
  onChangeSearchRadius = () => {},
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

  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [editFullName, setEditFullName] = useState(userName);
  const [editEmail, setEditEmail] = useState(userEmail);
  const [editPhone, setEditPhone] = useState(userPhone);
  const [editPostalCode, setEditPostalCode] = useState(userPostalCode);

  const emailIsValid = /^\S+@\S+\.\S+$/.test(editEmail.trim());

  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [passwordSaving, setPasswordSaving] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordSaved, setPasswordSaved] = useState(false);

  const passwordsMismatch = confirmPassword.length > 0 && confirmPassword !== newPassword;
  const canSavePassword =
    newPassword.length >= 8 &&
    newPassword === confirmPassword &&
    (!hasChosenPassword || currentPassword.length > 0);

  function closePasswordForm() {
    setIsChangingPassword(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
    setPasswordError(null);
  }

  async function savePassword() {
    if (!canSavePassword || passwordSaving) return;
    setPasswordSaving(true);
    setPasswordError(null);
    try {
      await onChangePassword({
        currentPassword: hasChosenPassword ? currentPassword : undefined,
        newPassword,
      });
      closePasswordForm();
      setPasswordSaved(true);
    } catch (err) {
      setPasswordError(err instanceof Error ? err.message : 'Une erreur est survenue.');
    } finally {
      setPasswordSaving(false);
    }
  }

  function startEditingProfile() {
    setEditFullName(userName);
    setEditEmail(userEmail);
    setEditPhone(userPhone);
    setEditPostalCode(userPostalCode);
    setIsEditingProfile(true);
  }

  function saveProfile() {
    if (!emailIsValid) return;
    onSaveProfile({
      fullName: editFullName,
      email: editEmail.trim(),
      phone: editPhone,
      postalCode: editPostalCode,
    });
    setIsEditingProfile(false);
  }

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

      {isEditingProfile ? (
        <Card withMarks={false} testID="profile-edit">
          <Field
            label={t('onboarding.profile.fullName')}
            value={editFullName}
            onChangeText={setEditFullName}
            testID="input-edit-fullName"
          />
          <Field
            label={t('onboarding.profile.email')}
            value={editEmail}
            onChangeText={setEditEmail}
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            testID="input-edit-email"
          />
          <Field
            label={t('onboarding.profile.phone')}
            value={editPhone}
            onChangeText={setEditPhone}
            keyboardType="phone-pad"
            testID="input-edit-phone"
          />
          <Field
            label={t('onboarding.profile.postalCode')}
            value={editPostalCode}
            onChangeText={setEditPostalCode}
            autoCapitalize="characters"
            testID="input-edit-postalCode"
          />
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                testID="cancel-edit-profile"
                onPress={() => setIsEditingProfile(false)}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                testID="save-edit-profile"
                disabled={!emailIsValid}
                onPress={saveProfile}
              />
            </View>
          </View>
        </Card>
      ) : (
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
          <Text
            onPress={startEditingProfile}
            testID="edit-profile"
            style={[textStyles.button, { color: colors.accentOnBackground }]}
          >
            ›
          </Text>
        </Card>
      )}

      {isChangingPassword ? (
        <Card withMarks={false} testID="password-edit">
          {!hasChosenPassword ? (
            <Text style={[textStyles.bodySecondary, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
              {t('settings.password.legacyNote')}
            </Text>
          ) : (
            <Field
              label={t('settings.password.current')}
              value={currentPassword}
              onChangeText={setCurrentPassword}
              secureTextEntry
              autoCapitalize="none"
              autoCorrect={false}
              autoComplete="current-password"
              testID="input-current-password"
            />
          )}
          <Field
            label={t('settings.password.new')}
            value={newPassword}
            onChangeText={setNewPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            testID="input-new-password"
          />
          <Field
            label={t('settings.password.confirm')}
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            autoComplete="new-password"
            testID="input-confirm-password"
          />
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{t('settings.password.hint')}</Text>
          {passwordsMismatch ? (
            <Text testID="password-mismatch" style={[textStyles.body, { color: colors.accentOnBackground }]}>
              {t('settings.password.mismatch')}
            </Text>
          ) : null}
          {passwordError ? (
            <Text testID="password-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
              {passwordError}
            </Text>
          ) : null}
          <View style={{ flexDirection: 'row', gap: spacing.md }}>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.cancel')}
                variant="secondary"
                testID="cancel-change-password"
                onPress={closePasswordForm}
              />
            </View>
            <View style={{ flex: 1 }}>
              <Button
                label={t('common.save')}
                testID="save-change-password"
                disabled={!canSavePassword}
                loading={passwordSaving}
                onPress={savePassword}
              />
            </View>
          </View>
        </Card>
      ) : (
        <>
          <LinkRow
            label={hasChosenPassword ? t('settings.password.change') : t('settings.password.set')}
            onPress={() => {
              setPasswordSaved(false);
              setIsChangingPassword(true);
            }}
            testID="link-change-password"
          />
          {passwordSaved ? (
            <Text
              testID="password-saved"
              style={[textStyles.bodySecondary, { color: colors.textSecondary, marginBottom: spacing.lg }]}
            >
              {t('settings.password.success')}
            </Text>
          ) : null}
        </>
      )}

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md, marginTop: spacing.xl }]}>
        {t('settings.preferences')}
      </Text>
      <Card>
        <SettingRow label={t('settings.theme')}>
          <OptionToggle
            options={[
              { label: t('settings.dark').toUpperCase(), value: 'dark' as const },
              { label: t('settings.light').toUpperCase(), value: 'light' as const },
              { label: t('settings.ember').toUpperCase(), value: 'ember' as const },
            ]}
            value={themeMode}
            onChange={onChangeTheme}
            testIDPrefix="theme"
          />
        </SettingRow>
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
        <SettingRow label={t('settings.searchRadius')} stacked>
          <OptionToggle
            options={RADIUS_OPTIONS_KM.map((km) => ({ label: `${km} KM`, value: km }))}
            value={searchRadiusKm}
            onChange={onChangeSearchRadius}
            testIDPrefix="radius"
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

function SettingRow({
  label,
  children,
  stacked = false,
}: {
  label: string;
  children: React.ReactNode;
  stacked?: boolean;
}) {
  const { colors } = useTheme();
  if (stacked) {
    return (
      <View style={{ marginBottom: spacing.lg }}>
        <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.sm }]}>{label}</Text>
        {children}
      </View>
    );
  }
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg }}>
      <Text style={[textStyles.body, { color: colors.textPrimary, flexShrink: 1 }]}>{label}</Text>
      {children}
    </View>
  );
}

const RADIUS_OPTIONS_KM = [10, 15, 25, 50] as const;

function OptionToggle<T extends string | number>({
  options,
  value,
  onChange,
  testIDPrefix,
}: {
  options: { label: string; value: T }[];
  value: T;
  onChange: (value: T) => void;
  testIDPrefix: string;
}) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm }}>
      {options.map(({ label, value: v }) => (
        <Text
          key={v}
          onPress={() => onChange(v)}
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
