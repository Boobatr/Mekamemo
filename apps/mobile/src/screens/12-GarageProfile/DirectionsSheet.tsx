import React from 'react';
import { Linking, Modal, Pressable, Text, TouchableOpacity, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../theme';
import { textStyles } from '../../theme/typography';
import { spacing } from '../../theme/spacing';
import { directionsLinks, DirectionsTarget } from '../../utils/directions';

interface DirectionsSheetProps {
  visible: boolean;
  target: DirectionsTarget;
  onClose: () => void;
}

const APP_LABELS = { google: 'Google Maps', apple: 'Apple Maps', waze: 'Waze' } as const;

/** "Which map app?" — each choice opens the route to the garage in that app. */
export function DirectionsSheet({ visible, target, onClose }: DirectionsSheetProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <Pressable
        testID="directions-backdrop"
        onPress={onClose}
        style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' }}
      >
        <Pressable
          onPress={() => {}}
          style={{
            backgroundColor: colors.mode === 'light' ? '#ffffff' : '#12171c',
            borderTopWidth: 1,
            borderColor: colors.hairlines[2],
            padding: spacing.xl,
          }}
        >
          <Text style={[textStyles.sectionLabel, { color: colors.textTertiary, marginBottom: spacing.lg }]}>
            {t('garageProfile.directionsTitle')}
          </Text>
          {directionsLinks(target).map(({ app, url }) => (
            <TouchableOpacity
              key={app}
              accessibilityRole="link"
              testID={`directions-${app}`}
              onPress={() => {
                Linking.openURL(url);
                onClose();
              }}
              style={{ paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.hairlines[3] }}
            >
              <Text style={[textStyles.cardTitle, { color: colors.textPrimary }]}>{APP_LABELS[app]}</Text>
            </TouchableOpacity>
          ))}
          <TouchableOpacity
            accessibilityRole="button"
            testID="directions-cancel"
            onPress={onClose}
            style={{ paddingVertical: spacing.lg, borderTopWidth: 1, borderTopColor: colors.hairlines[3] }}
          >
            <Text style={[textStyles.button, { color: colors.accentOnBackground }]}>{t('common.cancel')}</Text>
          </TouchableOpacity>
        </Pressable>
      </Pressable>
    </Modal>
  );
}
