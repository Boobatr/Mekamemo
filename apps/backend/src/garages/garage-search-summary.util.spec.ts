import { buildFallbackSummary } from './garage-search-summary.util';

const garages = [{}, {}, {}] as never;

describe('buildFallbackSummary', () => {
  it('reports the radius that was asked for', () => {
    expect(buildFallbackSummary(garages, 15, 'fr')).toBe('3 garages trouvés dans 15 km. Voici les plus proches.');
  });

  it('says the search was widened, in French and English', () => {
    expect(buildFallbackSummary(garages, 15, 'fr', 60)).toMatch(/élargi la recherche à 60 km/);
    expect(buildFallbackSummary(garages, 15, 'en', 60)).toMatch(/widened the search to 60 km/);
  });

  it('names the radius actually searched when nothing is found', () => {
    expect(buildFallbackSummary([], 15, 'fr', 100)).toBe('Aucun garage trouvé dans 100 km.');
    expect(buildFallbackSummary([], 15, 'en')).toBe('No garage found within 15 km.');
  });
});
