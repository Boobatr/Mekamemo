import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { BookingConfirmationScreen } from './BookingConfirmationScreen';
import { useQuoteRequest } from '../../hooks/useGarages';
import { useConfirmBooking } from '../../hooks/useBookings';

interface BookingConfirmationContainerProps {
  quoteRequestId: string;
  onConfirmed: () => void;
  onBack?: () => void;
}

export function BookingConfirmationContainer({
  quoteRequestId,
  onConfirmed,
  onBack,
}: BookingConfirmationContainerProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA';
  const { data: quoteRequest, isLoading } = useQuoteRequest(quoteRequestId);
  const confirmBooking = useConfirmBooking();

  const qr = quoteRequest as
    | {
        vehicleId: string;
        taskName: string | null;
        vehicleLabel: string | null;
        distanceToBookingKm: number | null;
        confirmedByChannel: 'email' | 'voice' | null;
        otherSlots: { garageId: string; garageName: string; distanceKm: number; priceCents: number | null; startsAt: string }[];
        garages: {
          garageId: string;
          garage: { name: string };
          contactMethod: string;
          sentAt: string | null;
          responses: unknown[];
        }[];
        bookings: {
          id: string;
          garageId: string;
          confirmedSlotAt: string;
          priceCents: number;
          durationMinutes: number;
          status: string;
          cancellationDeadlineAt: string | null;
        }[];
      }
    | undefined;

  const pendingBooking = qr?.bookings.find((b) => b.status === 'pending_user_confirmation');
  const bestGarage = qr?.garages.find((g) => g.garageId === pendingBooking?.garageId);

  if (isLoading || !qr) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const emailsSent = qr.garages.filter((g) => g.contactMethod === 'email' && g.sentAt).length;
  const voiceCalls = qr.garages.filter((g) => g.contactMethod === 'voice').length;
  const responsesReceived = qr.garages.reduce((sum, g) => sum + g.responses.length, 0);

  return (
    <BookingConfirmationScreen
      onBack={onBack}
      booking={{
        id: pendingBooking?.id ?? '',
        vehicleLabel: qr.vehicleLabel ?? '',
        taskName: qr.taskName ?? '',
        garagesRetainedCount: qr.garages.length,
        emailsSent,
        voiceCalls,
        responsesReceivedCount: responsesReceived,
        lastReceivedMinutesAgo: 0,
        bestOption: pendingBooking
          ? {
              garageId: pendingBooking.garageId,
              garageName: bestGarage?.garage.name ?? '',
              dateLabel: new Date(pendingBooking.confirmedSlotAt).toLocaleString(locale, {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              }),
              distanceKm: qr.distanceToBookingKm ?? 0,
              commuteMinutes: null,
              priceCents: pendingBooking.priceCents,
              durationMinutes: pendingBooking.durationMinutes,
              confirmedByChannel:
                qr.confirmedByChannel === 'voice' ? 'Téléphone' : qr.confirmedByChannel === 'email' ? 'Courriel' : '',
              cancellationHours: 24,
            }
          : ({} as never),
        otherSlots: qr.otherSlots.map((s) => ({
          garageId: s.garageId,
          garageName: s.garageName,
          dateLabel: new Date(s.startsAt).toLocaleString(locale, { weekday: 'short', hour: '2-digit', minute: '2-digit' }),
          distanceKm: s.distanceKm,
          priceCents: s.priceCents ?? 0,
        })),
      }}
      onConfirm={async () => {
        if (!pendingBooking) return;
        try {
          await confirmBooking.mutateAsync(pendingBooking.id);
          onConfirmed();
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
    />
  );
}
