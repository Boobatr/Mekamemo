import React, { useEffect, useRef, useState } from 'react';
import { GarageSearchScreen } from './GarageSearchScreen';
import { useGarageSearch } from '../../hooks/useGarages';
import { useProfile } from '../../hooks/useProfile';
import { useMaintenanceTasks } from '../../hooks/useMaintenance';
import { useTranslation } from 'react-i18next';
import { canLocate, getCurrentPosition, Position } from '../../utils/currentPosition';
import type { QuoteRecipient } from '../../navigation/types';

interface GarageSearchContainerProps {
  onSelectGarage: (garageId: string) => void;
  onAddGarage?: () => void;
  /** What the search is for, from the calendar or a diagnosis: it goes into the email to the garage. */
  vehicleId?: string;
  taskId?: string;
  diagnosisId?: string;
  onClearContext?: () => void;
  /** Opens the screen that writes one email to the garages picked in the list. */
  onWriteToGarages?: (recipients: QuoteRecipient[]) => void;
}

const DEFAULT_QUERY = 'Trouve un garage près de moi';
const DEFAULT_ORIGIN = { lat: 45.5019, lng: -73.5674 };

export function GarageSearchContainer({ onSelectGarage, onAddGarage, vehicleId, taskId, diagnosisId, onClearContext, onWriteToGarages }: GarageSearchContainerProps) {
  const { t } = useTranslation();
  const { data: tasks } = useMaintenanceTasks(taskId && vehicleId ? vehicleId : '');
  const contextLabel = taskId
    ? `${t('garageSearch.forTask')} : ${tasks?.find((task) => task.id === taskId)?.name ?? '…'}`
    : diagnosisId
      ? t('garageSearch.forDiagnosis')
      : undefined;
  const [query, setQuery] = useState(DEFAULT_QUERY);
  // Where the user is right now, when they asked to search from there instead of their postal code.
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const { data: profile } = useProfile();
  const { data } = useGarageSearch(
    query,
    position,
    profile && { postalCode: profile.postalCode, searchRadiusKm: profile.searchRadiusKm },
  );

  // A new postal code in Settings means the user moved house: search around it again.
  const knownPostalCode = useRef(profile?.postalCode);
  useEffect(() => {
    if (!profile) return;
    if (knownPostalCode.current !== undefined && knownPostalCode.current !== profile.postalCode) setPosition(undefined);
    knownPostalCode.current = profile.postalCode;
  }, [profile]);

  async function searchFromMyPosition() {
    setLocating(true);
    setLocationFailed(false);
    try {
      setPosition(await getCurrentPosition());
    } catch {
      setLocationFailed(true);
    } finally {
      setLocating(false);
    }
  }

  return (
    <GarageSearchScreen
      userQuery={query}
      assistantSummary={data?.assistantSummary ?? ''}
      origin={data?.origin ?? DEFAULT_ORIGIN}
      radiusKm={data?.radiusKm ?? profile?.searchRadiusKm ?? 15}
      results={
        (data?.results.map((g) => ({
          id: g.id,
          name: g.name,
          neighbourhood: g.address,
          distanceKm: g.distanceKm,
          lat: g.lat,
          lng: g.lng,
          rating: g.rating ?? 0,
          reviewCount: g.reviewCount ?? 0,
          priceCents: 0,
          contactMethod: g.email ? 'email' : 'voice',
          slotLabel: '',
        })) ?? []) as never
      }
      quickFilters={[]}
      onSelectGarage={onSelectGarage}
      onAddGarage={onAddGarage}
      onWriteToGarages={
        onWriteToGarages
          ? (garageIds) =>
              onWriteToGarages(
                (data?.results ?? [])
                  .filter((g) => garageIds.includes(g.id) && g.email)
                  .map((g) => ({ id: g.id, name: g.name, email: g.email as string })),
              )
          : undefined
      }
      contextLabel={contextLabel}
      onClearContext={contextLabel ? onClearContext : undefined}
      onUseMyPosition={canLocate ? searchFromMyPosition : undefined}
      onUsePostalCode={position ? () => setPosition(undefined) : undefined}
      locating={locating}
      locationFailed={locationFailed}
      onSendQuery={setQuery}
    />
  );
}
