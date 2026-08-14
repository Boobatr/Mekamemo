import React from 'react';
import { StyleSheet, Text, TextInput, TextInputProps, View } from 'react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface FieldProps extends TextInputProps {
  label: string;
}

export function Field({ label, style, ...inputProps }: FieldProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.wrapper}>
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.sm }]}>
        {label}
      </Text>
      <TextInput
        placeholderTextColor={colors.textMuted}
        style={[
          styles.input,
          textStyles.body,
          {
            backgroundColor: colors.fieldBackground,
            borderColor: colors.hairlines[2],
            color: colors.textPrimary,
          },
          style,
        ]}
        {...inputProps}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { marginBottom: spacing.xl },
  input: {
    borderWidth: 1,
    borderRadius: 0,
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.lg,
  },
});
