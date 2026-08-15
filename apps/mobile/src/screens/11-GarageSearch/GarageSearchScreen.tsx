import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { Send } from 'lucide-react-native';
import { Screen, Card, Field, Tag } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { mockGarages } from '../../mocks/mockData';

interface GarageSearchScreenProps {
  userQuery?: string;
  assistantSummary?: string;
  results?: typeof mockGarages;
  quickFilters?: string[];
  onSelectGarage?: (garageId: string) => void;
  onSendQuery?: (text: string) => void;
}

export function GarageSearchScreen({
  userQuery = 'Trouve un garage pour la vidange du RAV4, samedi matin si possible.',
  assistantSummary = "Cinq ateliers certifiés dans 4 km acceptent l'huile 0W-20. Voici les trois plus proches, du moins cher au plus rapide.",
  results = mockGarages,
  quickFilters = ['Le moins cher', 'Ouvert samedi', 'Concessionnaire'],
  onSelectGarage = () => {},
  onSendQuery = () => {},
}: GarageSearchScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [draft, setDraft] = useState('');

  function handleSend() {
    if (!draft.trim()) return;
    onSendQuery(draft.trim());
    setDraft('');
  }

  return (
    <Screen>
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xl }]}>
        {t('garageSearch.resultsNear', { count: results.length, radius: 4 }).toUpperCase()}
      </Text>

      <Card withMarks={false}>
        <Text style={[textStyles.body, { color: colors.textPrimary }]}>{userQuery}</Text>
      </Card>

      <View style={{ marginBottom: spacing.xl }}>
        <Text style={[textStyles.sectionLabel, { color: colors.accentOnBackground, marginBottom: spacing.sm }]}>
          {t('garageSearch.assistant')}
        </Text>
        <Text style={[textStyles.body, { color: colors.textSecondary }]}>{assistantSummary}</Text>
      </View>

      {results.map((garage) => (
        <TouchableOpacity
          key={garage.id}
          accessibilityRole="button"
          testID={`garage-result-${garage.id}`}
          onPress={() => onSelectGarage(garage.id)}
          activeOpacity={0.85}
        >
          <Card>
            <Text style={[textStyles.cardTitle, { color: colors.textPrimary, marginBottom: spacing.xs }]}>
              {garage.name}
            </Text>
            <Text style={[textStyles.bodySecondary, { color: colors.textSecondary }]}>
              {garage.distanceKm} km · {garage.rating} ★ · {(garage.priceCents / 100).toFixed(0)} $ ·{' '}
              {garage.contactMethod === 'email' ? 'courriel' : 'téléphone'}
            </Text>
            <Text style={[textStyles.button, { color: colors.accentOnBackground, fontSize: 12, marginTop: spacing.sm }]}>
              {garage.slotLabel}
            </Text>
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
    </Screen>
  );
}
