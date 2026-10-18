import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import { Screen, Card, Field, Tag } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockGarages, mockUserLocation } from '../../mocks/mockData';
import { GarageMapView } from './GarageMapView';

interface GarageSearchScreenProps {
  userQuery?: string;
  assistantSummary?: string;
  results?: typeof mockGarages;
  origin?: { lat: number; lng: number };
  radiusKm?: number;
  quickFilters?: string[];
  onSelectGarage?: (garageId: string) => void;
  onSendQuery?: (text: string) => void;
}

export function GarageSearchScreen({
  userQuery = 'Trouve un garage pour la vidange du RAV4, samedi matin si possible.',
  assistantSummary = "Cinq ateliers certifiés dans 4 km acceptent l'huile 0W-20. Voici les trois plus proches, du moins cher au plus rapide.",
  results = mockGarages,
  origin = mockUserLocation,
  radiusKm = 4,
  quickFilters = ['Le moins cher', 'Ouvert samedi', 'Concessionnaire'],
  onSelectGarage = () => {},
  onSendQuery = () => {},
}: GarageSearchScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');
  const [highlightedId, setHighlightedId] = useState<string | undefined>(undefined);

  function handleSend() {
    if (!draft.trim()) return;
    onSendQuery(draft.trim());
    setDraft('');
  }

  return (
    <Screen>
      <GarageMapView
        origin={origin}
        radiusKm={radiusKm}
        garages={results}
        selectedId={highlightedId}
        onSelectGarage={setHighlightedId}
      />

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
            onSelectGarage(garage.id);
          }}
          activeOpacity={0.85}
        >
          <Card style={garage.id === highlightedId ? { borderColor: colors.accent } : undefined}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: spacing.md }}>
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
                    garage.contactMethod === 'email' ? 'courriel' : 'téléphone',
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
    </Screen>
  );
}
