import React, { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useTheme } from '../../theme';
import { spacing } from '../../theme/spacing';
import { GarageMap, MapGarage } from './GarageMap';

const MAP_HEIGHT = 240;
const TILE_URL = 'https://tile.openstreetmap.org/{z}/{x}/{y}.png';
const TILE_ATTRIBUTION = '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener noreferrer">OpenStreetMap</a>';

interface LeafletGarageMapProps {
  origin: { lat: number; lng: number };
  garages: MapGarage[];
  radiusKm: number;
  selectedId?: string;
  onSelectGarage?: (garageId: string) => void;
  height?: number;
  /** Full-screen map: the page behind doesn't scroll, so one finger pans and the wheel zooms. */
  fullscreen?: boolean;
}

/** Real, pannable map for the web: OpenStreetMap tiles drawn by Leaflet (free, no API key).
 * Same props as the schematic GarageMap, which it falls back to if the map cannot start. */
export function LeafletGarageMap(props: LeafletGarageMapProps) {
  const { origin, garages, radiusKm, selectedId, onSelectGarage, height = MAP_HEIGHT, fullscreen = false } = props;
  const { colors } = useTheme();
  const [failed, setFailed] = useState(false);
  const container = useRef<HTMLDivElement>(null);
  const map = useRef<L.Map | null>(null);
  const layers = useRef<L.LayerGroup | null>(null);
  const onSelect = useRef(onSelectGarage);
  onSelect.current = onSelectGarage;

  /** The map is a nicety: if Leaflet fails for any reason, fall back to the simple map instead of crashing the screen. */
  function giveUp(error: unknown) {
    console.error('[MekaMemo] The map could not be drawn, showing the simple map instead:', error);
    setFailed(true);
  }

  const isLight = colors.mode === 'light';
  const markerFill = isLight ? '#ffffff' : '#0f1317';

  useEffect(() => {
    if (!container.current) return;
    try {
      const instance = L.map(container.current, {
        // One-finger drags must keep scrolling the page on phones; pinching still zooms.
        dragging: fullscreen || !L.Browser.mobile,
        scrollWheelZoom: fullscreen,
        zoomSnap: 0.5,
      });
      instance.attributionControl.setPrefix(false);
      L.tileLayer(TILE_URL, { maxZoom: 19, attribution: TILE_ATTRIBUTION }).addTo(instance);
      layers.current = L.layerGroup().addTo(instance);
      map.current = instance;
    } catch (error) {
      giveUp(error);
      return;
    }
    return () => {
      map.current?.remove();
      map.current = null;
      layers.current = null;
    };
  }, []);

  // Frame the search area whenever the search point, radius or map size changes.
  useEffect(() => {
    if (!map.current) return;
    try {
      map.current.invalidateSize({ animate: false }); // the container may have just grown or shrunk
      const area = L.latLng(origin.lat, origin.lng).toBounds(Math.max(radiusKm, 1) * 2000);
      map.current.fitBounds(area, { padding: [12, 12], animate: false });
    } catch (error) {
      giveUp(error);
    }
  }, [origin.lat, origin.lng, radiusKm, height]);

  // Draw the search point, the radius and the garages.
  useEffect(() => {
    const group = layers.current;
    if (!group) return;
    try {
      group.clearLayers();

      L.circle([origin.lat, origin.lng], {
        radius: Math.max(radiusKm, 1) * 1000,
        color: colors.accent,
        weight: 1,
        dashArray: '4 4',
        fillOpacity: 0.05,
        interactive: false,
      }).addTo(group);

      L.marker([origin.lat, origin.lng], {
        interactive: false,
        keyboard: false,
        icon: L.divIcon({
          className: '',
          iconSize: [14, 14],
          html: `<div data-testid="garage-map-origin" style="width:14px;height:14px;background:#ffffff;border:2px solid ${colors.accent};box-shadow:0 0 0 2px rgba(0,0,0,.35)"></div>`,
        }),
      }).addTo(group);

      for (const garage of garages) {
        const selected = garage.id === selectedId;
        L.circleMarker([garage.lat, garage.lng], {
          radius: selected ? 9 : 7,
          color: colors.accent,
          weight: 2.5,
          fillColor: selected ? colors.accent : markerFill,
          fillOpacity: 1,
        })
          .bindTooltip(garage.name, { direction: 'top', offset: [0, -6] })
          .on('click', () => onSelect.current?.(garage.id))
          .addTo(group);
      }
    } catch (error) {
      giveUp(error);
    }
  },[origin.lat, origin.lng, radiusKm, garages, selectedId, colors.accent, markerFill]);

  if (failed) return <GarageMap {...props} />;

  return (
    <div
      data-testid="garage-map"
      style={{
        position: 'relative',
        zIndex: 0, // keeps Leaflet's own layers (z-index up to 1000) from covering the tab bar
        height,
        marginBottom: spacing.xl,
        border: `1px solid ${colors.hairlines[2]}`,
        boxSizing: 'border-box',
        overflow: 'hidden',
      }}
    >
      <style>{`.mm-map-dark .leaflet-tile-pane{filter:invert(1) hue-rotate(180deg) brightness(.92) contrast(.9) saturate(.8)}`}</style>
      <div ref={container} className={isLight ? undefined : 'mm-map-dark'} style={{ width: '100%', height: '100%', background: isLight ? '#e8ecf0' : '#1b2128' }} />
    </div>
  );
}
