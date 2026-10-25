/**
 * Rounds a position to about 100 m. Finding garages needs nothing finer, and the position
 * travels in the request URL (so it ends up in server logs): keep it vague on purpose.
 */
export function toApproximatePosition(lat: number, lng: number): { lat: number; lng: number } {
  return { lat: Math.round(lat * 1000) / 1000, lng: Math.round(lng * 1000) / 1000 };
}
