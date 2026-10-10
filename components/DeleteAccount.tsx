"use server";

import { auth0 } from "@/lib/auth0";
import { callGcApi } from "@/lib/gcApi";

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

  // Nothing to cancel here — Annual and Per Exam are one-time Stripe payments,
  // never a recurring subscription object.
  //
  // Deletion is done by the backend's deleteAccount Lambda (DELETE /account),
  // the same route the mobile app uses. It removes the user's DynamoDB rows,
  // profile photos and analytics token, and deletes the Auth0 identity LAST so
  // a failed attempt can be retried while the user can still sign in. The user
  // id comes from the verified access token server-side, never from here.
  // Stripe payment records are deliberately retained by the backend for
  // tax/accounting retention, and the privacy policy says so.
  try {
    const response = await callGcApi("/account", { method: "DELETE" });
    if (!response.ok) {
      console.error("DELETE /account failed:", response.status);
      return {
        success: false,
        error:
          "We couldn't delete your account just now. Nothing has been lost, so please try again or contact support@getchartered.app.",
      };
    }
  } catch (error) {
    console.error("DELETE /account threw:", error);
    return {
      success: false,
      error:
        "We couldn't reach our servers. Please try again in a moment or contact support@getchartered.app.",
    };
  }

  return { success: true };
}
