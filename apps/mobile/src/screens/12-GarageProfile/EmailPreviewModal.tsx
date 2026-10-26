import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Modal, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { QuoteEmailPreview } from '../../services/garages';

export interface EditedEmail {
  subject: string;
  message: string;
}

interface EmailPreviewModalProps {
  visible: boolean;
  loading?: boolean;
  error?: string | null;
  preview?: QuoteEmailPreview | null;
  onClose: () => void;
  /** Sends the request for real, with the subject and message as they are now (edited or not). */
  onSend: (edited: EditedEmail) => void;
}

const MAX_SUBJECT = 150;
const MAX_MESSAGE = 2000;

/** The message a quote request would send to the garage, which the user can rewrite before it goes out. */
export function EmailPreviewModal({ visible, loading = false, error = null, preview = null, onClose, onSend }: EmailPreviewModalProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  // A fresh preview (another garage, or a retry) starts from its standard text.
  useEffect(() => {
    if (preview) {
      setSubject(preview.subject);
      setMessage(preview.body);
    }
  }, [preview]);

  const edited = preview !== null && (subject !== preview.subject || message !== preview.body);
  const isEmail = preview?.contactMethod === 'email';

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
              {isEmail ? t('garageProfile.emailNotSentYet') : t('garageProfile.emailVoiceOnly', { phone: preview.phone ?? '—' })}
            </Text>
            <Card>
              {preview.to ? (
                <View style={{ marginBottom: spacing.lg }}>
                  <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs }]}>
                    {t('garageProfile.emailTo')}
                  </Text>
                  <Text testID="email-preview-to" selectable style={[textStyles.body, { color: colors.textPrimary }]}>
                    {preview.to}
                  </Text>
                </View>
              ) : null}
              {isEmail ? (
                <Field
                  label={t('garageProfile.emailSubject')}
                  value={subject}
                  onChangeText={setSubject}
                  maxLength={MAX_SUBJECT}
                  testID="email-preview-subject"
                />
              ) : null}
              <Field
                label={t('garageProfile.emailMessage')}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={MAX_MESSAGE}
                style={{ minHeight: 260, textAlignVertical: 'top' }}
                testID="email-preview-body"
              />
              {edited ? (
                <Text
                  accessibilityRole="button"
                  testID="email-preview-reset"
                  onPress={() => {
                    setSubject(preview.subject);
                    setMessage(preview.body);
                  }}
                  style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 13 }]}
                >
                  {t('garageProfile.emailReset')}
                </Text>
              ) : null}
            </Card>
            <Button
              label={t('garageProfile.sendRequest')}
              disabled={message.trim().length === 0}
              testID="email-preview-send"
              onPress={() => onSend({ subject, message })}
            />
          </>
        ) : null}

        <Button label={t('common.close')} variant="secondary" testID="email-preview-close" onPress={onClose} />
      </Screen>
    </Modal>
  );
}
