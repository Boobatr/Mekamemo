import React from 'react';
import { Platform } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { NavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';
import { MainTabsParamList, RootStackParamList } from './types';
import { TabBarIOS } from './TabBarIOS';
import { TabBarAndroid } from './TabBarAndroid';
import { DashboardContainer } from '../screens/03-04-Dashboard/DashboardContainer';
import { AiCalendarContainer } from '../screens/05-AiCalendar/AiCalendarContainer';
import { GarageSearchContainer } from '../screens/11-GarageSearch/GarageSearchContainer';
import { SettingsContainer } from '../screens/15-Settings/SettingsContainer';
import { useProfile } from '../hooks/useProfile';
import { useVehicles } from '../hooks/useVehicles';

/** Tab screens navigate into root-level routes (EditTask, BookingConfirmation, ...) that live
 * outside MainTabsParamList — React Navigation resolves this fine at runtime by walking up to
 * the parent stack, but the tab's own navigation prop type only knows its own routes, hence the cast. */
type CrossStackNavigation = NavigationProp<RootStackParamList>;

const Tab = createBottomTabNavigator<MainTabsParamList>();

export function MainTabs() {
  const { t } = useTranslation();
  const { data: profile } = useProfile();
  const { data: vehicles = [] } = useVehicles();
  const primaryVehicleId = vehicles[0]?.id;

  return (
    <Tab.Navigator
      screenOptions={{ headerShown: false }}
      tabBar={(props) => (Platform.OS === 'ios' ? <TabBarIOS {...props} /> : <TabBarAndroid {...props} />)}
    >
      <Tab.Screen name="Vehicles" options={{ title: t('dashboard.tabs.vehicles') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return (
            <DashboardContainer
              userName={profile?.fullName ?? ''}
              onSelectVehicle={(vehicleId) => nav.navigate('History', { vehicleId })}
              onAddVehicle={() => nav.navigate('AddVehicle')}
              onBookNextDue={() => nav.navigate('MainTabs', { screen: 'Garages' } as never)}
            />
          );
        }}
      </Tab.Screen>
      <Tab.Screen name="Calendar" options={{ title: t('dashboard.tabs.calendar') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return (
            <AiCalendarContainer
              onOpenTask={(task, vehicleId) => nav.navigate('EditTask', { task, vehicleId })}
              onBook={() => nav.navigate('MainTabs', { screen: 'Garages' } as never)}
            />
          );
        }}
      </Tab.Screen>
      <Tab.Screen name="Garages" options={{ title: t('dashboard.tabs.garages') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return (
            <GarageSearchContainer
              onSelectGarage={(garageId) =>
                primaryVehicleId &&
                nav.navigate('GarageProfile', { garageId, vehicleId: primaryVehicleId })
              }
            />
          );
        }}
      </Tab.Screen>
      <Tab.Screen name="Settings" options={{ title: t('dashboard.tabs.settings') }}>
        {({ navigation }) => {
          const nav = navigation as unknown as CrossStackNavigation;
          return <SettingsContainer onLoggedOut={() => nav.navigate('OnboardingProfile')} />;
        }}
      </Tab.Screen>
    </Tab.Navigator>
  );
}
