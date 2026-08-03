import { callGcApi } from "@/lib/gcApi";
import { canonicalizeModuleCode } from "@/lib/practice/moduleCode";
import type { ExamBreakdownEntry, ModuleStat, ProgressData, WeeklyStat } from "@/lib/practice/types";

const KNOWN_MODULE_STAT_KEYS = new Set([
  "module",
  "course",
  "totalAnswered",
  "totalCorrect",
  "totalMarksAwarded",
  "totalMarksAvailable",
  "lastAnsweredAt",
  "learningCount",
  "reviewingCount",
  "masteredCount",
]);

/**
 * Sums two ModuleStat rows that canonicalized to the same module code (see
 * below) — both represent real attempts on the same actual module, just
 * recorded by the backend under two differently-spelled codes, so the
 * correct recovery is combining them, not picking one and discarding the
 * other's data.
 */
function mergeModuleStat(a: ModuleStat, b: ModuleStat): ModuleStat {
  return {
    module: a.module,
    course: a.course,
    totalAnswered: a.totalAnswered + b.totalAnswered,
    totalCorrect: a.totalCorrect + b.totalCorrect,
    totalMarksAwarded: a.totalMarksAwarded + b.totalMarksAwarded,
    totalMarksAvailable: a.totalMarksAvailable + b.totalMarksAvailable,
    lastAnsweredAt:
      a.lastAnsweredAt == null ? b.lastAnsweredAt : b.lastAnsweredAt == null ? a.lastAnsweredAt : Math.max(a.lastAnsweredAt, b.lastAnsweredAt),
    learningCount: a.learningCount + b.learningCount,
    reviewingCount: a.reviewingCount + b.reviewingCount,
    masteredCount: a.masteredCount + b.masteredCount,
  };
}

function parseModuleStats(raw: unknown): ModuleStat[] {
  if (!Array.isArray(raw)) return [];

  // Keyed by canonical module code (Map, not a plain filter+map) so two
  // raw rows that canonicalize to the same code — e.g. one correctly
  // coded "AF-2" plus a double-prefixed "AF-AF-2" for the SAME real
  // module — get merged into one entry instead of surviving as two
  // separate rows with the same display name but different numbers. Two
  // rows like that previously caused both a visible duplicate row in the
  // accuracy chart AND cross-wired bar/tooltip values, since recharts'
  // category axis assumes one row per unique label.
  const byCode = new Map<string, ModuleStat>();

  for (const entry of raw) {
    const m = entry as Record<string, unknown>;
    if (typeof m?.module !== "string" || typeof m?.course !== "string") continue;

    // Nested per-question data (e.g. a `questions: [...]` array on each
    // module entry) would show up here, since it wouldn't match any known
    // key — this is the check for "nested somewhere not currently parsed".
    const unknownKeys = Object.keys(m).filter((k) => !KNOWN_MODULE_STAT_KEYS.has(k));
    if (unknownKeys.length > 0) {
      console.warn(
        `[fetchProgressData] moduleStats entry for "${m.module}" has unrecognised key(s) — check if one of these is per-question data:`,
        unknownKeys
      );
    }

    // Some backend responses double-prefix the module code with its own
    // exam code ("BIP-BIP-4" instead of "BIP-4") — canonicalized here so
    // every downstream lookup against GET /courses's module codes (the
    // coverage cards, the accuracy chart, etc.) matches consistently
    // instead of silently missing and falling back to the raw code.
    const code = canonicalizeModuleCode(m.module);
    const stat: ModuleStat = {
      module: code,
      course: m.course,
      totalAnswered: typeof m.totalAnswered === "number" ? m.totalAnswered : 0,
      totalCorrect: typeof m.totalCorrect === "number" ? m.totalCorrect : 0,
      totalMarksAwarded: typeof m.totalMarksAwarded === "number" ? m.totalMarksAwarded : 0,
      totalMarksAvailable: typeof m.totalMarksAvailable === "number" ? m.totalMarksAvailable : 0,
      lastAnsweredAt: typeof m.lastAnsweredAt === "number" ? m.lastAnsweredAt : null,
      learningCount: typeof m.learningCount === "number" ? m.learningCount : 0,
      reviewingCount: typeof m.reviewingCount === "number" ? m.reviewingCount : 0,
      masteredCount: typeof m.masteredCount === "number" ? m.masteredCount : 0,
    };

    const existing = byCode.get(code);
    if (existing) {
      console.warn(
        `[fetchProgressData] moduleStats had two rows resolving to the same module code "${code}" (raw code "${m.module}") — merging instead of keeping both.`
      );
      byCode.set(code, mergeModuleStat(existing, stat));
    } else {
      byCode.set(code, stat);
    }
  }

  return Array.from(byCode.values());
}

/** Validates a raw examBreakdown object: exam code -> {newCorrect,
 *  reviewCorrect, score}. Missing/non-numeric fields within an entry
 *  default to 0 rather than dropping the whole entry — same tolerance
 *  parseModuleStats/parseWeeklyStats already give individual numeric
 *  fields elsewhere in this file. */
function parseExamBreakdown(raw: unknown): Record<string, ExamBreakdownEntry> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, ExamBreakdownEntry> = {};
  for (const [examCode, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const v = value as Record<string, unknown>;
    out[examCode] = {
      newCorrect: typeof v.newCorrect === "number" ? v.newCorrect : 0,
      reviewCorrect: typeof v.reviewCorrect === "number" ? v.reviewCorrect : 0,
      score: typeof v.score === "number" ? v.score : 0,
    };
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

/** Validates a raw dailyNewCorrectByExam/dailyReviewCorrectByExam object:
 *  date string -> (exam code -> count). Same shape both fields share. */
function parseDailyByExam(raw: unknown): Record<string, Record<string, number>> | undefined {
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return undefined;
  const out: Record<string, Record<string, number>> = {};
  for (const [date, value] of Object.entries(raw as Record<string, unknown>)) {
    if (!value || typeof value !== "object" || Array.isArray(value)) continue;
    const byExam: Record<string, number> = {};
    for (const [examCode, count] of Object.entries(value as Record<string, unknown>)) {
      if (typeof count === "number") byExam[examCode] = count;
    }
    if (Object.keys(byExam).length > 0) out[date] = byExam;
  }
  return Object.keys(out).length > 0 ? out : undefined;
}

function parseWeeklyStats(raw: unknown): WeeklyStat[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((entry) => {
      const w = entry as Record<string, unknown>;
      if (typeof w?.weekStartISO !== "string") return null;
      const stat: WeeklyStat = {
        weekStartISO: w.weekStartISO,
        newCorrect: typeof w.newCorrect === "number" ? w.newCorrect : 0,
        reviewCorrect: typeof w.reviewCorrect === "number" ? w.reviewCorrect : 0,
        score: typeof w.score === "number" ? w.score : 0,
        dailyBreakdown:
          w.dailyBreakdown && typeof w.dailyBreakdown === "object" && !Array.isArray(w.dailyBreakdown)
            ? (w.dailyBreakdown as Record<string, number>)
            : undefined,
        dailyNewCorrect:
          w.dailyNewCorrect && typeof w.dailyNewCorrect === "object" && !Array.isArray(w.dailyNewCorrect)
            ? (w.dailyNewCorrect as Record<string, number>)
            : undefined,
        dailyReviewCorrect:
          w.dailyReviewCorrect && typeof w.dailyReviewCorrect === "object" && !Array.isArray(w.dailyReviewCorrect)
            ? (w.dailyReviewCorrect as Record<string, number>)
            : undefined,
        examBreakdown: parseExamBreakdown(w.examBreakdown),
        dailyNewCorrectByExam: parseDailyByExam(w.dailyNewCorrectByExam),
        dailyReviewCorrectByExam: parseDailyByExam(w.dailyReviewCorrectByExam),
      };
      return stat;
    })
    .filter((w): w is WeeklyStat => w !== null);
}

// Fields this parser actually reads. Anything else in the raw response gets
// silently dropped unless KNOWN_TOP_LEVEL_KEYS is checked against it below —
// this is the mechanism that would catch a hidden per-question field (e.g.
// `questionStats`) if the backend ever adds one without us knowing.
const KNOWN_TOP_LEVEL_KEYS = new Set(["userId", "moduleStats", "weeklyStats", "generatedAt"]);

/**
 * Fetches + parses GET /progress, confirmed against GetChartered_app's
 * components/useBackendData.tsx (fetchProgress / ProgressResponse). Shared by
 * the /api/progress route (client-side dashboard fetch) and any Server
 * Component that wants progress data directly (e.g. my-account's quick-stats
 * card), matching the pattern SubscriptionDetails.tsx uses for Stripe.
 *
 * Logs the FULL raw response on every call (not just on an empty/error
 * result) — this is deliberate: GET /progress's documented shape is strictly
 * module- and week-level aggregates (confirmed against the mobile app's own
 * ProgressResponse type and its "this hook is LOCAL ONLY" comment on
 * per-question stats in hooks/useProgressTracking.ts), but that was verified
 * by reading client code, not a captured live response — this log is what
 * would surface a per-question field if one actually exists server-side.
 */
export async function fetchProgressData(): Promise<ProgressData | null> {
  const response = await callGcApi("/progress");
  const data = await response.json().catch(() => null);

  console.log(
    "[fetchProgressData] GET /progress raw response:",
    response.status,
    JSON.stringify(data)?.slice(0, 4000)
  );

  if (!response.ok || !data) {
    console.error("[fetchProgressData] GET /progress returned a non-OK or unparsable response", response.status);
    return null;
  }

  return parseProgressData(data);
}

/** Parses a raw GET /progress response body — factored out of
 *  fetchProgressData so it can be exercised directly (e.g. in tests)
 *  without a live session/network call. */
export function parseProgressData(data: unknown): ProgressData {
  if (typeof data === "object" && data !== null) {
    const unknownKeys = Object.keys(data).filter((k) => !KNOWN_TOP_LEVEL_KEYS.has(k));
    if (unknownKeys.length > 0) {
      console.warn(
        "[fetchProgressData] /progress response has unrecognised top-level key(s) we're not parsing — check if one of these is per-question data:",
        unknownKeys
      );
    }
  }

  const moduleStats = parseModuleStats((data as { moduleStats?: unknown }).moduleStats);
  const weeklyStats = parseWeeklyStats((data as { weeklyStats?: unknown }).weeklyStats);

  if (moduleStats.length === 0 && weeklyStats.length === 0) {
    console.warn(
      "[fetchProgressData] /progress returned no moduleStats or weeklyStats — either a brand-new user or an unexpected shape."
    );
  }

  return {
    userId: typeof (data as { userId?: unknown }).userId === "string" ? (data as { userId: string }).userId : "",
    moduleStats,
    weeklyStats,
    generatedAt:
      typeof (data as { generatedAt?: unknown }).generatedAt === "number"
        ? (data as { generatedAt: number }).generatedAt
        : Date.now(),
  };
}
