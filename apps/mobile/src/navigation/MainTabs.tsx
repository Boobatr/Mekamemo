import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MainTabsParamList } from './types';
import { TabBarIOS } from './TabBarIOS';
import { TabBarAndroid } from './TabBarAndroid';
import { VehiclesStack } from './VehiclesStack';
import { CalendarStack } from './CalendarStack';
import { GaragesStack } from './GaragesStack';
import { SettingsContainer } from '../screens/15-Settings/SettingsContainer';

const Tab = createBottomTabNavigator<MainTabsParamList>();

interface MainTabsProps {
  onLoggedOut?: () => void;
}

export function MainTabs({ onLoggedOut = () => {} }: MainTabsProps) {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (Platform.OS === 'ios' ? <TabBarIOS {...props} /> : <TabBarAndroid {...props} />)}
    >
      <Tab.Screen name="Vehicles" component={VehiclesStack} options={{ title: t('dashboard.tabs.vehicles') }} />
      <Tab.Screen name="Calendar" component={CalendarStack} options={{ title: t('dashboard.tabs.calendar') }} />
      <Tab.Screen name="Garages" component={GaragesStack} options={{ title: t('dashboard.tabs.garages') }} />
      <Tab.Screen name="Settings" options={{ title: t('dashboard.tabs.settings') }}>
        {() => <SettingsContainer onLoggedOut={onLoggedOut} />}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
