import { formatCents, formatCentsRange } from './format';

// Intl output uses non-breaking spaces; normalise so the expectations stay readable.
const plain = (text: string) => text.replace(/[  ]/g, ' ');

describe('formatCents', () => {
  it('drops the decimals for whole dollars and keeps two otherwise', () => {
    expect(plain(formatCents(0))).toMatch(/^0 \$$/);
    expect(plain(formatCents(9500))).toMatch(/^95 \$$/);
    expect(plain(formatCents(8999))).toMatch(/^89,99 \$$/);
  });

  it('formats in English when asked', () => {
    expect(plain(formatCents(8999, 'en'))).toMatch(/89\.99/);
  });

  it('never throws, whatever the amount (a throw here blanks the whole dashboard)', () => {
    for (const cents of [0, 1, 99, 100, 12345, 99999999, -500]) {
      expect(() => formatCents(cents)).not.toThrow();
    }
  });

  it('formats a range, collapsing it when both ends are equal', () => {
    expect(plain(formatCentsRange(9000, 13000))).toMatch(/^90 \$ – 130 \$$/);
    expect(plain(formatCentsRange(9000, 9000))).toMatch(/^90 \$$/);
  });
});
