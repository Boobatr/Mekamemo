import React from 'react';
import { Alert } from 'react-native';
import { AddVehicleScreen } from './AddVehicleScreen';
import { useCreateVehicle, useDecodeVin } from '../../hooks/useVehicles';
import { useGenerateCalendar } from '../../hooks/useMaintenance';

interface AddVehicleContainerProps {
  onDone: (vehicleId: string) => void;
  onBack?: () => void;
}

export function AddVehicleContainer({ onDone, onBack }: AddVehicleContainerProps) {
  const decodeVinMutation = useDecodeVin();
  const createVehicle = useCreateVehicle();
  const generateCalendar = useGenerateCalendar();

  return (
    <AddVehicleScreen
      onBack={onBack}
      decodeVin={async (vin) => {
        try {
          return await decodeVinMutation.mutateAsync(vin);
        } catch {
          return null;
        }
      }}
      onGenerateCalendar={async ({ vin, make, model, year, engine, trim, odometerKm }) => {
        try {
          const vehicle = await createVehicle.mutateAsync({
            vin,
            make,
            model,
            trim,
            year,
            engine,
            usageType: 'mixed',
            odometerKm,
          });
          await generateCalendar.mutateAsync(vehicle.id);
          onDone(vehicle.id);
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
    />
  );
}
