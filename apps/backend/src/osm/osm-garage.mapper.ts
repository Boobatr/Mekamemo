import type { Prisma } from '@prisma/client';

/** The slice of an OpenStreetMap element we use (Overpass `out center tags` shape). */
export interface OsmElement {
  type: 'node' | 'way' | 'relation';
  id: number;
  lat?: number;
  lon?: number;
  /** Ways and relations have no point of their own; Overpass gives their centre here. */
  center?: { lat: number; lon: number };
  tags?: Record<string, string>;
}

/** OpenStreetMap `service:vehicle:*=yes` tags → the specialty labels the app filters on. */
const SPECIALTY_BY_SERVICE_TAG: Record<string, string> = {
  brakes: 'Freins',
  oil_change: 'Vidange',
  tyres: 'Pneus',
  wheel_alignment: 'Alignement',
  air_conditioning: 'Climatisation',
  battery: 'Batterie',
  inspection: 'Inspection',
  diagnostics: 'Diagnostic',
  transmission: 'Transmission',
  suspension: 'Suspension',
  electrical: 'Électricité',
  exhaust: 'Échappement',
};

const MISSING_ADDRESS = 'Adresse non disponible';

/** OSM often lists several values separated by ";" (names, phones, house numbers) — keep the first. */
function firstValue(value: string | undefined): string | null {
  const first = value?.split(';')[0]?.trim();
  return first ? first : null;
}

function buildAddress(tags: Record<string, string>): string {
  const street = [firstValue(tags['addr:housenumber']), tags['addr:street']].filter(Boolean).join(' ');
  const address = [street, tags['addr:city'], tags['addr:postcode']].filter(Boolean).join(', ');
  return address || tags['addr:full'] || MISSING_ADDRESS;
}

/**
 * Turns an OSM element into a garage row, or null when it can't be used (no name — most
 * unnamed shops are not useful to show — or no coordinates).
 */
export function mapOsmElement(element: OsmElement): Prisma.GarageCreateManyInput | null {
  const tags = element.tags ?? {};
  const name = firstValue(tags.name ?? tags.brand ?? tags.operator);
  const lat = element.lat ?? element.center?.lat;
  const lng = element.lon ?? element.center?.lon;
  if (!name || lat == null || lng == null) return null;

  const specialties = Object.entries(SPECIALTY_BY_SERVICE_TAG)
    .filter(([key]) => tags[`service:vehicle:${key}`] === 'yes')
    .map(([, label]) => label);

  return {
    name,
    address: buildAddress(tags),
    lat,
    lng,
    phone: firstValue(tags.phone ?? tags['contact:phone']),
    email: firstValue(tags.email ?? tags['contact:email']),
    specialties,
    hours: tags.opening_hours ? { osm: tags.opening_hours } : undefined,
    certifications: [],
    source: 'osm',
    externalPlaceId: `${element.type}/${element.id}`,
  };
}
