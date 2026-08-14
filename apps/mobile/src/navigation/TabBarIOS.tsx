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

/** Native iOS tab bar: flat, hairline top border, icon + label, no elevation. */
export function TabBarIOS({ state, descriptors, navigation }: BottomTabBarProps) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.bar,
        {
          backgroundColor: colors.mode === 'dark' ? colors.veilBottom : colors.screenBackground,
          borderTopColor: colors.hairlines[2],
          paddingBottom: Math.max(insets.bottom, 8),
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
            <Icon size={22} strokeWidth={1.5} color={tint} />
            <Text style={[textStyles.statusBar, { color: tint, fontSize: 10.5, marginTop: 2 }]}>
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
    borderTopWidth: StyleSheet.hairlineWidth,
    paddingTop: 8,
  },
  tab: { flex: 1, alignItems: 'center', justifyContent: 'center' },
});
