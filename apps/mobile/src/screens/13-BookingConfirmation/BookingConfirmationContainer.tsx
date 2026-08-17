import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { BookingConfirmationScreen } from './BookingConfirmationScreen';
import { useQuoteRequest } from '../../hooks/useGarages';
import { useConfirmBooking } from '../../hooks/useBookings';

interface BookingConfirmationContainerProps {
  quoteRequestId: string;
  onConfirmed: () => void;
}

export function BookingConfirmationContainer({
  quoteRequestId,
  onConfirmed,
}: BookingConfirmationContainerProps) {
  const { data: quoteRequest, isLoading } = useQuoteRequest(quoteRequestId);
  const confirmBooking = useConfirmBooking();

  const qr = quoteRequest as
    | {
        vehicleId: string;
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
      booking={{
        id: pendingBooking?.id ?? '',
        vehicleLabel: '',
        taskName: '',
        garagesRetainedCount: qr.garages.length,
        emailsSent,
        voiceCalls,
        responsesReceivedCount: responsesReceived,
        lastReceivedMinutesAgo: 0,
        bestOption: pendingBooking
          ? {
              garageId: pendingBooking.garageId,
              garageName: bestGarage?.garage.name ?? '',
              dateLabel: new Date(pendingBooking.confirmedSlotAt).toLocaleString('fr-CA', {
                weekday: 'long',
                day: 'numeric',
                month: 'long',
                hour: '2-digit',
                minute: '2-digit',
              }),
              distanceKm: 0,
              commuteMinutes: 0,
              priceCents: pendingBooking.priceCents,
              durationMinutes: pendingBooking.durationMinutes,
              confirmedByChannel: '',
              cancellationHours: 24,
            }
          : ({} as never),
        otherSlots: [],
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
