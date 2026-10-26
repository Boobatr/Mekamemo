import { buildQuoteMessage, buildQuoteSubject, QuoteMessageInput } from './quote-message';

const base: QuoteMessageInput = {
  language: 'fr',
  fullName: 'Marc Lavoie',
  vehicle: { make: 'Toyota', model: 'RAV4', year: 2021 },
};

const oilChange = {
  name: 'Vidange d’huile et filtre',
  notesForGarage: 'Huile 0W-20 synthétique, merci.',
  dueKm: 70000,
  dueDate: new Date('2026-11-12T12:00:00Z'),
};

describe('buildQuoteMessage', () => {
  it('names the maintenance item, the vehicle, its mileage, the due point and the user notes', () => {
    const message = buildQuoteMessage({ ...base, odometerKm: 64200, task: oilChange });

    expect(message).toContain('Entretien : Vidange d’huile et filtre');
    expect(message).toContain('Véhicule : Toyota RAV4 2021');
    expect(message).toMatch(/Kilométrage : 64\s200 km/);
    expect(message).toMatch(/Échéance : 12 novembre 2026 · 70\s000 km/);
    expect(message).toContain('Précisions : Huile 0W-20 synthétique, merci.');
    expect(message).toContain('Marc Lavoie');
    expect(message).toContain('Envoyé avec MekaMemo.');
  });

  it('leaves out what is not known instead of printing blanks', () => {
    const message = buildQuoteMessage({ ...base, task: { name: 'Rotation des pneus' } });

    expect(message).toContain('Entretien : Rotation des pneus');
    expect(message).not.toMatch(/Kilométrage|Échéance|Précisions|null|undefined/);
  });

  it('adds the VIN and the trim when the vehicle has them', () => {
    const message = buildQuoteMessage({
      ...base,
      vehicle: { ...base.vehicle, trim: 'XLE', vin: '2T3W1RFV5MW123456' },
      task: oilChange,
    });

    expect(message).toContain('Véhicule : Toyota RAV4 XLE 2021');
    expect(message).toContain('NIV : 2T3W1RFV5MW123456');
  });

  it('describes a reported breakdown and its first analysis', () => {
    const message = buildQuoteMessage({
      ...base,
      diagnosis: { description: 'Bruit de grincement\nau freinage', primaryCause: 'Plaquettes usées' },
    });

    expect(message).toContain('examiner mon véhicule');
    expect(message).toContain('Problème signalé : Bruit de grincement au freinage');
    expect(message).toContain('Cause probable (première analyse) : Plaquettes usées');
  });

  it('is written in English for English-speaking users', () => {
    const message = buildQuoteMessage({ ...base, language: 'en', odometerKm: 64200, task: oilChange });

    expect(message).toContain('Hello,');
    expect(message).toContain('Service : Vidange d’huile et filtre');
    expect(message).toContain('Mileage : 64,200 km');
    expect(message).toContain('Due : November 12, 2026 · 70,000 km');
    expect(message).toContain('Sent with MekaMemo.');
  });

  it('falls back to a plain request when there is neither an item nor a breakdown', () => {
    const message = buildQuoteMessage(base);

    expect(message).toContain("pour l'entretien de mon Toyota RAV4 2021");
    expect(message).not.toContain('Entretien :');
  });

  it('keeps long free text on one line and bounded', () => {
    const message = buildQuoteMessage({ ...base, task: { name: 'x', notesForGarage: `a\n\nb ${'c'.repeat(900)}` } });

    const notes = message.split('\n').find((l) => l.startsWith('Précisions'))!;
    expect(notes.startsWith('Précisions : a b c')).toBe(true);
    expect(notes.length).toBeLessThanOrEqual(520);
  });
});

describe('buildQuoteSubject', () => {
  it('names the service and the vehicle', () => {
    expect(buildQuoteSubject({ ...base, task: oilChange })).toBe('Demande de soumission — Vidange d’huile et filtre — Toyota RAV4 2021');
  });

  it('says "diagnostic" for a breakdown and stays generic otherwise', () => {
    expect(buildQuoteSubject({ ...base, diagnosis: { description: 'x' } })).toBe('Demande de soumission — diagnostic — Toyota RAV4 2021');
    expect(buildQuoteSubject(base)).toBe('Demande de soumission — Toyota RAV4 2021');
    expect(buildQuoteSubject({ ...base, language: 'en' })).toBe('Quote request — Toyota RAV4 2021');
  });
});
