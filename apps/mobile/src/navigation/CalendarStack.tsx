import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CalendarStackParamList } from './types';
import { AiCalendarContainer } from '../screens/05-AiCalendar/AiCalendarContainer';
import { EditTaskContainer } from '../screens/06-EditTask/EditTaskContainer';

const Stack = createNativeStackNavigator<CalendarStackParamList>();

/** Own native-stack nested inside the "Calendar" tab so the bottom tab bar stays visible. */
export function CalendarStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="CalendarHome">
        {({ navigation }) => (
          <AiCalendarContainer
            onOpenTask={(task, vehicleId) => navigation.navigate('EditTask', { task, vehicleId })}
            onBook={(vehicleId) =>
              navigation.navigate('Garages', { screen: 'GarageList', params: { vehicleId } } as never)
            }
          />
        )}
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
    </Stack.Navigator>
  );
}
