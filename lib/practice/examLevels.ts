import type { ExamLevel } from "@/lib/practice/types";

// Exam-code -> ICAEW ACA syllabus tier lookup.
//
// Verified 2026-09-09 directly against the live backend (GET /courses):
// ACA "Certificate Level" currently has 6 exams — BIP, AF, TF, BL, SE, ARF —
// all with live question banks. This replaces an earlier version of this
// table that only knew about 3 stale/legacy codes (BIP, AF, ARF, with wrong
// names) because at the time there was no way to reach the live backend
// from this environment to check. All 6 are "certificate" level per the
// backend's own "ACA Certificate Level" course name — there's no
// Professional/Advanced level content live yet, so the name-pattern
// fallback below exists only for exam codes/names this table doesn't
// recognise (e.g. if Professional level ever goes live).
//
// resolveExamLevel() still returns null for anything unrecognised rather
// than guessing — the result-entry form
// (components/account/ExamResultModal.tsx) always shows this as an
// editable dropdown pre-filled from here, never a hidden assumption. If a
// real code turns out to be missing/misclassified, fix it here.
const EXAM_LEVEL_BY_CODE: Record<string, ExamLevel> = {
  BIP: "certificate", // Business Insight and Performance
  AF: "certificate", // Accounting Fundamentals
  TF: "certificate", // Tax Fundamentals
  BL: "certificate", // Business Law
  SE: "certificate", // Sustainability and Ethics
  ARF: "certificate", // Assurance and Risk Fundamentals
};

// Fallback for exam codes not in the table above: match on the exam's
// *name* against the standard ICAEW ACA paper titles. Ordered
// most-specific-first (Advanced, then Professional, then Certificate) so a
// phrase like "Audit and Assurance" (Professional) matches before the
// broader "Assurance" (Certificate) pattern would otherwise catch it.
const EXAM_LEVEL_BY_NAME_PATTERN: { pattern: RegExp; level: ExamLevel }[] = [
  {
    pattern: /corporate reporting|strategic business management|\bcase study\b/i,
    level: "advanced",
  },
  {
    pattern:
      /audit and assurance|financial accounting and reporting|financial management|tax compliance|business strategy and technology|business planning/i,
    level: "professional",
  },
  {
    pattern:
      /\baccounting\b|\bassurance\b|business,?\s*(technology|innovation)|\blaw\b|management information|principles of taxation/i,
    level: "certificate",
  },
];

/** Suggests an exam level for a given exam code/name — a starting point for
 *  the result-entry form's editable level dropdown, not a trusted final
 *  answer. Returns null (form falls back to no pre-selection) when neither
 *  the code nor the name matches anything recognised. */
export function resolveExamLevel(examCode: string, examName?: string): ExamLevel | null {
  const byCode = EXAM_LEVEL_BY_CODE[examCode];
  if (byCode) return byCode;

  if (examName) {
    for (const { pattern, level } of EXAM_LEVEL_BY_NAME_PATTERN) {
      if (pattern.test(examName)) return level;
    }
  }

  return null;
}

export const EXAM_LEVEL_OPTIONS: { value: ExamLevel; label: string }[] = [
  { value: "certificate", label: "Certificate Level" },
  { value: "professional", label: "Professional Level" },
  { value: "advanced", label: "Advanced Level" },
];

export const EXAM_LEVEL_LABELS: Record<ExamLevel, string> = {
  certificate: "Certificate Level",
  professional: "Professional Level",
  advanced: "Advanced Level",
};
