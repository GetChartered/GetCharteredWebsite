"use server";

import { auth0 } from "@/lib/auth0";
import { deleteUser } from "@/lib/auth0-management";

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string };

// Cookie teardown is handled by routing the browser to /auth/logout after a
// successful delete. The SDK middleware there knows the exact cookie names
// and attributes the SDK wrote (session JWE chunks + __FC_* connection token
// sets for social IdPs), so the Set-Cookie clearing actually matches and the
// browser drops them. Trying to clear cookies in this server action loses a
// race with the same-request middleware's session-rolling, which is why the
// previous approach left the icon green after delete.
//
// The /auth/logout endpoint normally trips on id_token_hint when the user is
// already gone from Auth0; that's avoided here by setting logoutStrategy:
// 'v2' on the Auth0Client (see lib/auth0.ts).
export default async function DeleteAccount(
  formData: FormData
): Promise<DeleteAccountResult> {
  const session = await auth0.getSession();

  if (!session) {
    return { success: false, error: "You're not signed in." };
  }

  // Nothing to cancel here anymore — Annual and Per Exam are both one-time
  // Stripe payments (Pierce's call, 2026-09-09), never a recurring
  // subscription object. This used to call CancelSubscription() first, which
  // always threw "No active subscription found" once that change shipped
  // (Stripe never has a subscription to find) — silently failing every
  // account deletion the moment this code path was reachable. Removed
  // rather than fixed in place, since there's no subscription concept left
  // to cancel at all.
  try {
    await deleteUser(session.user.sub);
  } catch (error) {
    console.error("Auth0 deleteUser failed:", error);
    return {
      success: false,
      error:
        error instanceof Error
          ? error.message
          : "Failed to delete your account. Please try again or contact support.",
    };
  }

  return { success: true };
}
