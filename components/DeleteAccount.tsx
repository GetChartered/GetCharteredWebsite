"use server";

import { cookies } from "next/headers";
import CancelSubscription from "@/components/CancelSubscription";
import { auth0 } from "@/lib/auth0";
import { deleteUser } from "@/lib/auth0-management";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string };

// Clear every cookie the Auth0 v4 SDK may have set so the deleted user is
// signed out immediately:
//   - __session / __session.N  (session JWE, chunked if large)
//   - __FC_N                   (per-connection token sets for social IdPs
//                               like LinkedIn — without these, middleware
//                               tries to refresh the social token after the
//                               user is gone and bounces to the Auth0
//                               hosted login page)
//   - __txn_*                  (transient transaction state)
//
// We overwrite with an expired cookie rather than calling delete() so the
// attributes (path, sameSite, secure, httpOnly) match what the SDK wrote —
// browsers won't clear a cookie whose attributes don't match.
//
// We do this server-side rather than redirecting through /auth/logout
// because Auth0's logout endpoint trips on the id_token_hint that now
// references a deleted user and shows the tenant error page.
async function clearAuthSessionCookies() {
  const cookieStore = await cookies();
  const isProd = process.env.NODE_ENV === "production";

  for (const cookie of cookieStore.getAll()) {
    const name = cookie.name;
    const isAuthCookie =
      name === "__session" ||
      name.startsWith("__session.") ||
      name.startsWith("__FC_") ||
      name.startsWith("__txn_");
    if (!isAuthCookie) continue;

    cookieStore.set(name, "", {
      path: "/",
      maxAge: 0,
      expires: new Date(0),
      httpOnly: true,
      sameSite: "lax",
      secure: isProd,
    });
  }
}

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

  await clearAuthSessionCookies();
  return { success: true };
}
