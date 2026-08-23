import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { VehiclesStackParamList } from './types';
import { useProfile } from '../hooks/useProfile';
import { DashboardContainer } from '../screens/03-04-Dashboard/DashboardContainer';
import { VehicleDetailContainer } from '../screens/VehicleDetail/VehicleDetailContainer';
import { AddVehicleContainer } from '../screens/02-AddVehicle/AddVehicleContainer';
import { HistoryContainer } from '../screens/14-History/HistoryContainer';
import { ReportBreakdownContainer } from '../screens/09-ReportBreakdown/ReportBreakdownContainer';
import { DiagnosisContainer } from '../screens/10-Diagnosis/DiagnosisContainer';
import { MileageReadingContainer } from '../screens/07-MileageReading/MileageReadingContainer';
import { GarageProfileContainer } from '../screens/12-GarageProfile/GarageProfileContainer';
import { BookingConfirmationContainer } from '../screens/13-BookingConfirmation/BookingConfirmationContainer';
import { NotificationsContainer } from '../screens/08-Notifications/NotificationsContainer';

const Stack = createNativeStackNavigator<VehiclesStackParamList>();

/** Own native-stack nested inside the "Vehicles" tab, so the bottom tab bar
 * (rendered by the parent Tab.Navigator) stays mounted and visible across the
 * whole dashboard → vehicle → action-screen drill-down. */
export function VehiclesStack() {
  const { data: profile } = useProfile();

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="VehicleList">
        {({ navigation }) => (
          <DashboardContainer
            userName={profile?.fullName ?? ''}
            onSelectVehicle={(vehicleId) => navigation.navigate('VehicleDetail', { vehicleId })}
            onAddVehicle={() => navigation.navigate('AddVehicle')}
            onBookNextDue={() => navigation.navigate('Garages' as never)}
            onOpenNotifications={() => navigation.navigate('Notifications')}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="VehicleDetail">
        {({ route, navigation }) => (
          <VehicleDetailContainer
            vehicleId={route.params.vehicleId}
            onReportBreakdown={(vehicleId) => navigation.navigate('ReportBreakdown', { vehicleId })}
            onUpdateMileage={(vehicleId) => navigation.navigate('MileageReading', { vehicleId })}
            onOpenHistory={(vehicleId) => navigation.navigate('History', { vehicleId })}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="AddVehicle">
        {({ navigation }) => (
          <AddVehicleContainer onDone={() => navigation.goBack()} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="History">
        {({ route, navigation }) => (
          <HistoryContainer vehicleId={route.params.vehicleId} onBack={() => navigation.goBack()} />
        )}
      </Stack.Screen>
      <Stack.Screen name="ReportBreakdown">
        {({ route, navigation }) => (
          <ReportBreakdownContainer
            vehicleId={route.params.vehicleId}
            onAnalyzed={(reportId) => navigation.navigate('Diagnosis', { reportId })}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Diagnosis">
        {({ route, navigation }) => (
          <DiagnosisContainer
            reportId={route.params.reportId}
            onRequestQuotes={() => navigation.navigate('Garages' as never)}
            onAddToCalendar={() => navigation.navigate('VehicleList')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="MileageReading">
        {({ route, navigation }) => (
          <MileageReadingContainer
            vehicleId={route.params.vehicleId}
            onSaved={() => navigation.goBack()}
            onBack={() => navigation.goBack()}
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
            onRequestedAppointment={(quoteRequestId) => navigation.navigate('BookingConfirmation', { quoteRequestId })}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="BookingConfirmation">
        {({ route, navigation }) => (
          <BookingConfirmationContainer
            quoteRequestId={route.params.quoteRequestId}
            onConfirmed={() => navigation.navigate('VehicleList')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
      <Stack.Screen name="Notifications">
        {({ navigation }) => <NotificationsContainer onBack={() => navigation.goBack()} />}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
