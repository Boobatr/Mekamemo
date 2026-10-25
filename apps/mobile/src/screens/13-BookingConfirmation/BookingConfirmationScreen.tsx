import React from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockBooking } from '../../mocks/mockData';

interface BookingConfirmationScreenProps {
  booking?: typeof mockBooking;
  /** Fires ONLY on explicit user tap — nothing above this ever auto-confirms a booking. */
  onConfirm?: (bookingId: string) => void;
  onViewTranscripts?: () => void;
  onBack?: () => void;
}

export function BookingConfirmationScreen({
  booking = mockBooking,
  onConfirm = () => {},
  onViewTranscripts = () => {},
  onBack,
}: BookingConfirmationScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const best = booking.bestOption;

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
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
        {booking.taskName.toUpperCase()} · {booking.vehicleLabel}
      </Text>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.xxl }]}>
        {t('booking.title')}
      </Text>

      <Card>
        <TimelineStep done>
          <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            {t('booking.garagesRetained', { count: booking.garagesRetainedCount })}
          </Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
            {t('booking.filteredNote')}
          </Text>
        </TimelineStep>

        <TimelineStep done>
          <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            {t('booking.emailsSent', { emails: booking.emailsSent, calls: booking.voiceCalls })}
          </Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
            {t('booking.onBehalfNote')}{' '}
            <Text onPress={onViewTranscripts} testID="view-transcripts-link" style={{ color: colors.accentOnBackground }}>
              {t('booking.viewTranscripts')}
            </Text>
          </Text>
        </TimelineStep>

        <TimelineStep done>
          <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
            {t('booking.responsesReceived', { count: booking.responsesReceivedCount })}
          </Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
            {t('booking.lastReceived', { minutes: booking.lastReceivedMinutesAgo })}
          </Text>
        </TimelineStep>

        <TimelineStep>
          <Text style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 12 }]}>
            {t('booking.awaitingConfirmation')}
          </Text>
        </TimelineStep>
      </Card>

      <Card accentPanel testID="best-option-panel">
        <Text style={[textStyles.sectionLabel, { color: colors.accentPanelMark, marginBottom: spacing.sm }]}>
          {t('booking.bestOption')}
        </Text>
        <Text style={[textStyles.cardTitle, { color: '#ffffff', marginBottom: spacing.xs }]}>
          {best.dateLabel}
        </Text>
        <Text style={[textStyles.body, { color: colors.textOnAccentTint, marginBottom: spacing.lg }]}>
          {best.garageName} · {best.distanceKm} km ·{' '}
          {best.commuteMinutes != null ? `${best.commuteMinutes} min` : '—'} {t('booking.commuteSuffix')} ·{' '}
          {(best.priceCents / 100).toFixed(0)} $ · durée {best.durationMinutes} min
        </Text>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <View>
            <Text style={[textStyles.sectionLabel, { color: colors.accentPanelMark, fontSize: 10 }]}>
              {t('booking.confirmedBy')}
            </Text>
            <Text style={[textStyles.body, { color: '#ffffff' }]}>{best.confirmedByChannel}</Text>
          </View>
          <View>
            <Text style={[textStyles.sectionLabel, { color: colors.accentPanelMark, fontSize: 10 }]}>
              {t('common.cancel').toUpperCase()}
            </Text>
            <Text style={[textStyles.body, { color: '#ffffff' }]}>
              {t('booking.cancellationUntil', { hours: best.cancellationHours })}
            </Text>
          </View>
        </View>
      </Card>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('booking.otherSlots')}
      </Text>
      {booking.otherSlots.map((slot) => (
        <View
          key={slot.garageId}
          style={{
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'center',
            borderWidth: 1,
            borderColor: colors.hairlines[2],
            padding: spacing.lg,
            marginBottom: spacing.md,
          }}
        >
          <Text style={[textStyles.body, { color: colors.textPrimary }]}>
            {slot.garageName} · {slot.dateLabel}
          </Text>
          <Text style={[textStyles.bodySecondary, { color: colors.textSecondary }]}>
            {slot.distanceKm} km · {(slot.priceCents / 100).toFixed(0)} $
          </Text>
        </View>
      ))}

      <Button
        label={t('booking.confirm')}
        testID="confirm-booking-button"
        onPress={() => onConfirm(booking.id)}
      />
      <Text
        style={[textStyles.bodySecondary, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}
      >
        {t('booking.confirmNote')}
      </Text>
    </Screen>
  );
}

function TimelineStep({ done = false, children }: { done?: boolean; children: React.ReactNode }) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
      <View
        style={{
          width: 9,
          height: 9,
          borderRadius: 5,
          marginTop: 5,
          marginRight: spacing.md,
          backgroundColor: done ? colors.accent : 'transparent',
          borderWidth: done ? 0 : 1.5,
          borderColor: colors.accent,
        }}
      />
      <View style={{ flex: 1 }}>{children}</View>
    </View>
  );
}
