import React from 'react';
import { Platform, StyleSheet, View, ViewStyle } from 'react-native';
import { useTheme } from '../theme';
import { spacing } from '../theme/spacing';
import { CrosshairMarks } from './CrosshairMarks';

interface CardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  withMarks?: boolean;
  accentPanel?: boolean;
}

/** Sharp-cornered card. Android gets the two-layer shadow per README; iOS/light stay flat. */
export function Card({ children, style, withMarks = true, accentPanel = false }: CardProps) {
  const { colors } = useTheme();

  const backgroundColor = accentPanel ? colors.accentPanelSolid : colors.fieldBackground;
  const borderColor = accentPanel ? 'transparent' : colors.hairlines[2];

  return (
    <View
      style={[
        styles.card,
        {
          backgroundColor,
          borderColor,
        },
        Platform.OS === 'android' ? styles.androidShadow : null,
        style,
      ]}
    >
      {children}
      {withMarks ? <CrosshairMarks /> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 0,
    borderWidth: 1,
    padding: spacing.xxl,
    marginBottom: spacing.xl,
  },
  androidShadow: {
    elevation: 3,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.55,
    shadowRadius: 10,
  },
});
