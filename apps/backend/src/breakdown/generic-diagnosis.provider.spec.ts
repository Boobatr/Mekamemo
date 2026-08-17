import { GenericDiagnosisProvider } from './generic-diagnosis.provider';

describe('GenericDiagnosisProvider', () => {
  const provider = new GenericDiagnosisProvider();

  it('never claims a specific mechanical cause without a real model', async () => {
    const result = await provider.diagnose({
      descriptionText: 'Bruit de grincement au freinage',
      tags: ['onBraking'],
      urgent: false,
      attachments: [],
      vehicle: { make: 'Toyota', model: 'RAV4', year: 2021 },
      recentServiceHistory: [],
      language: 'fr',
    });

    expect(result.confidence).toBe('low');
    expect(result.secondaryCauses).toEqual([]);
  });

  it('responds in the requested language', async () => {
    const en = await provider.diagnose({
      descriptionText: 'Grinding noise',
      tags: [],
      urgent: false,
      attachments: [],
      vehicle: { make: 'Toyota', model: 'RAV4', year: 2021 },
      recentServiceHistory: [],
      language: 'en',
    });
    expect(en.primaryCause.toLowerCase()).toContain('undetermined');
  });
});
