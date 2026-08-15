import { GenericFallbackProvider } from './generic-fallback.provider';

describe('GenericFallbackProvider', () => {
  const provider = new GenericFallbackProvider();

  it('returns a non-empty schedule with valid intervals for any vehicle', async () => {
    const tasks = await provider.suggest({ make: 'Toyota', model: 'RAV4', year: 2021, language: 'fr' });
    expect(tasks.length).toBeGreaterThan(0);
    for (const task of tasks) {
      expect(task.name.length).toBeGreaterThan(0);
      expect(task.intervalKm).toBeGreaterThan(0);
    }
  });

  it('translates task names to English when the vehicle owner’s language is en', async () => {
    const frTasks = await provider.suggest({ make: 'Honda', model: 'Civic', year: 2018, language: 'fr' });
    const enTasks = await provider.suggest({ make: 'Honda', model: 'Civic', year: 2018, language: 'en' });
    expect(frTasks[0].name).not.toBe(enTasks[0].name);
  });
});
