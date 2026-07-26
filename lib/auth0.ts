import { redirect } from 'next/navigation';
import { cache } from 'react';
import { getUserMetadata, type OnboardingMetadata } from '@/lib/auth0-management';
import { getCachedUserMetadata, setCachedUserMetadata } from '@/lib/onboardingCache';
import { getCachedProfile, setCachedProfile, type ProfileResponse } from '@/lib/profileCache';
import { fetchProfileData } from '@/lib/profile';
import { ONBOARDING_REQUIRED } from '@/lib/features';
import { auth0 } from '@/lib/auth0Client';

// The Auth0Client instance itself lives in lib/auth0Client.ts (a dependency-
// free leaf module) so lib/gcApi.ts can import it without importing this
// file — see lib/auth0Client.ts's header comment for why (this file's
// requireOnboardedSession() calls into lib/profile.ts -> lib/gcApi.ts, which
// would otherwise be circular). Re-exported here so every other call site's
// `import { auth0 } from '@/lib/auth0'` keeps working unchanged.
export { auth0 };

// Cross-request cache (lib/onboardingCache.ts) wrapped in React's per-request
// `cache()` — the per-request layer still dedupes a layout + page hitting
// the guard on the same render, but the real fix for repeated Management
// API 429s is the cross-request layer underneath: without it, every single
// gated page/API route load called getUserMetadata fresh (React's cache()
// only memoizes within one request, not across the several separate
// requests a normal multi-page visit makes).
async function getUserMetadataWithCache(userId: string): Promise<OnboardingMetadata> {
  const cached = getCachedUserMetadata(userId);
  if (cached) return cached;

  const metadata = await getUserMetadata(userId);
  setCachedUserMetadata(userId, metadata);
  return metadata;
}

export const getUserMetadataCached = cache(getUserMetadataWithCache);

// Same cross-request-cache-under-React-cache() pattern as
// getUserMetadataCached above, retargeted at our own GET /profile endpoint
// (lib/profile.ts / lib/profileCache.ts) instead of Auth0's Management API —
// this is what requireOnboardedSession uses now. getUserMetadataCached is
// kept as-is above since app/my-account/layout.tsx and app/api/profile/route.ts
// still call it for display-name resolution.
async function getProfileWithCache(userId: string): Promise<ProfileResponse> {
  const cached = getCachedProfile(userId);
  if (cached) return cached;

  const profile = await fetchProfileData();
  setCachedProfile(userId, profile);
  return profile;
}

export const getProfileCached = cache(getProfileWithCache);

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
    const profile = await getProfileCached(session.user.sub);
    if (profile.onboardingCompleted !== true) {
      redirect('/onboarding');
    }
  }

  return session;
}
