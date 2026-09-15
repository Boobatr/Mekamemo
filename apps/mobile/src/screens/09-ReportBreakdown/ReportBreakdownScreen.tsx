import React, { useState } from 'react';
import { Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Camera, Mic, Video } from 'lucide-react-native';
import { Screen, Card, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockBreakdownTags } from '../../mocks/mockData';

export interface BreakdownSubmission {
  descriptionText: string;
  tags: string[];
  hasPhoto: boolean;
  hasVideo: boolean;
  hasAudio: boolean;
}

interface ReportBreakdownScreenProps {
  vehicleLabel?: string;
  odometerKm?: number;
  onCapturePhoto?: () => Promise<boolean>;
  onCaptureVideo?: () => Promise<boolean>;
  onCaptureAudio?: () => Promise<boolean>;
  onAnalyze?: (submission: BreakdownSubmission) => void;
  onBack?: () => void;
}

export function ReportBreakdownScreen({
  vehicleLabel = 'RAV4',
  odometerKm = 65400,
  onCapturePhoto = async () => true,
  onCaptureVideo = async () => true,
  onCaptureAudio = async () => true,
  onAnalyze = () => {},
  onBack,
}: ReportBreakdownScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  const [description, setDescription] = useState('');
  const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set());
  const [hasPhoto, setHasPhoto] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [hasAudio, setHasAudio] = useState(false);

  function toggleTag(tag: string) {
    setSelectedTags((prev) => {
      const next = new Set(prev);
      if (next.has(tag)) next.delete(tag);
      else next.add(tag);
      return next;
    });
  }

  const canAnalyze = description.trim().length > 0;

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
      <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>{t('breakdown.title')}</Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.md }]}>
        {vehicleLabel} · {odometerKm.toLocaleString('fr-CA')} km
      </Text>
      <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginBottom: spacing.xxl }]}>
        {t('breakdown.subtitle')}
      </Text>

      <Card>
        <TextInput
          testID="input-description"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          placeholder={t('breakdown.descriptionPlaceholder')}
          placeholderTextColor={colors.textMuted}
          style={[textStyles.body, { color: colors.textPrimary, minHeight: 90, textAlignVertical: 'top' }]}
        />
      </Card>

      <View style={{ flexDirection: 'row', marginBottom: spacing.xxl }}>
        <AttachmentButton
          icon={<Camera size={18} strokeWidth={1.5} color={colors.accentOnBackground} />}
          label={t('breakdown.photo')}
          active={hasPhoto}
          testID="attach-photo"
          onPress={async () => setHasPhoto(await onCapturePhoto())}
        />
        <AttachmentButton
          icon={<Video size={18} strokeWidth={1.5} color={colors.accentOnBackground} />}
          label={t('breakdown.video')}
          active={hasVideo}
          testID="attach-video"
          onPress={async () => setHasVideo(await onCaptureVideo())}
        />
        <AttachmentButton
          icon={<Mic size={18} strokeWidth={1.5} color={colors.accentOnBackground} />}
          label={t('breakdown.audio')}
          active={hasAudio}
          testID="attach-audio"
          onPress={async () => setHasAudio(await onCaptureAudio())}
        />
      </View>

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('breakdown.precisionTags')}
      </Text>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xxl }}>
        {mockBreakdownTags.map((tag) => (
          <TagChip
            key={tag}
            label={t(`breakdown.tags.${tag}`)}
            selected={selectedTags.has(tag)}
            onPress={() => toggleTag(tag)}
            testID={`tag-${tag}`}
          />
        ))}
      </View>

      <View
        style={{
          borderWidth: 1,
          borderColor: colors.hairlines[2],
          padding: spacing.lg,
          marginBottom: spacing.xxl,
        }}
      >
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
          {t('breakdown.urgentNote')}
        </Text>
      </View>

      <Button
        label={t('breakdown.analyze')}
        disabled={!canAnalyze}
        testID="analyze-button"
        onPress={() =>
          onAnalyze({
            descriptionText: description,
            tags: Array.from(selectedTags),
            hasPhoto,
            hasVideo,
            hasAudio,
          })
        }
      />
      {!canAnalyze ? (
        <Text
          testID="analyze-hint"
          style={[textStyles.bodySecondary, { color: colors.textMuted, textAlign: 'center', marginTop: spacing.md }]}
        >
          {t('breakdown.analyzeHint')}
        </Text>
      ) : null}
    </Screen>
  );
}

function AttachmentButton({
  icon,
  label,
  active,
  onPress,
  testID,
}: {
  icon: React.ReactNode;
  label: string;
  active: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityState={{ selected: active }}
      testID={testID}
      onPress={onPress}
      style={{
        flex: 1,
        alignItems: 'center',
        paddingVertical: spacing.lg,
        marginRight: spacing.md,
        borderWidth: 1,
        borderColor: active ? colors.accent : colors.hairlines[1],
        backgroundColor: active ? colors.accentTints[0] : 'transparent',
      }}
    >
      {icon}
      <Text style={[textStyles.sectionLabel, { color: colors.textSecondary, marginTop: spacing.xs, fontSize: 10 }]}>
        {label}
      </Text>
    </TouchableOpacity>
  );
}

function TagChip({
  label,
  selected,
  onPress,
  testID,
}: {
  label: string;
  selected: boolean;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  return (
    <Text
      onPress={onPress}
      testID={testID}
      style={[
        textStyles.button,
        {
          color: selected ? '#ffffff' : colors.textSecondary,
          backgroundColor: selected ? colors.accent : colors.hairlines[3],
          paddingHorizontal: spacing.xl,
          paddingVertical: spacing.md,
          marginRight: spacing.md,
          marginBottom: spacing.md,
          fontSize: 12.5,
          textTransform: 'none',
        },
      ]}
    >
      {label}
    </Text>
  );
}
