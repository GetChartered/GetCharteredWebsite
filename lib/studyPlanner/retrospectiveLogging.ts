// Auto-logs a just-completed practice session onto the study planner
// calendar, even when it wasn't started from a planned session (2026-09-13,
// Pierce: "if a user does a practice... that should then be added to the
// calendar retrospectively"). Sessions are bucketed into 15-minute
// wall-clock windows -- multiple practice "sittings" inside the same window
// merge into one calendar entry (accumulating questionsAttempted/
// correctAnswers) rather than creating a new entry per attempt batch,
// matching the planner's own hour + 15-minute-increment time picker.
//
// Called from app/api/practice/finish/route.ts, right after that route
// records the attempts via POST /analytics/attempt. Deliberately
// best-effort: a failure here must never fail that call -- losing a
// calendar entry is much less bad than losing recorded progress.
import "server-only";
import { callGcApi } from "@/lib/gcApi";
import { STUDY_TYPE_OPTIONS } from "./activityTypes";
import { createStudySession, updateStudySession } from "./studySessionService";
import type {
  LocalDateString,
  LocalTimeString,
  StudyActivityKind,
  StudyActivityType,
  StudySession,
  StudySessionDraft,
} from "./types";
import type { AttemptPayload, BackendPracticeMode } from "@/lib/practice/types";

const RETRO_COURSE_ID = "ACA";

function activityForMode(mode: BackendPracticeMode): {
  activityKind: StudyActivityKind;
  activityType: StudyActivityType;
} {
  switch (mode) {
    case "module":
      return { activityKind: "module_practice", activityType: "practice_questions" };
    case "mock":
      return { activityKind: "mock_exam", activityType: "mock_exam" };
    // "Focus Areas" has no dedicated planner activity kind yet -- logged as
    // Quick Practice, matching how Timed Practice already collapses to the
    // "quick_practice" backend mode (see lib/practice/types.ts's
    // BackendPracticeMode comment). Revisit if Pierce wants Focus Areas
    // broken out separately on the calendar.
    case "focus_areas":
    case "quick_practice":
    default:
      return { activityKind: "quick_practice", activityType: "practice_questions" };
  }
}

export async function logPracticeCompletionRetrospectively(args: {
  mode: BackendPracticeMode;
  attempts: AttemptPayload[];
  localDate: LocalDateString;
  startTime: LocalTimeString;
}): Promise<void> {
  const { mode, attempts, localDate, startTime } = args;
  if (attempts.length === 0) return;

  const { activityKind, activityType } = activityForMode(mode);
  const label = STUDY_TYPE_OPTIONS.find((o) => o.activityKind === activityKind)?.label ?? "Practice";

  // Module Practice / Mock Exam sessions are (almost) always single-module;
  // Quick/Focus Areas sessions can span several modules in one batch -- only
  // tag a moduleId/examId when every attempt in this batch agrees on one
  // module, rather than guessing at a "primary" one.
  const moduleCodes = new Set(attempts.map((a) => a.module).filter((m): m is string => Boolean(m)));
  const moduleId = moduleCodes.size === 1 ? [...moduleCodes][0] : undefined;
  const examId = moduleId ? moduleId.split("-")[0] : undefined;

  const questionsAttempted = attempts.length;
  const correctAnswers = attempts.filter((a) => a.isCorrect).length;

  const listRes = await callGcApi("/study-sessions", { method: "GET" });
  const listData = listRes.ok ? await listRes.json().catch(() => null) : null;
  const sessions: StudySession[] = Array.isArray((listData as { sessions?: unknown })?.sessions)
    ? (listData as { sessions: StudySession[] }).sessions
    : [];

  const existing = sessions.find(
    (s) =>
      s.localDate === localDate &&
      s.startTime === startTime &&
      s.activityKind === activityKind &&
      s.moduleId === moduleId &&
      s.examId === examId &&
      s.status === "completed" &&
      s.source === "getchartered_verified"
  );

  const now = new Date();

  if (existing) {
    const updated = updateStudySession(
      existing,
      {
        questionsAttempted: (existing.questionsAttempted ?? 0) + questionsAttempted,
        correctAnswers: (existing.correctAnswers ?? 0) + correctAnswers,
        status: "completed",
        completedAt: now.toISOString(),
      },
      now
    );
    await callGcApi("/study-sessions", { method: "POST", body: JSON.stringify(updated) });
    return;
  }

  const draft: StudySessionDraft = {
    courseId: RETRO_COURSE_ID,
    examId,
    moduleId,
    title: label,
    activityType,
    activityKind,
    source: "getchartered_verified",
    status: "completed",
    localDate,
    startTime,
    durationMinutes: 15,
    questionsAttempted,
    correctAnswers,
    completedAt: now.toISOString(),
  };
  const session = createStudySession(draft, {
    now: () => now,
    createId: () => crypto.randomUUID(),
  });
  await callGcApi("/study-sessions", { method: "POST", body: JSON.stringify(session) });
}
