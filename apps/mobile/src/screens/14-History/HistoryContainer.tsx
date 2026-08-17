import React from 'react';
import { Alert, Linking } from 'react-native';
import { HistoryScreen } from './HistoryScreen';
import { useHistory } from '../../hooks/useHistory';
import { useVehicle } from '../../hooks/useVehicles';
import { getResaleDossierExportUrl } from '../../services/history';

interface HistoryContainerProps {
  vehicleId: string;
}

export function HistoryContainer({ vehicleId }: HistoryContainerProps) {
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: entries = [] } = useHistory(vehicleId);

  const entriesByYear = Object.values(
    entries.reduce<Record<number, typeof entries>>((acc, entry) => {
      const year = new Date(entry.performedAt).getFullYear();
      acc[year] = [...(acc[year] ?? []), entry];
      return acc;
    }, {}),
  ).map((yearEntries) => ({
    year: new Date(yearEntries[0].performedAt).getFullYear(),
    entries: yearEntries.map((e) => ({
      id: e.id,
      name: e.taskName,
      dateLabel: new Date(e.performedAt).toLocaleDateString('fr-CA', { day: 'numeric', month: 'long' }),
      mileageKm: e.mileageAtServiceKm,
      garageName: null,
      costCents: e.costCents,
    })),
  }));

  const totalThisYearCents = entries
    .filter((e) => new Date(e.performedAt).getFullYear() === new Date().getFullYear())
    .reduce((sum, e) => sum + e.costCents, 0);

  return (
    <HistoryScreen
      history={{
        vehicleLabel: vehicle ? `${vehicle.make.toUpperCase()} ${vehicle.model.toUpperCase()} ${vehicle.year}` : '',
        totalThisYearCents,
        interventionsCount: entries.length,
        entriesByYear,
      }}
      onExport={async () => {
        try {
          const url = await getResaleDossierExportUrl(vehicleId);
          await Linking.openURL(url);
        } catch (err) {
          Alert.alert('Erreur', err instanceof Error ? err.message : 'Une erreur est survenue.');
        }
      }}
      onOpenResaleDossier={async () => {
        const url = await getResaleDossierExportUrl(vehicleId);
        await Linking.openURL(url);
      }}
    />
  );
}
