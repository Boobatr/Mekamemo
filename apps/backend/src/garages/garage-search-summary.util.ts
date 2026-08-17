import { GarageWithDistance } from './garages.service';

const KNOWN_SPECIALTIES = [
  'vidange',
  'freins',
  'pneus',
  'inspection',
  'climatisation',
  'transmission',
  'suspension',
  'diagnostic',
];

/** Naive keyword extraction — good enough for a deterministic fallback summary. */
export function extractSpecialtyKeyword(query: string): string | undefined {
  const lower = query.toLowerCase();
  return KNOWN_SPECIALTIES.find((s) => lower.includes(s));
}

export function buildFallbackSummary(
  results: GarageWithDistance[],
  radiusKm: number,
  language: 'fr' | 'en',
): string {
  const isFr = language === 'fr';
  if (results.length === 0) {
    return isFr
      ? `Aucun garage trouvé dans ${radiusKm} km.`
      : `No garage found within ${radiusKm} km.`;
  }
  const count = results.length;
  return isFr
    ? `${count} garage${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''} dans ${radiusKm} km. Voici les plus proches.`
    : `${count} garage${count > 1 ? 's' : ''} found within ${radiusKm} km. Here are the closest ones.`;
}
