/**
 * The recalibrated mileage projection — see design_handoff_mekamemo/README.md,
 * "La solution au problème du kilométrage". The app never knows real-time
 * mileage; it projects a date from an average recalculated at every reading.
 *
 * Two independently-moving parts, by design:
 *  - The km target for a task is fixed at creation (or reset on completion) —
 *    readings never move it.
 *  - The projected DATE is recalculated from the latest pace on every reading —
 *    drive less and it recedes on its own; drive more and it advances.
 */

/** Assumed pace until at least two readings exist to compute a real average. */
export const DEFAULT_ASSUMED_KM_PER_MONTH = 1200;

/** Average days per month over a year — used to convert the monthly pace to a daily one. */
const DAYS_PER_MONTH = 30.44;

export interface MileageReadingPoint {
  valueKm: number;
  recordedAt: Date;
}

/**
 * Average km/month across the full reading history (earliest to latest),
 * not just the most recent pair — matches the mockup's "moyenne sur N relevés".
 * Returns null when fewer than two readings exist, or when they share a
 * timestamp (no elapsed time to compute a rate from).
 */
export function computeAverageKmPerMonth(readings: MileageReadingPoint[]): number | null {
  if (readings.length < 2) return null;

  const sorted = [...readings].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const first = sorted[0];
  const last = sorted[sorted.length - 1];

  const elapsedDays = (last.recordedAt.getTime() - first.recordedAt.getTime()) / (1000 * 60 * 60 * 24);
  if (elapsedDays <= 0) return null;

  const kmDriven = last.valueKm - first.valueKm;
  const elapsedMonths = elapsedDays / DAYS_PER_MONTH;
  return kmDriven / elapsedMonths;
}

export interface ProjectionInput {
  currentKm: number;
  dueAtKm: number;
  avgKmPerMonth: number;
  today: Date;
}

export interface ProjectionResult {
  projectedDueDate: Date | null;
  isOverdue: boolean;
}

/**
 * Projects the date a km target will be reached at the given pace.
 * Returns `isOverdue: true` (and a null date) when the target is already
 * behind the current mileage — the UI surfaces this as "en retard" rather
 * than a future date.
 */
export function projectDueDate({
  currentKm,
  dueAtKm,
  avgKmPerMonth,
  today,
}: ProjectionInput): ProjectionResult {
  const kmRemaining = dueAtKm - currentKm;

  if (kmRemaining <= 0) {
    return { projectedDueDate: null, isOverdue: true };
  }

  if (avgKmPerMonth <= 0) {
    return { projectedDueDate: null, isOverdue: false };
  }

  const avgKmPerDay = avgKmPerMonth / DAYS_PER_MONTH;
  const daysUntilDue = kmRemaining / avgKmPerDay;
  const projectedDueDate = new Date(today.getTime() + daysUntilDue * 24 * 60 * 60 * 1000);

  return { projectedDueDate, isOverdue: false };
}

/**
 * Three one-tap estimates for the monthly mileage prompt, spaced around the
 * current pace so a plausible actual reading is always one tap away.
 */
export function buildSuggestedReadings(currentKm: number, avgKmPerMonth: number): number[] {
  const pace = avgKmPerMonth > 0 ? avgKmPerMonth : DEFAULT_ASSUMED_KM_PER_MONTH;
  const step = Math.max(Math.round(pace / 3 / 100) * 100, 100);
  return [currentKm + step, currentKm + step * 2, currentKm + step * 3];
}

export interface MonthlyBar {
  /** ISO month key, e.g. "2026-04". */
  month: string;
  km: number;
}

/**
 * Km driven per calendar month, for the last `monthCount` months — feeds the
 * pace bar chart. A month with no readings on both ends reports 0.
 */
export function buildMonthlyBars(
  readings: MileageReadingPoint[],
  today: Date,
  monthCount = 6,
): MonthlyBar[] {
  const sorted = [...readings].sort((a, b) => a.recordedAt.getTime() - b.recordedAt.getTime());
  const bars: MonthlyBar[] = [];

  for (let i = monthCount - 1; i >= 0; i--) {
    const monthStart = new Date(today.getFullYear(), today.getMonth() - i, 1);
    const monthEnd = new Date(today.getFullYear(), today.getMonth() - i + 1, 1);
    const monthKey = `${monthStart.getFullYear()}-${String(monthStart.getMonth() + 1).padStart(2, '0')}`;

    const before = [...sorted].reverse().find((r) => r.recordedAt < monthStart);
    const within = sorted.filter((r) => r.recordedAt >= monthStart && r.recordedAt < monthEnd);
    const boundaryStart = within.length > 0 ? (before?.valueKm ?? within[0].valueKm) : before?.valueKm;
    const boundaryEnd = within.length > 0 ? within[within.length - 1].valueKm : undefined;

    const km =
      boundaryStart !== undefined && boundaryEnd !== undefined
        ? Math.max(boundaryEnd - boundaryStart, 0)
        : 0;

    bars.push({ month: monthKey, km });
  }

  return bars;
}
