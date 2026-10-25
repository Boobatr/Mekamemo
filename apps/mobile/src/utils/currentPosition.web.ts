import { toApproximatePosition } from './approximatePosition';
import type { Position } from './currentPosition';

export type { Position } from './currentPosition';

export const canLocate = typeof navigator !== 'undefined' && 'geolocation' in navigator;

export function getCurrentPosition(): Promise<Position> {
  return new Promise((resolve, reject) => {
    if (!canLocate) {
      reject(new Error('Location is not available in this browser.'));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (result) => resolve(toApproximatePosition(result.coords.latitude, result.coords.longitude)),
      (error) => reject(new Error(error.message)),
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 5 * 60 * 1000 },
    );
  });
}
