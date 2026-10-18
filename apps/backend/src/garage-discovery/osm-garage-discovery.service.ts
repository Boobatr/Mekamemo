import { Injectable, Logger } from '@nestjs/common';
import type { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import type { GeoPoint } from '../geocoding/geocoding-provider.interface';
import { OverpassClient } from '../osm/overpass.client';
import { NominatimPoiClient } from '../osm/nominatim-poi.client';
import { mapOsmElement } from '../osm/osm-garage.mapper';
import type { OsmElement } from '../osm/osm-garage.mapper';
import type { GarageDiscovery } from './garage-discovery.interface';

const DAY_MS = 24 * 60 * 60 * 1000;
/** Real garages rarely change; once a month is plenty and keeps the public servers happy. */
const FULL_FETCH_TTL_MS = 30 * DAY_MS;
/** Only the capped fallback answered: look again soon for the complete picture. */
const PARTIAL_FETCH_TTL_MS = DAY_MS;
/** After every Overpass mirror failed, don't make users wait on them again for a while. */
const OVERPASS_COOLDOWN_MS = 10 * 60 * 1000;

@Injectable()
export class OsmGarageDiscovery implements GarageDiscovery {
  readonly usesRealGarageData = true;
  private readonly logger = new Logger(OsmGarageDiscovery.name);
  private readonly inFlight = new Map<string, Promise<void>>();
  private overpassDownUntil = 0;

  constructor(
    private readonly prisma: PrismaService,
    private readonly overpass: OverpassClient,
    private readonly nominatim: NominatimPoiClient,
  ) {}

  ensureNear(origin: GeoPoint, radiusKm: number): Promise<void> {
    const key = `${origin.lat.toFixed(2)}:${origin.lng.toFixed(2)}:${radiusKm}`;
    const running = this.inFlight.get(key);
    if (running) return running;

    const job = this.refresh(origin, radiusKm, key)
      .catch((err) => this.logger.warn(`Garage discovery failed: ${(err as Error).message}`))
      .finally(() => this.inFlight.delete(key));
    this.inFlight.set(key, job);
    return job;
  }

  private async refresh(origin: GeoPoint, radiusKm: number, key: string): Promise<void> {
    const previous = await this.prisma.garageAreaFetch.findUnique({ where: { cellKey: key } });
    if (previous) {
      const ttl = previous.partial ? PARTIAL_FETCH_TTL_MS : FULL_FETCH_TTL_MS;
      if (Date.now() - previous.fetchedAt.getTime() < ttl) return;
    }

    let elements: OsmElement[] | null = null;
    let partial = false;

    if (Date.now() >= this.overpassDownUntil) {
      try {
        elements = await this.overpass.fetchGarages(origin, radiusKm);
      } catch {
        this.overpassDownUntil = Date.now() + OVERPASS_COOLDOWN_MS;
      }
    }

    if (!elements) {
      try {
        elements = await this.nominatim.fetchGarages(origin, radiusKm);
        partial = true;
      } catch (err) {
        this.logger.warn(`Nominatim fallback failed: ${(err as Error).message}`);
        return; // keep serving whatever is already stored; try again on the next search
      }
    }

    const garages = elements.map(mapOsmElement).filter((garage) => garage !== null);
    if (garages.length > 0) {
      await this.saveGarages(garages);
    }
    await this.prisma.garageAreaFetch.upsert({
      where: { cellKey: key },
      create: { cellKey: key, partial },
      update: { fetchedAt: new Date(), partial },
    });
    this.logger.log(`Discovered ${garages.length} garages near ${key}${partial ? ' (fallback source)' : ''}`);
  }

  /** One batch insert; if the database rejects a row, retry row by row so one odd name can't lose the rest. */
  private async saveGarages(garages: Prisma.GarageCreateManyInput[]): Promise<void> {
    try {
      await this.prisma.garage.createMany({ data: garages, skipDuplicates: true });
    } catch (err) {
      this.logger.warn(`Batch insert failed, saving garages one by one: ${(err as Error).message.split('\n')[0]}`);
      for (const garage of garages) {
        await this.prisma.garage
          .createMany({ data: [garage], skipDuplicates: true })
          .catch((rowErr: Error) => this.logger.warn(`Skipped garage "${garage.name}": ${rowErr.message.split('\n')[0]}`));
      }
    }
  }
}
