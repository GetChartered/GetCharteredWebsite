// lib/requireGatedAccess.ts
// Shared access gate used by protected route layouts (practice, progress,
// leaderboard). Checks both the dev-only feature allowlist and the real
// premium/exam entitlement, redirecting on failure.

import { redirect } from "next/navigation";
import { auth0, isNextControlFlowError } from "@/lib/auth0";
import { isFeatureUnlocked } from "@/lib/featureAccess";
import { getExamAccess } from "@/lib/examAccess";

/**
 * Verifies that the current user is both feature-unlocked (dev allowlist)
 * and has premium/exam access. Redirects away if either check fails.
 *
 * Call this at the top of any server-component layout that guards a
 * premium feature. If the function returns, the user is authorised.
 *
 * @param label  Short identifier for console.error messages (e.g. "PracticeLayout")
 */
export async function requireGatedAccess(label: string): Promise<void> {
  let unlocked = false;
  try {
    const session = await auth0.getSession();
    unlocked = isFeatureUnlocked(session?.user?.sub);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error(`${label}: failed to resolve session, denying access`, error);
  }

  if (!unlocked) {
    redirect("/");
  }

  const { hasAnyAccess } = await getExamAccess();
  if (!hasAnyAccess) {
    redirect("/my-account?subscribe=annual#subscription");
  }
}
