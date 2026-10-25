import React, { useState } from 'react';
import { Modal, Text, TouchableOpacity, useWindowDimensions, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Maximize2, Minimize2, X } from 'lucide-react-native';
import { Screen } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import type { MapGarage } from './GarageMap';
import { GarageMapView } from './GarageMapView';

interface ExpandableGarageMapProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
  /** Opens the picked garage's profile (offered from the full-screen map). */
  onOpenGarage?: (garageId: string) => void;
}

/** Room the full-screen map leaves for its own top bar and the picked-garage card. */
const FULLSCREEN_CHROME = 190;
const MIN_FULLSCREEN_HEIGHT = 240;

/** The garage map with room to grow: compact by default, half the screen on demand, or the whole screen. */
export function ExpandableGarageMap({ garages, selectedId, onSelectGarage, onOpenGarage, ...mapProps }: ExpandableGarageMapProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { height: windowHeight } = useWindowDimensions();
  const [half, setHalf] = useState(false);
  const [fullscreen, setFullscreen] = useState(false);

  const selected = garages.find((g) => g.id === selectedId);
  const halfHeight = Math.round(windowHeight * 0.5);
  const fullscreenHeight = Math.max(windowHeight - FULLSCREEN_CHROME, MIN_FULLSCREEN_HEIGHT);

  const sharedProps = { ...mapProps, garages, selectedId, onSelectGarage };

  return (
    <>
      <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
        <SizeButton
          testID="map-resize"
          label={half ? t('garageSearch.mapShrink') : t('garageSearch.mapGrow')}
          icon={half ? Minimize2 : Maximize2}
          onPress={() => setHalf((value) => !value)}
        />
        <SizeButton
          testID="map-fullscreen"
          label={t('garageSearch.mapFullscreen')}
          icon={Maximize2}
          onPress={() => setFullscreen(true)}
        />
      </View>

      <GarageMapView {...sharedProps} height={half ? halfHeight : undefined} />

      <Modal visible={fullscreen} animationType="fade" onRequestClose={() => setFullscreen(false)}>
        <Screen scroll={false} style={{ paddingHorizontal: spacing.lg, paddingVertical: spacing.lg }}>
          <View style={{ flexDirection: 'row', justifyContent: 'flex-end', marginBottom: spacing.sm }}>
            <SizeButton testID="map-close" label={t('garageSearch.mapClose')} icon={X} onPress={() => setFullscreen(false)} />
          </View>

          {fullscreen ? <GarageMapView {...sharedProps} height={fullscreenHeight} fullscreen /> : null}

          <View
            testID="map-selected-garage"
            style={{ borderWidth: 1, borderColor: colors.hairlines[2], padding: spacing.lg, backgroundColor: colors.fieldBackground }}
          >
            {selected ? (
              <>
                <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>{selected.name}</Text>
                {selected.neighbourhood && selected.neighbourhood !== 'Adresse non disponible' ? (
                  <Text style={[textStyles.bodySecondary, { color: colors.textMuted, marginTop: spacing.xs }]}>{selected.neighbourhood}</Text>
                ) : null}
                {onOpenGarage ? (
                  <TouchableOpacity
                    accessibilityRole="button"
                    testID="map-open-garage"
                    onPress={() => {
                      setFullscreen(false);
                      onOpenGarage(selected.id);
                    }}
                    style={{ marginTop: spacing.md }}
                  >
                    <Text style={[textStyles.button, { color: colors.accentOnBackground }]}>{t('garageSearch.mapOpenGarage')}</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : (
              <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>{t('garageSearch.mapPickHint')}</Text>
            )}
          </View>
        </Screen>
      </Modal>
    </>
  );
}

function SizeButton({
  label,
  icon: Icon,
  onPress,
  testID,
}: {
  label: string;
  icon: typeof Maximize2;
  onPress: () => void;
  testID: string;
}) {
  const { colors } = useTheme();
  return (
    <TouchableOpacity
      accessibilityRole="button"
      accessibilityLabel={label}
      testID={testID}
      onPress={onPress}
      hitSlop={6}
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.hairlines[2],
        paddingHorizontal: spacing.md,
        paddingVertical: spacing.xs,
        marginLeft: spacing.sm,
      }}
    >
      <Icon size={14} strokeWidth={1.5} color={colors.accentOnBackground} />
      <Text style={[textStyles.sectionLabel, { color: colors.accentOnBackground, marginLeft: spacing.xs }]}>{label}</Text>
    </TouchableOpacity>
  );
}
