import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getUserMetadata } from '@/lib/auth0-management';
import { ONBOARDING_REQUIRED } from '@/lib/features';

const appBaseUrl =
  process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';

export const auth0 = new Auth0Client({
  appBaseUrl,
  session: {
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
  // Use the /v2/logout endpoint instead of OIDC RP-Initiated logout. /v2 does
  // NOT require id_token_hint, which means /auth/logout works even after the
  // user has been deleted from Auth0 (otherwise the tenant returns an error
  // page complaining the hint references an unknown user). This is what lets
  // the delete-account flow route through /auth/logout for a clean session
  // teardown.
  logoutStrategy: 'v2',
  async onCallback(error, ctx, _session) {
    const safeReturnTo =
      ctx.returnTo && ctx.returnTo.startsWith('/') ? ctx.returnTo : '/';

    if (error) {
      const code = (error as { code?: string; cause?: { code?: string } }).code;
      const causeCode = (error as { cause?: { code?: string } }).cause?.code;

      // User-cancelled flows (declined consent, closed dialog, etc.) — just go back.
      if (code === 'access_denied' || causeCode === 'access_denied') {
        return NextResponse.redirect(new URL(safeReturnTo, appBaseUrl));
      }

      // Any other error: send the user home with a flag the page can surface.
      const homeWithError = new URL('/', appBaseUrl);
      homeWithError.searchParams.set('auth_error', '1');
      return NextResponse.redirect(homeWithError);
    }

    return NextResponse.redirect(new URL(safeReturnTo, appBaseUrl));
  },
});

// Memoized within a single request so a layout + page hitting the guard on
// the same render don't double up on the Management API call.
export const getUserMetadataCached = cache(getUserMetadata);

/**
 * Use on public marketing pages. Returns the session if the visitor is signed
 * in, otherwise null. Lets the page render either way — no redirects.
 */
export async function getOptionalSession() {
  return auth0.getSession();
}

/**
 * Server-side guard for pages that require a signed-in user but don't yet
 * require onboarding to be complete (e.g. /onboarding itself).
 *
 * Email verification is handled by Auth0 at signup (OTP), so we no longer
 * gate on `email_verified` here.
 *
 * Side effect (via `redirect()`):
 *   - no session → /auth/login?returnTo=<path>
 */
export async function requireSession(returnTo: string = '/') {
  const session = await auth0.getSession();
  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }
  return session;
}

/**
 * Server-side guard for protected pages. Returns the session when the user
 * is signed in AND has completed onboarding (or onboarding isn't required by
 * feature flag).
 *
 * Side effects (via `redirect()`):
 *   - no session              → /auth/login?returnTo=<path>
 *   - onboarding incomplete   → /onboarding (only if ONBOARDING_REQUIRED)
 */
export async function requireOnboardedSession(returnTo: string = '/') {
  const session = await requireSession(returnTo);

  if (ONBOARDING_REQUIRED) {
    const metadata = await getUserMetadataCached(session.user.sub);
    if (metadata.onboarding_completed !== true) {
      redirect('/onboarding');
    }
  }

  return session;
}
