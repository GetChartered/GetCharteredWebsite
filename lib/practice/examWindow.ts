import { daysUntilExamPrep } from "@/lib/practice/examPrep";

export interface ExamPrepNextExam {
  examName: string;
  examDate: string;
}

export type NextExamDisplay =
  | { kind: "countdown"; value: string; caption?: string }
  | { kind: "setup-cta" };

/**
 * Resolves the Progress page's Next Exam tile from the user's real
 * exam-prep record (GET /exam-prep's primary entry, resolved to a display
 * name via GET /courses — see app/progress/page.tsx): a specific exam +
 * specific date they actually set up via My Exams.
 *
 * Previously this fell back to onboarding's target_exam_window (a coarse
 * multi-month bucket, e.g. "3 to 6 months") when there was no exam-prep
 * record yet, showing an estimated day count derived from the bucket's
 * midpoint. That's gone — a real My Exams entry is always more useful than
 * a guess from a 3-6 month window, so when there's no real entry, the tile
 * now surfaces a direct "set up your exams" CTA (see ProgressDashboardClient)
 * instead of a fuzzy estimate.
 */
export function resolveNextExamDisplay(examPrepExam?: ExamPrepNextExam | null): NextExamDisplay {
  if (examPrepExam) {
    const days = daysUntilExamPrep(examPrepExam.examDate);
    if (days !== null) {
      const value = days > 0 ? `${days} day${days === 1 ? "" : "s"}` : days === 0 ? "Today" : "Date passed";
      return { kind: "countdown", value, caption: examPrepExam.examName };
    }
  }

  return { kind: "setup-cta" };
}
