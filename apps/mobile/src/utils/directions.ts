export interface DirectionsTarget {
  lat: number;
  lng: number;
}

export interface DirectionsLink {
  /** Stable key, also the label's translation suffix. */
  app: 'google' | 'apple' | 'waze';
  url: string;
}

/**
 * Links that open a map app with the route to a place. They are plain https links, so they work
 * everywhere: the phone opens the installed app (or the website when there isn't one).
 * Coordinates rather than the address text: the pin is exactly where the garage is.
 */
export function directionsLinks({ lat, lng }: DirectionsTarget): DirectionsLink[] {
  const point = `${lat.toFixed(6)},${lng.toFixed(6)}`;
  return [
    { app: 'google', url: `https://www.google.com/maps/dir/?api=1&destination=${point}` },
    { app: 'apple', url: `https://maps.apple.com/?daddr=${point}&dirflg=d` },
    { app: 'waze', url: `https://waze.com/ul?ll=${point}&navigate=yes` },
  ];
}
