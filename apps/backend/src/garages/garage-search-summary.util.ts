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
  /** The radius actually searched, when it had to be widened beyond `radiusKm`. */
  searchedKm: number = radiusKm,
): string {
  const isFr = language === 'fr';
  const widened = searchedKm > radiusKm;
  if (results.length === 0) {
    return isFr
      ? `Aucun garage trouvé dans ${searchedKm} km.`
      : `No garage found within ${searchedKm} km.`;
  }
  const count = results.length;
  if (widened) {
    return isFr
      ? `Peu de garages dans ${radiusKm} km : j'ai élargi la recherche à ${searchedKm} km. ${count} garage${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''}, voici les plus proches.`
      : `Few garages within ${radiusKm} km, so I widened the search to ${searchedKm} km. ${count} garage${count > 1 ? 's' : ''} found, here are the closest ones.`;
  }
  return isFr
    ? `${count} garage${count > 1 ? 's' : ''} trouvé${count > 1 ? 's' : ''} dans ${radiusKm} km. Voici les plus proches.`
    : `${count} garage${count > 1 ? 's' : ''} found within ${radiusKm} km. Here are the closest ones.`;
}

export function buildGeocodeFailureSummary(postalCode: string, language: 'fr' | 'en'): string {
  return language === 'fr'
    ? `Je ne trouve pas le code postal « ${postalCode} ». Vérifiez-le dans Réglages pour voir les garages près de chez vous.`
    : `I can't find the postal code "${postalCode}". Check it in Settings to see garages near you.`;
}
