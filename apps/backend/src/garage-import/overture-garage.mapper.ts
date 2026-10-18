/** One line of `prisma/data/garages-ca.ndjson.gz`, as written by scripts/export-overture-garages.py. */
export interface OvertureRecord {
  id: string;
  name: string;
  category: string | null;
  street: string | null;
  city: string | null;
  region: string | null;
  postcode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;
  lat: number;
  lng: number;
  confidence: number;
}

export interface ImportedGarage {
  name: string;
  address: string;
  lat: number;
  lng: number;
  phone: string | null;
  email: string | null;
  specialties: string[];
  /** Stable Overture id: re-importing a newer release updates the same row. */
  externalPlaceId: string;
}

/**
 * Overture's category → the specialty labels the garage search filters on. Plain
 * "automotive_repair" says nothing about the service, so it stays empty — and an
 * empty list means "general garage", which matches every specialty search.
 */
const SPECIALTY_BY_CATEGORY: Record<string, string> = {
  tire_dealer_and_repair: 'Pneus',
  tire_shop: 'Pneus',
  auto_body_shop: 'Carrosserie',
  brake_service_and_repair: 'Freins',
  engine_repair_service: 'Moteur',
  transmission_repair: 'Transmission',
  auto_electrical_repair: 'Électricité',
};

/** "+14188273551", "(418) 827-3551", "4188273551" → "+1 418-827-3551". Anything odd is kept as is. */
export function formatPhone(raw: string | null | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  const digits = value.replace(/\D/g, '');
  const national = digits.length === 11 && digits.startsWith('1') ? digits.slice(1) : digits;
  if (national.length === 10 && !/ext/i.test(value)) {
    return `+1 ${national.slice(0, 3)}-${national.slice(3, 6)}-${national.slice(6)}`;
  }
  return value.slice(0, 40);
}

export function mapOvertureRecord(record: OvertureRecord): ImportedGarage | null {
  const name = record.name?.trim();
  if (!name || name.length < 2 || !record.id) return null;
  if (!Number.isFinite(record.lat) || !Number.isFinite(record.lng)) return null;

  const cityAndPostcode = [record.city?.trim(), record.postcode?.trim().toUpperCase()].filter(Boolean).join(' ');
  const address = [record.street?.trim(), cityAndPostcode].filter(Boolean).join(', ');

  const specialty = record.category ? SPECIALTY_BY_CATEGORY[record.category] : undefined;
  const email = record.email?.trim().toLowerCase();

  return {
    name,
    address: address || 'Adresse non disponible',
    lat: record.lat,
    lng: record.lng,
    phone: formatPhone(record.phone),
    email: email && email.includes('@') ? email : null,
    specialties: specialty ? [specialty] : [],
    externalPlaceId: record.id,
  };
}
