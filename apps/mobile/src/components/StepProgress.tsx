import React from 'react';
import { View } from 'react-native';
import { useTheme } from '../theme';
import { spacing } from '../theme/spacing';

interface StepProgressProps {
  current: number;
  total: number;
}

/** Three (or N) thin segments marking onboarding progress, per screens 01/02. */
export function StepProgress({ current, total }: StepProgressProps) {
  const { colors } = useTheme();
  return (
    <View style={{ flexDirection: 'row', marginBottom: spacing.sm }}>
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          style={{
            width: 34,
            height: 3,
            marginRight: spacing.xs,
            backgroundColor: i < current ? colors.accent : colors.hairlines[2],
          }}
        />
      ))}
    </View>
  );
}
