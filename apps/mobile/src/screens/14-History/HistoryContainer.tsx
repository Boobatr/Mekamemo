import React from 'react';
import { Alert, Linking } from 'react-native';
import { useTranslation } from 'react-i18next';
import { HistoryScreen } from './HistoryScreen';
import { useHistory } from '../../hooks/useHistory';
import { useVehicle } from '../../hooks/useVehicles';
import { getResaleDossierExportUrl } from '../../services/history';

interface HistoryContainerProps {
  vehicleId: string;
  onReportBreakdown: (vehicleId: string) => void;
  onUpdateMileage: (vehicleId: string) => void;
  onBack?: () => void;
}

export function HistoryContainer({
  vehicleId,
  onReportBreakdown,
  onUpdateMileage,
  onBack,
}: HistoryContainerProps) {
  const { i18n } = useTranslation();
  const locale = i18n.language === 'fr' ? 'fr-CA' : 'en-CA';
  const { data: vehicle } = useVehicle(vehicleId);
  const { data: entries = [] } = useHistory(vehicleId);

  const entriesByYear = Object.values(
    entries.reduce<Record<number, typeof entries>>((acc, entry) => {
      const year = new Date(entry.performedAt).getFullYear();
      acc[year] = [...(acc[year] ?? []), entry];
      return acc;
    }, {}),
  )
    .map((yearEntries) => ({
      year: new Date(yearEntries[0].performedAt).getFullYear(),
      entries: yearEntries.map((e) => ({
        id: e.id,
        name: e.taskName,
        dateLabel: new Date(e.performedAt).toLocaleDateString(locale, { day: 'numeric', month: 'long' }),
        mileageKm: e.mileageAtServiceKm,
        garageName: e.garage?.name ?? null,
        costCents: e.costCents,
      })),
    }))
    .sort((a, b) => b.year - a.year);

  const totalThisYearCents = entries
    .filter((e) => new Date(e.performedAt).getFullYear() === new Date().getFullYear())
    .reduce((sum, e) => sum + e.costCents, 0);

  return (
    <HistoryScreen
      onBack={onBack}
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
      onReportBreakdown={() => onReportBreakdown(vehicleId)}
      onUpdateMileage={() => onUpdateMileage(vehicleId)}
    />
  );
}
