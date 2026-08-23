import 'react-native-gesture-handler';
import React from 'react';
import { ActivityIndicator, Platform, View } from 'react-native';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { I18nextProvider } from 'react-i18next';
import { StatusBar } from 'expo-status-bar';
import { ThemeProvider, useAppFonts } from './src/theme';
import { screenGeometry } from './src/theme/spacing';
import i18n, { detectDeviceLanguage, initI18n } from './src/i18n';
import { RootNavigator } from './src/navigation/RootNavigator';

const queryClient = new QueryClient();

/**
 * The product is mobile-only by design (no desktop mockup exists). On a wide
 * browser window, react-native-web's root otherwise leaves the surrounding
 * viewport unstyled, which browsers with auto-dark-mode render as a jarring
 * grey void. Pin the app to a phone-width column on a themed backdrop instead.
 */
function WebFrame({ children }: { children: React.ReactNode }) {
  if (Platform.OS !== 'web') return <>{children}</>;
  return (
    <View style={{ flex: 1, alignItems: 'center', backgroundColor: '#08090b' }}>
      <View style={{ flex: 1, width: '100%', maxWidth: screenGeometry.width, overflow: 'hidden' }}>
        {children}
      </View>
    </View>
  );
}

initI18n(detectDeviceLanguage());

export default function App() {
  const [fontsLoaded] = useAppFonts();

  if (!fontsLoaded) {
    return (
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#0b0e12' }}>
        <ActivityIndicator color="#1d6ef5" />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <I18nextProvider i18n={i18n}>
          <ThemeProvider initialMode="dark">
            <WebFrame>
              <NavigationContainer>
                <RootNavigator />
              </NavigationContainer>
              <StatusBar style="auto" />
            </WebFrame>
          </ThemeProvider>
        </I18nextProvider>
      </QueryClientProvider>
    </SafeAreaProvider>
  );
}
