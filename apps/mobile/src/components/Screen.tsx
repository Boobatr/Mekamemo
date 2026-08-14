import React from 'react';
import { ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ScreenBackground } from './ScreenBackground';
import { screenPadding } from '../theme/spacing';

interface ScreenProps {
  children: React.ReactNode;
  scroll?: boolean;
  style?: ViewStyle;
  edges?: ('top' | 'bottom' | 'left' | 'right')[];
}

/** Shared screen shell: photo/veil background, safe-area padding, optional scroll. */
export function Screen({ children, scroll = true, style, edges = ['top', 'bottom'] }: ScreenProps) {
  const Container = scroll ? ScrollView : View;
  const containerProps = scroll
    ? { contentContainerStyle: [styles.content, style], showsVerticalScrollIndicator: false }
    : { style: [styles.content, { flex: 1 }, style] };

  return (
    <ScreenBackground>
      <SafeAreaView edges={edges} style={styles.safeArea}>
        <Container {...(containerProps as any)}>{children}</Container>
      </SafeAreaView>
    </ScreenBackground>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  content: {
    paddingHorizontal: screenPadding.horizontal,
    paddingVertical: screenPadding.vertical,
  },
});
