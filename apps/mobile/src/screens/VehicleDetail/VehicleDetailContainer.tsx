import React from 'react';
import { Alert } from 'react-native';
import { VehicleDetailScreen } from './VehicleDetailScreen';
import { useUpdateVehicle, useVehicle } from '../../hooks/useVehicles';

interface VehicleDetailContainerProps {
  vehicleId: string;
  onReportBreakdown: (vehicleId: string) => void;
  onUpdateMileage: (vehicleId: string) => void;
  onOpenHistory: (vehicleId: string) => void;
  onBack?: () => void;
}

export function VehicleDetailContainer({
  vehicleId,
  onReportBreakdown,
  onUpdateMileage,
  onOpenHistory,
  onBack,
}: VehicleDetailContainerProps) {
  const { data: vehicle } = useVehicle(vehicleId);
  const updateVehicle = useUpdateVehicle(vehicleId);

  return (
    <VehicleDetailScreen
      vehicleLabel={vehicle ? `${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} ${vehicle.year}` : ''}
      odometerKm={vehicle?.latestOdometerKm ?? undefined}
      vin={vehicle?.vin}
      onSaveVin={(vin) =>
        updateVehicle.mutate(
          { vin },
          {
            onError: (err) =>
              Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.'),
          },
        )
      }
      onBack={onBack}
      onReportBreakdown={() => onReportBreakdown(vehicleId)}
      onUpdateMileage={() => onUpdateMileage(vehicleId)}
      onOpenHistory={() => onOpenHistory(vehicleId)}
    />
  );
}
