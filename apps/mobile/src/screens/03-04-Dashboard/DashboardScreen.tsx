import React from 'react';
import { Image, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Bell, Plus } from 'lucide-react-native';
import { Screen, Card, Tag } from '../../components';
import { AndroidAppBar } from '../../navigation/AndroidAppBar';
import { FabAndroid } from '../../navigation/FabAndroid';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCents } from '../../utils/format';
import {
  mockFleetSummary,
  mockNextDue,
  mockUser,
  mockVehicles,
} from '../../mocks/mockData';

type Vehicle = (typeof mockVehicles)[number];

interface DashboardScreenProps {
  userName?: string;
  vehicles?: Vehicle[];
  nextDue?: typeof mockNextDue;
  fleetSummary?: typeof mockFleetSummary;
  onSelectVehicle?: (vehicleId: string) => void;
  onAddVehicle?: () => void;
  onBookNextDue?: () => void;
  onOpenNotifications?: () => void;
}

export function DashboardScreen({
  userName = mockUser.fullName,
  vehicles = mockVehicles,
  nextDue = mockNextDue,
  fleetSummary = mockFleetSummary,
  onSelectVehicle = () => {},
  onAddVehicle = () => {},
  onBookNextDue = () => {},
  onOpenNotifications = () => {},
}: DashboardScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const isAndroid = Platform.OS === 'android';

  return (
    <View style={{ flex: 1 }}>
      {isAndroid ? (
        <AndroidAppBar
          title={t('dashboard.title')}
          onMenuPress={() => {}}
          onNotificationsPress={onOpenNotifications}
        />
      ) : null}
      <Screen edges={isAndroid ? ['bottom'] : ['top', 'bottom']}>
        {!isAndroid ? (
          <View style={styles.iosHeaderRow}>
            <View>
              <Text style={[textStyles.sectionLabel, { color: colors.textTertiary }]}>
                {t('dashboard.greeting', { name: userName }).toUpperCase()}
              </Text>
              <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>
                {t('dashboard.title')}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing.lg }}>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.notifications')}
                testID="open-notifications"
                onPress={onOpenNotifications}
                hitSlop={12}
              >
                <Bell size={20} strokeWidth={1.5} color={colors.textPrimary} />
              </TouchableOpacity>
              <TouchableOpacity
                accessibilityRole="button"
                accessibilityLabel={t('dashboard.addVehicle')}
                testID="add-vehicle-inline"
                onPress={onAddVehicle}
                hitSlop={12}
              >
                <Plus size={22} strokeWidth={1.5} color={colors.accentOnBackground} />
              </TouchableOpacity>
            </View>
          </View>
        ) : null}

        <TouchableOpacity
          accessibilityRole="button"
          testID="next-due-panel"
          onPress={onBookNextDue}
          activeOpacity={0.85}
        >
          <Card accentPanel>
            <Text style={[textStyles.sectionLabel, { color: colors.accentPanelMark, marginBottom: spacing.xs }]}>
              {t('dashboard.nextDue')}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center' }}>
              <Text style={[textStyles.cardTitle, { color: '#ffffff', flex: 1, fontSize: 20 }]}>
                {nextDue.taskName} · {nextDue.vehicleLabel} · dans {nextDue.daysUntilDue} jours
              </Text>
              <Text
                style={[
                  textStyles.button,
                  { color: colors.accentPanelMark, fontSize: 13, flexShrink: 0, marginLeft: spacing.md },
                ]}
              >
                {t('dashboard.book')} ›
              </Text>
            </View>
          </Card>
        </TouchableOpacity>

        {vehicles.map((vehicle) => (
          <TouchableOpacity
            key={vehicle.id}
            accessibilityRole="button"
            testID={`vehicle-card-${vehicle.id}`}
            onPress={() => onSelectVehicle(vehicle.id)}
            activeOpacity={0.85}
          >
            <Card>
              <View style={{ flexDirection: 'row', gap: spacing.lg }}>
                {vehicle.photoUrl ? (
                  <Image source={{ uri: vehicle.photoUrl }} style={styles.vehiclePhoto} />
                ) : (
                  <View style={[styles.vehiclePhoto, { borderColor: colors.hairlines[2], borderWidth: 1 }]} />
                )}
                <View style={{ flex: 1 }}>
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
                    <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>
                      {vehicle.make} {vehicle.model} {vehicle.year}
                    </Text>
                    <Text style={[textStyles.body, { color: colors.textSecondary }]}>
                      {vehicle.odometerKm.toLocaleString('fr-CA')} km
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', marginBottom: vehicle.progressRatio != null ? spacing.md : 0 }}>
                    <Tag
                      label={vehicle.statusLabel}
                      tone={vehicle.isOverdue ? 'warning' : vehicle.tasksCount > 0 ? 'accent' : 'neutral'}
                    />
                    {vehicle.tasksCount > 0 ? (
                      <Tag label={t('dashboard.tasksCount', { count: vehicle.tasksCount })} />
                    ) : null}
                  </View>
                  {vehicle.progressRatio != null ? (
                    <View style={{ height: 4, backgroundColor: colors.hairlines[3] }}>
                      <View
                        testID={`vehicle-progress-${vehicle.id}`}
                        style={{
                          width: `${Math.round(vehicle.progressRatio * 100)}%`,
                          height: 4,
                          backgroundColor: colors.accent,
                        }}
                      />
                    </View>
                  ) : null}
                </View>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        <Card>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <SummaryStat label={t('dashboard.vehiclesCount')} value={String(fleetSummary.vehiclesCount)} />
            <SummaryStat label={t('dashboard.upcoming30d')} value={String(fleetSummary.upcoming30d)} />
            <SummaryStat
              label={t('dashboard.costThisYear', { year: new Date().getFullYear() })}
              value={formatCents(fleetSummary.costThisYearCents)}
            />
          </View>
        </Card>
      </Screen>
      <FabAndroid onPress={onAddVehicle} testID="fab-add-vehicle" label={t('dashboard.addVehicle')} />
    </View>
  );
}

function SummaryStat({ label, value }: { label: string; value: string }) {
  const { colors } = useTheme();
  return (
    <View>
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
        {label}
      </Text>
      <Text style={[textStyles.featureNumber, { color: colors.textPrimary }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  iosHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xxl,
  },
  vehiclePhoto: {
    width: 60,
    height: 60,
  },
});
