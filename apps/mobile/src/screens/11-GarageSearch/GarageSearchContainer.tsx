import React, { useState } from 'react';
import { GarageSearchScreen } from './GarageSearchScreen';
import { useGarageSearch } from '../../hooks/useGarages';

interface GarageSearchContainerProps {
  onSelectGarage: (garageId: string) => void;
}

const DEFAULT_QUERY = 'Trouve un garage près de moi';

export function GarageSearchContainer({ onSelectGarage }: GarageSearchContainerProps) {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const { data } = useGarageSearch(query);

  return (
    <GarageSearchScreen
      userQuery={query}
      assistantSummary={data?.assistantSummary ?? ''}
      results={
        (data?.results.map((g) => ({
          id: g.id,
          name: g.name,
          neighbourhood: g.address,
          distanceKm: g.distanceKm,
          rating: g.rating ?? 0,
          reviewCount: g.reviewCount ?? 0,
          priceCents: 0,
          contactMethod: g.email ? 'email' : 'voice',
          slotLabel: '',
        })) ?? []) as never
      }
      quickFilters={[]}
      onSelectGarage={onSelectGarage}
      onSendQuery={setQuery}
    />
  );
}
