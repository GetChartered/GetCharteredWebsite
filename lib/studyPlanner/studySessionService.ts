// Ported 1:1 from GetChartered_app's StudyPlanner/studySessionService.ts.
// Business rule preserved exactly: a session only ever counts toward
// scoring/streaks when source === "getchartered_verified" AND
// status === "completed" — personal_study and manual/imported sessions are
// deliberately excluded. The website planner never creates
// "getchartered_verified" sessions itself (that source is reserved for a
// real practice attempt writing back), so scoringEligibility.isEligible is
// always false for sessions created here — matching how the app's planner
// behaves for anything other than a synced practice-session completion.
import { isLocalDateString } from "./calendarUtils";
import type {
  ScoringEligibility,
  StudySession,
  StudySessionDraft,
  StudySessionRepository,
  StudySessionSource,
} from "./types";

export type CreateStudySessionDependencies = {
  now?: () => Date;
  createId: () => string;
};

export function deriveScoringEligibility(args: {
  source: StudySessionSource;
  status: StudySession["status"];
}): ScoringEligibility {
  if (args.source === "personal_study") {
    return { isEligible: false, reason: "personal_study_excluded" };
  }

  if (args.source !== "getchartered_verified") {
    return { isEligible: false, reason: "manual_or_imported_activity_unverified" };
  }

  if (args.status !== "completed") {
    return { isEligible: false, reason: "planned_activity_not_completed" };
  }

  return { isEligible: true, reason: "verified_getchartered_activity" };
}

export function validateStudySessionDraft(draft: StudySessionDraft): string[] {
  const errors: string[] = [];

  if (!draft.courseId.trim()) errors.push("courseId is required");
  if (!draft.title.trim()) errors.push("title is required");
  if (!isLocalDateString(draft.localDate)) errors.push("localDate must be YYYY-MM-DD");
  if (!Number.isFinite(draft.durationMinutes) || draft.durationMinutes <= 0) {
    errors.push("durationMinutes must be greater than zero");
  }
  if (draft.targetQuestionCount != null && draft.targetQuestionCount < 1) {
    errors.push("targetQuestionCount must be at least 1");
  }
  if (draft.questionsAttempted != null && draft.questionsAttempted < 0) {
    errors.push("questionsAttempted cannot be negative");
  }
  if (draft.correctAnswers != null && draft.correctAnswers < 0) {
    errors.push("correctAnswers cannot be negative");
  }
  if (
    draft.questionsAttempted != null &&
    draft.correctAnswers != null &&
    draft.correctAnswers > draft.questionsAttempted
  ) {
    errors.push("correctAnswers cannot exceed questionsAttempted");
  }
  if (
    draft.accuracyPercent != null &&
    (draft.accuracyPercent < 0 || draft.accuracyPercent > 100)
  ) {
    errors.push("accuracyPercent must be between 0 and 100");
  }
  if (draft.recurrenceRule?.interval != null && draft.recurrenceRule.interval < 1) {
    errors.push("recurrenceRule.interval must be at least 1");
  }
  if (draft.recurrenceRule?.count != null && draft.recurrenceRule.count < 1) {
    errors.push("recurrenceRule.count must be at least 1");
  }
  if (draft.recurrenceRule?.untilDate && !isLocalDateString(draft.recurrenceRule.untilDate)) {
    errors.push("recurrenceRule.untilDate must be YYYY-MM-DD");
  }

  return errors;
}

export function createStudySession(
  draft: StudySessionDraft,
  deps: CreateStudySessionDependencies
): StudySession {
  const errors = validateStudySessionDraft(draft);
  if (errors.length > 0) {
    throw new Error(`Invalid study session: ${errors.join(", ")}`);
  }

  const now = (deps.now ?? (() => new Date()))().toISOString();
  const status = draft.status ?? "planned";

  return {
    ...draft,
    id: draft.id ?? deps.createId(),
    status,
    scoringEligibility: deriveScoringEligibility({ source: draft.source, status }),
    createdAt: now,
    updatedAt: now,
  };
}

export function markStudySessionCompleted(
  session: StudySession,
  completedAt = new Date()
): StudySession {
  const status = "completed";
  return {
    ...session,
    status,
    completedAt: completedAt.toISOString(),
    updatedAt: completedAt.toISOString(),
    scoringEligibility: deriveScoringEligibility({ source: session.source, status }),
  };
}

export function updateStudySession(
  session: StudySession,
  changes: Partial<StudySessionDraft>,
  now = new Date()
): StudySession {
  const next = {
    ...session,
    ...changes,
    id: session.id,
    createdAt: session.createdAt,
    updatedAt: now.toISOString(),
  };
  const errors = validateStudySessionDraft(next);
  if (errors.length > 0) {
    throw new Error(`Invalid study session: ${errors.join(", ")}`);
  }
  return {
    ...next,
    scoringEligibility: deriveScoringEligibility({
      source: next.source,
      status: next.status,
    }),
  };
}

export async function saveStudySession(
  repository: StudySessionRepository,
  draft: StudySessionDraft,
  deps: CreateStudySessionDependencies
) {
  const session = createStudySession(draft, deps);
  return repository.saveSession(session);
}
