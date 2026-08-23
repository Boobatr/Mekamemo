import React from 'react';
import { VehicleDetailScreen } from './VehicleDetailScreen';
import { useVehicle } from '../../hooks/useVehicles';

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

  return (
    <VehicleDetailScreen
      vehicleLabel={vehicle ? `${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} ${vehicle.year}` : ''}
      odometerKm={vehicle?.latestOdometerKm ?? undefined}
      onBack={onBack}
      onReportBreakdown={() => onReportBreakdown(vehicleId)}
      onUpdateMileage={() => onUpdateMileage(vehicleId)}
      onOpenHistory={() => onOpenHistory(vehicleId)}
    />
  );
}
