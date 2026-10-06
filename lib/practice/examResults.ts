import type { ExamLevel, ExamOutcome, ExamPrepEntry } from "@/lib/practice/types";

// Pure pass/fail logic for recorded exam results — kept as one small
// function rather than hardcoding 55/50 at every call site, since ICAEW
// could change these thresholds independently of each other (as of this
// writing: Certificate and Professional Level both pass at 55%, Advanced
// Level papers — Corporate Reporting, Strategic Business Management, Case
// Study — pass at 50%).
export function getPassMark(examLevel: ExamLevel): number {
  switch (examLevel) {
    case "advanced":
      return 50;
    case "certificate":
    case "professional":
      return 55;
  }
}

/** Pass/fail for a grade under the CURRENT pass mark. Only for pre-selecting
 *  the result form, and for rows saved before `outcome` existed: a recorded
 *  result's pass/fail is its stored `outcome`, fixed on the day, so a later
 *  pass-mark change never turns a pass into a fail. Null when there's no
 *  grade or level. */
export function computeExamPassed(
  gradePercent: number | null | undefined,
  examLevel: ExamLevel | null | undefined
): boolean | null {
  if (gradePercent == null || !examLevel) return null;
  return gradePercent >= getPassMark(examLevel);
}

/** Pass/fail for a recorded result: the stored `outcome` (as it stood on
 *  the day). Rows saved before `outcome` existed fall back to the pass mark.
 *  Null when neither is available. */
export function resultPassed(
  entry: Pick<ExamPrepEntry, "gradePercent" | "examLevel" | "outcome">
): boolean | null {
  if (entry.outcome === "pass") return true;
  if (entry.outcome === "fail") return false;
  return computeExamPassed(entry.gradePercent, entry.examLevel);
}

export function toOutcome(passed: boolean | null): ExamOutcome | null {
  return passed === null ? null : passed ? "pass" : "fail";
}
