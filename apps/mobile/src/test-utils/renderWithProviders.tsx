import React from 'react';
import { render, RenderAPI } from '@testing-library/react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';
import { ThemeProvider, ThemeMode } from '../theme';
import i18n, { initI18n } from '../i18n';

initI18n('fr');

interface RenderOptions {
  themeMode?: ThemeMode;
  language?: 'fr' | 'en';
  withNavigationContainer?: boolean;
}

export async function renderWithProviders(
  ui: React.ReactElement,
  { themeMode = 'dark', language = 'fr', withNavigationContainer = true }: RenderOptions = {},
): Promise<RenderAPI> {
  i18n.changeLanguage(language);

  const tree = (
    <SafeAreaProvider initialMetrics={initialWindowMetrics}>
      <I18nextProvider i18n={i18n}>
        <ThemeProvider initialMode={themeMode}>
          {withNavigationContainer ? <NavigationContainer>{ui}</NavigationContainer> : ui}
        </ThemeProvider>
      </I18nextProvider>
    </SafeAreaProvider>
  );

  return render(tree);
}
