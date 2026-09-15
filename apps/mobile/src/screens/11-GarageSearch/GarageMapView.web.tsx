import React from 'react';
import { GarageMap, MapGarage } from './GarageMap';

interface GarageMapViewProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
}

/** react-native-maps has no web renderer, so this file never imports it —
 * Metro's platform-extension resolution keeps it out of the web bundle
 * entirely (see GarageMapView.native.tsx for the iOS/Android split). */
export function GarageMapView(props: GarageMapViewProps) {
  return <GarageMap {...props} />;
}
