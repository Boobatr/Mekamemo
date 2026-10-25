import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCents } from '../../utils/format';
import { mockHistory } from '../../mocks/mockData';

interface HistoryScreenProps {
  history?: typeof mockHistory;
  onExport?: () => void;
  onOpenResaleDossier?: () => void;
  onBack?: () => void;
}

export function HistoryScreen({
  history = mockHistory,
  onExport = () => {},
  onOpenResaleDossier = () => {},
  onBack,
}: HistoryScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow={history.vehicleLabel}
        title={t('history.title')}
        onBack={onBack}
        trailing={
          <Text onPress={onExport} testID="export-history-button" style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 13 }]}>
            {t('history.export')}
          </Text>
        }
      />

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
              {t('history.totalThisYear', { year: history.entriesByYear[0]?.year })}
            </Text>
            <Text style={[textStyles.featureNumber, { color: colors.textPrimary }]}>
              {formatCents(history.totalThisYearCents)}
            </Text>
          </View>
          <View>
            <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
              {t('history.interventions')}
            </Text>
            <Text style={[textStyles.featureNumber, { color: colors.textPrimary }]}>
              {history.interventionsCount}
            </Text>
          </View>
        </View>
      </Card>

      {history.entriesByYear.map((yearGroup) => (
        <View key={yearGroup.year} style={{ marginBottom: spacing.xl }}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
            {yearGroup.year}
          </Text>
          {yearGroup.entries.map((entry) => (
            <Card key={entry.id} testID={`history-entry-${entry.id}`}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={[textStyles.cardTitle, { color: colors.textPrimary, flexShrink: 1 }]}>
                  {entry.name}
                </Text>
                <Text style={[textStyles.body, { color: colors.textPrimary }]}>
                  {formatCents(entry.costCents)}
                </Text>
              </View>
              <Text style={[textStyles.bodySecondary, { color: colors.textSecondary, marginTop: spacing.xs }]}>
                {entry.dateLabel} · {entry.mileageKm.toLocaleString('fr-CA')} km
                {entry.garageName ? ` · ${entry.garageName}` : ''}
              </Text>
            </Card>
          ))}
        </View>
      ))}

      <View
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderWidth: 1,
          borderColor: colors.hairlines[2],
          padding: spacing.lg,
          gap: spacing.md,
        }}
      >
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted, flex: 1 }]}>
          {t('history.resaleNote')}
        </Text>
        <Text
          onPress={onOpenResaleDossier}
          testID="open-resale-dossier-button"
          accessibilityRole="button"
          style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 12, flexShrink: 0 }]}
        >
          {t('history.open')}
        </Text>
      </View>
    </Screen>
  );
}
