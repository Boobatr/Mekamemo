import AsyncStorage from '@react-native-async-storage/async-storage';

const THEME_MODE_KEY = 'mekamemo.themeMode';

export async function getStoredThemeMode(): Promise<'dark' | 'light' | null> {
  const value = await AsyncStorage.getItem(THEME_MODE_KEY);
  return value === 'dark' || value === 'light' ? value : null;
}

export async function setStoredThemeMode(mode: 'dark' | 'light'): Promise<void> {
  await AsyncStorage.setItem(THEME_MODE_KEY, mode);
}
