// Shapes for the GetChartered AWS API Gateway "GetCharteredQuestions" backend
// and the clean, client-safe question shape we normalise it into. Kept
// permissive (`unknown`/optional) on the raw side since this is the first
// time this backend contract is being consumed from the website — several
// batches of question data exist with slightly different field names (see
// GetChartered_app's Learning/Utils/normaliseQuestion.ts, which this mirrors
// a subset of).

export type RawGcOptions = Record<string, unknown> | unknown[];

export interface RawGcQuestion {
  id?: unknown;
  questionId?: unknown;
  _id?: unknown;
  question?: unknown;
  questionText?: unknown;
  options?: RawGcOptions;
  answers?: RawGcOptions;
  correct_answer?: unknown;
  feedback?: unknown;
  explanation?: unknown;
  question_type?: unknown;
  type?: unknown;
  scenario?: unknown;
  select_count?: unknown;
  _topic?: unknown;
  module?: unknown;
  // Multi-part questions aren't supported in this first Quick Practice pass —
  // presence of any of these causes normaliseGcQuestion to drop the question.
  parts?: unknown;
  sub_questions?: unknown;
  statements?: unknown;
  // Tax-table reference IDs (see lib/practice/taxTables.ts) — mirrors
  // GetChartered_app's Learning/Utils/normaliseQuestion.ts, which reads
  // _taxTableRef first, falling back to taxTableRef.
  _taxTableRef?: unknown;
  taxTableRef?: unknown;
}

// The backend's practice-session mode enum, sent to both GetCharteredQuestions
// (as `mode=`) and POST /analytics/attempt (as `mode`). "Timed" has no
// distinct backend mode — it sends "quick_practice", same as the mobile app.
export type BackendPracticeMode = "quick_practice" | "module" | "focus_areas" | "mock";

export interface PracticeOption {
  key: string;
  text: string;
}

export type PracticeQuestionType = "mcq" | "multiple_response";

export interface PracticeQuestion {
  questionId: string;
  module: string;
  questionText: string;
  scenario: string | null;
  options: PracticeOption[];
  /** One key for mcq, one-or-more for multiple_response. */
  correctKeys: string[];
  selectCount: number;
  questionType: PracticeQuestionType;
  explanation: string | null;
  topic: string | null;
  /** IDs into lib/practice/taxTables.ts's TAX_TABLES, when this question has
   *  relevant reference tables — empty/absent for most questions. */
  taxTableRef: string[];
}

export interface PracticeModule {
  code: string;
  name: string;
}

/** A group of modules under a parent exam (e.g. ACA's "BIP", "ARF", ...). */
export interface PracticeExamGroup {
  code: string;
  name: string;
  modules: PracticeModule[];
}

export interface StartSessionResponse {
  sessionId: string;
  course: string;
  mode: BackendPracticeMode;
  modules: string[];
  questions: PracticeQuestion[];
}

export interface AttemptPayload {
  module: string;
  questionId: string;
  isCorrect: boolean;
  marksAwarded: number;
  marksAvailable: number;
  answeredAt: number;
  questionText?: string;
  questionExplanation?: string;
  topic?: string | null;
  timeTaken?: number;
}

// Shapes for GET /progress, confirmed against GetChartered_app's
// components/useBackendData.tsx (BackendModuleStat / BackendWeeklyStat /
// ProgressResponse) — this is a live, already-used-by-the-mobile-app
// endpoint, not a new one.
export interface ModuleStat {
  module: string;
  course: string;
  totalAnswered: number;
  totalCorrect: number;
  totalMarksAwarded: number;
  totalMarksAvailable: number;
  lastAnsweredAt: number | null;
  learningCount: number;
  reviewingCount: number;
  masteredCount: number;
}

export interface ExamBreakdownEntry {
  newCorrect: number;
  reviewCorrect: number;
  score: number;
}

export interface WeeklyStat {
  weekStartISO: string;
  newCorrect: number;
  reviewCorrect: number;
  score: number;
  dailyBreakdown?: Record<string, number>;
  /** Date-string ("YYYY-MM-DD") -> correct-on-first-attempt count for that
   *  day. Same "missing day/week means 0, not omitted-on-purpose" contract
   *  as dailyBreakdown — absent entirely on weeks recorded before this field
   *  existed on the backend. */
  dailyNewCorrect?: Record<string, number>;
  /** Date-string ("YYYY-MM-DD") -> correct-on-a-previously-seen-question
   *  count for that day. Same contract as dailyNewCorrect above. */
  dailyReviewCorrect?: Record<string, number>;
  /** Exam code (e.g. "BIP", derived server-side from the module code prefix
   *  — same codes My Exams/exam-prep already use) -> that week's
   *  newCorrect/reviewCorrect/score for just that exam. Same "missing means
   *  0, absent entirely on weeks before this field existed" contract as
   *  dailyBreakdown. Powers the exam-scope filter's per-exam recompute of
   *  Weekly Activity — see lib/practice/weeklyActivityChart.ts. */
  examBreakdown?: Record<string, ExamBreakdownEntry>;
  /** Date-string -> (exam code -> correct-on-first-attempt count for that
   *  exam that day). Same contract as examBreakdown/dailyNewCorrect. Powers
   *  the exam-scope filter's per-exam recompute of New vs Review's "week"
   *  range. */
  dailyNewCorrectByExam?: Record<string, Record<string, number>>;
  /** Date-string -> (exam code -> correct-on-a-previously-seen-question
   *  count for that exam that day). Same contract as dailyNewCorrectByExam. */
  dailyReviewCorrectByExam?: Record<string, Record<string, number>>;
}

export interface ProgressData {
  userId: string;
  moduleStats: ModuleStat[];
  weeklyStats: WeeklyStat[];
  generatedAt: number;
}

// Shapes for GET /leaderboard?examKey={course}#{examCode}, confirmed against
// GetChartered_app's components/useBackendData.tsx. Note: entries only carry
// an aggregate `score` — there's no per-user newCorrect/reviewCorrect split
// available from the backend, only for the requesting user (`yourScore`,
// cross-referenced against their own GET /progress weekly stats).
export interface LeaderboardEntry {
  name: string;
  score: number;
  /** Falls back to array position (+1) when the backend omits it. */
  rank?: number;
}

// Shapes for POST/GET /exam-prep, confirmed against GetChartered_app's
// components/useBackendData.tsx (ExamPrepEntry / SetExamPrepParams) — a real
// per-user exam registration (specific exam code + specific date + a
// "primary" flag), distinct from and more specific than onboarding's coarse
// user_metadata.target_exam_window bucket. The app's own leaderboard hook
// (hooks/useBackendLeaderboard.ts) defaults its exam selection to
// `entries.find(e => e.isPrimary) ?? entries[0]` — the pattern this website
// now mirrors wherever a "the user's real exam" default is needed.
export interface ExamPrepEntry {
  course: string;
  examCode: string;
  /** `${course}#${examCode}` — the key GET /leaderboard expects. Derived
   *  server-side if the backend response omits it. */
  examKey: string;
  year?: number;
  session?: string;
  examDate?: string;
  isPrimary?: boolean;
}

export type LeaderboardData =
  // Never decided — distinct from an explicit opt-out (`optedIn: false`).
  | { optedIn: null }
  | { optedIn: false }
  | { optedIn: true; noCohort: true }
  | {
      optedIn: true;
      noCohort: false;
      entries: LeaderboardEntry[];
      yourRank: number | null;
      yourScore: number | null;
      cohortSize: number;
    };
