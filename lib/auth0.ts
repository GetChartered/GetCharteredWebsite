import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';
import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getUserAccount, getUserMetadata } from '@/lib/auth0-management';
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
  async onCallback(error, ctx, session) {
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

    // If the user signed in with an unverified email, divert them to the
    // verify-email page instead of dropping them into the rest of the app.
    // We deliberately don't trigger Auth0's verification-email job here —
    // Auth0's database connection sends one automatically on signup, and
    // calling it again would result in duplicate emails.
    if (session && session.user?.email_verified === false) {
      return NextResponse.redirect(new URL('/verify-email', appBaseUrl));
    }

    return NextResponse.redirect(new URL(safeReturnTo, appBaseUrl));
  },
});

// Memoized within a single request so a layout + page hitting the guard on
// the same render don't double up on the Management API call.
const getUserMetadataCached = cache(getUserMetadata);
const getUserAccountCached = cache(getUserAccount);

/**
 * Use on public marketing pages. If the visitor isn't signed in, returns
 * null and lets the page render normally. If they ARE signed in but their
 * email isn't verified, redirects them to /verify-email — so unverified
 * users are effectively locked out of the rest of the site.
 */
export async function requireVerifiedIfSignedIn() {
  const session = await auth0.getSession();
  if (!session) return null;

  const account = await getUserAccountCached(session.user.sub);
  if (!account.email_verified) {
    redirect('/verify-email');
  }
  return session;
}

/**
 * Server-side guard for pages that require a signed-in, email-verified user
 * but don't yet require onboarding to be complete (e.g. /onboarding itself).
 *
 * Side effects (via `redirect()`, which throws a Next.js redirect):
 *   - no session       → /auth/login?returnTo=<path>
 *   - not verified     → /verify-email
 */
export async function requireVerifiedSession(returnTo: string = '/') {
  const session = await auth0.getSession();
  if (!session) {
    redirect(`/auth/login?returnTo=${encodeURIComponent(returnTo)}`);
  }

  // Source of truth is Auth0, not the session cookie's stale claim.
  const account = await getUserAccountCached(session.user.sub);
  if (!account.email_verified) {
    redirect('/verify-email');
  }

  return session;
}

/**
 * Server-side guard for protected pages. Returns the session when the user is
 * signed in, email-verified, AND has completed onboarding (or onboarding
 * isn't required by feature flag).
 *
 * Side effects (via `redirect()`):
 *   - no session              → /auth/login?returnTo=<path>
 *   - not verified            → /verify-email
 *   - onboarding incomplete   → /onboarding (only if ONBOARDING_REQUIRED)
 */
export async function requireOnboardedSession(returnTo: string = '/') {
  const session = await requireVerifiedSession(returnTo);

  if (ONBOARDING_REQUIRED) {
    const metadata = await getUserMetadataCached(session.user.sub);
    if (metadata.onboarding_completed !== true) {
      redirect('/onboarding');
    }
  }

  return session;
}
