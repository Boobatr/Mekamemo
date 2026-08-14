import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

/**
 * Four `+` corner registration marks, per README: 11px, accent color,
 * offset -6px vertical / -4px horizontal from each corner.
 */
export function CrosshairMarks() {
  const { colors } = useTheme();
  const color = colors.mode === 'dark' ? colors.accentOnBackground : colors.accent;

  return (
    <>
      <Mark color={color} style={{ top: -6, left: -4 }} />
      <Mark color={color} style={{ top: -6, right: -4 }} />
      <Mark color={color} style={{ bottom: -6, left: -4 }} />
      <Mark color={color} style={{ bottom: -6, right: -4 }} />
    </>
  );
}

function Mark({ color, style }: { color: string; style: object }) {
  return (
    <View style={[styles.mark, style]} pointerEvents="none">
      <View style={[styles.horizontal, { backgroundColor: color }]} />
      <View style={[styles.vertical, { backgroundColor: color }]} />
    </View>
  );
}

const SIZE = 11;
const THICKNESS = 1.2;

const styles = StyleSheet.create({
  mark: { position: 'absolute', width: SIZE, height: SIZE },
  horizontal: {
    position: 'absolute',
    top: SIZE / 2 - THICKNESS / 2,
    left: 0,
    width: SIZE,
    height: THICKNESS,
  },
  vertical: {
    position: 'absolute',
    left: SIZE / 2 - THICKNESS / 2,
    top: 0,
    width: THICKNESS,
    height: SIZE,
  },
});
