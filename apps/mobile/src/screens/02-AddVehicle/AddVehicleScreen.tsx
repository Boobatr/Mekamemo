import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { ScanLine } from 'lucide-react-native';
import { Screen, Card, Field, Button, Tag } from '../../components';
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

interface AddVehicleScreenProps {
  /** Mocked VIN decode call — Task #5 replaces this with the real NHTSA vPIC + fallback service. */
  decodeVin: (vin: string) => Promise<DecodedVehicle | null>;
  onGenerateCalendar: (input: {
    vin: string;
    decoded: DecodedVehicle;
    odometerKm: number;
  }) => void;
}

export function AddVehicleScreen({ decodeVin, onGenerateCalendar }: AddVehicleScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [vin, setVin] = useState('');
  const [decoded, setDecoded] = useState<DecodedVehicle | null>(null);
  const [decoding, setDecoding] = useState(false);
  const [odometerKm, setOdometerKm] = useState('64200');

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

  return (
    <Screen>
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('onboarding.step', { current: 2, total: 3 })}
      </Text>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
        {t('onboarding.vehicle.title')}
      </Text>

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

      <Button
        label={t('onboarding.vehicle.generateCalendar')}
        disabled={!decoded}
        testID="generate-calendar-button"
        onPress={() => {
          if (!decoded) return;
          onGenerateCalendar({ vin, decoded, odometerKm: parseInt(odometerKm, 10) || 0 });
        }}
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
