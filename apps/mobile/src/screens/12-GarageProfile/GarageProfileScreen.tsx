import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Tag, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { MockGarage, mockGarages } from '../../mocks/mockData';

type Garage = MockGarage;

interface GarageProfileScreenProps {
  garage?: Garage;
  onRequestAppointment?: () => void;
  onViewEmailBeforeSending?: () => void;
  onBack?: () => void;
}

export function GarageProfileScreen({
  garage = mockGarages[0],
  onRequestAppointment = () => {},
  onViewEmailBeforeSending = () => {},
  onBack,
}: GarageProfileScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

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
      <View
        testID="garage-photo-slot"
        style={{
          height: 150,
          borderWidth: 1,
          borderColor: colors.hairlines[2],
          backgroundColor: colors.fieldBackground,
          marginBottom: spacing.lg,
        }}
      />
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
        {garage.distanceKm > 0 ? `${garage.distanceKm} KM · ` : ''}
        {garage.neighbourhood.toUpperCase()}
      </Text>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
        {garage.name}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xxl }}>
        {garage.rating > 0 ? (
          <Tag label={`${garage.rating} ★ · ${garage.reviewCount} ${t('garageProfile.reviews')}`} tone="accent" />
        ) : null}
        {garage.certifiedCaa ? <Tag label={t('garageProfile.certified')} tone="accent" /> : null}
        {garage.openUntil ? <Tag label={`${t('garageProfile.open')} · ${garage.openUntil}`} /> : null}
      </View>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <StatCell
            label={t('garageProfile.price')}
            value={garage.priceCents ? `${(garage.priceCents / 100).toFixed(0)} $` : '—'}
            border={colors.hairlines[3]}
          />
          <StatCell
            label={t('garageProfile.wait')}
            value={garage.waitDays != null ? `${garage.waitDays} j` : '—'}
            border={colors.hairlines[3]}
          />
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.hairlines[3] }}>
          <StatCell
            label={t('garageProfile.commute')}
            value={garage.commuteMinutes != null ? `${garage.commuteMinutes} min` : '—'}
            border={colors.hairlines[3]}
          />
          <StatCell
            label={t('garageProfile.warranty')}
            value={garage.warrantyMonths != null ? `${garage.warrantyMonths} m` : '—'}
          />
        </View>
      </Card>
      <View style={{ marginBottom: spacing.xxl }} />

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('garageProfile.relevantServices')}
      </Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
        {garage.services?.join(' · ')}
      </Text>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary }]}>
            {t('garageProfile.contactMethod')}
          </Text>
          <Tag label={t('garageProfile.detectedByAi')} tone="accent" />
        </View>
        <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          {t('garageProfile.emailVerified')} — {garage.email}
        </Text>
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
          {t('garageProfile.voiceFallback')}
        </Text>
      </Card>

      <Button
        label={t('garageProfile.requestAppointment')}
        testID="request-appointment-button"
        onPress={onRequestAppointment}
      />
      <Button
        label={t('garageProfile.viewEmailBeforeSending')}
        variant="secondary"
        testID="view-email-button"
        onPress={onViewEmailBeforeSending}
      />
    </Screen>
  );
}

function StatCell({ label, value, border }: { label: string; value: string; border?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: spacing.lg,
        borderRightWidth: border ? 1 : 0,
        borderRightColor: border,
      }}
    >
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs, fontSize: 10 }]}>
        {label}
      </Text>
      <Text style={[textStyles.cardTitle, { color: colors.textPrimary, fontSize: 18 }]}>{value}</Text>
    </View>
  );
}
