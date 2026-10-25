import { Platform } from 'react-native';

export const fontFamily = {
  condensedMedium: 'BarlowCondensed_500Medium',
  condensedSemiBold: 'BarlowCondensed_600SemiBold',
  condensedBold: 'BarlowCondensed_700Bold',
  bodyRegular: 'Barlow_400Regular',
  bodyMedium: 'Barlow_500Medium',
  bodySemiBold: 'Barlow_600SemiBold',
} as const;

export const textStyles = {
  screenTitle: {
    fontFamily: fontFamily.condensedSemiBold,
    fontSize: 30,
    letterSpacing: 0,
  },
  onboardingTitle: {
    fontFamily: fontFamily.condensedSemiBold,
    fontSize: 34,
    letterSpacing: -0.01 * 34,
  },
  cardTitle: {
    fontFamily: fontFamily.condensedSemiBold,
    fontSize: 22,
    letterSpacing: 0,
  },
  featureNumber: {
    fontFamily: fontFamily.condensedSemiBold,
    fontSize: 38,
    letterSpacing: 0,
  },
  sectionLabel: {
    fontFamily: fontFamily.condensedMedium,
    fontSize: 11.5,
    letterSpacing: 0.15 * 11.5,
    textTransform: 'uppercase' as const,
  },
  button: {
    fontFamily: fontFamily.condensedSemiBold,
    fontSize: 17,
    letterSpacing: 0.08 * 17,
    textTransform: 'uppercase' as const,
  },
  body: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 15,
    letterSpacing: 0,
  },
  bodySecondary: {
    fontFamily: fontFamily.bodyRegular,
    fontSize: 13.5,
    letterSpacing: 0,
  },
  statusBar: {
    fontFamily: fontFamily.bodySemiBold,
    fontSize: 12,
    letterSpacing: 0,
  },
} as const;

/**
 * Text fields on the web must use at least 16px type: iPhone browsers zoom the whole page in when a
 * smaller field gets focus, and may stay zoomed afterwards, leaving the top bar and tab bar off screen.
 */
export const noZoomInput = Platform.OS === 'web' ? ({ fontSize: 16 } as const) : {};
