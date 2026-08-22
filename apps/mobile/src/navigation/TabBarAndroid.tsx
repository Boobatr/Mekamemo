import React from 'react';
import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Calendar, Car, Settings, Wrench } from 'lucide-react-native';
import { useTheme } from '../theme';
import { textStyles } from '../theme/typography';

const ICONS: Record<string, typeof Car> = {
  Vehicles: Car,
  Calendar: Calendar,
  Garages: Wrench,
  Settings: Settings,
};

/** Material-style bottom navigation: elevated, filled active pill, system nav bar padding. */
export function TabBarAndroid({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.mode !== 'light' ? colors.veilBottom : colors.fieldBackground,
          paddingBottom: Math.max(insets.bottom, 12),
        },
      ]}
    >
      {state.routes.map((route, index) => {
        const { options } = descriptors[route.key];
        const label = (options.title ?? route.name) as string;
        const isFocused = state.index === index;
        const Icon = ICONS[route.name] ?? Car;
        const tint = isFocused ? colors.accentOnBackground : colors.textTertiary;

        return (
          <TouchableOpacity
            key={route.key}
            accessibilityRole="button"
            accessibilityState={isFocused ? { selected: true } : {}}
            testID={`tab-${route.name}`}
            onPress={() => {
              const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
              if (!isFocused && !event.defaultPrevented) {
                navigation.navigate(route.name);
              }
            }}
            style={styles.tab}
          >
            <View
              style={[
                styles.pill,
                isFocused ? { backgroundColor: colors.accentTints[0] } : null,
              ]}
            >
              <Icon size={20} strokeWidth={1.5} color={tint} />
            </View>
            <Text style={[textStyles.statusBar, { color: tint, fontSize: 10.5, marginTop: 3 }]}>
              {label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    paddingTop: 10,
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  pill: { paddingHorizontal: 18, paddingVertical: 4 },
});
