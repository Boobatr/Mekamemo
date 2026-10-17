import type { GeoPoint } from '../geocoding/geocoding-provider.interface';

export const GARAGE_DISCOVERY = 'GARAGE_DISCOVERY';

/** Brings real garages around a point into the database before a search reads them. */
export interface GarageDiscovery {
  /** When true, real garages are discovered and the `demo` sample garages are hidden. */
  readonly enabled: boolean;
  /** Never rejects: if discovery fails, the search simply serves what is already stored. */
  ensureNear(origin: GeoPoint, radiusKm: number): Promise<void>;
}

export class NoopGarageDiscovery implements GarageDiscovery {
  readonly enabled = false;
  async ensureNear(): Promise<void> {}
}
