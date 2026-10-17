import { mapOsmElement } from './osm-garage.mapper';

describe('mapOsmElement', () => {
  it('maps a fully tagged node into a garage row', () => {
    const garage = mapOsmElement({
      type: 'node',
      id: 123,
      lat: 45.5,
      lon: -73.57,
      tags: {
        name: 'Garage Lacroix',
        'addr:housenumber': '2001',
        'addr:street': 'Rue Centre',
        'addr:city': 'Montréal',
        'addr:postcode': 'H3K 1J3',
        phone: '+1 514 555 0100; +1 514 555 0101',
        'contact:email': 'info@lacroix.ca',
        opening_hours: 'Mo-Fr 08:00-17:00',
        'service:vehicle:brakes': 'yes',
        'service:vehicle:oil_change': 'yes',
        'service:vehicle:tyres': 'no',
      },
    });

    expect(garage).toEqual({
      name: 'Garage Lacroix',
      address: '2001 Rue Centre, Montréal, H3K 1J3',
      lat: 45.5,
      lng: -73.57,
      phone: '+1 514 555 0100',
      email: 'info@lacroix.ca',
      specialties: ['Freins', 'Vidange'],
      hours: { osm: 'Mo-Fr 08:00-17:00' },
      certifications: [],
      source: 'osm',
      externalPlaceId: 'node/123',
    });
  });

  it('uses the centre of a way and tolerates a bare-bones shop', () => {
    const garage = mapOsmElement({
      type: 'way',
      id: 9,
      center: { lat: 46.8, lon: -71.2 },
      tags: { name: 'Mécanique Express' },
    });

    expect(garage).toMatchObject({
      lat: 46.8,
      lng: -71.2,
      address: 'Adresse non disponible',
      phone: null,
      email: null,
      specialties: [],
      externalPlaceId: 'way/9',
    });
    expect(garage?.hours).toBeUndefined();
  });

  it('keeps the first value when OSM lists several names or house numbers', () => {
    const garage = mapOsmElement({
      type: 'node',
      id: 5,
      lat: 1,
      lon: 1,
      tags: { name: 'Carrosserie du Nord;Centre Saint-Louis', 'addr:housenumber': '158;4285', 'addr:street': 'Rue Marie-Anne Est' },
    });

    expect(garage?.name).toBe('Carrosserie du Nord');
    expect(garage?.address).toBe('158 Rue Marie-Anne Est');
  });

  it('falls back to the brand when a shop has no name', () => {
    expect(mapOsmElement({ type: 'node', id: 1, lat: 1, lon: 1, tags: { brand: 'Midas' } })?.name).toBe('Midas');
  });

  it('skips elements that are unnamed or have no coordinates', () => {
    expect(mapOsmElement({ type: 'node', id: 1, lat: 1, lon: 1, tags: { shop: 'car_repair' } })).toBeNull();
    expect(mapOsmElement({ type: 'node', id: 2, tags: { name: 'Sans position' } })).toBeNull();
  });
});
