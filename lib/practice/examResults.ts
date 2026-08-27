import type { ExamLevel } from "@/lib/practice/types";

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

/** Derived, never stored — a graded exam's pass/fail is always recomputed
 *  from gradePercent + examLevel rather than persisted as its own field, so
 *  a future pass-mark change retroactively reflects on every past result.
 *  Null when there's nothing to compute from yet (not sat, or sat without a
 *  recorded grade/level). */
export function computeExamPassed(
  gradePercent: number | null | undefined,
  examLevel: ExamLevel | null | undefined
): boolean | null {
  if (gradePercent == null || !examLevel) return null;
  return gradePercent >= getPassMark(examLevel);
}
