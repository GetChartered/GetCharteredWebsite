import "server-only";

import { fetchProfileData } from "@/lib/profile";

// Server-side counterpart to the app's hooks/useHasExamAccess.ts — same
// premium-OR-purchased-exam logic, built 2026-09-09 alongside the app-side
// hook and the website's per-exam picker (components/account/PerExamPicker.tsx).
//
// DELIBERATE SUB-LAYER (Pierce's call, 2026-09-09): this sits BENEATH the
// existing dev-only allowlist in lib/featureAccess.ts, which still gates
// app/practice, app/progress, and app/leaderboard entirely — real users
// can't reach this code path yet. That allowlist stays untouched; do not
// remove or bypass it here. This exists so that once the allowlist comes
// down (Pierce: "once the app is released and the two branches are
// merged"), the real premium/per-exam gating underneath it is already
// built, tested, and ready — no separate gating project needed at launch.
export interface ExamAccess {
  hasFullAccess: boolean;
  purchasedExams: string[];
  hasAnyAccess: boolean;
  canAccessExam: (examCode: string | null | undefined) => boolean;
}

export async function getExamAccess(): Promise<ExamAccess> {
  let hasFullAccess = false;
  let purchasedExams: string[] = [];

  try {
    const profile = await fetchProfileData();
    hasFullAccess = profile.premium === true;
    purchasedExams = profile.purchasedExams ?? [];
  } catch (error) {
    // Same "fail closed" posture as PracticeLayout/ProgressLayout/
    // LeaderboardLayout's own session resolution — a profile-fetch failure
    // degrades to "no access" rather than an uncaught error or, worse,
    // silently granting access.
    console.error("getExamAccess: failed to fetch profile, denying access", error);
  }

  return {
    hasFullAccess,
    purchasedExams,
    hasAnyAccess: hasFullAccess || purchasedExams.length > 0,
    canAccessExam: (examCode) => {
      if (hasFullAccess) return true;
      if (!examCode) return false;
      return purchasedExams.includes(examCode);
    },
  };
}
