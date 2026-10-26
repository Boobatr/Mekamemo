import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Screen, Card, Field, Button, Tag } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { QuoteEmailPreview } from '../../services/garages';
import type { QuoteRecipient } from '../../navigation/types';

interface ComposeQuoteScreenProps {
  recipients: QuoteRecipient[];
  /** The standard subject and message, once the server has written them. */
  preview?: QuoteEmailPreview | null;
  loading?: boolean;
  error?: string | null;
  /** The maintenance item or breakdown the message is about. */
  forLabel?: string;
  sending?: boolean;
  sendError?: string | null;
  onRemoveRecipient?: (garageId: string) => void;
  /** Sends the same subject and message to every recipient. */
  onSend?: (edited: { subject: string; message: string }) => void;
  onBack?: () => void;
}

const MAX_SUBJECT = 150;
const MAX_MESSAGE = 2000;

/** One email, written once, sent to several garages: the user can edit it and drop recipients first. */
export function ComposeQuoteScreen({
  recipients,
  preview = null,
  loading = false,
  error = null,
  forLabel,
  sending = false,
  sendError = null,
  onRemoveRecipient = () => {},
  onSend = () => {},
  onBack,
}: ComposeQuoteScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (preview) {
      setSubject(preview.subject);
      setMessage(preview.body);
    }
  }, [preview]);

  const edited = preview !== null && (subject !== preview.subject || message !== preview.body);
  const canSend = recipients.length > 0 && message.trim().length > 0 && !sending;

  return (
    <Screen>
      {onBack ? (
        <Text
          onPress={onBack}
          testID="screen-back-button"
          accessibilityRole="button"
          style={[textStyles.button, { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.lg }]}
        >
          ‹ {t('common.back')}
        </Text>
      ) : null}
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>{t('composeQuote.title')}</Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xl }]}>{t('composeQuote.intro')}</Text>
      {forLabel ? (
        <View style={{ flexDirection: 'row', marginBottom: spacing.lg }}>
          <Tag label={forLabel} tone="accent" />
        </View>
      ) : null}

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>{t('composeQuote.recipients')}</Text>
      <Card>
        {recipients.length === 0 ? (
          <Text testID="no-recipients" style={[textStyles.body, { color: colors.textMuted }]}>
            {t('composeQuote.noRecipients')}
          </Text>
        ) : null}
        {recipients.map((recipient) => (
          <View
            key={recipient.id}
            testID={`recipient-${recipient.id}`}
            style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md }}
          >
            <View style={{ flex: 1 }}>
              <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>{recipient.name}</Text>
              <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{recipient.email}</Text>
            </View>
            <Text
              accessibilityRole="button"
              accessibilityLabel={t('composeQuote.remove', { name: recipient.name })}
              testID={`remove-recipient-${recipient.id}`}
              onPress={() => onRemoveRecipient(recipient.id)}
              style={[textStyles.button, { color: colors.textSecondary }]}
            >
              ✕
            </Text>
          </View>
        ))}
      </Card>

      {loading ? (
        <View testID="compose-loading" style={{ paddingVertical: spacing.xxl, alignItems: 'center' }}>
          <ActivityIndicator />
        </View>
      ) : null}
      {error ? (
        <Text testID="compose-error" style={[textStyles.body, { color: colors.accentOnBackground, marginBottom: spacing.xl }]}>
          {error}
        </Text>
      ) : null}

      {preview ? (
        <>
          <Card>
            <Field label={t('garageProfile.emailSubject')} value={subject} onChangeText={setSubject} maxLength={MAX_SUBJECT} testID="compose-subject" />
            <Field
              label={t('garageProfile.emailMessage')}
              value={message}
              onChangeText={setMessage}
              multiline
              maxLength={MAX_MESSAGE}
              style={{ minHeight: 260, textAlignVertical: 'top' }}
              testID="compose-message"
            />
            {edited ? (
              <Text
                accessibilityRole="button"
                testID="compose-reset"
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
          {sendError ? (
            <Text testID="compose-send-error" style={[textStyles.body, { color: colors.accentOnBackground }]}>
              {sendError}
            </Text>
          ) : null}
          <Button
            label={t('composeQuote.send', { count: recipients.length })}
            disabled={!canSend}
            loading={sending}
            testID="compose-send"
            onPress={() => onSend({ subject, message })}
          />
        </>
      ) : null}
    </Screen>
  );
}
