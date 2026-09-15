import React from 'react';
import { ImageBackground, StyleSheet, View } from 'react-native';
import { useTheme } from '../theme';

const workshopPhoto = require('../../assets/images/atelier-ecran.png');

/**
 * The workshop photo shows through under a tinted veil on every theme. Dark/ember
 * use a dark veil at full photo opacity; light mode dims the photo itself first,
 * then lays a near-opaque pale veil on top, so it reads as a soft, bright texture
 * instead of darkening the screen or fighting with light mode's dark text.
 */
export function ScreenBackground({ children }: { children: React.ReactNode }) {
  const { colors } = useTheme();

  return (
    <ImageBackground
      source={workshopPhoto}
      resizeMode="cover"
      imageStyle={colors.mode === 'light' ? styles.imageLight : styles.image}
      style={styles.fill}
    >
      <View style={[styles.veil, { backgroundColor: colors.photoVeil }]} />
      <View style={styles.content}>{children}</View>
    </ImageBackground>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1 },
  image: { opacity: 1 },
  imageLight: { opacity: 0.5 },
  veil: StyleSheet.absoluteFill,
  content: { flex: 1 },
});
