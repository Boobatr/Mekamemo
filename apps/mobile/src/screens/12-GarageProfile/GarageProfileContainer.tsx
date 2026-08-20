import React from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { GarageProfileScreen } from './GarageProfileScreen';
import { useGarage } from '../../hooks/useGarages';
import { useCreateQuoteRequest } from '../../hooks/useGarages';
import { MockGarage } from '../../mocks/mockData';

interface GarageProfileContainerProps {
  garageId: string;
  vehicleId: string;
  taskId?: string;
  diagnosisId?: string;
  onRequestedAppointment: (quoteRequestId: string) => void;
  onBack?: () => void;
}

export function GarageProfileContainer({
  garageId,
  vehicleId,
  taskId,
  diagnosisId,
  onRequestedAppointment,
  onBack,
}: GarageProfileContainerProps) {
  const { data: garage, isLoading } = useGarage(garageId);
  const createQuoteRequest = useCreateQuoteRequest();

  if (isLoading || !garage) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const g = garage as unknown as MockGarage & { address: string; certifications: string[] };

  return (
    <GarageProfileScreen
      onBack={onBack}
      garage={{
        id: g.id,
        name: g.name,
        neighbourhood: g.address,
        distanceKm: (g as unknown as { distanceKm?: number }).distanceKm ?? 0,
        rating: g.rating ?? 0,
        reviewCount: g.reviewCount ?? 0,
        priceCents: 0,
        contactMethod: g.email ? 'email' : 'voice',
        slotLabel: '',
        certifiedCaa: g.certifications?.includes('CAA'),
        services: (g as unknown as { specialties?: string[] }).specialties,
        email: g.email ?? undefined,
      }}
      onRequestAppointment={async () => {
        try {
          const quoteRequest = await createQuoteRequest.mutateAsync({
            vehicleId,
            garageIds: [garageId],
            taskId,
            diagnosisId,
          });
          onRequestedAppointment((quoteRequest as { id: string }).id);
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
      onViewEmailBeforeSending={() => {}}
    />
  );
}
