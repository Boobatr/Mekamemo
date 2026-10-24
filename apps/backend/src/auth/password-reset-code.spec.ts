import {
  formatResetCode,
  generateResetCode,
  hashResetCode,
  normalizeResetCode,
  resetCodeMatches,
} from './password-reset-code';
import { buildPasswordResetEmail } from './password-reset-email';

describe('reset codes', () => {
  it('generates 8 unambiguous characters', () => {
    for (let i = 0; i < 200; i++) {
      expect(generateResetCode()).toMatch(/^[ABCDEFGHJKMNPQRSTUVWXYZ2-9]{8}$/);
    }
  });

  it('does not repeat itself', () => {
    const codes = new Set(Array.from({ length: 500 }, generateResetCode));
    expect(codes.size).toBe(500);
  });

  it('shows the code as two groups of four and accepts it however the user types it', () => {
    expect(formatResetCode('ABCDEFGH')).toBe('ABCD-EFGH');
    expect(normalizeResetCode(' abcd-efgh ')).toBe('ABCDEFGH');
    expect(normalizeResetCode('abcd efgh')).toBe('ABCDEFGH');
  });

  it('matches the right code however it is typed, and rejects any other', () => {
    const hash = hashResetCode('ABCDEFGH');

    expect(hash).not.toContain('ABCDEFGH');
    expect(resetCodeMatches(hash, 'ABCD-EFGH')).toBe(true);
    expect(resetCodeMatches(hash, 'abcd efgh')).toBe(true);
    expect(resetCodeMatches(hash, 'ABCD-EFGJ')).toBe(false);
    expect(resetCodeMatches(hash, '')).toBe(false);
  });
});

describe('buildPasswordResetEmail', () => {
  const user = { email: 'marc@courriel.ca', fullName: 'Marc Lavoie', language: 'fr' as const };

  it('writes to the user in their language, with the code and its lifetime', () => {
    const fr = buildPasswordResetEmail(user, 'ABCDEFGH');
    expect(fr).toMatchObject({ to: 'marc@courriel.ca', subject: 'Votre code de réinitialisation MekaMemo' });
    expect(fr.body).toContain('Bonjour Marc Lavoie');
    expect(fr.body).toContain('ABCD-EFGH');
    expect(fr.body).toContain('30 minutes');

    const en = buildPasswordResetEmail({ ...user, language: 'en' }, 'ABCDEFGH');
    expect(en.subject).toBe('Your MekaMemo password reset code');
    expect(en.body).toContain('Hello Marc Lavoie');
    expect(en.body).toContain('ABCD-EFGH');
  });
});
