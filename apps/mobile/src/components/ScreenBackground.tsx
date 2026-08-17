import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

const workshopPhoto = require('../../assets/images/atelier-ecran.png');

/**
 * Dark mode lets the workshop photo show through under a tinted veil;
 * light mode fully hides it behind a pale blue-paper background (per README).
 */
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  if (colors.mode === 'light') {
    return <View style={[styles.fill, { backgroundColor: colors.screenBackground }]}>{children}</View>;
  }

  return (
    <ImageBackground
      source={workshopPhoto}
      resizeMode="cover"
      imageStyle={styles.image}
      style={styles.fill}
    >
      <View style={[styles.veil, { backgroundColor: colors.screenBackground }]} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  image: { opacity: 1 },
  veil: StyleSheet.absoluteFill,
  content: { flex: 1 },
});
