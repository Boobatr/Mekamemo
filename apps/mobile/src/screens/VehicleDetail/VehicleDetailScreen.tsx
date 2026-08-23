import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, ChevronRight, Gauge, History } from 'lucide-react-native';
import { Screen, ScreenHeader, Card } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

interface VehicleDetailScreenProps {
  vehicleLabel?: string;
  odometerKm?: number;
  onReportBreakdown?: () => void;
  onUpdateMileage?: () => void;
  onOpenHistory?: () => void;
  onBack?: () => void;
}

/** Vehicle action hub — not part of the original 15-screen mockup, added so
 * "report a breakdown" / "update mileage" / "history" are three equal, top-level
 * entry points reached from the dashboard, rather than links buried in History. */
export function VehicleDetailScreen({
  vehicleLabel = '',
  odometerKm,
  onReportBreakdown = () => {},
  onUpdateMileage = () => {},
  onOpenHistory = () => {},
  onBack,
}: VehicleDetailScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow={odometerKm != null ? `${odometerKm.toLocaleString('fr-CA')} km` : undefined}
        title={vehicleLabel}
        onBack={onBack}
      />

      <TouchableOpacity
        accessibilityRole="button"
        testID="vehicle-detail-report-breakdown"
        onPress={onReportBreakdown}
        activeOpacity={0.85}
      >
        <Card accentPanel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <AlertTriangle size={26} strokeWidth={1.5} color="#ffffff" />
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.cardTitle, { color: '#ffffff', fontSize: 19 }]}>
                {t('vehicleDetail.reportBreakdown')}
              </Text>
              <Text style={[textStyles.bodySecondary, { color: colors.textOnAccentTint }]}>
                {t('vehicleDetail.reportBreakdownNote')}
              </Text>
            </View>
            <ChevronRight size={20} strokeWidth={1.5} color={colors.accentPanelMark} />
          </View>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        testID="vehicle-detail-update-mileage"
        onPress={onUpdateMileage}
        activeOpacity={0.85}
      >
        <Card>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
            <Gauge size={24} strokeWidth={1.5} color={colors.accentOnBackground} />
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.cardTitle, { color: colors.textPrimary, fontSize: 17 }]}>
                {t('vehicleDetail.updateMileage')}
              </Text>
              <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
                {t('vehicleDetail.updateMileageNote')}
              </Text>
            </View>
            <ChevronRight size={18} strokeWidth={1.5} color={colors.textMuted} />
          </View>
        </Card>
      </TouchableOpacity>

      <TouchableOpacity
        accessibilityRole="button"
        testID="vehicle-detail-history"
        onPress={onOpenHistory}
        activeOpacity={0.85}
        style={{
          flexDirection: 'row',
          alignItems: 'center',
          gap: spacing.md,
          paddingVertical: spacing.lg,
          borderTopWidth: 1,
          borderTopColor: colors.hairlines[3],
        }}
      >
        <History size={18} strokeWidth={1.5} color={colors.textSecondary} />
        <Text style={[textStyles.body, { color: colors.textSecondary, flex: 1 }]}>
          {t('vehicleDetail.history')}
        </Text>
        <ChevronRight size={16} strokeWidth={1.5} color={colors.textMuted} />
      </TouchableOpacity>
    </Screen>
  );
}
