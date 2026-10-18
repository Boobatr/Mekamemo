import type { GeoPoint } from '../geocoding/geocoding-provider.interface';

export const GARAGE_DISCOVERY = 'GARAGE_DISCOVERY';

/** Brings real garages around a point into the database before a search reads them. */
export interface GarageDiscovery {
  /** When true the database holds real garages, so the `demo` sample garages are hidden from search. */
  readonly usesRealGarageData: boolean;
  /** Never rejects: if discovery fails, the search simply serves what is already stored. */
  ensureNear(origin: GeoPoint, radiusKm: number): Promise<void>;
}

/** Doesn't fetch anything: search just reads the garages already in the database. */
export class NoopGarageDiscovery implements GarageDiscovery {
  constructor(readonly usesRealGarageData = false) {}
  async ensureNear(): Promise<void> {}
}
