import type { ExamPrepEntry } from "@/lib/practice/types";

// Pure parsing + selection logic for the exam-prep contract — no
// server-only imports here (unlike lib/practice/examPrepServer.ts) so this
// can be imported from client components (the My Exams form) as well as
// server code, mirroring the split forced on components/InfoTooltip.tsx
// earlier: a file that imports 'server-only' (transitively, via
// lib/gcApi.ts's callGcApi) can never be imported by a "use client" file.

/** Parses a raw GET/POST /exam-prep response body's `examPrep` array. */
export function parseExamPrepData(raw: unknown): ExamPrepEntry[] {
  if (!Array.isArray(raw)) return [];
  const entries: ExamPrepEntry[] = [];
  for (const item of raw) {
    const e = item as Record<string, unknown>;
    if (typeof e?.course !== "string" || typeof e?.examCode !== "string") continue;
    entries.push({
      course: e.course,
      examCode: e.examCode,
      examKey: typeof e.examKey === "string" ? e.examKey : `${e.course}#${e.examCode}`,
      year: typeof e.year === "number" ? e.year : undefined,
      session: typeof e.session === "string" ? e.session : undefined,
      examDate: typeof e.examDate === "string" ? e.examDate : undefined,
      isPrimary: typeof e.isPrimary === "boolean" ? e.isPrimary : undefined,
    });
  }
  return entries;
}

/** The app's own default-selection rule (hooks/useBackendLeaderboard.ts):
 *  whichever entry is flagged primary, else the first one. Null if the
 *  user has no exam-prep entries at all yet. */
export function selectPrimaryExamPrep(entries: ExamPrepEntry[]): ExamPrepEntry | null {
  if (entries.length === 0) return null;
  return entries.find((e) => e.isPrimary) ?? entries[0];
}

/** Whole days from today until `dateStr` (midnight-to-midnight). Null if
 *  unset/unparsable. Mirrors GetChartered_app's Learning/Utils/primaryExam.ts. */
export function daysUntilExamPrep(dateStr: string | undefined): number | null {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  if (Number.isNaN(target.getTime())) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const diffMs = target.getTime() - startOfToday.getTime();
  return Math.ceil(diffMs / (1000 * 60 * 60 * 24));
}

/** Given a set of candidate {examCode, examDate} rows (e.g. the My Exams
 *  form's current draft state), picks which examCode should be flagged
 *  primary — mirroring GetChartered_app's Learning/Utils/primaryExam.ts
 *  loadPrimaryExam(): nearest *upcoming* date wins (today or later; no date
 *  counts as upcoming but sorts after any dated row); past-dated exams are
 *  never primary. Returns null only when `rows` is empty. */
export function computePrimaryExamCode(
  rows: { examCode: string; examDate?: string }[]
): string | null {
  if (rows.length === 0) return null;

  const startOfToday = new Date();
  startOfToday.setHours(0, 0, 0, 0);

  const upcoming = rows.filter((r) => {
    if (!r.examDate) return true;
    const d = new Date(r.examDate);
    return Number.isNaN(d.getTime()) || d.getTime() >= startOfToday.getTime();
  });

  const candidates = upcoming.length > 0 ? upcoming : rows;

  const sorted = [...candidates].sort((a, b) => {
    if (a.examDate && b.examDate) return new Date(a.examDate).getTime() - new Date(b.examDate).getTime();
    if (a.examDate && !b.examDate) return -1;
    if (!a.examDate && b.examDate) return 1;
    return 0;
  });

  return sorted[0].examCode;
}
