import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useTranslation } from 'react-i18next';
import { MainTabsParamList, RootStackParamList } from './types';
import { NavigationProp } from '@react-navigation/native';

/** Tab screens navigate into root-level routes (EditTask, BookingConfirmation, ...) that live
 * outside MainTabsParamList — React Navigation resolves this fine at runtime by walking up to
 * the parent stack, but the tab's own navigation prop type only knows its own routes, hence the cast. */
type CrossStackNavigation = NavigationProp<RootStackParamList>;
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
      <Tab.Screen name="Vehicles" options={{ title: t('dashboard.tabs.vehicles') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return (
            <DashboardScreen
              onSelectVehicle={(vehicleId) => nav.navigate('History', { vehicleId })}
              onAddVehicle={() => nav.navigate('AddVehicle')}
              onBookNextDue={() => nav.navigate('BookingConfirmation', { quoteRequestId: 'mock' })}
            />
          );
        }}
      </Tab.Screen>
      <Tab.Screen name="Calendar" options={{ title: t('dashboard.tabs.calendar') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return (
            <AiCalendarScreen
              onOpenTask={(taskId) => nav.navigate('EditTask', { taskId })}
              onBook={() => nav.navigate('BookingConfirmation', { quoteRequestId: 'mock' })}
            />
          );
        }}
      </Tab.Screen>
      <Tab.Screen name="Garages" options={{ title: t('dashboard.tabs.garages') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return (
            <GarageSearchScreen onSelectGarage={(garageId) => nav.navigate('GarageProfile', { garageId })} />
          );
        }}
      </Tab.Screen>
      <Tab.Screen
        name="Settings"
        component={SettingsScreen}
        options={{ title: t('dashboard.tabs.settings') }}
      />
    </Tab.Navigator>
  );
}
