import React from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker } from 'react-native-maps';
import { spacing } from '../../theme/spacing';
import { useTheme } from '../../theme';
import type { MapGarage } from './GarageMap';

const KM_PER_DEG_LAT = 110.57;
const MAP_HEIGHT = 190;

interface RealGarageMapProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
}

/** Real interactive map (Apple Maps via react-native-maps' default iOS provider —
 * no API key needed). Same props shape as the schematic GarageMap so
 * GarageMapView.native.tsx can swap between them by platform. Centered on the
 * profile's postal-code-derived origin, not live device GPS. */
export function RealGarageMap({ origin, garages, radiusKm, selectedId, onSelectGarage = () => {} }: RealGarageMapProps) {
  const { colors } = useTheme();
  const spanDeg = (Math.max(radiusKm, 1) * 2.6) / KM_PER_DEG_LAT;
  const lngSpanDeg = spanDeg / Math.cos((origin.lat * Math.PI) / 180);

  return (
    <MapView
      testID="garage-map"
      key={`${origin.lat.toFixed(3)}-${origin.lng.toFixed(3)}-${radiusKm}`}
      style={[styles.map, { borderColor: colors.hairlines[2] }]}
      initialRegion={{
        latitude: origin.lat,
        longitude: origin.lng,
        latitudeDelta: spanDeg,
        longitudeDelta: lngSpanDeg,
      }}
    >
      <Marker testID="garage-map-origin" coordinate={{ latitude: origin.lat, longitude: origin.lng }} />
      {garages.map((garage) => (
        <Marker
          key={garage.id}
          testID={`garage-pin-${garage.id}`}
          coordinate={{ latitude: garage.lat, longitude: garage.lng }}
          title={garage.name}
          pinColor={garage.id === selectedId ? colors.accent : undefined}
          onPress={() => onSelectGarage(garage.id)}
        />
      ))}
    </MapView>
  );
}

const styles = StyleSheet.create({
  map: {
    height: MAP_HEIGHT,
    borderWidth: 1,
    marginBottom: spacing.xl,
  },
});
