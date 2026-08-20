import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface ScreenHeaderProps {
  title: string;
  eyebrow?: string;
  trailing?: React.ReactNode;
  onBack?: () => void;
}

export function ScreenHeader({ title, eyebrow, trailing, onBack }: ScreenHeaderProps) {
  const { colors } = useTheme();
  const { t } = useTranslation();

  return (
    <View>
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
      <View style={styles.row}>
        <View style={styles.textBlock}>
          {eyebrow ? (
            <Text style={[textStyles.sectionLabel, { color: colors.textTertiary }]}>{eyebrow}</Text>
          ) : null}
          <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
        </View>
        {trailing}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: spacing.xxl,
  },
  textBlock: { flexShrink: 1 },
});
