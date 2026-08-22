import React, { useState } from 'react';
import { Switch, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Tag, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { TaskPriority } from '@mekamemo/shared-types';

export interface EditableTask {
  id: string;
  name: string;
  editedByUser: boolean;
  isRecurring: boolean;
  manufacturerIntervalKm: number;
  manufacturerIntervalMonths: number;
  intervalKm: number;
  intervalMonths: number;
  priority: TaskPriority;
  nextDueLabel: string;
  notesForGarage: string;
  groupWithTireRotation: boolean;
}

interface EditTaskScreenProps {
  task: EditableTask;
  onBack?: () => void;
  onDelete?: (taskId: string) => void;
  onSave?: (task: EditableTask) => void;
}

const PRIORITIES: TaskPriority[] = ['low', 'normal', 'critical'];

export function EditTaskScreen({ task, onBack = () => {}, onDelete = () => {}, onSave = () => {} }: EditTaskScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [intervalKm, setIntervalKm] = useState(`${task.intervalKm} ${t('common.km')}`);
  const [intervalMonths, setIntervalMonths] = useState(`${task.intervalMonths} ${t('common.months')}`);
  const [priority, setPriority] = useState<TaskPriority>(task.priority);
  const [notes, setNotes] = useState(task.notesForGarage);
  const [groupWithTireRotation, setGroupWithTireRotation] = useState(task.groupWithTireRotation);

  return (
    <Screen>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.xl }}>
        <Text
          onPress={onBack}
          testID="back-to-calendar"
          style={[textStyles.button, { color: colors.textSecondary, fontSize: 13 }]}
        >
          ‹ {t('calendar.title').toUpperCase()}
        </Text>
        <Text
          onPress={() => onDelete(task.id)}
          testID="delete-task-button"
          style={[textStyles.button, { color: '#e5484d', fontSize: 13 }]}
        >
          {t('common.delete').toUpperCase()}
        </Text>
      </View>

      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        {task.name}
      </Text>
      <View style={{ flexDirection: 'row', marginBottom: spacing.xl }}>
        {task.editedByUser ? <Tag label={t('taskEdit.modifiedByYou')} tone="accent" /> : null}
        {task.isRecurring ? <Tag label={t('taskEdit.recurring')} /> : null}
      </View>

      <View
        style={{
          borderLeftWidth: 2,
          borderLeftColor: colors.accent,
          paddingLeft: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <Text style={[textStyles.bodySecondary, { color: colors.textSecondary }]}>
          {t('taskEdit.manufacturerNote', {
            km: task.manufacturerIntervalKm.toLocaleString('fr-CA'),
            months: task.manufacturerIntervalMonths,
          })}
        </Text>
      </View>

      <Card>
        <Field
          label={t('taskEdit.intervalKm')}
          value={intervalKm}
          onChangeText={setIntervalKm}
          keyboardType="numeric"
          testID="input-interval-km"
        />
        <Field
          label={t('taskEdit.intervalMonths')}
          value={intervalMonths}
          onChangeText={setIntervalMonths}
          keyboardType="numeric"
          testID="input-interval-months"
        />

        <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
          {t('taskEdit.priority')}
        </Text>
        <View style={{ flexDirection: 'row', marginBottom: spacing.xl }}>
          {PRIORITIES.map((p) => (
            <PriorityChip
              key={p}
              label={t(`taskEdit.priority${p[0].toUpperCase()}${p.slice(1)}`)}
              selected={priority === p}
              onPress={() => setPriority(p)}
              testID={`priority-${p}`}
            />
          ))}
        </View>

        <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
          {t('taskEdit.nextDue')}
        </Text>
        <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.xl }]}>
          {task.nextDueLabel}
        </Text>

        <Field
          label={t('taskEdit.notesForGarage')}
          value={notes}
          onChangeText={setNotes}
          multiline
          testID="input-notes"
        />

        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
          <Text style={[textStyles.body, { color: colors.textSecondary, flexShrink: 1 }]}>
            {t('taskEdit.groupWith')}
          </Text>
          <Switch
            testID="group-with-tire-rotation"
            value={groupWithTireRotation}
            onValueChange={setGroupWithTireRotation}
          />
        </View>
      </Card>

      <Button
        label={t('common.save')}
        testID="save-task-button"
        onPress={() =>
          onSave({
            ...task,
            intervalKm: parseInt(intervalKm, 10) || task.intervalKm,
            intervalMonths: parseInt(intervalMonths, 10) || task.intervalMonths,
            priority,
            notesForGarage: notes,
            groupWithTireRotation,
          })
        }
      />
    </Screen>
  );
}

function PriorityChip({
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
          color: selected ? '#ffffff' : colors.textSecondary,
          backgroundColor: selected ? colors.accent : 'transparent',
          borderWidth: 1,
          borderColor: selected ? colors.accent : colors.hairlines[1],
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.sm,
          marginRight: spacing.md,
          fontSize: 12,
        },
      ]}
    >
      {label}
    </Text>
  );
}
