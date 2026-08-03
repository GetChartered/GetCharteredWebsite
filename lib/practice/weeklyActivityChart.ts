import type { WeeklyStat } from "@/lib/practice/types";

// Data-shaping logic behind the Weekly Activity chart. The weekly/monthly
// frame-building here started as a 1:1 port of GetChartered_app's
// Learning/Utils/weeklyActivityChart.ts, then extended with more time
// ranges (This week / 3 months / 6 months / All time) and per-point
// "correct" totals to support recharts Tooltips — the app itself has no
// equivalent for any of this since its own chart only ever shows one fixed
// 12-week/6-month view with no hover interaction.
//
// Important constraint carried over from the backend contract (confirmed
// against BackendWeeklyStat in GetChartered_app's components/
// useBackendData.tsx): `dailyBreakdown` is a date -> completed-SESSION-COUNT
// map, not a per-day score breakdown, and there is still no backend field
// giving per-day SCORE resolution — only the weekly aggregate (`score`)
// does. So the "This week" daily view plots real session counts (a metric
// daily data actually supports), not a fabricated daily score.
//
// `dailyNewCorrect`/`dailyReviewCorrect` (added later) DO give per-day
// resolution for new-vs-review correctness specifically — see
// buildCurrentWeekNewReviewDailySeries below, used by NewVsReviewChart's
// "week" range. Same "missing day/week means 0" contract as dailyBreakdown.
//
// `examBreakdown` (per week) and `dailyNewCorrectByExam`/
// `dailyReviewCorrectByExam` (per day, added later still) split
// score/newCorrect/reviewCorrect by exam code — see resolveWeekTotals below
// and buildCurrentWeekNewReviewDailySeries's `examCodes` param. Every
// build*Series function here takes an optional `examCodes: Set<string> |
// null` — null (the default) preserves the original unfiltered behavior
// exactly; a Set sums only those exam codes' contributions instead of using
// the flat fields. There's still no per-day SESSION-COUNT-by-exam field, so
// the "This week" daily-sessions view (buildCurrentWeekDailySeries) has no
// examCodes param — it can't be exam-scoped.

export const WEEKS_IN_FRAME = 12;
export const WEEKS_PAST_3_MONTHS = 13;
export const MONTHS_IN_FRAME = 6;

const MONTH_ABBR = [
  "JAN", "FEB", "MAR", "APR", "MAY", "JUN",
  "JUL", "AUG", "SEP", "OCT", "NOV", "DEC",
] as const;

// Titlecase variant for inline date labels ("6 Jul"), vs. MONTH_ABBR's
// all-caps used for whole-month axis labels ("MAY").
const MONTH_ABBR_TITLE = MONTH_ABBR.map((m) => m[0] + m.slice(1).toLowerCase());

const WEEKDAY_ABBR = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const WEEKDAY_FULL = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export type WeekPoint = {
  /** Monday-start date key, "YYYY-MM-DD". */
  weekStartISO: string;
  score: number;
  /** newCorrect + reviewCorrect — kept alongside the two split-out fields
   *  below for callers (like the combined activity chart) that only need
   *  the total, not the new/review breakdown. */
  correct: number;
  newCorrect: number;
  reviewCorrect: number;
  /** false for frame weeks with no matching backend row — rendered as a
   *  flat zero, Strava-style, rather than skipped. */
  hasData: boolean;
  isCurrent: boolean;
};

export type MonthPoint = {
  /** "YYYY-MM" */
  monthKey: string;
  score: number;
  correct: number;
  /** newCorrect + reviewCorrect breakdown of `correct` above — added for
   *  NewVsReviewChart's 6-month/all-time views (buildWeekSeries already had
   *  this split at week granularity; monthly aggregation previously
   *  collapsed it into `correct` only, which was fine while nothing read
   *  the split at month granularity). */
  newCorrect: number;
  reviewCorrect: number;
  isCurrent: boolean;
};

export type DayPoint = {
  /** "YYYY-MM-DD" */
  dateISO: string;
  sessions: number;
  isCurrent: boolean;
};

function toDateKey(d: Date): string {
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd}`;
}

function monthKeyOf(year: number, monthIndex0: number): string {
  return `${year}-${String(monthIndex0 + 1).padStart(2, "0")}`;
}

/**
 * A week's effective score/newCorrect/reviewCorrect: the flat fields when
 * `examCodes` is null (unfiltered — the original, unchanged behavior), or
 * summed from `examBreakdown` across only the given exam codes when it
 * isn't. A week with no examBreakdown at all (recorded before that field
 * existed on the backend), or with none of the requested codes present in
 * it, resolves to all-zero rather than erroring — same "missing means 0"
 * contract dailyBreakdown/dailyNewCorrect already have elsewhere in this
 * file.
 */
function resolveWeekTotals(
  stat: WeeklyStat | undefined,
  examCodes: Set<string> | null
): { score: number; newCorrect: number; reviewCorrect: number } {
  if (!stat) return { score: 0, newCorrect: 0, reviewCorrect: 0 };
  if (!examCodes) {
    return { score: stat.score ?? 0, newCorrect: stat.newCorrect ?? 0, reviewCorrect: stat.reviewCorrect ?? 0 };
  }
  const breakdown = stat.examBreakdown ?? {};
  let score = 0;
  let newCorrect = 0;
  let reviewCorrect = 0;
  for (const code of examCodes) {
    const entry = breakdown[code];
    if (!entry) continue;
    score += entry.score ?? 0;
    newCorrect += entry.newCorrect ?? 0;
    reviewCorrect += entry.reviewCorrect ?? 0;
  }
  return { score, newCorrect, reviewCorrect };
}

// Monday-start week, matching the app's convention (ISO 8601 weeks start
// Monday). Re-deriving this from the parsed date rather than trusting the
// raw weekStartISO string's exact format makes matching robust to whatever
// timestamp shape the backend sends.
export function startOfWeekMonday(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay(); // Sun=0..Sat=6
  const diff = day === 0 ? -6 : 1 - day;
  d.setDate(d.getDate() + diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

function weekKeyOf(dateLike: string | Date): string | null {
  const d = dateLike instanceof Date ? dateLike : new Date(dateLike);
  if (Number.isNaN(d.getTime())) return null;
  return toDateKey(startOfWeekMonday(d));
}

export function getCurrentWeekStartISO(now: Date = new Date()): string {
  return toDateKey(startOfWeekMonday(now));
}

/** Shifts a Monday-start week key by `deltaWeeks` (negative = earlier). */
export function shiftWeekStartISO(weekStartISO: string, deltaWeeks: number): string {
  const [y, m, d] = weekStartISO.split("-").map(Number);
  const date = new Date(y, (m ?? 1) - 1, d ?? 1);
  date.setDate(date.getDate() + deltaWeeks * 7);
  return toDateKey(date);
}

export function getCurrentMonthKey(now: Date = new Date()): string {
  return monthKeyOf(now.getFullYear(), now.getMonth());
}

/** Shifts a "YYYY-MM" month key by `deltaMonths` (negative = earlier). */
export function shiftMonthKey(monthKey: string, deltaMonths: number): string {
  const [y, m] = monthKey.split("-").map(Number);
  const d = new Date(y, (m ?? 1) - 1 + deltaMonths, 1);
  return monthKeyOf(d.getFullYear(), d.getMonth());
}

/**
 * Builds a dense frame of `weeksInFrame` weeks ending at `anchorWeekStartISO`
 * (defaults to the current week), filling any week with no matching backend
 * row as a zero/no-data point. `isCurrent` is always relative to the real
 * current week (`now`), not the anchor. Weeks are returned oldest-first.
 */
export function buildWeekSeries(
  weeklyStats: WeeklyStat[],
  weeksInFrame: number = WEEKS_IN_FRAME,
  anchorWeekStartISO: string = getCurrentWeekStartISO(),
  now: Date = new Date(),
  /** When set, score/newCorrect/reviewCorrect are summed from each week's
   *  examBreakdown across just these exam codes instead of using the flat
   *  fields — see resolveWeekTotals. */
  examCodes: Set<string> | null = null
): WeekPoint[] {
  const byWeek = new Map<string, WeeklyStat>();
  for (const w of weeklyStats) {
    const key = weekKeyOf(w.weekStartISO);
    if (key) byWeek.set(key, w);
  }

  const currentWeekISO = getCurrentWeekStartISO(now);

  const points: WeekPoint[] = [];
  for (let i = weeksInFrame - 1; i >= 0; i--) {
    const iso = shiftWeekStartISO(anchorWeekStartISO, -i);
    const stat = byWeek.get(iso);
    const totals = resolveWeekTotals(stat, examCodes);
    points.push({
      weekStartISO: iso,
      score: totals.score,
      correct: totals.newCorrect + totals.reviewCorrect,
      newCorrect: totals.newCorrect,
      reviewCorrect: totals.reviewCorrect,
      hasData: stat != null,
      isCurrent: iso === currentWeekISO,
    });
  }
  return points;
}

/**
 * Builds a dense frame of `monthsInFrame` calendar months ending at
 * `anchorMonthKey` (defaults to the current month), summing every
 * weeklyStats entry that falls in each month and zero-filling months with
 * none. `isCurrent` is relative to the real current month (`now`), not the
 * anchor. Months are returned oldest-first.
 */
export function buildMonthlySeries(
  weeklyStats: WeeklyStat[],
  monthsInFrame: number = MONTHS_IN_FRAME,
  anchorMonthKey: string = getCurrentMonthKey(),
  now: Date = new Date(),
  /** Same meaning as buildWeekSeries's examCodes param. */
  examCodes: Set<string> | null = null
): MonthPoint[] {
  const byMonth = new Map<string, { score: number; newCorrect: number; reviewCorrect: number }>();
  for (const w of weeklyStats) {
    const d = new Date(w.weekStartISO);
    if (Number.isNaN(d.getTime())) continue;
    const key = monthKeyOf(d.getFullYear(), d.getMonth());
    const totals = resolveWeekTotals(w, examCodes);
    const existing = byMonth.get(key) ?? { score: 0, newCorrect: 0, reviewCorrect: 0 };
    existing.score += totals.score;
    existing.newCorrect += totals.newCorrect;
    existing.reviewCorrect += totals.reviewCorrect;
    byMonth.set(key, existing);
  }

  const currentMonthKey = getCurrentMonthKey(now);

  const points: MonthPoint[] = [];
  for (let i = monthsInFrame - 1; i >= 0; i--) {
    const key = shiftMonthKey(anchorMonthKey, -i);
    const agg = byMonth.get(key);
    points.push({
      monthKey: key,
      score: agg?.score ?? 0,
      correct: (agg?.newCorrect ?? 0) + (agg?.reviewCorrect ?? 0),
      newCorrect: agg?.newCorrect ?? 0,
      reviewCorrect: agg?.reviewCorrect ?? 0,
      isCurrent: key === currentMonthKey,
    });
  }
  return points;
}

/** Earliest calendar month present anywhere in weeklyStats, or null when
 *  there's no data at all. Used to size the "All time" frame. */
export function getEarliestMonthKey(weeklyStats: WeeklyStat[]): string | null {
  const keys = weeklyStats
    .map((w) => {
      const d = new Date(w.weekStartISO);
      return Number.isNaN(d.getTime()) ? null : monthKeyOf(d.getFullYear(), d.getMonth());
    })
    .filter((k): k is string => k !== null);
  if (keys.length === 0) return null;
  return keys.sort()[0];
}

/** Monthly series spanning every month from the user's earliest recorded
 *  activity through the current month. Falls back to a single current-month
 *  point when there's no history yet, rather than an empty/undefined frame. */
export function buildAllTimeMonthlySeries(
  weeklyStats: WeeklyStat[],
  now: Date = new Date(),
  /** Same meaning as buildWeekSeries's examCodes param. */
  examCodes: Set<string> | null = null
): MonthPoint[] {
  const currentMonthKey = getCurrentMonthKey(now);
  const earliest = getEarliestMonthKey(weeklyStats);
  if (!earliest) return buildMonthlySeries(weeklyStats, 1, currentMonthKey, now, examCodes);

  const [ey, em] = earliest.split("-").map(Number);
  const [cy, cm] = currentMonthKey.split("-").map(Number);
  const monthsSpan = (cy - ey) * 12 + (cm - em) + 1;
  return buildMonthlySeries(weeklyStats, monthsSpan, currentMonthKey, now, examCodes);
}

/**
 * The current week's individual days (Monday through today — future days in
 * the week aren't included, since there's nothing to plot for them yet).
 * `sessions` is a completed-session COUNT, not a score: see the module
 * header comment for why per-day score isn't available.
 */
export function buildCurrentWeekDailySeries(weeklyStats: WeeklyStat[], now: Date = new Date()): DayPoint[] {
  const weekStartISO = getCurrentWeekStartISO(now);
  const match = weeklyStats.find((w) => weekKeyOf(w.weekStartISO) === weekStartISO);
  const breakdown = match?.dailyBreakdown ?? {};
  const todayKey = toDateKey(now);

  const [y, m, d] = weekStartISO.split("-").map(Number);
  const points: DayPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(y, (m ?? 1) - 1, (d ?? 1) + i);
    const key = toDateKey(day);
    if (key > todayKey) break;
    points.push({ dateISO: key, sessions: breakdown[key] ?? 0, isCurrent: key === todayKey });
  }
  return points;
}

export type NewReviewDayPoint = {
  /** "YYYY-MM-DD" */
  dateISO: string;
  newCorrect: number;
  reviewCorrect: number;
  isCurrent: boolean;
};

/**
 * Same Monday-through-today day range as buildCurrentWeekDailySeries above
 * (see its doc comment for why future days in the week aren't included),
 * but reading dailyNewCorrect/dailyReviewCorrect instead of dailyBreakdown —
 * for NewVsReviewChart's "week" range, which needs the new-vs-review split
 * at daily resolution rather than a session count.
 *
 * A week with no dailyNewCorrect/dailyReviewCorrect data at all (any week
 * recorded before these fields existed on the backend) defaults every day
 * to 0/0 rather than erroring — same "missing means zero, not omitted on
 * purpose" contract dailyBreakdown itself already has.
 */
export function buildCurrentWeekNewReviewDailySeries(
  weeklyStats: WeeklyStat[],
  now: Date = new Date(),
  /** When set, each day's newCorrect/reviewCorrect are summed from
   *  dailyNewCorrectByExam/dailyReviewCorrectByExam across just these exam
   *  codes instead of the flat dailyNewCorrect/dailyReviewCorrect maps. A
   *  day/week with no *ByExam data at all (recorded before those fields
   *  existed) resolves to 0 rather than erroring — same contract as the
   *  unfiltered case already has. */
  examCodes: Set<string> | null = null
): NewReviewDayPoint[] {
  const weekStartISO = getCurrentWeekStartISO(now);
  const match = weeklyStats.find((w) => weekKeyOf(w.weekStartISO) === weekStartISO);
  const newBreakdown = match?.dailyNewCorrect ?? {};
  const reviewBreakdown = match?.dailyReviewCorrect ?? {};
  const newByExam = match?.dailyNewCorrectByExam ?? {};
  const reviewByExam = match?.dailyReviewCorrectByExam ?? {};
  const todayKey = toDateKey(now);

  const resolveDay = (key: string): { newCorrect: number; reviewCorrect: number } => {
    if (!examCodes) {
      return { newCorrect: newBreakdown[key] ?? 0, reviewCorrect: reviewBreakdown[key] ?? 0 };
    }
    let newCorrect = 0;
    let reviewCorrect = 0;
    const newForDay = newByExam[key] ?? {};
    const reviewForDay = reviewByExam[key] ?? {};
    for (const code of examCodes) {
      newCorrect += newForDay[code] ?? 0;
      reviewCorrect += reviewForDay[code] ?? 0;
    }
    return { newCorrect, reviewCorrect };
  };

  const [y, m, d] = weekStartISO.split("-").map(Number);
  const points: NewReviewDayPoint[] = [];
  for (let i = 0; i < 7; i++) {
    const day = new Date(y, (m ?? 1) - 1, (d ?? 1) + i);
    const key = toDateKey(day);
    if (key > todayKey) break;
    const { newCorrect, reviewCorrect } = resolveDay(key);
    points.push({ dateISO: key, newCorrect, reviewCorrect, isCurrent: key === todayKey });
  }
  return points;
}

/** Score/Correct for the current week specifically — 0/false when the
 *  backend hasn't written a row for this week yet. Always the real current
 *  week, independent of whatever range is selected in the chart above it. */
export function getCurrentWeekStat(
  weeklyStats: WeeklyStat[],
  now: Date = new Date(),
  /** Same meaning as buildWeekSeries's examCodes param. */
  examCodes: Set<string> | null = null
): { score: number; correct: number; hasData: boolean } {
  const currentKey = getCurrentWeekStartISO(now);
  const match = weeklyStats.find((w) => weekKeyOf(w.weekStartISO) === currentKey);
  if (!match) return { score: 0, correct: 0, hasData: false };
  const totals = resolveWeekTotals(match, examCodes);
  return {
    score: totals.score,
    correct: totals.newCorrect + totals.reviewCorrect,
    hasData: true,
  };
}

/**
 * Y-axis scale: `max` is always >=1 (safe scaling denominator, even for an
 * all-zero/empty frame); `ticks` is the deduped set of label values to draw
 * (0/midpoint/max).
 */
export function computeYAxisScale(values: number[]): { max: number; ticks: number[] } {
  const rawMax = Math.max(...values, 0);
  if (rawMax <= 0) {
    return { max: 1, ticks: [0] };
  }
  const top = Math.max(1, Math.ceil(rawMax));
  const mid = Math.round(top / 2);
  const ticks = Array.from(new Set([0, mid, top])).sort((a, b) => a - b);
  return { max: top, ticks };
}

/**
 * Picks up to `targetCount` evenly-spaced indices out of `n` points (always
 * including the first and last), so x-axis label density adapts to however
 * many points are in the current range instead of colliding on a long "All
 * time" frame or looking sparse on a short one.
 */
export function selectEvenLabelIndices(n: number, targetCount: number): number[] {
  if (n <= 0) return [];
  if (n <= targetCount) return Array.from({ length: n }, (_, i) => i);

  const step = Math.max(1, Math.round((n - 1) / (targetCount - 1)));
  const indices: number[] = [];
  for (let i = 0; i < n; i += step) indices.push(i);
  if (indices[indices.length - 1] !== n - 1) indices.push(n - 1);
  return indices;
}

export function formatWeekDateLabel(weekStartISO: string): string {
  const d = new Date(`${weekStartISO}T00:00:00`);
  return `${d.getDate()} ${MONTH_ABBR_TITLE[d.getMonth()]}`;
}

export function formatMonthLabel(monthKey: string): string {
  const monthIndex = Number(monthKey.split("-")[1]) - 1;
  return MONTH_ABBR[monthIndex];
}

export function formatMonthFullLabel(monthKey: string): string {
  const [year, month] = monthKey.split("-").map(Number);
  return `${MONTH_ABBR_TITLE[(month ?? 1) - 1]} ${year}`;
}

export function formatDayLabel(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return WEEKDAY_ABBR[d.getDay()];
}

export function formatFullDate(dateISO: string): string {
  const d = new Date(`${dateISO}T00:00:00`);
  return `${WEEKDAY_FULL[d.getDay()]}, ${d.getDate()} ${MONTH_ABBR_TITLE[d.getMonth()]} ${d.getFullYear()}`;
}
