import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Menu } from 'lucide-react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';
import { spacing, screenGeometry } from '../theme/spacing';

interface AndroidAppBarProps {
  title: string;
  onMenuPress?: () => void;
}

/** Material top app bar with hamburger menu, per screen 04 conventions. */
export function AndroidAppBar({ title, onMenuPress }: AndroidAppBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          height: screenGeometry.androidAppBar + insets.top,
          paddingTop: insets.top,
          backgroundColor: colors.mode === 'dark' ? colors.veilTop : colors.screenBackground,
        },
      ]}
    >
      <TouchableOpacity
        accessibilityRole="button"
        accessibilityLabel="menu"
        onPress={onMenuPress}
        hitSlop={12}
      >
        <Menu size={22} strokeWidth={1.5} color={colors.textPrimary} />
      </TouchableOpacity>
      <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginLeft: spacing.xl }]}>
        {title}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.xxl,
  },
});
