export interface Position {
  lat: number;
  lng: number;
}

/** Whether this platform can ask the device for its position (the web version can; see currentPosition.web.ts). */
export const canLocate: boolean = false;

/** Rejects when the position is unavailable or the user said no. */
export function getCurrentPosition(): Promise<Position> {
  return Promise.reject(new Error('Location is not available on this platform.'));
}
