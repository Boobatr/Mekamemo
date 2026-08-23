import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MainTabsParamList, RootStackParamList } from './types';
import { TabBarIOS } from './TabBarIOS';
import { TabBarAndroid } from './TabBarAndroid';
import { VehiclesStack } from './VehiclesStack';
import { CalendarStack } from './CalendarStack';
import { GaragesStack } from './GaragesStack';
import { SettingsContainer } from '../screens/15-Settings/SettingsContainer';

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
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
        {({ navigation }) => {
          const nav = navigation as unknown as NavigationProp<RootStackParamList>;
          return <SettingsContainer onLoggedOut={() => nav.navigate('OnboardingProfile')} />;
        }}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
