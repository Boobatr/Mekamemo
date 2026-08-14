import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface ScreenHeaderProps {
  title: string;
  eyebrow?: string;
  trailing?: React.ReactNode;
}

export function ScreenHeader({ title, eyebrow, trailing }: ScreenHeaderProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.row}>
      <View style={styles.textBlock}>
        {eyebrow ? (
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary }]}>{eyebrow}</Text>
        ) : null}
        <Text style={[textStyles.screenTitle, { color: colors.textPrimary }]}>{title}</Text>
      </View>
      {trailing}
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
