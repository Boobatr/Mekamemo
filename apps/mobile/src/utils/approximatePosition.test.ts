import { toApproximatePosition } from './approximatePosition';

describe('toApproximatePosition', () => {
  it('keeps three decimals (about 100 m), in both hemispheres', () => {
    expect(toApproximatePosition(47.0598198, -70.8493423)).toEqual({ lat: 47.06, lng: -70.849 });
    expect(toApproximatePosition(-33.86882, 151.20929)).toEqual({ lat: -33.869, lng: 151.209 });
  });

  it('leaves an already coarse position unchanged', () => {
    expect(toApproximatePosition(45.5, -73.5)).toEqual({ lat: 45.5, lng: -73.5 });
  });
});
