import AsyncStorage from '@react-native-async-storage/async-storage';

export type ThemeMode = 'dark' | 'light' | 'ember';

const THEME_MODE_KEY = 'mekamemo.themeMode';

export async function getStoredThemeMode(): Promise<ThemeMode | null> {
  const value = await AsyncStorage.getItem(THEME_MODE_KEY);
  return value === 'dark' || value === 'light' || value === 'ember' ? value : null;
}

export async function setStoredThemeMode(mode: ThemeMode): Promise<void> {
  await AsyncStorage.setItem(THEME_MODE_KEY, mode);
}
