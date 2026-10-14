import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScanLine } from 'lucide-react-native';
import { Screen, Card, Field, Button, Tag, StepProgress } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface DecodedVehicle {
  make: string;
  model: string;
  year: number;
  engine: string | null;
  trim?: string | null;
}

interface GenerateCalendarInput {
  vin?: string;
  make: string;
  model: string;
  year: number;
  engine?: string;
  trim?: string;
  odometerKm: number;
}

interface AddVehicleScreenProps {
  /** Mocked VIN decode call — Task #5 replaces this with the real NHTSA vPIC + fallback service. */
  decodeVin: (vin: string) => Promise<DecodedVehicle | null>;
  onGenerateCalendar: (input: GenerateCalendarInput) => void;
  onBack?: () => void;
}

export function AddVehicleScreen({ decodeVin, onGenerateCalendar, onBack }: AddVehicleScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [entryMode, setEntryMode] = useState<'vin' | 'manual'>('vin');

  const [vin, setVin] = useState('');
  const [decoded, setDecoded] = useState<DecodedVehicle | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [odometerKm, setOdometerKm] = useState('64200');

  const [manualMake, setManualMake] = useState('');
  const [manualModel, setManualModel] = useState('');
  const [manualYear, setManualYear] = useState('');
  const [manualEngine, setManualEngine] = useState('');

  async function handleVinChange(value: string) {
    setVin(value);
    setDecoded(null);
    if (value.length === 17) {
      setDecoding(true);
      const result = await decodeVin(value);
      setDecoding(false);
      setDecoded(result);
    }
  }

  const manualYearValue = parseInt(manualYear, 10);
  const manualIsValid =
    manualMake.trim().length > 0 &&
    manualModel.trim().length > 0 &&
    Number.isInteger(manualYearValue) &&
    manualYearValue >= 1980;

  const canGenerate = entryMode === 'vin' ? Boolean(decoded) : manualIsValid;

  function handleGenerateCalendar() {
    if (!canGenerate) return;
    const odometer = parseInt(odometerKm, 10) || 0;
    if (entryMode === 'vin' && decoded) {
      onGenerateCalendar({
        vin,
        make: decoded.make,
        model: decoded.model,
        year: decoded.year,
        engine: decoded.engine ?? undefined,
        trim: decoded.trim ?? undefined,
        odometerKm: odometer,
      });
    } else {
      onGenerateCalendar({
        make: manualMake.trim(),
        model: manualModel.trim(),
        year: manualYearValue,
        engine: manualEngine.trim() || undefined,
        odometerKm: odometer,
      });
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
      ) : (
        <>
          <StepProgress current={2} total={3} />
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
            {t('onboarding.step', { current: 2, total: 3 })}
          </Text>
        </>
      )}
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
        {t('onboarding.vehicle.title')}
      </Text>

      {entryMode === 'vin' ? (
        <>
          <Card>
            <Field
              label={t('onboarding.vehicle.vin')}
              value={vin}
              onChangeText={handleVinChange}
              autoCapitalize="characters"
              maxLength={17}
              testID="input-vin"
            />
            <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.md }}>
              <ScanLine size={16} strokeWidth={1.5} color={colors.accentOnBackground} />
              <Text
                style={[
                  textStyles.button,
                  { color: colors.accentOnBackground, fontSize: 13, marginLeft: spacing.sm },
                ]}
              >
                {t('onboarding.vehicle.scan')}
              </Text>
            </View>
            <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
              {t('onboarding.vehicle.altEntry')}
            </Text>
          </Card>

          <Text
            onPress={() => setEntryMode('manual')}
            testID="switch-to-manual-entry"
            accessibilityRole="button"
            style={[
              textStyles.button,
              { color: colors.accentOnBackground, fontSize: 13, marginBottom: spacing.xl },
            ]}
          >
            {t('onboarding.vehicle.noVinLink')}
          </Text>

          {decoding ? (
            <Text style={[textStyles.body, { color: colors.textSecondary }]}>{t('common.loading')}</Text>
          ) : null}

          {decoded ? (
            <Card testID="decoded-card">
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.lg }}>
                <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>
                  {t('onboarding.vehicle.decodedTitle')}
                </Text>
                <Tag label={t('onboarding.vehicle.decodedBadge')} tone="accent" />
              </View>
              <ReadOnlyRow label={t('onboarding.vehicle.make')} value={decoded.make} />
              <ReadOnlyRow label={t('onboarding.vehicle.model')} value={decoded.model} />
              <ReadOnlyRow label={t('onboarding.vehicle.year')} value={String(decoded.year)} />
              <ReadOnlyRow label={t('onboarding.vehicle.engine')} value={decoded.engine ?? '—'} />
              <Field
                label={t('onboarding.vehicle.odometer')}
                value={odometerKm}
                onChangeText={setOdometerKm}
                keyboardType="numeric"
                testID="input-odometer"
              />
            </Card>
          ) : null}
        </>
      ) : (
        <>
          <Card testID="manual-entry-card">
            <Field
              label={t('onboarding.vehicle.make')}
              value={manualMake}
              onChangeText={setManualMake}
              testID="input-make"
            />
            <Field
              label={t('onboarding.vehicle.model')}
              value={manualModel}
              onChangeText={setManualModel}
              testID="input-model"
            />
            <Field
              label={t('onboarding.vehicle.year')}
              value={manualYear}
              onChangeText={setManualYear}
              keyboardType="numeric"
              testID="input-year"
            />
            <Field
              label={t('onboarding.vehicle.engineOptional')}
              value={manualEngine}
              onChangeText={setManualEngine}
              testID="input-engine"
            />
            <Field
              label={t('onboarding.vehicle.odometer')}
              value={odometerKm}
              onChangeText={setOdometerKm}
              keyboardType="numeric"
              testID="input-odometer"
            />
          </Card>

          <Text
            onPress={() => setEntryMode('vin')}
            testID="switch-to-vin-entry"
            accessibilityRole="button"
            style={[
              textStyles.button,
              { color: colors.accentOnBackground, fontSize: 13, marginBottom: spacing.xl },
            ]}
          >
            {t('onboarding.vehicle.useVinLink')}
          </Text>

          <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginBottom: spacing.xl }]}>
            {t('onboarding.vehicle.manualEntryNote')}
          </Text>
        </>
      )}

      <Button
        label={t('onboarding.vehicle.generateCalendar')}
        disabled={!canGenerate}
        testID="generate-calendar-button"
        onPress={handleGenerateCalendar}
      />
    </Screen>
  );
}

function ReadOnlyRow({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
        {label}
      </Text>
      <Text style={[textStyles.body, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}
