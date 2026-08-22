import React from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';

const KM_PER_DEG_LAT = 110.57;
const MAP_HEIGHT = 190;
const GRID_STEP = 28;

export interface MapGarage {
  id: string;
  name: string;
  lat: number;
  lng: number;
}

interface GarageMapProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
}

/** Schematic map — a grid backdrop with pins placed by real relative lat/lng,
 * not a tile-based map. Keeps the mockup's "map with pins" idea without a
 * native maps SDK (which has no web renderer, so it can't be verified there). */
export function GarageMap({ origin, garages, radiusKm, selectedId, onSelectGarage = () => {} }: GarageMapProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const kmPerDegLng = KM_PER_DEG_LAT * Math.cos((origin.lat * Math.PI) / 180);

  function project(lat: number, lng: number) {
    const dxKm = (lng - origin.lng) * kmPerDegLng;
    const dyKm = (lat - origin.lat) * KM_PER_DEG_LAT;
    const clampedRadius = Math.max(radiusKm, 1);
    const x = 0.5 + (dxKm / clampedRadius) * 0.42;
    const y = 0.5 - (dyKm / clampedRadius) * 0.42;
    return { left: `${Math.min(0.96, Math.max(0.04, x)) * 100}%`, top: `${Math.min(0.9, Math.max(0.1, y)) * 100}%` };
  }

  const gridLines = Math.ceil(MAP_HEIGHT / GRID_STEP);

  return (
    <View
      testID="garage-map"
      style={{
        height: MAP_HEIGHT,
        borderWidth: 1,
        borderColor: colors.hairlines[2],
        backgroundColor: colors.fieldBackground,
        overflow: 'hidden',
        marginBottom: spacing.xl,
      }}
    >
      {Array.from({ length: gridLines }).map((_, i) => (
        <View
          key={`h${i}`}
          style={{
            position: 'absolute',
            top: i * GRID_STEP,
            left: 0,
            right: 0,
            height: 1,
            backgroundColor: colors.accentTints[3],
          }}
        />
      ))}
      {Array.from({ length: 14 }).map((_, i) => (
        <View
          key={`v${i}`}
          style={{
            position: 'absolute',
            left: i * GRID_STEP,
            top: 0,
            bottom: 0,
            width: 1,
            backgroundColor: colors.accentTints[3],
          }}
        />
      ))}

      <View
        testID="garage-map-origin"
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          width: 14,
          height: 14,
          marginLeft: -7,
          marginTop: -7,
          backgroundColor: colors.textPrimary,
        }}
      />

      {garages.map((garage) => {
        const pos = project(garage.lat, garage.lng);
        const selected = garage.id === selectedId;
        return (
          <TouchableOpacity
            key={garage.id}
            testID={`garage-pin-${garage.id}`}
            accessibilityRole="button"
            accessibilityLabel={garage.name}
            onPress={() => onSelectGarage(garage.id)}
            hitSlop={8}
            style={[
              { position: 'absolute', width: 20, height: 20, marginLeft: -10, marginTop: -10 },
              pos as never,
            ]}
          >
            <View
              style={{
                width: 20,
                height: 20,
                borderRadius: 10,
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              <View
                style={{
                  width: selected ? 14 : 10,
                  height: selected ? 14 : 10,
                  borderRadius: 7,
                  borderWidth: 1.5,
                  borderColor: colors.accent,
                  backgroundColor: selected ? colors.accent : colors.screenBackground,
                }}
              />
            </View>
          </TouchableOpacity>
        );
      })}

      <Text
        style={[
          textStyles.sectionLabel,
          {
            position: 'absolute',
            left: spacing.md,
            bottom: spacing.md,
            color: colors.accentOnBackground,
            backgroundColor: colors.screenBackground,
            borderWidth: 1,
            borderColor: colors.hairlines[2],
            paddingHorizontal: spacing.sm,
            paddingVertical: 2,
          },
        ]}
      >
        {t('garageSearch.mapCaption', { count: garages.length, radius: radiusKm })}
      </Text>
    </View>
  );
}
