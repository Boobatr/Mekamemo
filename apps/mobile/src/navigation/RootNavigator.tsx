import React, { useEffect, useState } from 'react';
import { ActivityIndicator, View } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { getStoredToken } from '../services/auth-storage';
import { ProfileContainer } from '../screens/01-Profile/ProfileContainer';
import { AddVehicleContainer } from '../screens/02-AddVehicle/AddVehicleContainer';
import { EditTaskContainer } from '../screens/06-EditTask/EditTaskContainer';
import { MileageReadingContainer } from '../screens/07-MileageReading/MileageReadingContainer';
import { NotificationsContainer } from '../screens/08-Notifications/NotificationsContainer';
import { ReportBreakdownContainer } from '../screens/09-ReportBreakdown/ReportBreakdownContainer';
import { DiagnosisContainer } from '../screens/10-Diagnosis/DiagnosisContainer';
import { GarageProfileContainer } from '../screens/12-GarageProfile/GarageProfileContainer';
import { BookingConfirmationContainer } from '../screens/13-BookingConfirmation/BookingConfirmationContainer';
import { HistoryContainer } from '../screens/14-History/HistoryContainer';

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
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="AddVehicle">
            {({ navigation }) => <AddVehicleContainer onDone={() => navigation.goBack()} />}
          </Stack.Screen>
          <Stack.Screen name="EditTask">
            {({ route, navigation }) => (
              <EditTaskContainer
                task={route.params.task}
                vehicleId={route.params.vehicleId}
                onBack={() => navigation.goBack()}
                onDeleted={() => navigation.goBack()}
                onSaved={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="MileageReading">
            {({ route, navigation }) => (
              <MileageReadingContainer vehicleId={route.params.vehicleId} onSaved={() => navigation.goBack()} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Notifications" component={NotificationsContainer} />
          <Stack.Screen name="ReportBreakdown">
            {({ route, navigation }) => (
              <ReportBreakdownContainer
                vehicleId={route.params.vehicleId}
                onAnalyzed={(reportId) => navigation.navigate('Diagnosis', { reportId })}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="Diagnosis">
            {({ route, navigation }) => (
              <DiagnosisContainer
                reportId={route.params.reportId}
                onRequestQuotes={() =>
                  navigation.navigate('MainTabs', { screen: 'Garages' } as never)
                }
                onAddToCalendar={() => navigation.navigate('MainTabs')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="GarageProfile">
            {({ route, navigation }) => (
              <GarageProfileContainer
                garageId={route.params.garageId}
                vehicleId={route.params.vehicleId}
                taskId={route.params.taskId}
                diagnosisId={route.params.diagnosisId}
                onRequestedAppointment={(quoteRequestId) =>
                  navigation.navigate('BookingConfirmation', { quoteRequestId })
                }
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="BookingConfirmation">
            {({ route, navigation }) => (
              <BookingConfirmationContainer
                quoteRequestId={route.params.quoteRequestId}
                onConfirmed={() => navigation.navigate('MainTabs')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="History">
            {({ route }) => <HistoryContainer vehicleId={route.params.vehicleId} />}
          </Stack.Screen>
        </>
      )}
    </Stack.Navigator>
  );
}
