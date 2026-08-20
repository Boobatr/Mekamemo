import React from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { MileageReadingScreen } from './MileageReadingScreen';
import { useOcrOdometer, usePace, useRecordReading } from '../../hooks/useMileage';
import { useVehicle } from '../../hooks/useVehicles';

interface MileageReadingContainerProps {
  vehicleId: string;
  onSaved: () => void;
  onBack?: () => void;
}

export function MileageReadingContainer({ vehicleId, onSaved, onBack }: MileageReadingContainerProps) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: pace } = usePace(vehicleId);
  const recordReading = useRecordReading(vehicleId);
  const ocrOdometer = useOcrOdometer(vehicleId);

  return (
    <MileageReadingScreen
      onBack={onBack}
      vehicleLabel={vehicle ? `${vehicle.make} ${vehicle.model} ${vehicle.year}` : ''}
      pace={
        pace
          ? {
              avgKmPerMonth: Math.round(pace.avgKmPerMonth),
              readingsCount: pace.readingsCount,
              monthlyBars: pace.monthlyBars.map((b) => ({ label: b.month.slice(5), km: b.km })),
              suggestedReadings: pace.suggestedReadings,
              projection: { taskName: '', dueKm: 0, dueDateLabel: '' },
            }
          : undefined
      }
      onPhotographOdometer={async () => {
        const permission = await ImagePicker.requestCameraPermissionsAsync();
        if (!permission.granted) return null;

        const result = await ImagePicker.launchCameraAsync({ quality: 0.7 });
        if (result.canceled || !result.assets?.[0]) return null;

        const asset = result.assets[0];
        try {
          const { valueKm } = await ocrOdometer.mutateAsync({
            uri: asset.uri,
            name: 'odometer.jpg',
            type: 'image/jpeg',
          });
          return valueKm;
        } catch {
          return null;
        }
      }}
      onSave={async ({ valueKm, source, autoTrackEnabled: _autoTrackEnabled }) => {
        try {
          await recordReading.mutateAsync({ valueKm, source });
          onSaved();
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
    />
  );
}
