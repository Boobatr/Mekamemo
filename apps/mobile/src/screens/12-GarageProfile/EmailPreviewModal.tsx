import React from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { QuoteEmailPreview } from '../../services/garages';

interface EmailPreviewModalProps {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  preview?: QuoteEmailPreview | null;
  onClose: () => void;
  /** Sends the request for real (the same action as the "request an appointment" button). */
  onSend: () => void;
}

/** Shows the message a quote request would send to the garage, before anything is sent. */
export function EmailPreviewModal({ visible, loading = false, error = null, preview = null, onClose, onSend }: EmailPreviewModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} animationType="slide" onRequestClose={onClose}>
      <Screen>
        <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
          {t('garageProfile.emailPreviewTitle')}
        </Text>

        {loading ? (
          <View testID="email-preview-loading" style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
            <ActivityIndicator />
          </View>
        ) : null}

        {error ? (
          <Text testID="email-preview-error" style={[textStyles.body, { color: colors.accentOnBackground, marginBottom: spacing.xl }]}>
            {error}
          </Text>
        ) : null}

        {preview ? (
          <>
            <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}>
              {preview.contactMethod === 'email'
                ? t('garageProfile.emailNotSentYet')
                : t('garageProfile.emailVoiceOnly', { phone: preview.phone ?? '—' })}
            </Text>
            <Card>
              {preview.to ? <Row label={t('garageProfile.emailTo')} value={preview.to} testID="email-preview-to" /> : null}
              <Row label={t('garageProfile.emailSubject')} value={preview.subject} testID="email-preview-subject" />
              <Row label={t('garageProfile.emailMessage')} value={preview.body} testID="email-preview-body" />
            </Card>
            <Button label={t('garageProfile.requestAppointment')} testID="email-preview-send" onPress={onSend} />
          </>
        ) : null}

        <Button label={t('common.close')} variant="secondary" testID="email-preview-close" onPress={onClose} />
      </Screen>
    </Modal>
  );
}

function Row({ label, value, testID }: { label: string; value: string; testID: string }) {
  const { colors } = useTheme();
  return (
    <View style={{ marginBottom: spacing.lg }}>
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>{label}</Text>
      <Text testID={testID} selectable style={[textStyles.body, { color: colors.textPrimary }]}>
        {value}
      </Text>
    </View>
  );
}
