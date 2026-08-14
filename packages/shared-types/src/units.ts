const KM_PER_MI = 1.609344;

export function kmToDisplayUnits(km: number, units: 'km' | 'mi'): number {
  return units === 'km' ? km : km / KM_PER_MI;
}

export function displayUnitsToKm(value: number, units: 'km' | 'mi'): number {
  return units === 'km' ? value : value * KM_PER_MI;
}

export function formatDistance(km: number, units: 'km' | 'mi', locale: 'fr' | 'en'): string {
  const value = Math.round(kmToDisplayUnits(km, units));
  const formatted = new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA').format(value);
  const unitLabel = units === 'km' ? 'km' : 'mi';
  return `${formatted} ${unitLabel}`;
}
