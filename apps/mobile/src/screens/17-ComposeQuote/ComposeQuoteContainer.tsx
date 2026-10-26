import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ComposeQuoteScreen } from './ComposeQuoteScreen';
import { useCreateQuoteRequest, usePreviewQuoteEmail } from '../../hooks/useGarages';
import { useMaintenanceTasks } from '../../hooks/useMaintenance';
import type { QuoteRecipient } from '../../navigation/types';

interface ComposeQuoteContainerProps {
  vehicleId: string;
  recipients: QuoteRecipient[];
  taskId?: string;
  diagnosisId?: string;
  onSent: (quoteRequestId: string) => void;
  onBack?: () => void;
}

export function ComposeQuoteContainer({ vehicleId, recipients: initialRecipients, taskId, diagnosisId, onSent, onBack }: ComposeQuoteContainerProps) {
  const { t } = useTranslation();
  const [recipients, setRecipients] = useState(initialRecipients);
  const previewEmail = usePreviewQuoteEmail();
  const createQuoteRequest = useCreateQuoteRequest();
  const { data: tasks } = useMaintenanceTasks(taskId ? vehicleId : '');

  // The standard message doesn't depend on the garage: the first one is enough to have it written.
  const firstGarageId = initialRecipients[0]?.id;
  const { mutate: writePreview } = previewEmail;
  useEffect(() => {
    if (firstGarageId) writePreview({ vehicleId, garageId: firstGarageId, taskId, diagnosisId });
  }, [vehicleId, firstGarageId, taskId, diagnosisId, writePreview]);

  return (
    <ComposeQuoteScreen
      recipients={recipients}
      preview={previewEmail.data ?? null}
      loading={previewEmail.isPending}
      error={previewEmail.error ? previewEmail.error.message : null}
      forLabel={
        taskId
          ? `${t('garageProfile.forTask')} : ${tasks?.find((task) => task.id === taskId)?.name ?? '…'}`
          : diagnosisId
            ? t('garageProfile.forDiagnosis')
            : undefined
      }
      sending={createQuoteRequest.isPending}
      sendError={createQuoteRequest.error ? createQuoteRequest.error.message : null}
      onRemoveRecipient={(garageId) => setRecipients((current) => current.filter((r) => r.id !== garageId))}
      onSend={async (edited) => {
        try {
          const quoteRequest = await createQuoteRequest.mutateAsync({
            vehicleId,
            garageIds: recipients.map((r) => r.id),
            taskId,
            diagnosisId,
            subject: edited.subject,
            message: edited.message,
          });
          onSent((quoteRequest as { id: string }).id);
        } catch {
          // The error is shown under the message by the screen (createQuoteRequest.error).
        }
      }}
      onBack={onBack}
    />
  );
}
