import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Tag, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCentsRange } from '../../utils/format';
import { mockDiagnosis } from '../../mocks/mockData';

interface DiagnosisScreenProps {
  diagnosis?: typeof mockDiagnosis;
  onRequestQuotes?: () => void;
  onAddToCalendar?: () => void;
}

export function DiagnosisScreen({
  diagnosis = mockDiagnosis,
  onRequestQuotes = () => {},
  onAddToCalendar = () => {},
}: DiagnosisScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
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
      {diagnosis.secondaryCauses.map((cause) => (
        <View
          key={cause.cause}
          style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}
        >
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>{cause.cause}</Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textTertiary }]}>
            {t(`diagnosis.confidence.${cause.confidence}`)}
          </Text>
        </View>
      ))}

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginVertical: spacing.xxl }}>
        <View>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
            {t('diagnosis.recommendedDelay')}
          </Text>
          <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>{diagnosis.recommendedDelay}</Text>
        </View>
        <View>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
            {t('diagnosis.estimatedCost')}
          </Text>
          <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>
            {formatCentsRange(diagnosis.costMinCents, diagnosis.costMaxCents)}
          </Text>
        </View>
      </View>

      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.sm }]}>
        {diagnosis.safetyNote}
      </Text>
      <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginBottom: spacing.xxl }]} testID="diagnosis-disclaimer">
        {diagnosis.disclaimer}
      </Text>

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
