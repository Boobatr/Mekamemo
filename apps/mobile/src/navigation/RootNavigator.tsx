import React, { useState } from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { MainTabs } from './MainTabs';
import { ProfileScreen } from '../screens/01-Profile/ProfileScreen';
import { AddVehicleScreen } from '../screens/02-AddVehicle/AddVehicleScreen';
import { EditTaskScreen, EditableTask } from '../screens/06-EditTask/EditTaskScreen';
import { MileageReadingScreen } from '../screens/07-MileageReading/MileageReadingScreen';
import { NotificationsScreen } from '../screens/08-Notifications/NotificationsScreen';
import { ReportBreakdownScreen } from '../screens/09-ReportBreakdown/ReportBreakdownScreen';
import { DiagnosisScreen } from '../screens/10-Diagnosis/DiagnosisScreen';
import { GarageProfileScreen } from '../screens/12-GarageProfile/GarageProfileScreen';
import { BookingConfirmationScreen } from '../screens/13-BookingConfirmation/BookingConfirmationScreen';
import { HistoryScreen } from '../screens/14-History/HistoryScreen';
import { mockMaintenanceTasks } from '../mocks/mockData';

const Stack = createNativeStackNavigator<RootStackParamList>();

/**
 * Mock-data phase wiring: every screen still reads from src/mocks/mockData.
 * Task #12 (end-to-end backend wiring) replaces each of these with a
 * TanStack Query hook against the NestJS API — the navigation shape itself
 * does not change.
 */
export function RootNavigator() {
  const [onboarded, setOnboarded] = useState(false);

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {!onboarded ? (
        <>
          <Stack.Screen name="OnboardingProfile">
            {({ navigation }) => (
              <ProfileScreen onContinue={() => navigation.navigate('OnboardingVehicle')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="OnboardingVehicle">
            {() => (
              <AddVehicleScreen
                decodeVin={async () => ({
                  make: 'Toyota',
                  model: 'RAV4 LE',
                  year: 2021,
                  engine: '2,5 L I4',
                })}
                onGenerateCalendar={() => setOnboarded(true)}
              />
            )}
          </Stack.Screen>
        </>
      ) : (
        <>
          <Stack.Screen name="MainTabs" component={MainTabs} />
          <Stack.Screen name="AddVehicle">
            {() => (
              <AddVehicleScreen
                decodeVin={async () => ({
                  make: 'Toyota',
                  model: 'RAV4 LE',
                  year: 2021,
                  engine: '2,5 L I4',
                })}
                onGenerateCalendar={() => {}}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="EditTask">
            {({ route, navigation }) => (
              <EditTaskScreen
                task={taskById(route.params.taskId)}
                onBack={() => navigation.goBack()}
                onDelete={() => navigation.goBack()}
                onSave={() => navigation.goBack()}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="MileageReading">
            {({ navigation }) => <MileageReadingScreen onSave={() => navigation.goBack()} />}
          </Stack.Screen>
          <Stack.Screen name="Notifications" component={NotificationsScreen} />
          <Stack.Screen name="ReportBreakdown">
            {({ navigation }) => (
              <ReportBreakdownScreen onAnalyze={() => navigation.navigate('Diagnosis', { reportId: 'mock' })} />
            )}
          </Stack.Screen>
          <Stack.Screen name="Diagnosis">
            {({ navigation }) => (
              <DiagnosisScreen
                onRequestQuotes={() => navigation.navigate('BookingConfirmation', { quoteRequestId: 'mock' })}
                onAddToCalendar={() => navigation.navigate('MainTabs')}
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="GarageProfile">
            {({ navigation }) => (
              <GarageProfileScreen
                onRequestAppointment={() =>
                  navigation.navigate('BookingConfirmation', { quoteRequestId: 'mock' })
                }
              />
            )}
          </Stack.Screen>
          <Stack.Screen name="BookingConfirmation">
            {({ navigation }) => (
              <BookingConfirmationScreen onConfirm={() => navigation.navigate('MainTabs')} />
            )}
          </Stack.Screen>
          <Stack.Screen name="History" component={HistoryScreen} />
        </>
      )}
    </Stack.Navigator>
  );
}

function taskById(taskId: string): EditableTask {
  const task = mockMaintenanceTasks.find((t) => t.id === taskId) ?? mockMaintenanceTasks[0];
  return {
    id: task.id,
    name: task.name,
    editedByUser: 'editedByUser' in task ? Boolean(task.editedByUser) : false,
    isRecurring: true,
    manufacturerIntervalKm: task.intervalKm ?? 8000,
    manufacturerIntervalMonths: task.intervalMonths ?? 6,
    intervalKm: 'userIntervalKm' in task ? Number(task.userIntervalKm) : (task.intervalKm ?? 8000),
    intervalMonths: task.intervalMonths ?? 6,
    priority: 'priority' in task ? (task.priority as EditableTask['priority']) : 'normal',
    nextDueLabel: task.dueDateLabel,
    notesForGarage: 'notesForGarage' in task ? String(task.notesForGarage) : '',
    groupWithTireRotation: Boolean('groupWithTaskId' in task && task.groupWithTaskId),
  };
}
