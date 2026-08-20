import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockNotifications } from '../../mocks/mockData';

export interface NotificationItem {
  id: string;
  type: 'mileage_prompt' | 'maintenance_reminder_7d' | 'maintenance_reminder_due' | 'garage_response';
  dateLabel: string;
  title: string;
  body: string;
  actions: string[];
}

interface NotificationsScreenProps {
  notifications?: NotificationItem[];
  reminderDelayDays?: number[];
  onAction?: (notificationId: string, action: string) => void;
  onBack?: () => void;
}

export function NotificationsScreen({
  notifications = mockNotifications,
  reminderDelayDays = [30, 14, 7, 1],
  onAction = () => {},
  onBack,
}: NotificationsScreenProps) {
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
      <Text style={[textStyles.screenTitle, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
        {t('notifications.title')}
      </Text>

      {notifications.map((notif) => (
        <Card key={notif.id} testID={`notification-${notif.id}`}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
            {notif.dateLabel}
          </Text>
          <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            {notif.title}
          </Text>
          <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
            {notif.body}
          </Text>
          {notif.actions.length > 0 ? (
            <View style={{ flexDirection: 'row' }}>
              {notif.actions.map((action) => (
                <TouchableOpacity
                  key={action}
                  accessibilityRole="button"
                  testID={`notification-${notif.id}-${action.toLowerCase()}`}
                  onPress={() => onAction(notif.id, action)}
                  style={{ marginRight: spacing.xl }}
                >
                  <Text style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 13 }]}>
                    {action}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          ) : null}
        </Card>
      ))}

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('notifications.reminderDelays')}
      </Text>
      <View style={{ flexDirection: 'row' }}>
        {reminderDelayDays.map((days) => (
          <Text
            key={days}
            style={[
              textStyles.button,
              {
                color: colors.textSecondary,
                borderWidth: 1,
                borderColor: colors.hairlines[1],
                paddingHorizontal: spacing.xl,
                paddingVertical: spacing.sm,
                marginRight: spacing.md,
                fontSize: 13,
              },
            ]}
          >
            {days} j
          </Text>
        ))}
      </View>
    </Screen>
  );
}
