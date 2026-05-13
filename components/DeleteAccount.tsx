"use server";

import { cookies } from "next/headers";
import CancelSubscription from "@/components/CancelSubscription";
import { auth0 } from "@/lib/auth0";
import { deleteUser } from "@/lib/auth0-management";
import { SUBSCRIPTIONS_ENABLED } from "@/lib/features";

export type DeleteAccountResult =
  | { success: true }
  | { success: false; error: string };

// Clear the Auth0 v4 session cookie (and any chunked variants like
// __session.0, __session.1) so the deleted user is signed out immediately.
// We do this server-side rather than redirecting through /auth/logout
// because Auth0's logout endpoint trips on the id_token_hint that now
// references a deleted user and shows the tenant error page.
async function clearAuthSessionCookies() {
  const cookieStore = await cookies();
  for (const cookie of cookieStore.getAll()) {
    if (cookie.name === "__session" || cookie.name.startsWith("__session.")) {
      cookieStore.delete(cookie.name);
    }
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
