import React, { useState } from 'react';
import { Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { MapPin } from 'lucide-react-native';
import { Screen, Card, Tag, Button } from '../../components';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { MockGarage, mockGarages } from '../../mocks/mockData';
import type { QuoteEmailPreview } from '../../services/garages';
import { GarageMapView } from '../11-GarageSearch/GarageMapView';
import { DirectionsSheet } from './DirectionsSheet';
import { EmailPreviewModal } from './EmailPreviewModal';

type Garage = MockGarage & { phone?: string };

const UNKNOWN_ADDRESS = 'Adresse non disponible';

interface GarageProfileScreenProps {
  garage?: Garage;
  onRequestAppointment?: () => void;
  onViewEmailBeforeSending?: () => void;
  onBack?: () => void;
  /** The "view the email before sending" window: open, still loading, failed, or showing the message. */
  emailPreviewOpen?: boolean;
  emailPreviewLoading?: boolean;
  emailPreviewError?: string | null;
  emailPreview?: QuoteEmailPreview | null;
  onCloseEmailPreview?: () => void;
}

export function GarageProfileScreen({
  garage = mockGarages[0],
  onRequestAppointment = () => {},
  onViewEmailBeforeSending = () => {},
  onBack,
  emailPreviewOpen = false,
  emailPreviewLoading = false,
  emailPreviewError = null,
  emailPreview = null,
  onCloseEmailPreview = () => {},
}: GarageProfileScreenProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [directionsOpen, setDirectionsOpen] = useState(false);
  const hasAddress = Boolean(garage.neighbourhood) && garage.neighbourhood !== UNKNOWN_ADDRESS;

  return (
    <Screen>
      {onBack ? (
        <Text
          onPress={onBack}
          testID="screen-back-button"
          accessibilityRole="button"
          style={[textStyles.button, { color: colors.textSecondary, fontSize: 13, marginBottom: spacing.lg }]}
        >
          ‹ {t('common.back')}
        </Text>
      ) : null}
      <View testID="garage-location-map">
        <GarageMapView
          origin={{ lat: garage.lat, lng: garage.lng }}
          radiusKm={1.5}
          garages={[{ id: garage.id, name: garage.name, lat: garage.lat, lng: garage.lng }]}
          selectedId={garage.id}
          showOrigin={false}
          height={180}
        />
      </View>
      <Text style={[textStyles.onboardingTitle, { color: colors.textPrimary, marginBottom: spacing.md }]}>
        {garage.name}
      </Text>
      {hasAddress ? (
        <TouchableOpacity
          accessibilityRole="button"
          accessibilityLabel={`${garage.neighbourhood}. ${t('garageProfile.directions')}`}
          testID="garage-address"
          onPress={() => setDirectionsOpen(true)}
          style={{ flexDirection: 'row', alignItems: 'flex-start', marginBottom: spacing.lg }}
        >
          <MapPin size={18} strokeWidth={1.5} color={colors.accentOnBackground} style={{ marginTop: 2, marginRight: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text style={[textStyles.body, { color: colors.textPrimary, fontSize: 17, lineHeight: 24 }]}>
              {garage.neighbourhood}
            </Text>
            <Text style={[textStyles.sectionLabel, { color: colors.accentOnBackground, marginTop: spacing.xs }]}>
              {t('garageProfile.directions')} ›
            </Text>
          </View>
        </TouchableOpacity>
      ) : null}
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginBottom: spacing.xxl }}>
        {garage.distanceKm > 0 ? <Tag label={`${garage.distanceKm} km`} /> : null}
        {garage.rating > 0 ? (
          <Tag label={`${garage.rating} ★ · ${garage.reviewCount} ${t('garageProfile.reviews')}`} tone="accent" />
        ) : null}
        {garage.certifiedCaa ? <Tag label={t('garageProfile.certified')} tone="accent" /> : null}
        {garage.openUntil ? <Tag label={`${t('garageProfile.open')} · ${garage.openUntil}`} /> : null}
      </View>

      <Card style={{ padding: 0, overflow: 'hidden' }}>
        <View style={{ flexDirection: 'row' }}>
          <StatCell
            label={t('garageProfile.price')}
            value={garage.priceCents ? `${(garage.priceCents / 100).toFixed(0)} $` : '—'}
            border={colors.hairlines[3]}
          />
          <StatCell
            label={t('garageProfile.wait')}
            value={garage.waitDays != null ? `${garage.waitDays} j` : '—'}
            border={colors.hairlines[3]}
          />
        </View>
        <View style={{ flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.hairlines[3] }}>
          <StatCell
            label={t('garageProfile.commute')}
            value={garage.commuteMinutes != null ? `${garage.commuteMinutes} min` : '—'}
            border={colors.hairlines[3]}
          />
          <StatCell
            label={t('garageProfile.warranty')}
            value={garage.warrantyMonths != null ? `${garage.warrantyMonths} m` : '—'}
          />
        </View>
      </Card>
      <View style={{ marginBottom: spacing.xxl }} />

      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.md }]}>
        {t('garageProfile.relevantServices')}
      </Text>
      <Text style={[textStyles.body, { color: colors.textSecondary, marginBottom: spacing.xxl }]}>
        {garage.services?.join(' · ')}
      </Text>

      <Card>
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginBottom: spacing.md }}>
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary }]}>
            {t('garageProfile.contactMethod')}
          </Text>
          <Tag label={t('garageProfile.detectedByAi')} tone="accent" />
        </View>
        <Text style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
          {garage.email
            ? `${t('garageProfile.emailLabel')} — ${garage.email}`
            : t('garageProfile.noEmail')}
        </Text>
        {garage.phone ? (
          <Text testID="garage-phone" style={[textStyles.body, { color: colors.textPrimary, marginBottom: spacing.sm }]}>
            {t('garageProfile.phone')} — {garage.phone}
          </Text>
        ) : null}
        <Text style={[textStyles.bodySecondary, { color: colors.textMuted }]}>
          {t('garageProfile.voiceFallback')}
        </Text>
      </Card>

      <Button
        label={t('garageProfile.requestAppointment')}
        testID="request-appointment-button"
        onPress={onRequestAppointment}
      />
      <Button
        label={t('garageProfile.viewEmailBeforeSending')}
        variant="secondary"
        testID="view-email-button"
        onPress={onViewEmailBeforeSending}
      />

      <DirectionsSheet visible={directionsOpen} target={{ lat: garage.lat, lng: garage.lng }} onClose={() => setDirectionsOpen(false)} />
      <EmailPreviewModal
        visible={emailPreviewOpen}
        loading={emailPreviewLoading}
        error={emailPreviewError}
        preview={emailPreview}
        onClose={onCloseEmailPreview}
        onSend={() => {
          onCloseEmailPreview();
          onRequestAppointment();
        }}
      />
    </Screen>
  );
}

function StatCell({ label, value, border }: { label: string; value: string; border?: string }) {
  const { colors } = useTheme();
  return (
    <View
      style={{
        flex: 1,
        padding: spacing.lg,
        borderRightWidth: border ? 1 : 0,
        borderRightColor: border,
      }}
    >
      <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.xs, fontSize: 10 }]}>
        {label}
      </Text>
      <Text style={[textStyles.cardTitle, { color: colors.textPrimary, fontSize: 18 }]}>{value}</Text>
    </View>
  );
}
