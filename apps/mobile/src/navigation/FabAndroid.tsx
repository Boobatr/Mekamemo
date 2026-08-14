import React from 'react';
import { Platform, StyleSheet, TouchableOpacity } from 'react-native';
import { Plus } from 'lucide-react-native';
import { useTheme } from '../theme';

interface FabAndroidProps {
  onPress: () => void;
  testID?: string;
}

/** Square floating action button, Android-only per README (iOS uses an inline "+" instead). */
export function FabAndroid({ onPress, testID }: FabAndroidProps) {
  const { colors } = useTheme();
  if (Platform.OS !== 'android') return null;

  return (
    <TouchableOpacity
      accessibilityRole="button"
      testID={testID}
      onPress={onPress}
      style={[styles.fab, { backgroundColor: colors.accent }]}
    >
      <Plus size={24} strokeWidth={2} color="#ffffff" />
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
});
