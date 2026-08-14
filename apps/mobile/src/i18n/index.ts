import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as Localization from 'expo-localization';
import fr from './fr.json';
import en from './en.json';

export const resources = {
  fr: { translation: fr },
  en: { translation: en },
} as const;

export type SupportedLanguage = keyof typeof resources;

export function detectDeviceLanguage(): SupportedLanguage {
  const tag = Localization.getLocales()[0]?.languageCode;
  return tag === 'en' ? 'en' : 'fr';
}

export function initI18n(language: SupportedLanguage) {
  if (!i18n.isInitialized) {
    i18n.use(initReactI18next).init({
      resources,
      lng: language,
      fallbackLng: 'fr',
      interpolation: { escapeValue: false },
      compatibilityJSON: 'v4',
    });
  } else {
    i18n.changeLanguage(language);
  }
  return i18n;
}

export default i18n;
