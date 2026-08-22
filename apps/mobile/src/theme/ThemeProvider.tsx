import React, { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { darkTheme, emberTheme, lightTheme, ThemeColors } from './colors';
import { getStoredThemeMode, setStoredThemeMode, ThemeMode } from './theme-storage';

const THEME_ORDER: ThemeMode[] = ['dark', 'light', 'ember'];
const THEME_MAP: Record<ThemeMode, ThemeColors> = {
  dark: darkTheme,
  light: lightTheme,
  ember: emberTheme,
};

interface ThemeContextValue {
  colors: ThemeColors;
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialMode = 'dark',
}: {
  children: React.ReactNode;
  initialMode?: ThemeMode;
}) {
  const [mode, setModeState] = useState<ThemeMode>(initialMode);

  useEffect(() => {
    getStoredThemeMode().then((stored) => {
      if (stored) setModeState(stored);
    });
  }, []);

  const setMode = (next: ThemeMode) => {
    setModeState(next);
    setStoredThemeMode(next);
  };

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: THEME_MAP[mode],
      mode,
      setMode,
      toggleMode: () => setMode(THEME_ORDER[(THEME_ORDER.indexOf(mode) + 1) % THEME_ORDER.length]),
    }),
    [mode],
  );

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within a ThemeProvider');
  return ctx;
}
