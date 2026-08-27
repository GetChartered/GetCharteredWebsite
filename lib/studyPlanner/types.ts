// Ported 1:1 from GetChartered_app's StudyPlanner/types.ts — this is pure,
// framework-agnostic data-shape TypeScript with zero React Native
// dependencies, so the website's Study Planner uses the exact same session
// shape as the app's. Keeping the shape identical is what leaves the door
// open for the two to share a real backend later (see localRepository.ts's
// doc comment) without a data migration.

export type LocalDateString = `${number}-${number}-${number}`;
export type LocalTimeString = `${number}:${number}`;

export type StudyActivityType =
  | "practice_questions"
  | "mock_exam"
  | "reading"
  | "video"
  | "review"
  | "personal_study"
  | "other";

export type StudyActivityKind =
  | "quick_practice"
  | "module_practice"
  | "timed_practice"
  | "daily_challenge"
  | "mock_exam"
  | "personal_study";

export type StudySessionStatus =
  | "planned"
  | "completed"
  | "cancelled"
  | "missed";

export type StudySessionSource =
  | "getchartered_verified"
  | "system_planned"
  | "personal_study"
  | "manual_import";

export type ScoringEligibilityReason =
  | "verified_getchartered_activity"
  | "planned_activity_not_completed"
  | "personal_study_excluded"
  | "manual_or_imported_activity_unverified";

export type ScoringEligibility = {
  isEligible: boolean;
  reason: ScoringEligibilityReason;
};

export type RecurrenceFrequency = "daily" | "weekly" | "monthly";
export type Weekday = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export type RecurrenceRule = {
  frequency: RecurrenceFrequency;
  interval: number;
  byWeekday?: Weekday[];
  count?: number;
  untilDate?: LocalDateString;
};

export type StudySession = {
  id: string;
  userId?: string;
  courseId: string;
  examId?: string;
  moduleId?: string;
  title: string;
  activityType: StudyActivityType;
  activityKind?: StudyActivityKind;
  status: StudySessionStatus;
  source: StudySessionSource;
  scoringEligibility: ScoringEligibility;
  localDate: LocalDateString;
  startTime?: LocalTimeString;
  durationMinutes: number;
  targetQuestionCount?: number;
  questionsAttempted?: number;
  correctAnswers?: number;
  accuracyPercent?: number;
  recurrenceRule?: RecurrenceRule;
  plannedSessionId?: string;
  completedAt?: string;
  createdAt: string;
  updatedAt: string;
  notes?: string;
};

export type StudySessionDraft = {
  id?: string;
  userId?: string;
  courseId: string;
  examId?: string;
  moduleId?: string;
  title: string;
  activityType: StudyActivityType;
  activityKind?: StudyActivityKind;
  status?: StudySessionStatus;
  source: StudySessionSource;
  localDate: LocalDateString;
  startTime?: LocalTimeString;
  durationMinutes: number;
  targetQuestionCount?: number;
  questionsAttempted?: number;
  correctAnswers?: number;
  accuracyPercent?: number;
  recurrenceRule?: RecurrenceRule;
  plannedSessionId?: string;
  completedAt?: string;
  notes?: string;
};

export type StudySessionFilters = {
  courseId?: string;
  examId?: string;
  moduleId?: string;
  status?: StudySessionStatus | StudySessionStatus[];
  activityType?: StudyActivityType | StudyActivityType[];
  fromDate?: LocalDateString;
  toDate?: LocalDateString;
};

export type StudySessionRepository = {
  listSessions(filters?: StudySessionFilters): Promise<StudySession[]>;
  getSession(id: string): Promise<StudySession | null>;
  saveSession(session: StudySession): Promise<StudySession>;
  deleteSession(id: string): Promise<void>;
};
