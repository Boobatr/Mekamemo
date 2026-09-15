import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DiagnosisScreen } from './DiagnosisScreen';
import { useAnalyzeBreakdownReport } from '../../hooks/useBreakdown';
import { useGarageSearch, useCreateQuoteRequest } from '../../hooks/useGarages';
import { Diagnosis } from '../../services/breakdown';

interface DiagnosisContainerProps {
  reportId: string;
  vehicleId: string;
  onRequestedQuotes: (quoteRequestId: string) => void;
  onSelectGarage: (garageId: string, diagnosisId: string) => void;
  onAddToCalendar: () => void;
  onBack?: () => void;
}

export function DiagnosisContainer({
  reportId,
  vehicleId,
  onRequestedQuotes,
  onSelectGarage,
  onAddToCalendar,
  onBack,
}: DiagnosisContainerProps) {
  const { t } = useTranslation();
  const analyze = useAnalyzeBreakdownReport();
  const createQuoteRequest = useCreateQuoteRequest();
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);
  const { data: nearbyGarages } = useGarageSearch(diagnosis?.primaryCause ?? '');

  useEffect(() => {
    analyze.mutate(reportId, { onSuccess: setDiagnosis });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [reportId]);

  if (!diagnosis) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  const availableGarages = (nearbyGarages?.results ?? []).slice(0, 3);

  return (
    <DiagnosisScreen
      onBack={onBack}
      diagnosis={{
        id: diagnosis.id,
        analyzedInSeconds: 4,
        primaryCause: diagnosis.primaryCause,
        confidence: diagnosis.confidence,
        explanation: diagnosis.explanation,
        secondaryCauses: diagnosis.secondaryCauses,
        recommendedDelay: diagnosis.recommendedDelay,
        costMinCents: diagnosis.costMinCents,
        costMaxCents: diagnosis.costMaxCents,
        safetyNote: diagnosis.safetyNote,
        disclaimer: diagnosis.disclaimer,
        availableGarages: availableGarages.map((g) => ({
          id: g.id,
          name: g.name,
          distanceKm: g.distanceKm,
          slotLabel: t('diagnosis.availabilityUnknown'),
        })),
      }}
      onSelectGarage={(garageId) => onSelectGarage(garageId, diagnosis.id)}
      onRequestQuotes={async () => {
        try {
          const quoteRequest = await createQuoteRequest.mutateAsync({
            vehicleId,
            diagnosisId: diagnosis.id,
            garageIds: availableGarages.map((g) => g.id),
          });
          onRequestedQuotes((quoteRequest as { id: string }).id);
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
      onAddToCalendar={onAddToCalendar}
    />
  );
}
