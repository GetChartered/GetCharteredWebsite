import 'server-only';
import type { OnboardingMetadata } from '@/lib/auth0-management';

// In-memory, per-server-process cache of Auth0 `user_metadata`, keyed by
// user ID — exists to stop requireOnboardedSession from calling the Auth0
// Management API on every single gated page/API route load.
//
// Why in-memory rather than caching inside the session cookie itself: the
// SDK (@auth0/nextjs-auth0 v4.13.1) does support `auth0.updateSession()`,
// but only from Server Actions and Route Handlers — Server Components
// can't set cookies at all (the SDK's own JSDoc calls this out for
// getAccessTokenForConnection, and the same constraint applies here).
// requireOnboardedSession is called from ~10 page.tsx Server Components as
// well as several Route Handlers, so a cookie-based cache would only ever
// get written from the Route Handler call sites, leaving page-only
// navigation just as exposed to the original problem. An in-memory cache
// works identically from every call site with no context threading.
//
// Tradeoff (explicitly acceptable for this low-traffic beta site): this
// cache is local to a single server process, so it provides no benefit
// across cold starts / separate serverless instances, and it grows
// unbounded for the life of the process (each entry is a few dozen bytes —
// revisit with a real eviction policy if traffic grows enough for that to
// matter). `invalidateCachedUserMetadata` is called from
// lib/auth0-management.ts's updateUserMetadata/updateUserProfile after a
// successful write so a just-completed onboarding (`onboarding_completed`
// flipping false → true) or a profile-name edit is visible on the very
// next request rather than waiting out the TTL.
const TTL_MS = 10 * 60 * 1000;

type CacheEntry = { metadata: OnboardingMetadata; expiresAt: number };

const cache = new Map<string, CacheEntry>();

export function getCachedUserMetadata(userId: string): OnboardingMetadata | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return entry.metadata;
}

export function setCachedUserMetadata(userId: string, metadata: OnboardingMetadata): void {
  cache.set(userId, { metadata, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCachedUserMetadata(userId: string): void {
  cache.delete(userId);
}
