import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface TagProps {
  label: string;
  tone?: 'neutral' | 'accent' | 'warning';
}

export function Tag({ label, tone = 'neutral' }: TagProps) {
  const { colors } = useTheme();

  const backgroundColor =
    tone === 'accent'
      ? colors.accentTints[0]
      : tone === 'warning'
        ? colors.mode === 'dark'
          ? 'rgba(232,237,243,.16)'
          : '#e8e2d4'
        : colors.hairlines[3];

  const textColor = tone === 'accent' ? colors.textOnAccentTint : colors.textSecondary;

  return (
    <View style={[styles.tag, { backgroundColor }]}>
      <Text style={[textStyles.sectionLabel, { color: textColor, fontSize: 10.5 }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tag: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    marginRight: spacing.sm,
    marginBottom: spacing.sm,
  },
});
