import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MainTabsParamList } from './types';
import { TabBarIOS } from './TabBarIOS';
import { TabBarAndroid } from './TabBarAndroid';
import { DashboardScreen } from '../screens/03-04-Dashboard/DashboardScreen';
import { AiCalendarScreen } from '../screens/05-AiCalendar/AiCalendarScreen';
import { GarageSearchScreen } from '../screens/11-GarageSearch/GarageSearchScreen';
import { SettingsScreen } from '../screens/15-Settings/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const { t } = useTranslation();

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (Platform.OS === 'ios' ? <TabBarIOS {...props} /> : <TabBarAndroid {...props} />)}
    >
      <Tab.Screen
        name="Vehicles"
        component={DashboardScreen}
        options={{ title: t('dashboard.tabs.vehicles') }}
      />
      <Tab.Screen
        name="Calendar"
        component={AiCalendarScreen}
        options={{ title: t('dashboard.tabs.calendar') }}
      />
      <Tab.Screen
        name="Garages"
        component={GarageSearchScreen}
        options={{ title: t('dashboard.tabs.garages') }}
      />
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('dashboard.tabs.settings') }}
      />
    </Tab.Navigator>
  );
}
