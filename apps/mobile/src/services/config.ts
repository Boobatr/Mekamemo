/**
 * Backend base URL. Two override paths, checked in order:
 * 1. `EXPO_PUBLIC_API_BASE_URL` — inlined at build time by Expo/Metro from the
 *    environment (e.g. set in Vercel/Netlify's build settings for the web deploy).
 * 2. `app.json`'s `expo.extra.apiBaseUrl` — used by EAS-built mobile binaries
 *    (e.g. your machine's LAN IP when testing on a physical device with Expo Go —
 *    `localhost` on a phone means the phone itself, not your dev machine).
 */
import Constants from 'expo-constants';

const DEFAULT_API_BASE_URL = 'http://localhost:3000';

export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_BASE_URL ??
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  DEFAULT_API_BASE_URL;
