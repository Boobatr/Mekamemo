/** Density-0.85 derived scale from the design handoff README. */
export const spacing = {
  xs: 4,
  sm: 6.8,
  md: 10.2,
  lg: 13.6,
  xl: 16,
  xxl: 20.4,
} as const;

export const screenPadding = {
  horizontal: 20.4,
  vertical: 16,
} as const;

export const radius = {
  none: 0,
  button: 7,
} as const;

export const screenGeometry = {
  width: 390,
  height: 844,
  iosStatusBar: 44,
  iosHomeIndicator: 22,
  androidStatusBar: 32,
  androidAppBar: 56,
  androidTabBar: 62,
  androidSystemBar: 20,
} as const;
