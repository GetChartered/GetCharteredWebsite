"use server";

import CancelSubscription from "@/components/CancelSubscription";
import { auth0 } from "@/lib/auth0";
import { deleteUser } from "@/lib/auth0-management";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";

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

  if (SUBSCRIPTIONS_ENABLED) {
    try {
      await CancelSubscription(formData);
    } catch (error) {
      console.error("Cancel subscription failed during account delete:", error);
      return {
        success: false,
        error:
          "We couldn't cancel your active subscription. Please cancel it from your account page first, then try again.",
      };
    }
  }

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
