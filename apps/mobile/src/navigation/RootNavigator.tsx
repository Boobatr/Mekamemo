import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { getStoredToken } from '../services/auth-storage';
import { ProfileContainer } from '../screens/01-Profile/ProfileContainer';
import { AddVehicleContainer } from '../screens/02-AddVehicle/AddVehicleContainer';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function RootNavigator() {
  const [authChecked, setAuthChecked] = useState(false);
  const [onboarded, setOnboarded] = useState(false);

  useEffect(() => {
    getStoredToken().then((token) => {
      setOnboarded(Boolean(token));
      setAuthChecked(true);
    });
  }, []);

  if (!authChecked) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator />
      </View>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded ? (
        <>
          <Stack.Screen name="OnboardingProfile">
            {({ navigation }) => (
              <ProfileContainer onContinue={() => navigation.navigate('OnboardingVehicle')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="OnboardingVehicle">
            {() => <AddVehicleContainer onDone={() => setOnboarded(true)} />}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="MainTabs" component={MainTabs} />
      )}
    </Stack.Navigator>
  );
}
