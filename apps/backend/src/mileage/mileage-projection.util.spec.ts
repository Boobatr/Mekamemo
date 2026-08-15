import {
  buildMonthlyBars,
  buildSuggestedReadings,
  computeAverageKmPerMonth,
  DEFAULT_ASSUMED_KM_PER_MONTH,
  projectDueDate,
} from './mileage-projection.util';

function daysAgo(days: number, from = new Date('2026-08-14T00:00:00Z')): Date {
  return new Date(from.getTime() - days * 24 * 60 * 60 * 1000);
}

describe('computeAverageKmPerMonth', () => {
  it('returns null with fewer than two readings', () => {
    expect(computeAverageKmPerMonth([])).toBeNull();
    expect(computeAverageKmPerMonth([{ valueKm: 1000, recordedAt: new Date() }])).toBeNull();
  });

  it('returns null when all readings share the same timestamp', () => {
    const at = new Date('2026-08-14T00:00:00Z');
    expect(
      computeAverageKmPerMonth([
        { valueKm: 1000, recordedAt: at },
        { valueKm: 1000, recordedAt: at },
      ]),
    ).toBeNull();
  });

  it('computes the average across the full history, not just the last pair', () => {
    // 1380 km/month over ~4 months, matching the design handoff mockup's example.
    const today = new Date('2026-08-14T00:00:00Z');
    const readings = [
      { valueKm: 60480, recordedAt: daysAgo(120, today) }, // ~4 months ago
      { valueKm: 61860, recordedAt: daysAgo(90, today) },
      { valueKm: 63240, recordedAt: daysAgo(60, today) },
      { valueKm: 64200, recordedAt: daysAgo(0, today) },
    ];
    const avg = computeAverageKmPerMonth(readings);
    expect(avg).not.toBeNull();
    expect(avg!).toBeCloseTo(943.6, 1); // (64200 - 60480) km / (120 days / 30.44)
  });

  it('is order-independent (sorts readings internally)', () => {
    const today = new Date('2026-08-14T00:00:00Z');
    const inOrder = [
      { valueKm: 60000, recordedAt: daysAgo(60, today) },
      { valueKm: 63000, recordedAt: daysAgo(0, today) },
    ];
    const reversed = [inOrder[1], inOrder[0]];
    expect(computeAverageKmPerMonth(inOrder)).toBeCloseTo(computeAverageKmPerMonth(reversed)!, 5);
  });

  it('can be negative if the odometer reading regressed (data-entry error) — callers must guard', () => {
    const today = new Date('2026-08-14T00:00:00Z');
    const avg = computeAverageKmPerMonth([
      { valueKm: 65000, recordedAt: daysAgo(30, today) },
      { valueKm: 64000, recordedAt: daysAgo(0, today) },
    ]);
    expect(avg!).toBeLessThan(0);
  });
});

describe('projectDueDate', () => {
  const today = new Date('2026-08-14T00:00:00Z');

  it('projects a future date when the target is still ahead', () => {
    const result = projectDueDate({ currentKm: 64200, dueAtKm: 72000, avgKmPerMonth: 1380, today });
    expect(result.isOverdue).toBe(false);
    expect(result.projectedDueDate).not.toBeNull();
    expect(result.projectedDueDate!.getTime()).toBeGreaterThan(today.getTime());

    // 7800 km remaining at 1380 km/month ≈ 172 days ≈ ~5.7 months out.
    const daysOut =
      (result.projectedDueDate!.getTime() - today.getTime()) / (1000 * 60 * 60 * 24);
    expect(daysOut).toBeCloseTo(172, 0);
  });

  it('flags overdue tasks instead of returning a past date', () => {
    const result = projectDueDate({ currentKm: 72500, dueAtKm: 72000, avgKmPerMonth: 1380, today });
    expect(result.isOverdue).toBe(true);
    expect(result.projectedDueDate).toBeNull();
  });

  it('treats reaching the target exactly as overdue (due now, not "later today")', () => {
    const result = projectDueDate({ currentKm: 72000, dueAtKm: 72000, avgKmPerMonth: 1380, today });
    expect(result.isOverdue).toBe(true);
  });

  it('cannot project when the pace is zero or negative — no date, not a crash', () => {
    const zero = projectDueDate({ currentKm: 64200, dueAtKm: 72000, avgKmPerMonth: 0, today });
    expect(zero.projectedDueDate).toBeNull();
    expect(zero.isOverdue).toBe(false);

    const negative = projectDueDate({ currentKm: 64200, dueAtKm: 72000, avgKmPerMonth: -50, today });
    expect(negative.projectedDueDate).toBeNull();
    expect(negative.isOverdue).toBe(false);
  });

  it('the projected date recedes on its own when the pace slows down', () => {
    const fast = projectDueDate({ currentKm: 64200, dueAtKm: 72000, avgKmPerMonth: 2000, today });
    const slow = projectDueDate({ currentKm: 64200, dueAtKm: 72000, avgKmPerMonth: 500, today });
    expect(slow.projectedDueDate!.getTime()).toBeGreaterThan(fast.projectedDueDate!.getTime());
  });
});

describe('buildSuggestedReadings', () => {
  it('returns three ascending values above the current odometer', () => {
    const suggestions = buildSuggestedReadings(64200, 1380);
    expect(suggestions).toHaveLength(3);
    expect(suggestions[0]).toBeGreaterThan(64200);
    expect(suggestions[1]).toBeGreaterThan(suggestions[0]);
    expect(suggestions[2]).toBeGreaterThan(suggestions[1]);
  });

  it('falls back to the default assumed pace when no average is available yet', () => {
    const withZero = buildSuggestedReadings(64200, 0);
    const withDefault = buildSuggestedReadings(64200, DEFAULT_ASSUMED_KM_PER_MONTH);
    expect(withZero).toEqual(withDefault);
  });
});

describe('buildMonthlyBars', () => {
  it('returns exactly six bars by default, oldest first', () => {
    const bars = buildMonthlyBars([], new Date('2026-08-14T00:00:00Z'));
    expect(bars).toHaveLength(6);
    expect(bars[0].month).toBe('2026-03');
    expect(bars[5].month).toBe('2026-08');
  });

  it('reports 0 km for months with no reading activity', () => {
    const bars = buildMonthlyBars([], new Date('2026-08-14T00:00:00Z'));
    expect(bars.every((b) => b.km === 0)).toBe(true);
  });

  it('computes km driven within each month from surrounding readings', () => {
    const today = new Date('2026-08-14T00:00:00Z');
    const readings = [
      { valueKm: 62820, recordedAt: new Date('2026-06-30T00:00:00Z') },
      { valueKm: 64200, recordedAt: new Date('2026-07-31T00:00:00Z') },
    ];
    const bars = buildMonthlyBars(readings, today);
    const july = bars.find((b) => b.month === '2026-07');
    expect(july!.km).toBe(1380);
  });
});
