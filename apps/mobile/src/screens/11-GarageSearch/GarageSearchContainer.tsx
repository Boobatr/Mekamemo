import React, { useState } from 'react';
import { GarageSearchScreen } from './GarageSearchScreen';
import { useGarageSearch } from '../../hooks/useGarages';
import { useProfile } from '../../hooks/useProfile';
import { canLocate, getCurrentPosition, Position } from '../../utils/currentPosition';

interface GarageSearchContainerProps {
  onSelectGarage: (garageId: string) => void;
  onAddGarage?: () => void;
}

const DEFAULT_QUERY = 'Trouve un garage près de moi';
const DEFAULT_ORIGIN = { lat: 45.5019, lng: -73.5674 };

export function GarageSearchContainer({ onSelectGarage, onAddGarage }: GarageSearchContainerProps) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  // Where the user is right now, when they asked to search from there instead of their postal code.
  const [position, setPosition] = useState<Position | undefined>(undefined);
  const [locating, setLocating] = useState(false);
  const [locationFailed, setLocationFailed] = useState(false);
  const { data } = useGarageSearch(query, position);
  const { data: profile } = useProfile();

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
      onUseMyPosition={canLocate ? searchFromMyPosition : undefined}
      onUsePostalCode={position ? () => setPosition(undefined) : undefined}
      locating={locating}
      locationFailed={locationFailed}
      onSendQuery={setQuery}
    />
  );
}
