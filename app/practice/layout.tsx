import { redirect } from "next/navigation";
import { auth0, isNextControlFlowError } from "@/lib/auth0";
import { isFeatureUnlocked } from "@/lib/featureAccess";

export default async function PracticeLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // getSession() (and anything in its dependency chain) must never crash
  // this route with an uncaught exception — any failure here degrades to
  // "deny access" instead of a hard server error.
  let unlocked = false;
  try {
    const session = await auth0.getSession();
    unlocked = isFeatureUnlocked(session?.user?.sub);
  } catch (error) {
    if (isNextControlFlowError(error)) throw error;
    console.error("PracticeLayout: failed to resolve session, denying access", error);
  }

  if (!unlocked) {
    redirect("/");
  }

  return children;
}
