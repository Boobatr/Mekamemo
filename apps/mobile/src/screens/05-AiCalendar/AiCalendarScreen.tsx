import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Tag, ScreenHeader } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { formatCentsRange } from '../../utils/format';
import { mockMaintenanceTasks, mockVehicles } from '../../mocks/mockData';

interface AiCalendarScreenProps {
  vehicleLabel?: string;
  odometerKm?: number;
  tasks?: typeof mockMaintenanceTasks;
  onOpenTask?: (taskId: string) => void;
  onBook?: () => void;
}

export function AiCalendarScreen({
  vehicleLabel = `${mockVehicles[0].make.toUpperCase()} ${mockVehicles[0].model.toUpperCase()} ${mockVehicles[0].year}`,
  odometerKm = mockVehicles[0].odometerKm,
  tasks = mockMaintenanceTasks,
  onOpenTask = () => {},
  onBook = () => {},
}: AiCalendarScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Screen>
      <ScreenHeader
        eyebrow={`${vehicleLabel} · ${odometerKm.toLocaleString('fr-CA')} KM`}
        title={t('calendar.title')}
        trailing={<Tag label={t('calendar.generatedByAi')} tone="accent" />}
      />
      <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginBottom: spacing.xxl }]}>
        {t('calendar.source', { source: "guide d'entretien Toyota 2021", date: '2 août' })}
      </Text>

      {tasks.map((task) => (
        <TouchableOpacity
          key={task.id}
          accessibilityRole="button"
          testID={`task-row-${task.id}`}
          onPress={() => onOpenTask(task.id)}
          activeOpacity={0.85}
        >
          <Card>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
              <Text style={[textStyles.cardTitle, { color: colors.textPrimary, flexShrink: 1 }]}>
                {task.name}
              </Text>
              <Text style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 13 }]}>
                {task.dueDateLabel}
              </Text>
            </View>
            <Text style={[textStyles.bodySecondary, { color: colors.textSecondary, marginTop: spacing.sm }]}>
              {describeTask(task)}
            </Text>
          </Card>
        </TouchableOpacity>
      ))}

      <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginBottom: spacing.xxl }]}>
        Un climat froid et un usage mixte ont été pris en compte.
      </Text>

      <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
        <Text style={[textStyles.button, { color: colors.textSecondary, fontSize: 14 }]}>
          {t('calendar.details')}
        </Text>
        <Text style={[textStyles.button, { color: colors.textSecondary, fontSize: 14 }]}>
          {t('calendar.modify')}
        </Text>
        <Text
          onPress={onBook}
          testID="calendar-book-button"
          style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 14 }]}
        >
          {t('calendar.book')}
        </Text>
      </View>
    </Screen>
  );
}

function describeTask(task: (typeof mockMaintenanceTasks)[number]): string {
  const parts: string[] = [];
  if (task.groupedWith) parts.push(`Groupée avec ${task.groupedWith}`);
  else if (task.intervalKm && task.intervalMonths) {
    parts.push(`À ${task.intervalKm.toLocaleString('fr-CA')} km ou ${task.intervalMonths} mois`);
  } else if (task.intervalKm) {
    parts.push(`À ${task.intervalKm.toLocaleString('fr-CA')} km`);
  }
  if (task.inspectionIncluded) parts.push('inspection incluse');
  else if (task.costMinCents != null && task.costMaxCents != null) {
    parts.push(`${formatCentsRange(task.costMinCents, task.costMaxCents)} estimé`);
  }
  return parts.join(' · ');
}
