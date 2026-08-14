import React, { createContext, useContext, useMemo, useState } from 'react';
import { darkTheme, lightTheme, ThemeColors } from './colors';

interface ThemeContextValue {
  colors: ThemeColors;
  mode: 'dark' | 'light';
  setMode: (mode: 'dark' | 'light') => void;
  toggleMode: () => void;
}

const ThemeContext = createContext<ThemeContextValue | null>(null);

export function ThemeProvider({
  children,
  initialMode = 'dark',
}: {
  children: React.ReactNode;
  initialMode?: 'dark' | 'light';
}) {
  const [mode, setMode] = useState<'dark' | 'light'>(initialMode);

  const value = useMemo<ThemeContextValue>(
    () => ({
      colors: mode === 'dark' ? darkTheme : lightTheme,
      mode,
      setMode,
      toggleMode: () => setMode((m) => (m === 'dark' ? 'light' : 'dark')),
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
