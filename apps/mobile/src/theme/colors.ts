export interface ThemeColors {
  mode: 'dark' | 'light';
  screenBackground: string;
  screenBackgroundSecondary: string;
  veilTop: string;
  veilBottom: string;
  textPrimary: string;
  textSecondary: string;
  textTertiary: string;
  textMuted: string;
  fieldBackground: string;
  rail: string;
  accent: string;
  accentHover: string;
  accentOnBackground: string;
  textOnAccentTint: string;
  /** Solid full-bleed accent panel (dark mode only visually; light mode reuses accent at full opacity). */
  accentPanelSolid: string;
  accentPanelMark: string;
  /** Five hairline opacities, from most to least visible. */
  hairlines: [string, string, string, string, string];
  /** Five accent-tint opacities, from most to least visible. */
  accentTints: [string, string, string, string, string];
}

export const darkTheme: ThemeColors = {
  mode: 'dark',
  screenBackground: 'rgba(15,19,23,.5)',
  screenBackgroundSecondary: 'rgba(15,19,23,.5)',
  veilTop: 'rgba(11,14,18,.62)',
  veilBottom: 'rgba(11,14,18,.86)',
  textPrimary: '#e8edf3',
  textSecondary: '#9aa6b3',
  textTertiary: '#7e8894',
  textMuted: '#6d7783',
  fieldBackground: 'rgba(23,29,36,.62)',
  rail: '#2b333c',
  accent: '#1d6ef5',
  accentHover: '#4a8dff',
  accentOnBackground: '#5fa2ff',
  textOnAccentTint: '#bcd9ff',
  accentPanelSolid: '#0d2748',
  accentPanelMark: '#6fa8ff',
  hairlines: [
    'rgba(232,237,243,.22)',
    'rgba(232,237,243,.16)',
    'rgba(232,237,243,.12)',
    'rgba(232,237,243,.09)',
    'rgba(232,237,243,.07)',
  ],
  accentTints: [
    'rgba(29,110,245,.22)',
    'rgba(29,110,245,.20)',
    'rgba(29,110,245,.18)',
    'rgba(29,110,245,.14)',
    'rgba(29,110,245,.12)',
  ],
};

export const lightTheme: ThemeColors = {
  mode: 'light',
  screenBackground: '#f4f6f9',
  screenBackgroundSecondary: '#eceff4',
  veilTop: 'transparent',
  veilBottom: 'transparent',
  textPrimary: '#141a22',
  textSecondary: '#55606d',
  textTertiary: '#78838f',
  textMuted: '#9aa4b0',
  fieldBackground: '#ffffff',
  rail: '#d4d4d7',
  accent: '#1d6ef5',
  accentHover: '#1558c8',
  accentOnBackground: '#1558c8',
  textOnAccentTint: '#17457f',
  accentPanelSolid: '#1d6ef5',
  accentPanelMark: '#ffffff',
  hairlines: [
    'rgba(29,44,64,.32)',
    'rgba(29,44,64,.22)',
    'rgba(29,44,64,.15)',
    'rgba(29,44,64,.11)',
    'rgba(29,44,64,.08)',
  ],
  accentTints: [
    'rgba(29,110,245,.14)',
    'rgba(29,110,245,.12)',
    'rgba(29,110,245,.10)',
    'rgba(29,110,245,.08)',
    'rgba(29,110,245,.06)',
  ],
};
