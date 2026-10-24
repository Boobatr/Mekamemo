export function formatCents(cents: number, locale: 'fr' | 'en' = 'fr'): string {
  const value = cents / 100;
  // Set both bounds: giving only maximumFractionDigits: 0 (below currency's default minimum of 2)
  // throws a RangeError in older browsers, which would blank the whole screen.
  const digits = value % 1 === 0 ? 0 : 2;
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    minimumFractionDigits: digits,
    maximumFractionDigits: digits,
  }).format(value);
}

export function formatCentsRange(minCents: number, maxCents: number, locale: 'fr' | 'en' = 'fr'): string {
  if (minCents === maxCents) return formatCents(minCents, locale);
  return `${formatCents(minCents, locale)} – ${formatCents(maxCents, locale)}`;
}
