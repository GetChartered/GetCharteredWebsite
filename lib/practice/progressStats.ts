import type { ModuleStat, WeeklyStat } from "@/lib/practice/types";

export function toLocalDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

/** Merges every week's dailyBreakdown into one date -> session-count map. */
export function mergeDailyBreakdowns(weeklyStats: WeeklyStat[]): Record<string, number> {
  const merged: Record<string, number> = {};
  for (const week of weeklyStats) {
    if (!week.dailyBreakdown) continue;
    for (const [date, count] of Object.entries(week.dailyBreakdown)) {
      merged[date] = (merged[date] ?? 0) + count;
    }
  }
  return merged;
}

/**
 * Consecutive-day streak, counted backward from today. If today has no
 * session yet, that's not treated as a broken streak — checking starts from
 * yesterday instead, since today may simply be in progress.
 */
export function computeStreak(dailyCounts: Record<string, number>, now: Date = new Date()): number {
  let cursor = new Date(now);
  if ((dailyCounts[toLocalDateKey(cursor)] ?? 0) === 0) {
    cursor.setDate(cursor.getDate() - 1);
  }

  let streak = 0;
  while ((dailyCounts[toLocalDateKey(cursor)] ?? 0) > 0) {
    streak += 1;
    cursor = new Date(cursor);
    cursor.setDate(cursor.getDate() - 1);
  }
  return streak;
}

export interface StreakDay {
  dateISO: string;
  dayNum: number;
  /** "MON" .. "SUN". */
  label: string;
  done: boolean;
  isToday: boolean;
}

export const STREAK_WEEKDAY_LABELS = ["MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN"];

/**
 * `weeksBack` consecutive Monday-Sunday weeks ending at the current week
 * (inclusive), oldest week first — e.g. weeksBack=3 returns [2 weeks ago,
 * last week, this week]. Days later in the current week that haven't
 * happened yet just render as not-done, same as any other day with no
 * session.
 *
 * `done` is computed from dailyBreakdown merged across every entry in
 * `weeklyStats` (mergeDailyBreakdowns, same approach used elsewhere in this
 * file for multi-week data) — a prior week with no matching WeeklyStat row,
 * or one with no dailyBreakdown at all, safely renders as an all-not-done
 * week rather than erroring.
 */
export function buildRecentWeeksStreakDays(
  weeklyStats: WeeklyStat[],
  weeksBack: number = 3,
  now: Date = new Date()
): StreakDay[][] {
  const dailyCounts = mergeDailyBreakdowns(weeklyStats);

  const currentWeekStart = new Date(now);
  const dow = currentWeekStart.getDay(); // 0 = Sunday .. 6 = Saturday
  const mondayOffset = dow === 0 ? -6 : 1 - dow;
  currentWeekStart.setDate(currentWeekStart.getDate() + mondayOffset);
  currentWeekStart.setHours(0, 0, 0, 0);

  const todayKey = toLocalDateKey(now);

  const weeks: StreakDay[][] = [];
  for (let w = weeksBack - 1; w >= 0; w--) {
    const weekStart = new Date(currentWeekStart);
    weekStart.setDate(currentWeekStart.getDate() - w * 7);

    const days: StreakDay[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date(weekStart);
      d.setDate(weekStart.getDate() + i);
      const key = toLocalDateKey(d);
      days.push({
        dateISO: key,
        dayNum: d.getDate(),
        label: STREAK_WEEKDAY_LABELS[i],
        done: (dailyCounts[key] ?? 0) > 0,
        isToday: key === todayKey,
      });
    }
    weeks.push(days);
  }
  return weeks;
}

/** Most-recent week by weekStartISO, or null if there's no history yet. */
export function currentWeek(weeklyStats: WeeklyStat[]): WeeklyStat | null {
  if (weeklyStats.length === 0) return null;
  return [...weeklyStats].sort((a, b) => (a.weekStartISO < b.weekStartISO ? 1 : -1))[0];
}

export interface ModuleCoverage {
  module: string;
  totalAnswered: number;
  totalCorrect: number;
  accuracy: number | null;
  learningCount: number;
  reviewingCount: number;
  masteredCount: number;
  /** null when the bank size for this module isn't known (no moduleQuestionCounts entry). */
  notStartedCount: number | null;
  bankSize: number | null;
}

export function buildModuleCoverage(
  moduleCode: string,
  moduleStats: ModuleStat[],
  moduleQuestionCounts: Record<string, number>
): ModuleCoverage {
  const stat = moduleStats.find((m) => m.module === moduleCode);
  const bankSize = typeof moduleQuestionCounts[moduleCode] === "number" ? moduleQuestionCounts[moduleCode] : null;
  const learningCount = stat?.learningCount ?? 0;
  const reviewingCount = stat?.reviewingCount ?? 0;
  const masteredCount = stat?.masteredCount ?? 0;
  const notStartedCount =
    bankSize != null ? Math.max(0, bankSize - learningCount - reviewingCount - masteredCount) : null;

  return {
    module: moduleCode,
    totalAnswered: stat?.totalAnswered ?? 0,
    totalCorrect: stat?.totalCorrect ?? 0,
    accuracy: stat && stat.totalAnswered > 0 ? Math.round((stat.totalCorrect / stat.totalAnswered) * 100) : null,
    learningCount,
    reviewingCount,
    masteredCount,
    notStartedCount,
    bankSize,
  };
}

export type CoverageBucket = "notStarted" | "learning" | "reviewing" | "mastered";

export interface CoverageBarData {
  segments: { key: CoverageBucket; value: number }[];
  barTotal: number;
  caption: string;
}

/**
 * Ported 1:1 from GetChartered_app's components/progress/ModuleCoverageCard.tsx
 * (the segment-building + caption logic inlined in its render). A module
 * with zero recorded progress always gets a single full-width "notStarted"
 * segment — never an empty/blank bar — which is the bug this fixes on the
 * website (a `total === 0` case previously rendered a bare, colourless div).
 */
export function buildCoverageBarData(coverage: ModuleCoverage): CoverageBarData {
  const started = coverage.totalAnswered > 0;
  const bankKnown = coverage.bankSize != null && coverage.bankSize > 0;
  const notStarted = coverage.notStartedCount ?? 0;
  const answeredSum = coverage.masteredCount + coverage.reviewingCount + coverage.learningCount;

  // bankSize alone isn't a safe denominator: notStartedCount is clamped to
  // >=0 (see buildModuleCoverage) when answeredSum exceeds bankSize — e.g.
  // the backend's Leitner-bucket counts including questions no longer in
  // the current bank snapshot — but the segment values themselves are NOT
  // clamped. Using bankSize as barTotal in that case makes the segments
  // sum to more than barTotal, so their percentages (and the aggregate
  // "touched" % this feeds via buildCoverageTotals) exceed 100%. Using
  // whichever is larger keeps barTotal >= the actual segment sum always,
  // so every percentage stays correctly bounded at 0-100%.
  const barTotal = !started
    ? 1
    : bankKnown
      ? Math.max(coverage.bankSize!, answeredSum)
      : Math.max(answeredSum, 1);

  const segments: { key: CoverageBucket; value: number }[] = !started
    ? [{ key: "notStarted", value: 1 }]
    : (
        [
          { key: "mastered" as const, value: coverage.masteredCount },
          { key: "reviewing" as const, value: coverage.reviewingCount },
          { key: "learning" as const, value: coverage.learningCount },
          ...(bankKnown ? [{ key: "notStarted" as const, value: notStarted }] : []),
        ]
      ).filter((s) => s.value > 0);

  const nonZeroParts = [
    coverage.masteredCount > 0 ? `${coverage.masteredCount} mastered` : null,
    coverage.reviewingCount > 0 ? `${coverage.reviewingCount} reviewing` : null,
    coverage.learningCount > 0 ? `${coverage.learningCount} learning` : null,
  ].filter((s): s is string => s !== null);
  const toGoPart = bankKnown ? `${notStarted} to go` : null;

  const caption = !started
    ? "Start practising to track your progress"
    : nonZeroParts.length > 0
      ? [...nonZeroParts, ...(toGoPart ? [toGoPart] : [])].join(" · ")
      : (toGoPart ?? "In progress");

  return { segments, barTotal, caption };
}

export interface AccuracyDatum {
  module: string;
  examCode: string;
  name: string;
  accuracy: number;
  totalAnswered: number;
  totalCorrect: number;
}

/** One row per module the user has actually attempted (totalAnswered > 0),
 *  sorted weakest-first — untouched modules are excluded entirely rather
 *  than shown at 0%, since 0% would misleadingly read as "failing" instead
 *  of "never tried". `examCode` is the module code's own prefix (same
 *  `code.split("-")[0]` convention used elsewhere, e.g. examVisuals.ts) —
 *  relies on moduleStats already being canonicalized (see
 *  lib/practice/moduleCode.ts) so this split is reliable. */
export function buildAccuracyByModule(
  moduleStats: ModuleStat[],
  moduleNameByCode: Record<string, string>
): AccuracyDatum[] {
  return moduleStats
    .filter((m) => m.totalAnswered > 0)
    .map((m) => ({
      module: m.module,
      examCode: m.module.split("-")[0] ?? m.module,
      name: moduleNameByCode[m.module] || m.module,
      accuracy: Math.round((m.totalCorrect / m.totalAnswered) * 100),
      totalAnswered: m.totalAnswered,
      totalCorrect: m.totalCorrect,
    }))
    .sort((a, b) => a.accuracy - b.accuracy);
}

export type CoverageTotals = Record<CoverageBucket, number> & { total: number };

/**
 * Sums buildCoverageBarData's per-module segments across every module in
 * the course — the "zoom out" aggregate that the Coverage section's
 * per-module bars are the "zoom in" view of. Reuses the exact same
 * denominator logic (buildModuleCoverage + buildCoverageBarData) as those
 * bars module-by-module, so the whole-syllabus summary can never disagree
 * with the individual bars it's built from.
 */
export function buildCoverageTotals(
  moduleCodes: string[],
  moduleStats: ModuleStat[],
  moduleQuestionCounts: Record<string, number>
): CoverageTotals {
  const totals: CoverageTotals = { mastered: 0, reviewing: 0, learning: 0, notStarted: 0, total: 0 };
  for (const code of moduleCodes) {
    const coverage = buildModuleCoverage(code, moduleStats, moduleQuestionCounts);
    const { segments, barTotal } = buildCoverageBarData(coverage);
    for (const seg of segments) {
      totals[seg.key] += seg.value;
    }
    totals.total += barTotal;
  }
  return totals;
}
