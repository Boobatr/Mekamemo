import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { getStoredToken } from '../services/auth-storage';
import { LoginContainer } from '../screens/00-Login/LoginContainer';
import { ForgotPasswordContainer } from '../screens/00-ForgotPassword/ForgotPasswordContainer';
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
              <ProfileContainer
                onContinue={() => navigation.navigate('OnboardingVehicle')}
                onLogin={() => navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Login">
            {({ navigation }) => (
              <LoginContainer
                onLoggedIn={() => setOnboarded(true)}
                onCreateAccount={() => navigation.navigate('OnboardingProfile')}
                onForgotPassword={(email) => navigation.navigate('ForgotPassword', { email })}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="ForgotPassword">
            {({ route, navigation }) => (
              <ForgotPasswordContainer
                initialEmail={route.params?.email}
                onLoggedIn={() => setOnboarded(true)}
                onBackToLogin={() => navigation.navigate('Login')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="OnboardingVehicle">
            {() => <AddVehicleContainer onDone={() => setOnboarded(true)} />}
          </Stack.Screen>
        </>
      ) : (
        <Stack.Screen name="MainTabs">{() => <MainTabs onLoggedOut={() => setOnboarded(false)} />}</Stack.Screen>
      )}
    </Stack.Navigator>
  );
}
