import { formatPhone, mapOvertureRecord } from './overture-garage.mapper';
import type { OvertureRecord } from './overture-garage.mapper';

const record = (overrides: Partial<OvertureRecord> = {}): OvertureRecord => ({
  id: 'abc-123',
  name: 'Garage David Lavoie',
  category: 'automotive_repair',
  street: '11280 Bd Sainte-Anne',
  city: 'Beaupré',
  region: 'QC',
  postcode: 'g0a 1e0',
  phone: '+14188273551',
  email: 'Info@Lavoie.CA',
  website: null,
  lat: 47.0489,
  lng: -70.8926,
  confidence: 0.86,
  ...overrides,
});

describe('formatPhone', () => {
  it.each([
    ['+14188273551', '+1 418-827-3551'],
    ['(418) 827-3551', '+1 418-827-3551'],
    ['4188273551', '+1 418-827-3551'],
    ['1-418-827-3551', '+1 418-827-3551'],
  ])('formats %s', (raw, expected) => expect(formatPhone(raw)).toBe(expected));

  it('keeps an unusual number (extension, foreign) as it was written, and returns null for none', () => {
    expect(formatPhone('+1-514-596-5800 ext. 8533')).toBe('+1-514-596-5800 ext. 8533');
    expect(formatPhone('')).toBeNull();
    expect(formatPhone(undefined)).toBeNull();
  });
});

describe('mapOvertureRecord', () => {
  it('builds a garage row with a readable address and a normalised phone, email and postcode', () => {
    expect(mapOvertureRecord(record())).toEqual({
      name: 'Garage David Lavoie',
      address: '11280 Bd Sainte-Anne, Beaupré G0A 1E0',
      lat: 47.0489,
      lng: -70.8926,
      phone: '+1 418-827-3551',
      email: 'info@lavoie.ca',
      specialties: [],
      externalPlaceId: 'abc-123',
    });
  });

  it('derives a specialty from the category when it says what the shop does', () => {
    expect(mapOvertureRecord(record({ category: 'tire_dealer_and_repair' }))?.specialties).toEqual(['Pneus']);
    expect(mapOvertureRecord(record({ category: 'auto_body_shop' }))?.specialties).toEqual(['Carrosserie']);
    expect(mapOvertureRecord(record({ category: 'brake_service_and_repair' }))?.specialties).toEqual(['Freins']);
  });

  it('copes with missing address parts and contact details', () => {
    const garage = mapOvertureRecord(record({ street: null, city: null, postcode: null, phone: null, email: null }));

    expect(garage).toMatchObject({ address: 'Adresse non disponible', phone: null, email: null });
  });

  it('drops records that can not be shown: no name, or no usable position', () => {
    expect(mapOvertureRecord(record({ name: ' ' }))).toBeNull();
    expect(mapOvertureRecord(record({ lat: Number.NaN }))).toBeNull();
    expect(mapOvertureRecord(record({ id: '' }))).toBeNull();
  });

  it('ignores an e-mail that is not one', () => {
    expect(mapOvertureRecord(record({ email: 'n/a' }))?.email).toBeNull();
  });
});
