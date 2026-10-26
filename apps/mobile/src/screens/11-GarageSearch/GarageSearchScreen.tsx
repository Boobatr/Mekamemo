import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import { Screen, Card, Field, Tag, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockGarages, mockUserLocation } from '../../mocks/mockData';
import { ExpandableGarageMap } from './ExpandableGarageMap';

interface GarageSearchScreenProps {
  userQuery?: string;
  assistantSummary?: string;
  results?: typeof mockGarages;
  origin?: { lat: number; lng: number };
  radiusKm?: number;
  quickFilters?: string[];
  onSelectGarage?: (garageId: string) => void;
  onSendQuery?: (text: string) => void;
  /** Opens the form for a garage that is missing from the results. The link is hidden without it. */
  onAddGarage?: () => void;
  /** Search from the device's current position (web only; the button is hidden without it). */
  onUseMyPosition?: () => void;
  /** Go back to searching from the postal code. Offered while a position is in use. */
  onUsePostalCode?: () => void;
  locating?: boolean;
  locationFailed?: boolean;
  /** "For: oil change": what the garage will be asked about. */
  contextLabel?: string;
  onClearContext?: () => void;
  /** Write one email to several of the listed garages at once. The option is hidden without it. */
  onWriteToGarages?: (garageIds: string[]) => void;
}

/** More garages than this in one request is a mass mailing, not a quote comparison (the server refuses it too). */
export const MAX_GARAGES_PER_REQUEST = 10;

export function GarageSearchScreen({
  userQuery = 'Trouve un garage pour la vidange du RAV4, samedi matin si possible.',
  assistantSummary = "Cinq ateliers certifiés dans 4 km acceptent l'huile 0W-20. Voici les trois plus proches, du moins cher au plus rapide.",
  results = mockGarages,
  origin = mockUserLocation,
  radiusKm = 4,
  quickFilters = ['Le moins cher', 'Ouvert samedi', 'Concessionnaire'],
  onSelectGarage = () => {},
  onSendQuery = () => {},
  onAddGarage,
  onUseMyPosition,
  onUsePostalCode,
  locating = false,
  locationFailed = false,
  contextLabel,
  onClearContext,
  onWriteToGarages,
}: GarageSearchScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);
  // "Write to several garages": tapping a card ticks it instead of opening it.
  const [selecting, setSelecting] = useState(false);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  function stopSelecting() {
    setSelecting(false);
    setSelectedIds([]);
  }

  function toggleSelected(garageId: string) {
    setSelectedIds((ids) =>
      ids.includes(garageId) ? ids.filter((id) => id !== garageId) : ids.length < MAX_GARAGES_PER_REQUEST ? [...ids, garageId] : ids,
    );
  }

  function handleSend() {
    if (!draft.trim()) return;
    onSendQuery(draft.trim());
    setDraft('');
  }

  return (
    <View style={{ flex: 1 }}>
      <Screen>
        {contextLabel ? (
          <View
            testID="search-context"
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              justifyContent: 'space-between',
              borderWidth: 1,
              borderColor: colors.accent,
              padding: spacing.md,
              marginBottom: spacing.lg,
            }}
          >
            <Text style={[textStyles.button, { color: colors.accentOnBackground, flexShrink: 1 }]}>{contextLabel}</Text>
            {onClearContext ? (
              <Text
                accessibilityRole="button"
                accessibilityLabel={t('garageSearch.clearContext')}
                testID="clear-search-context"
                onPress={onClearContext}
                style={[textStyles.button, { color: colors.textSecondary, marginLeft: spacing.md }]}
              >
                ✕
              </Text>
            ) : null}
          </View>
        ) : null}
        <ExpandableGarageMap
          origin={origin}
          radiusKm={radiusKm}
          garages={results.map((g) => ({ id: g.id, name: g.name, lat: g.lat, lng: g.lng, neighbourhood: g.neighbourhood }))}
          selectedId={highlightedId}
          onSelectGarage={setHighlightedId}
          onOpenGarage={onSelectGarage}
        />

        {onUsePostalCode || onUseMyPosition ? (
          <View style={{ marginBottom: spacing.lg }}>
            {onUsePostalCode ? (
              <Text testID="position-in-use" style={[textStyles.bodySecondary, { color: colors.textSecondary, marginBottom: spacing.xs }]}>
                {t('garageSearch.positionInUse')}
              </Text>
            ) : null}
            <Text
              accessibilityRole="button"
              testID={onUsePostalCode ? 'use-postal-code' : 'use-my-position'}
              onPress={onUsePostalCode ?? onUseMyPosition}
              style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 13 }]}
            >
              {onUsePostalCode
                ? t('garageSearch.usePostalCode')
                : locating
                  ? t('garageSearch.locating')
                  : t('garageSearch.useMyPosition')}
            </Text>
            {locationFailed ? (
              <Text testID="location-error" style={[textStyles.bodySecondary, { color: colors.textMuted, marginTop: spacing.xs }]}>
                {t('garageSearch.locationFailed')}
              </Text>
            ) : null}
          </View>
        ) : null}

        {onWriteToGarages && results.length > 1 && !selecting ? (
          <Text
            accessibilityRole="button"
            testID="multi-select-toggle"
            onPress={() => setSelecting(true)}
            style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 13, marginBottom: spacing.lg }]}
          >
            {t('garageSearch.writeToSeveral')}
          </Text>
        ) : null}
        {selecting ? (
          <Text testID="multi-select-hint" style={[textStyles.bodySecondary, { color: colors.textSecondary, marginBottom: spacing.lg }]}>
            {t('garageSearch.selectHint', { max: MAX_GARAGES_PER_REQUEST })}
          </Text>
        ) : null}

        <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xl }]}>
          {t('garageSearch.resultsNear', { count: results.length, radius: radiusKm }).toUpperCase()}
        </Text>

        <View style={{ alignItems: 'flex-end', marginBottom: spacing.lg }}>
          <View style={{ maxWidth: '82%', backgroundColor: colors.accentPanelSolid, padding: spacing.lg }}>
            <Text style={[textStyles.body, { color: '#ffffff' }]}>{userQuery}</Text>
          </View>
        </View>

        <View style={{ alignItems: 'flex-start', marginBottom: spacing.xl }}>
          <View style={{ maxWidth: '88%', borderWidth: 1, borderColor: colors.hairlines[2], padding: spacing.lg }}>
            <Text style={[textStyles.sectionLabel, { color: colors.accentOnBackground, marginBottom: spacing.sm }]}>
              {t('garageSearch.assistant')}
            </Text>
            <Text style={[textStyles.body, { color: colors.textSecondary }]}>{assistantSummary}</Text>
          </View>
        </View>

        {results.map((garage) => (
          <TouchableOpacity
            key={garage.id}
            accessibilityRole="button"
            testID={`garage-result-${garage.id}`}
            onPress={() => {
              setHighlightedId(garage.id);
              if (!selecting) onSelectGarage(garage.id);
              else if (garage.contactMethod === 'email') toggleSelected(garage.id);
            }}
            activeOpacity={0.85}
          >
            <Card
              style={{
                ...(garage.id === highlightedId || selectedIds.includes(garage.id) ? { borderColor: colors.accent } : {}),
                // A garage with no email can't receive the message: shown, but not tickable.
                ...(selecting && garage.contactMethod !== 'email' ? { opacity: 0.45 } : {}),
              }}
            >
              <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
                {selecting ? (
                  <Text
                    testID={`garage-check-${garage.id}`}
                    accessibilityState={{ checked: selectedIds.includes(garage.id), disabled: garage.contactMethod !== 'email' }}
                    style={[textStyles.cardTitle, { color: colors.accentOnBackground }]}
                  >
                    {selectedIds.includes(garage.id) ? '☑' : '☐'}
                  </Text>
                ) : null}
                <View style={{ flex: 1 }}>
                  <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
                    {garage.name}
                  </Text>
                  {garage.neighbourhood && garage.neighbourhood !== 'Adresse non disponible' ? (
                    <Text
                      testID={`garage-address-${garage.id}`}
                      style={[textStyles.bodySecondary, { color: colors.textMuted, marginBottom: spacing.xs }]}
                    >
                      {garage.neighbourhood}
                    </Text>
                  ) : null}
                  <Text style={[textStyles.bodySecondary, { color: colors.textSecondary }]}>
                    {[
                      `${garage.distanceKm} km`,
                      // Real-world garages often have no rating or price yet: say nothing rather than "0 ★".
                      garage.rating > 0 ? `${garage.rating} ★` : null,
                      garage.priceCents > 0 ? `${(garage.priceCents / 100).toFixed(0)} $` : null,
                      garage.contactMethod === 'email' ? 'courriel' : selecting ? t('garageSearch.noEmailKnown') : 'téléphone',
                    ]
                      .filter(Boolean)
                      .join(' · ')}
                  </Text>
                </View>
                <Text style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 12, flexShrink: 0 }]}>
                  {garage.slotLabel}
                </Text>
              </View>
            </Card>
          </TouchableOpacity>
        ))}

        {onAddGarage ? (
          <TouchableOpacity
            accessibilityRole="button"
            testID="add-garage-link"
            onPress={onAddGarage}
            style={{ borderWidth: 1, borderColor: colors.hairlines[2], padding: spacing.lg, marginBottom: spacing.xl }}
          >
            <Text style={[textStyles.button, { color: colors.accentOnBackground, textAlign: 'center' }]}>
              {t('garageSearch.addGarageLink')}
            </Text>
          </TouchableOpacity>
        ) : null}

        <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xxl }}>
          {quickFilters.map((filter) => (
            <Tag key={filter} label={filter} />
          ))}
        </View>

        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <View style={{ flex: 1 }}>
            <Field
              label=""
              value={draft}
              onChangeText={setDraft}
              placeholder={t('garageSearch.placeholder')}
              testID="garage-search-input"
            />
          </View>
          <TouchableOpacity
            accessibilityRole="button"
            testID="garage-search-send"
            onPress={handleSend}
            style={{ marginLeft: spacing.md, marginBottom: spacing.xl }}
          >
            <Send size={20} strokeWidth={1.5} color={colors.accentOnBackground} />
          </TouchableOpacity>
        </View>

        <Text
          testID="osm-attribution"
          style={[textStyles.bodySecondary, { color: colors.textMuted, textAlign: 'center', fontSize: 11 }]}
        >
          {t('garageSearch.osmAttribution')}
        </Text>
        {selecting ? <View style={{ height: 96 }} /> : null}
      </Screen>
      {selecting ? (
        <View
          testID="selection-bar"
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            flexDirection: 'row',
            alignItems: 'center',
            justifyContent: 'space-between',
            gap: spacing.md,
            padding: spacing.lg,
            borderTopWidth: 1,
            borderTopColor: colors.hairlines[2],
            backgroundColor: colors.mode === 'light' ? '#ffffff' : '#12171c',
          }}
        >
          <View style={{ flexShrink: 1 }}>
            <Text testID="selected-count" style={[textStyles.button, { color: colors.textPrimary }]}>
              {t('garageSearch.selectedCount', { count: selectedIds.length })}
            </Text>
            <Text accessibilityRole="button" testID="cancel-selection" onPress={stopSelecting} style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 12, marginTop: spacing.xs }]}>
              {t('common.cancel')}
            </Text>
          </View>
          <Button
            label={t('garageSearch.writeToSelected')}
            disabled={selectedIds.length === 0}
            testID="write-to-selected"
            style={{ marginTop: 0, paddingHorizontal: spacing.xl }}
            onPress={() => {
              onWriteToGarages?.(selectedIds);
              stopSelecting();
            }}
          />
        </View>
      ) : null}
    </View>
  );
}
