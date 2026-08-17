/**
 * Backend base URL. Override at build time via app.json's `expo.extra.apiBaseUrl`
 * (e.g. your machine's LAN IP when testing on a physical device with Expo Go —
 * `localhost` on a phone means the phone itself, not your dev machine).
 */
import Constants from 'expo-constants';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export const API_BASE_URL: string =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? DEFAULT_API_BASE_URL;
