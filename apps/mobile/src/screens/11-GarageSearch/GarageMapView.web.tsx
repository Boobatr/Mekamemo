import React from 'react';
import type { MapGarage } from './GarageMap';
import { LeafletGarageMap } from './LeafletGarageMap';

interface GarageMapViewProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
  height?: number;
  fullscreen?: boolean;
  showOrigin?: boolean;
}

/** The web gets a real map: OpenStreetMap tiles drawn by Leaflet (free, no API key).
 * react-native-maps has no web renderer, so this file never imports it — Metro's
 * platform-extension resolution keeps it out of the web bundle entirely
 * (see GarageMapView.native.tsx for the iOS/Android split). */
export function GarageMapView(props: GarageMapViewProps) {
  return <LeafletGarageMap {...props} />;
}
