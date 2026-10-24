import React from 'react';
import { Platform, ScrollView, Text, TouchableOpacity, View } from 'react-native';
import { clearStoredToken } from '../services/auth-storage';

interface ErrorBoundaryProps {
  children: React.ReactNode;
}

interface ErrorBoundaryState {
  error: Error | null;
}

/**
 * Last line of defence. Without it, one rendering error anywhere unmounts the whole app and
 * leaves a blank page with nothing to tap. This shows what went wrong and a way out.
 *
 * It sits above every provider, so it deliberately uses plain colours and bilingual text:
 * the theme and translations may be exactly what failed.
 */
export class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  state: ErrorBoundaryState = { error: null };

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    console.error('[MekaMemo] The app crashed while rendering:', error, info.componentStack);
  }

  private reload = () => {
    if (Platform.OS === 'web') window.location.reload();
    else this.setState({ error: null });
  };

  private signOutAndReload = async () => {
    try {
      await clearStoredToken();
    } finally {
      this.reload();
    }
  };

  render() {
    const { error } = this.state;
    if (!error) return this.props.children;

    return (
      <View testID="error-boundary" style={{ flex: 1, backgroundColor: '#0b0e12', justifyContent: 'center', padding: 24 }}>
        <ScrollView contentContainerStyle={{ flexGrow: 1, justifyContent: 'center', maxWidth: 520, alignSelf: 'center', width: '100%' }}>
          <Text accessibilityRole="header" style={{ color: '#ffffff', fontSize: 22, fontWeight: '700', marginBottom: 8 }}>
            Un problème est survenu
          </Text>
          <Text style={{ color: '#aab4c0', fontSize: 15, marginBottom: 4 }}>
            L'application a rencontré une erreur d'affichage. Vos données ne sont pas perdues.
          </Text>
          <Text style={{ color: '#7d8895', fontSize: 13, marginBottom: 20 }}>
            Something went wrong. Your data is safe.
          </Text>

          <Text
            testID="error-message"
            selectable
            style={{ color: '#f2c14e', fontSize: 12, marginBottom: 24, fontFamily: Platform.OS === 'web' ? 'monospace' : undefined }}
          >
            {error.name}: {error.message}
          </Text>
          {Platform.OS === 'web' && typeof navigator !== 'undefined' ? (
            <Text testID="error-browser" selectable style={{ color: '#7d8895', fontSize: 11, marginBottom: 24 }}>
              {navigator.userAgent}
            </Text>
          ) : null}

          <TouchableOpacity
            accessibilityRole="button"
            testID="error-reload"
            onPress={this.reload}
            style={{ backgroundColor: '#1d6ef5', paddingVertical: 14, alignItems: 'center', marginBottom: 12 }}
          >
            <Text style={{ color: '#ffffff', fontSize: 15, fontWeight: '600' }}>Recharger / Reload</Text>
          </TouchableOpacity>
          <TouchableOpacity
            accessibilityRole="button"
            testID="error-sign-out"
            onPress={this.signOutAndReload}
            style={{ borderColor: '#3a4452', borderWidth: 1, paddingVertical: 14, alignItems: 'center' }}
          >
            <Text style={{ color: '#aab4c0', fontSize: 15 }}>Se déconnecter / Sign out</Text>
          </TouchableOpacity>
        </ScrollView>
      </View>
    );
  }
}
