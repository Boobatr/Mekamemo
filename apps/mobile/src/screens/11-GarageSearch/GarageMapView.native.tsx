import React from 'react';
import { Platform } from 'react-native';
import { GarageMap, MapGarage } from './GarageMap';
import { RealGarageMap } from './RealGarageMap';

interface GarageMapViewProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
}

/** iOS gets a real interactive map (Apple Maps, no API key needed). Android
 * keeps the schematic grid until a Google Maps API key is configured —
 * react-native-maps renders a blank screen on Android without one. */
export function GarageMapView(props: GarageMapViewProps) {
  return Platform.OS === 'ios' ? <RealGarageMap {...props} /> : <GarageMap {...props} />;
}
