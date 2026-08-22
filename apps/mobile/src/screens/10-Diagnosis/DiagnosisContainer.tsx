import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { DiagnosisScreen } from './DiagnosisScreen';
import { useAnalyzeBreakdownReport } from '../../hooks/useBreakdown';
import { useGarageSearch } from '../../hooks/useGarages';
import { Diagnosis } from '../../services/breakdown';

interface DiagnosisContainerProps {
  reportId: string;
  onRequestQuotes: (diagnosisId: string) => void;
  onAddToCalendar: () => void;
  onBack?: () => void;
}

export function DiagnosisContainer({ reportId, onRequestQuotes, onAddToCalendar, onBack }: DiagnosisContainerProps) {
  const { t } = useTranslation();
  const analyze = useAnalyzeBreakdownReport();
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
        availableGarages: (nearbyGarages?.results ?? []).slice(0, 3).map((g) => ({
          id: g.id,
          name: g.name,
          distanceKm: g.distanceKm,
          slotLabel: t('diagnosis.availabilityUnknown'),
        })),
      }}
      onRequestQuotes={() => onRequestQuotes(diagnosis.id)}
      onAddToCalendar={onAddToCalendar}
    />
  );
}
