import React from 'react';
import { useTranslation } from 'react-i18next';
import { NotificationsScreen } from './NotificationsScreen';
import { useMarkNotificationRead, useNotifications } from '../../hooks/useNotifications';

function formatDateLabel(iso: string, locale: 'fr' | 'en'): string {
  const date = new Date(iso);
  return date.toLocaleString(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    day: 'numeric',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  });
}

interface NotificationsContainerProps {
  onBack?: () => void;
}

export function NotificationsContainer({ onBack }: NotificationsContainerProps) {
  const { i18n } = useTranslation();
  const { data: notifications = [] } = useNotifications();
  const markRead = useMarkNotificationRead();

  return (
    <NotificationsScreen
      onBack={onBack}
      notifications={notifications.map((n) => ({
        id: n.id,
        type: n.type,
        dateLabel: formatDateLabel(n.scheduledFor, i18n.language as 'fr' | 'en'),
        title: (n.payload.taskName as string) ?? (n.payload.vehicleLabel as string) ?? '',
        body: (n.payload.vehicleLabel as string) ?? '',
        actions: n.type === 'maintenance_reminder_due' ? ['CHERCHER', 'REPORTER'] : [],
      }))}
      onAction={(notificationId) => {
        markRead.mutate(notificationId);
      }}
    />
  );
}
