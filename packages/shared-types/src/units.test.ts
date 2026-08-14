import { describe, expect, it } from 'vitest';
import { displayUnitsToKm, formatDistance, kmToDisplayUnits } from './units';

describe('units conversion', () => {
  it('returns km unchanged when units is km', () => {
    expect(kmToDisplayUnits(64200, 'km')).toBe(64200);
  });

  it('converts km to miles', () => {
    expect(kmToDisplayUnits(1.609344, 'mi')).toBeCloseTo(1, 5);
  });

  it('round-trips km -> mi -> km', () => {
    const km = 66000;
    const mi = kmToDisplayUnits(km, 'mi');
    expect(displayUnitsToKm(mi, 'mi')).toBeCloseTo(km, 5);
  });

  it('formats distance with locale-aware grouping', () => {
    expect(formatDistance(64200, 'km', 'fr')).toMatch(/64.200 km|64 200 km/);
    expect(formatDistance(64200, 'km', 'en')).toContain('km');
  });
});
