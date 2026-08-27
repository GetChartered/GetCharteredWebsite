import type { ExamLevel } from "@/lib/practice/types";

// Best-effort exam-code -> ICAEW ACA syllabus tier lookup.
//
// IMPORTANT CAVEAT: GET /courses (lib/practice/courses.ts) never returns a
// level for an exam, and there is no live backend access from this
// environment to enumerate the *real* full set of exam codes the backend
// actually serves. The only two ACA exam codes independently confirmed
// against real source (GetChartered_app/assets/courses.ts) are "BIP" and
// "ARF" (a third, "AF", is also seeded there but its module list is empty).
// Neither of those codes matches standard ICAEW paper names 1:1 — "Business,
// Innovation and People" and "Assurance and Risk Fundamentals" aren't real
// ICAEW paper titles — which suggests this product's exam catalogue may not
// map cleanly onto the official syllabus at all, not just that the exact
// code strings are unverified.
//
// Given that, this table is a genuine best guess (standard ICAEW ACA
// structure, matched by code where seen in the app repo and by exam *name*
// otherwise), not a verified mapping. resolveExamLevel() returns null for
// anything it doesn't recognise rather than silently guessing — the exam
// level field in the result-entry form (components/account/ExamResultModal.tsx)
// always shows this as an editable dropdown pre-filled from here, never a
// hidden assumption, specifically because this table might be wrong. If a
// real code turns out to be missing/misclassified, fix it here — everything
// else (getPassMark, the UI) is driven off ExamLevel, not off this file's
// contents directly.
const EXAM_LEVEL_BY_CODE: Record<string, ExamLevel> = {
  // Confirmed-existing codes (GetChartered_app/assets/courses.ts) — both
  // read as introductory/foundational in scope, hence "certificate" here.
  BIP: "certificate",
  AF: "certificate",
  ARF: "certificate",
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
