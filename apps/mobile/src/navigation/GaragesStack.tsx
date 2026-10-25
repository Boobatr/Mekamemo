import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { GaragesStackParamList } from './types';
import { useVehicles } from '../hooks/useVehicles';
import { GarageSearchContainer } from '../screens/11-GarageSearch/GarageSearchContainer';
import { GarageProfileContainer } from '../screens/12-GarageProfile/GarageProfileContainer';
import { AddGarageContainer } from '../screens/16-AddGarage/AddGarageContainer';
import { BookingConfirmationContainer } from '../screens/13-BookingConfirmation/BookingConfirmationContainer';

const Stack = createNativeStackNavigator<GaragesStackParamList>();

/** Own native-stack nested inside the "Garages" tab so the bottom tab bar stays visible.
 * Independent from the Vehicles tab's own GarageProfile/BookingConfirmation copies. */
export function GaragesStack() {
  const { data: vehicles = [] } = useVehicles();
  const primaryVehicleId = vehicles[0]?.id;

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="GarageList">
        {({ route, navigation }) => {
          const vehicleId = route.params?.vehicleId ?? primaryVehicleId;
          return (
            <GarageSearchContainer
              onSelectGarage={(garageId) =>
                vehicleId &&
                navigation.navigate('GarageProfile', {
                  garageId,
                  vehicleId,
                  taskId: route.params?.taskId,
                  diagnosisId: route.params?.diagnosisId,
                })
              }
              onAddGarage={() => navigation.navigate('AddGarage', { vehicleId })}
            />
          );
        }}
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
      <Stack.Screen name="AddGarage">
        {({ route, navigation }) => {
          const vehicleId = route.params?.vehicleId ?? primaryVehicleId;
          return (
            <AddGarageContainer
              onBack={() => navigation.goBack()}
              onOpenGarage={(garageId) =>
                vehicleId ? navigation.replace('GarageProfile', { garageId, vehicleId }) : navigation.goBack()
              }
            />
          );
        }}
      </Stack.Screen>
      <Stack.Screen name="BookingConfirmation">
        {({ route, navigation }) => (
          <BookingConfirmationContainer
            quoteRequestId={route.params.quoteRequestId}
            onConfirmed={() => navigation.navigate('GarageList')}
            onBack={() => navigation.goBack()}
          />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}
