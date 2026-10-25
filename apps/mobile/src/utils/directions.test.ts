import { directionsLinks } from './directions';

describe('directionsLinks', () => {
  const links = directionsLinks({ lat: 47.0598198, lng: -70.8493423 });

  it('offers Google Maps, Apple Maps and Waze', () => {
    expect(links.map((l) => l.app)).toEqual(['google', 'apple', 'waze']);
  });

  it('points every app at the garage coordinates', () => {
    for (const link of links) {
      expect(link.url).toContain('47.059820,-70.849342');
      expect(link.url.startsWith('https://')).toBe(true);
    }
  });

  it('asks for a route (not just a pin) in each app', () => {
    const byApp = Object.fromEntries(links.map((l) => [l.app, l.url]));
    expect(byApp.google).toContain('/dir/');
    expect(byApp.apple).toContain('daddr=');
    expect(byApp.waze).toContain('navigate=yes');
  });
});
