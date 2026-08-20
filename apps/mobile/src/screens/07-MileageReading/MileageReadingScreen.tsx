import React, { useMemo, useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera } from 'lucide-react-native';
import { Screen, Card, Field, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockMileagePace, mockVehicles } from '../../mocks/mockData';

interface MileageReadingScreenProps {
  vehicleLabel?: string;
  pace?: typeof mockMileagePace;
  /** Mocked odometer-photo OCR — Task #7 replaces this with a real capture + Claude-vision read. */
  onPhotographOdometer?: () => Promise<number | null>;
  onSave?: (input: { valueKm: number; source: 'manual' | 'ocr' | 'estimate_tap'; autoTrackEnabled: boolean }) => void;
  onBack?: () => void;
}

export function MileageReadingScreen({
  vehicleLabel = `${mockVehicles[0].make} ${mockVehicles[0].model} ${mockVehicles[0].year}`,
  pace = mockMileagePace,
  onPhotographOdometer = async () => null,
  onSave = () => {},
  onBack,
}: MileageReadingScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [selected, setSelected] = useState<number | 'other' | null>(null);
  const [manualValue, setManualValue] = useState('');
  const [autoTrack, setAutoTrack] = useState(false);

  const maxBar = useMemo(() => Math.max(...pace.monthlyBars.map((b) => b.km), 1), [pace]);

  async function handlePhotograph() {
    const value = await onPhotographOdometer();
    if (value != null) {
      setSelected('other');
      setManualValue(String(value));
    }
  }

  function handleSave() {
    if (selected === 'other') {
      const value = parseInt(manualValue, 10);
      if (!Number.isNaN(value)) onSave({ valueKm: value, source: 'manual', autoTrackEnabled: autoTrack });
      return;
    }
    if (typeof selected === 'number') {
      onSave({ valueKm: selected, source: 'estimate_tap', autoTrackEnabled: autoTrack });
    }
  }

  const canSave = selected === 'other' ? manualValue.trim().length > 0 : typeof selected === 'number';

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
      <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>{t('mileage.title')}</Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
        {vehicleLabel}
      </Text>

      <Card>
        <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.lg }]}>
          {t('mileage.prompt')}
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.md }}>
          {pace.suggestedReadings.map((value) => (
            <EstimateChip
              key={value}
              label={value.toLocaleString('fr-CA')}
              selected={selected === value}
              onPress={() => setSelected(value)}
              testID={`estimate-${value}`}
            />
          ))}
          <EstimateChip
            label={t('mileage.other')}
            selected={selected === 'other'}
            onPress={() => setSelected('other')}
            testID="estimate-other"
          />
        </View>
        {selected === 'other' ? (
          <Field
            label={t('onboarding.vehicle.odometer')}
            value={manualValue}
            onChangeText={setManualValue}
            keyboardType="numeric"
            testID="input-manual-odometer"
          />
        ) : null}
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
          {t('mileage.estimateNote')}
        </Text>
      </Card>

      <TouchableOpacity
        accessibilityRole="button"
        testID="photograph-odometer"
        onPress={handlePhotograph}
        style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xxl }}
      >
        <Camera size={20} strokeWidth={1.5} color={colors.accentOnBackground} />
        <View style={{ marginLeft: spacing.md }}>
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>{t('mileage.photoOdometer')}</Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
            {t('mileage.photoOdometerNote')}
          </Text>
        </View>
      </TouchableOpacity>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
        {t('mileage.pace')}
      </Text>
      <Text style={[textStyles.featureNumber, { color: colors.textPrimary }]}>
        {pace.avgKmPerMonth.toLocaleString('fr-CA')}{' '}
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>
          {t('mileage.paceSuffix', { count: pace.readingsCount })}
        </Text>
      </Text>

      <View style={{ flexDirection: 'row', alignItems: 'flex-end', height: 60, marginVertical: spacing.xl }}>
        {pace.monthlyBars.map((bar) => (
          <View key={bar.label} style={{ flex: 1, alignItems: 'center' }}>
            <View
              testID={`bar-${bar.label}`}
              style={{
                width: 14,
                height: Math.max((bar.km / maxBar) * 44, 2),
                backgroundColor: bar.km > 0 ? colors.accentTints[1] : colors.hairlines[3],
              }}
            />
            <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, fontSize: 9, marginTop: spacing.xs }]}>
              {bar.label}
            </Text>
          </View>
        ))}
      </View>

      <Card accentPanel testID="projection-panel">
        <Text style={[textStyles.sectionLabel, { color: colors.accentPanelMark, marginBottom: spacing.xs }]}>
          {t('mileage.projectionTitle')}
        </Text>
        <Text style={[textStyles.cardTitle, { color: '#ffffff', marginBottom: spacing.sm }]}>
          {t('mileage.projectionLine', {
            task: pace.projection.taskName,
            km: pace.projection.dueKm.toLocaleString('fr-CA'),
            date: pace.projection.dueDateLabel,
          })}
        </Text>
        <Text style={[textStyles.bodySecondary, { color: colors.textOnAccentTint }]}>
          {t('mileage.projectionNote')}
        </Text>
      </Card>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginVertical: spacing.xl }}>
        <View style={{ flexShrink: 1 }}>
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>{t('mileage.autoTrackToggle')}</Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{t('mileage.autoTrackNote')}</Text>
        </View>
        <Switch value={autoTrack} onValueChange={setAutoTrack} testID="auto-track-switch" />
      </View>

      <Button label={t('mileage.save')} disabled={!canSave} testID="save-reading-button" onPress={handleSave} />
    </Screen>
  );
}

function EstimateChip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      testID={testID}
      style={[
        textStyles.button,
        {
          color: selected ? '#ffffff' : colors.textPrimary,
          backgroundColor: selected ? colors.accent : colors.hairlines[3],
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          marginRight: spacing.md,
          marginBottom: spacing.md,
          fontSize: 15,
          textTransform: 'none',
        },
      ]}
    >
      {label}
    </Text>
  );
}
