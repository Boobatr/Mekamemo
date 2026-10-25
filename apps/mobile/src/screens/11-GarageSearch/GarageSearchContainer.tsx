import React, { useState } from 'react';
import { GarageSearchScreen } from './GarageSearchScreen';
import { useGarageSearch } from '../../hooks/useGarages';
import { useProfile } from '../../hooks/useProfile';

interface GarageSearchContainerProps {
  onSelectGarage: (garageId: string) => void;
  onAddGarage?: () => void;
}

const DEFAULT_QUERY = 'Trouve un garage près de moi';
const DEFAULT_ORIGIN = { lat: 45.5019, lng: -73.5674 };

export function GarageSearchContainer({ onSelectGarage, onAddGarage }: GarageSearchContainerProps) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const { data } = useGarageSearch(query);
  const { data: profile } = useProfile();

  return (
    <GarageSearchScreen
      userQuery={query}
      assistantSummary={data?.assistantSummary ?? ''}
      origin={data?.origin ?? DEFAULT_ORIGIN}
      radiusKm={profile?.searchRadiusKm ?? 15}
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
      onSendQuery={setQuery}
    />
  );
}
