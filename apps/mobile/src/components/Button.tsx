import React from 'react';
import {
  ActivityIndicator,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  ViewStyle,
} from 'react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing, radius } from '../theme/spacing';
import { CrosshairMarks } from './CrosshairMarks';

interface ButtonProps {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary';
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
  testID?: string;
}

/** Button is the one shape in the system with a border radius (7px, per README). */
export function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
  testID,
}: ButtonProps) {
  const { colors } = useTheme();
  const isPrimary = variant === 'primary';

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      testID={testID}
      style={({ pressed }) => [
        styles.button,
        {
          backgroundColor: isPrimary ? colors.accent : 'transparent',
          borderColor: isPrimary ? colors.accent : colors.hairlines[0],
          opacity: disabled ? 0.5 : pressed ? 0.85 : 1,
        },
        Platform.OS === 'android' ? styles.androidShadow : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator color={isPrimary ? '#ffffff' : colors.accent} />
      ) : (
        <Text
          style={[
            textStyles.button,
            { color: isPrimary ? '#ffffff' : colors.accentOnBackground },
          ]}
        >
          {label}
        </Text>
      )}
      {isPrimary ? <CrosshairMarks /> : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.button,
    borderWidth: 1,
    paddingVertical: spacing.xl,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  androidShadow: {
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.6,
    shadowRadius: 2,
  },
});
