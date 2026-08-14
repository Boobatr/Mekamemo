export function formatCents(cents: number, locale: 'fr' | 'en' = 'fr'): string {
  const value = cents / 100;
  return new Intl.NumberFormat(locale === 'fr' ? 'fr-CA' : 'en-CA', {
    style: 'currency',
    currency: 'CAD',
    maximumFractionDigits: value % 1 === 0 ? 0 : 2,
  }).format(value);
}

export function formatCentsRange(minCents: number, maxCents: number, locale: 'fr' | 'en' = 'fr'): string {
  if (minCents === maxCents) return formatCents(minCents, locale);
  return `${formatCents(minCents, locale)} – ${formatCents(maxCents, locale)}`;
}
