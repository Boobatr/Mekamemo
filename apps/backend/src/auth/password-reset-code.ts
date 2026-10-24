import { createHash, randomInt, timingSafeEqual } from 'crypto';

// No 0/O, 1/I/L: the code is read from an e-mail and typed by hand.
const ALPHABET = 'ABCDEFGHJKMNPQRSTUVWXYZ23456789';
const CODE_LENGTH = 8;

/** 8 characters from 31 → ~8.5 × 10¹¹ possibilities; with 5 guesses per code that is unguessable. */
export function generateResetCode(): string {
  return Array.from({ length: CODE_LENGTH }, () => ALPHABET[randomInt(ALPHABET.length)]).join('');
}

/** "abcd efgh" / "ABCD-EFGH" → "ABCDEFGH". */
export function normalizeResetCode(input: string): string {
  return input.toUpperCase().replace(/[^A-Z0-9]/g, '');
}

/** What gets shown to the user: "ABCD-EFGH". */
export function formatResetCode(code: string): string {
  return `${code.slice(0, 4)}-${code.slice(4)}`;
}

export function hashResetCode(code: string): string {
  return createHash('sha256').update(normalizeResetCode(code)).digest('hex');
}

export function resetCodeMatches(storedHash: string, candidate: string): boolean {
  const expected = Buffer.from(storedHash, 'hex');
  const actual = Buffer.from(hashResetCode(candidate), 'hex');
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}
