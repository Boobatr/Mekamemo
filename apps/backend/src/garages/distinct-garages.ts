import { distanceKm } from '../geocoding/geocoding-provider.interface';
import type { GarageWithDistance } from './garages.service';

/** Two listings closer than this can be the same business entered by two different sources. */
const SAME_PLACE_KM = 0.15;

/** Words that don't tell two garages apart ("Garage Laurier" vs "Laurier Auto Inc."). */
const GENERIC_WORDS = new Set([
  'garage', 'centre', 'center', 'auto', 'automobile', 'automobiles', 'mecanique', 'inc', 'ltee', 'enr',
  'et', 'de', 'du', 'des', 'la', 'le', 'les', 'l', 'd', 'service', 'services', 'carrosserie', 'pneus', 'pneu',
]);

function nameTokens(name: string): Set<string> {
  const words = name
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter(Boolean);
  const distinctive = words.filter((word) => !GENERIC_WORDS.has(word));
  return new Set(distinctive.length > 0 ? distinctive : words);
}

function sameName(a: string, b: string): boolean {
  const left = nameTokens(a);
  const right = nameTokens(b);
  if (left.size === 0 || right.size === 0) return false;
  const shared = [...left].filter((word) => right.has(word)).length;
  if (shared === left.size || shared === right.size) return true; // one name contains the other
  return shared / (left.size + right.size - shared) >= 0.5;
}

const digits = (phone: string | null) => phone?.replace(/\D/g, '') ?? '';

function isSameBusiness(a: GarageWithDistance, b: GarageWithDistance): boolean {
  const apart = distanceKm(a, b);
  if (apart > SAME_PLACE_KM) {
    return false;
  }
  const samePhone = digits(a.phone) !== '' && digits(a.phone) === digits(b.phone);
  return samePhone || sameName(a.name, b.name);
}

/**
 * How reachable a listing is. Of two listings of one business, the one the app opens (and writes to)
 * must be the one that really holds the email and phone shown in the list: the garage page and the
 * quote request read that listing, not its twin.
 */
const reachability = (garage: GarageWithDistance) => (garage.email ? 2 : 0) + (garage.phone ? 1 : 0);

/** Keeps `first` and fills what it lacks from `other` (e.g. OSM's services + Overture's phone). */
function fillGaps(first: GarageWithDistance, other: GarageWithDistance): GarageWithDistance {
  return {
    ...first,
    phone: first.phone ?? other.phone,
    email: first.email ?? other.email,
    specialties: first.specialties.length > 0 ? first.specialties : other.specialties,
    hours: first.hours ?? other.hours,
    rating: first.rating ?? other.rating,
    reviewCount: first.reviewCount ?? other.reviewCount,
  };
}

/**
 * From garages already sorted nearest-first, returns the `limit` nearest distinct businesses.
 * A business listed by several sources shows once, with the details from all of them.
 */
export function pickNearestDistinct(sortedByDistance: GarageWithDistance[], limit: number): GarageWithDistance[] {
  const kept: GarageWithDistance[] = [];
  for (const garage of sortedByDistance) {
    const twin = kept.findIndex((existing) => isSameBusiness(existing, garage));
    if (twin >= 0) {
      const [base, other] = reachability(garage) > reachability(kept[twin]) ? [garage, kept[twin]] : [kept[twin], garage];
      kept[twin] = fillGaps(base, other);
    } else if (kept.length < limit) {
      kept.push(garage);
    } else {
      break;
    }
  }
  return kept;
}
