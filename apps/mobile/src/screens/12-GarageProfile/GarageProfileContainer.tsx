import React, { useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { GarageProfileScreen } from './GarageProfileScreen';
import { useGarage } from '../../hooks/useGarages';
import { useCreateQuoteRequest, usePreviewQuoteEmail } from '../../hooks/useGarages';
import { useMaintenanceTasks } from '../../hooks/useMaintenance';
import { useTranslation } from 'react-i18next';
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
  const previewEmail = usePreviewQuoteEmail();
  const { t } = useTranslation();
  const { data: tasks } = useMaintenanceTasks(taskId ? vehicleId : '');
  const [previewOpen, setPreviewOpen] = useState(false);

  if (isLoading || !garage) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const g = garage as unknown as MockGarage & { address: string; certifications: string[]; phone?: string | null };

  return (
    <GarageProfileScreen
      onBack={onBack}
      garage={{
        id: g.id,
        name: g.name,
        neighbourhood: g.address,
        distanceKm: (g as unknown as { distanceKm?: number }).distanceKm ?? 0,
        lat: g.lat,
        lng: g.lng,
        rating: g.rating ?? 0,
        reviewCount: g.reviewCount ?? 0,
        priceCents: 0,
        contactMethod: g.email ? 'email' : 'voice',
        slotLabel: '',
        certifiedCaa: g.certifications?.includes('CAA'),
        services: (g as unknown as { specialties?: string[] }).specialties,
        email: g.email ?? undefined,
        phone: g.phone ?? undefined,
      }}
      forLabel={
        taskId
          ? `${t('garageProfile.forTask')} : ${tasks?.find((task) => task.id === taskId)?.name ?? '…'}`
          : diagnosisId
            ? t('garageProfile.forDiagnosis')
            : undefined
      }
      onRequestAppointment={async (edited) => {
        try {
          const quoteRequest = await createQuoteRequest.mutateAsync({
            vehicleId,
            garageIds: [garageId],
            taskId,
            diagnosisId,
            subject: edited?.subject,
            message: edited?.message,
          });
          onRequestedAppointment((quoteRequest as { id: string }).id);
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
      onViewEmailBeforeSending={() => {
        setPreviewOpen(true);
        previewEmail.reset();
        previewEmail.mutate({ vehicleId, garageId, taskId, diagnosisId });
      }}
      emailPreviewOpen={previewOpen}
      emailPreviewLoading={previewEmail.isPending}
      emailPreviewError={previewEmail.error ? previewEmail.error.message : null}
      emailPreview={previewEmail.data ?? null}
      onCloseEmailPreview={() => setPreviewOpen(false)}
    />
  );
}
