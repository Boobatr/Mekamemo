import React from 'react';
import { Platform, StyleSheet, Text, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing } from '../theme/spacing';

interface FabAndroidProps {
  onPress: () => void;
  testID?: string;
  label?: string;
}

/** Extended floating action button, Android-only per README (iOS uses an inline "+" instead). */
export function FabAndroid({ onPress, testID, label }: FabAndroidProps) {
  const { colors } = useTheme();
  if (Platform.OS !== 'android') return null;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={[styles.fab, { backgroundColor: colors.accent }, label ? styles.fabExtended : null]}
    >
      <Plus size={22} strokeWidth={2} color="#ffffff" />
      {label ? <Text style={[textStyles.button, { color: '#ffffff', fontSize: 14 }]}>{label}</Text> : null}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: 'absolute',
    right: 20,
    bottom: 88,
    width: 52,
    height: 52,
    borderRadius: 0,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
  },
  fabExtended: {
    width: undefined,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
  },
});
