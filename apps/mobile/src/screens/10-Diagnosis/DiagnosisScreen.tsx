import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Tag, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCentsRange } from '../../utils/format';
import { mockDiagnosis } from '../../mocks/mockData';

export interface DiagnosisData {
  id: string;
  analyzedInSeconds: number;
  primaryCause: string;
  confidence: 'low' | 'medium' | 'high';
  explanation: string;
  secondaryCauses: { cause: string; confidence: 'low' | 'medium' | 'high' }[];
  recommendedDelay: string;
  costMinCents: number;
  costMaxCents: number;
  safetyNote: string;
  disclaimer: string;
  availableGarages: { id: string; name: string; distanceKm: number; slotLabel: string }[];
}

interface DiagnosisScreenProps {
  diagnosis?: DiagnosisData;
  onRequestQuotes?: () => void;
  onAddToCalendar?: () => void;
  onBack?: () => void;
}

export function DiagnosisScreen({
  diagnosis = mockDiagnosis,
  onRequestQuotes = () => {},
  onAddToCalendar = () => {},
  onBack,
}: DiagnosisScreenProps) {
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
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xxl }}>
        <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>{t('diagnosis.title')}</Text>
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
          {t('diagnosis.analyzedIn', { seconds: diagnosis.analyzedInSeconds })}
        </Text>
      </View>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.sm }}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary }]}>
            {t('diagnosis.mostLikelyCause')}
          </Text>
          <Tag label={t(`diagnosis.confidence.${diagnosis.confidence}`).toUpperCase()} tone="accent" />
        </View>
        <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          {diagnosis.primaryCause}
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>{diagnosis.explanation}</Text>
      </Card>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('diagnosis.otherLeads')}
      </Text>
      {diagnosis.secondaryCauses.map((cause, index) => (
        <View
          key={cause.cause}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            paddingVertical: spacing.md,
            borderBottomWidth: index < diagnosis.secondaryCauses.length - 1 ? 1 : 0,
            borderBottomColor: colors.hairlines[3],
          }}
        >
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>{cause.cause}</Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textTertiary }]}>
            {t(`diagnosis.confidence.${cause.confidence}`)}
          </Text>
        </View>
      ))}

      <View style={{ flexDirection: 'row', marginVertical: spacing.xxl }}>
        <View style={{ flex: 1, borderWidth: 1, borderColor: colors.hairlines[2], padding: spacing.lg, marginRight: spacing.md }}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
            {t('diagnosis.recommendedDelay')}
          </Text>
          <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>{diagnosis.recommendedDelay}</Text>
        </View>
        <View style={{ flex: 1, borderWidth: 1, borderColor: colors.hairlines[2], padding: spacing.lg }}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
            {t('diagnosis.estimatedCost')}
          </Text>
          <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>
            {formatCentsRange(diagnosis.costMinCents, diagnosis.costMaxCents)}
          </Text>
        </View>
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: colors.hairlines[2],
          backgroundColor: colors.accentTints[4],
          padding: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
          {diagnosis.safetyNote}
        </Text>
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]} testID="diagnosis-disclaimer">
          {diagnosis.disclaimer}
        </Text>
      </View>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('diagnosis.availableGarages', { count: diagnosis.availableGarages.length })}
      </Text>
      {diagnosis.availableGarages.map((garage) => (
        <View key={garage.id} style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>
            {garage.name} · {garage.distanceKm} km
          </Text>
          <Text style={[textStyles.bodySecondary, { color: colors.accentOnBackground }]}>{garage.slotLabel}</Text>
        </View>
      ))}

      <Button label={t('diagnosis.requestQuotes')} testID="request-quotes-button" onPress={onRequestQuotes} />
      <Button
        label={t('diagnosis.addToCalendar')}
        variant="secondary"
        testID="add-to-calendar-button"
        onPress={onAddToCalendar}
      />
    </Screen>
  );
}
