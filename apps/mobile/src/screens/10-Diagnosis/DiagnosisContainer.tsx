import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { DiagnosisScreen } from './DiagnosisScreen';
import { useAnalyzeBreakdownReport } from '../../hooks/useBreakdown';
import { Diagnosis } from '../../services/breakdown';

interface DiagnosisContainerProps {
  reportId: string;
  onRequestQuotes: (diagnosisId: string) => void;
  onAddToCalendar: () => void;
}

export function DiagnosisContainer({ reportId, onRequestQuotes, onAddToCalendar }: DiagnosisContainerProps) {
  const analyze = useAnalyzeBreakdownReport();
  const [diagnosis, setDiagnosis] = useState<Diagnosis | null>(null);

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
      diagnosis={{
        id: diagnosis.id,
        analyzedInSeconds: 4,
        primaryCause: diagnosis.primaryCause,
        confidence: diagnosis.confidence,
        explanation: '',
        secondaryCauses: diagnosis.secondaryCauses,
        recommendedDelay: diagnosis.recommendedDelay,
        costMinCents: diagnosis.costMinCents,
        costMaxCents: diagnosis.costMaxCents,
        safetyNote: diagnosis.safetyNote,
        disclaimer: diagnosis.disclaimer,
        availableGarages: [],
      }}
      onRequestQuotes={() => onRequestQuotes(diagnosis.id)}
      onAddToCalendar={onAddToCalendar}
    />
  );
}
