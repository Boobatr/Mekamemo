import { createHash } from 'crypto';
import { createReadStream, readFileSync } from 'fs';
import { createInterface } from 'readline';
import { createGunzip } from 'zlib';
import type { PrismaClient } from '@prisma/client';
import { mapOvertureRecord } from './overture-garage.mapper';
import type { ImportedGarage, OvertureRecord } from './overture-garage.mapper';

const BATCH_SIZE = 1000;

export const OVERTURE_SOURCE = 'overture';

type Db = Pick<PrismaClient, 'garageAreaFetch' | '$executeRaw'>;

export interface ImportResult {
  release: string;
  /** True when this exact file was already loaded, so nothing was done. */
  skipped: boolean;
  imported: number;
  /** Garages that left the dataset and that nothing in the app refers to, so were deleted. */
  removed: number;
}

export interface ImportOptions {
  log?: (message: string) => void;
  /** Delete previously imported garages missing from this file (default). Only unreferenced ones go. */
  removeStale?: boolean;
}

/**
 * Loads the Overture garage dataset into the garages table.
 *
 * - The file IS the dataset. A marker row remembers its release and a fingerprint of its
 *   content, so restarting or redeploying does nothing, and any new file is loaded in full.
 * - Upserts by (source, externalPlaceId): a garage keeps its row (and anything pointing at
 *   it) across releases.
 * - Garages that disappeared from the dataset are deleted — but only when no quote request,
 *   booking or service history refers to them: deleting those would cascade into user data.
 */
export async function importOvertureGarages(
  db: Db,
  file: string,
  options: ImportOptions = {},
): Promise<ImportResult> {
  const { log = () => {}, removeStale = true } = options;
  const fingerprint = createHash('sha1').update(readFileSync(file)).digest('hex').slice(0, 12);
  const lines = createInterface({ input: createReadStream(file).pipe(createGunzip()), crlfDelay: Infinity });

  let release = '';
  let minConfidence = 0;
  let headerRead = false;
  let imported = 0;
  const seenIds: string[] = [];
  let batch = new Map<string, ImportedGarage>();

  let skipped = 0;
  const flush = async () => {
    if (batch.size === 0) return;
    const garages = [...batch.values()];
    batch = new Map();
    try {
      await upsertBatch(db, garages);
      imported += garages.length;
    } catch (err) {
      // One row the database refuses (e.g. a character its encoding can't store) must not lose
      // the other 999: retry row by row and skip only the culprits.
      log(`Batch failed (${firstLine(err)}); retrying ${garages.length} garages one by one…`);
      for (const garage of garages) {
        try {
          await upsertBatch(db, [garage]);
          imported += 1;
        } catch {
          skipped += 1;
        }
      }
    }
  };

  for await (const line of lines) {
    if (!line.trim()) continue;
    const parsed = JSON.parse(line);

    if (!headerRead) {
      headerRead = true;
      release = String(parsed.release);
      minConfidence = Number(parsed.minConfidence);
      const marker = markerKey(release, fingerprint);
      if (await db.garageAreaFetch.findUnique({ where: { cellKey: marker } })) {
        log(`Garage data ${release} already loaded — nothing to do.`);
        lines.close();
        return { release, skipped: true, imported: 0, removed: 0 };
      }
      log(`Loading garage data ${release} (confidence ≥ ${minConfidence})…`);
      continue;
    }

    const garage = mapOvertureRecord(parsed as OvertureRecord);
    if (!garage) continue;
    seenIds.push(garage.externalPlaceId);
    batch.set(garage.externalPlaceId, garage); // a batch can't hold the same conflict key twice
    if (batch.size >= BATCH_SIZE) await flush();
  }
  await flush();

  // Never on an empty file: that would wipe every imported garage.
  const removed = removeStale && seenIds.length > 0 ? await deleteStaleGarages(db, seenIds) : 0;

  const marker = markerKey(release, fingerprint);
  await db.garageAreaFetch.upsert({
    where: { cellKey: marker },
    create: { cellKey: marker },
    update: { fetchedAt: new Date() },
  });
  log(
    `Loaded ${imported} garages from Overture ${release} (confidence ≥ ${minConfidence})` +
      `${skipped ? `, ${skipped} skipped` : ''}${removed ? `, ${removed} outdated ones removed` : ''}.`,
  );
  return { release, skipped: false, imported, removed };
}

const firstLine = (err: unknown) => String((err as Error)?.message ?? err).trim().split('\n')[0];

function markerKey(release: string, fingerprint: string): string {
  return `overture:${release}:${fingerprint}`;
}

async function deleteStaleGarages(db: Db, currentIds: string[]): Promise<number> {
  return db.$executeRaw`
    DELETE FROM "garages" g
    WHERE g."source" = ${OVERTURE_SOURCE}
      AND NOT (g."externalPlaceId" = ANY(${currentIds}::text[]))
      AND NOT EXISTS (SELECT 1 FROM "quote_request_garages" q WHERE q."garageId" = g."id")
      AND NOT EXISTS (SELECT 1 FROM "bookings" b WHERE b."garageId" = g."id")
      AND NOT EXISTS (SELECT 1 FROM "service_history_entries" h WHERE h."garageId" = g."id")`;
}

async function upsertBatch(db: Db, garages: ImportedGarage[]): Promise<void> {
  // One round trip per batch: the columns travel as parallel arrays and Postgres unnests them.
  // Empty strings stand in for NULL inside the arrays and are turned back with NULLIF.
  const names = garages.map((g) => g.name);
  const addresses = garages.map((g) => g.address);
  const lats = garages.map((g) => g.lat);
  const lngs = garages.map((g) => g.lng);
  const phones = garages.map((g) => g.phone ?? '');
  const emails = garages.map((g) => g.email ?? '');
  const specialties = garages.map((g) => g.specialties.join('|'));
  const externalIds = garages.map((g) => g.externalPlaceId);

  await db.$executeRaw`
    INSERT INTO "garages"
      ("id", "name", "address", "lat", "lng", "phone", "email", "specialties", "certifications", "source", "externalPlaceId")
    SELECT gen_random_uuid()::text, g.name, g.address, g.lat, g.lng,
           NULLIF(g.phone, ''), NULLIF(g.email, ''),
           COALESCE(string_to_array(NULLIF(g.specialties, ''), '|'), ARRAY[]::text[]),
           ARRAY[]::text[], ${OVERTURE_SOURCE}, g.external_id
    FROM unnest(
      ${names}::text[], ${addresses}::text[], ${lats}::float8[], ${lngs}::float8[],
      ${phones}::text[], ${emails}::text[], ${specialties}::text[], ${externalIds}::text[]
    ) AS g(name, address, lat, lng, phone, email, specialties, external_id)
    ON CONFLICT ("source", "externalPlaceId") DO UPDATE SET
      "name" = EXCLUDED."name",
      "address" = EXCLUDED."address",
      "lat" = EXCLUDED."lat",
      "lng" = EXCLUDED."lng",
      "phone" = EXCLUDED."phone",
      "email" = EXCLUDED."email",
      "specialties" = EXCLUDED."specialties"`;
}
