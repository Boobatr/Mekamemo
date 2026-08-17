import React from 'react';
import { render } from '@testing-library/react-native';
import { SafeAreaProvider, initialWindowMetrics } from 'react-native-safe-area-context';
import { NavigationContainer } from '@react-navigation/native';
import { I18nextProvider } from 'react-i18next';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ThemeProvider } from '../theme';
import i18n, { initI18n } from '../i18n';

initI18n('fr');

type RenderAPI = Awaited<ReturnType<typeof render>>;

interface RenderOptions {
  themeMode?: 'dark' | 'light';
  language?: 'fr' | 'en';
  withNavigationContainer?: boolean;
}

export async function renderWithProviders(
  ui: React.ReactElement,
  { themeMode = 'dark', language = 'fr', withNavigationContainer = true }: RenderOptions = {},
): Promise<RenderAPI> {
  i18n.changeLanguage(language);

  // No retries/backoff in tests — a failed query should fail fast and visibly.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false }, mutations: { retry: false } },
  });

  const tree = (
    <QueryClientProvider client={queryClient}>
      <SafeAreaProvider initialMetrics={initialWindowMetrics}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider initialMode={themeMode}>
            {withNavigationContainer ? <NavigationContainer>{ui}</NavigationContainer> : ui}
          </ThemeProvider>
        </I18nextProvider>
      </SafeAreaProvider>
    </QueryClientProvider>
  );

  return render(tree);
}
