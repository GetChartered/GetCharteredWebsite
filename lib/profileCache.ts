import 'server-only';

// In-memory, per-server-process cache of our own GET /profile response,
// keyed by user ID — the direct equivalent of lib/onboardingCache.ts, just
// retargeted from Auth0's Management API to our own backend Lambda now that
// onboarding data lives in DynamoDB behind /profile and /complete-onboarding
// (Auth0 stays identity/login only). Same reasoning as the original cache
// still applies here: requireOnboardedSession is called from ~10 page.tsx
// Server Components as well as several Route Handlers, and without a
// cross-request cache every single gated page/API route load would call our
// Lambda fresh — this just moves that concern from "don't rate-limit Auth0's
// Management API" to "don't hammer our own /profile endpoint on every load."
//
// Same tradeoff as before, explicitly accepted: local to a single server
// process (no benefit across cold starts/separate serverless instances),
// unbounded growth for the process lifetime (each entry is tiny) — revisit
// with real eviction if traffic grows enough to matter.
const TTL_MS = 10 * 60 * 1000;

/** Shape of GET /profile's response body. */
export interface ProfileResponse {
  userId: string;
  email: string;
  name: string;
  createdAt: string;
  premium: boolean;
  /** Exam codes bought individually via the Per Exam plan (£25, one-off,
   *  no full premium) — see lib/examAccess.ts for how this combines with
   *  `premium` to decide access to a given exam's content. */
  purchasedExams: string[];
  /** Only ever "annual" today (or null) — written by stripeWebhook on an
   *  Annual purchase. Not a real Stripe subscription; expiry is tracked
   *  manually via annualExpiresAt + the premiumExpiryCheck Lambda. */
  subscriptionPlan: string | null;
  /** ISO date string, or null if the user has never bought Annual. */
  annualExpiresAt: string | null;
  course: string | null;
  examDate: string | null;
  leaderboardOptIn: boolean | null;
  selectedModules: string[];
  onboardingCompleted: boolean;
  fullName: string;
  company?: string;
  role?: string;
  linkedinUrl?: string;
  heardFrom?: string;
  heardFromDetail?: string;
  targetExamWindow?: string;
  qualificationStage?: string;
  marketingConsent?: boolean;
  /** Set once a user uploads a custom avatar via POST /api/user/photo (see
   *  backend-reference/updateUserPhoto.js) — undefined until the backend
   *  Lambda that writes it is deployed. Falls back to the Auth0 IdP picture,
   *  then initials, in app/my-account/layout.tsx. */
  photoUrl?: string;
}

type CacheEntry = { profile: ProfileResponse; expiresAt: number };

const cache = new Map<string, CacheEntry>();

export function getCachedProfile(userId: string): ProfileResponse | null {
  const entry = cache.get(userId);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    cache.delete(userId);
    return null;
  }
  return entry.profile;
}

const MAX_CACHE_SIZE = 500;

export function setCachedProfile(userId: string, profile: ProfileResponse): void {
  // Evict expired entries if the cache is getting large, preventing unbounded growth
  if (cache.size >= MAX_CACHE_SIZE) {
    const now = Date.now();
    for (const [key, entry] of cache) {
      if (now > entry.expiresAt) cache.delete(key);
    }
    // If still over limit after evicting expired, drop oldest entries
    if (cache.size >= MAX_CACHE_SIZE) {
      const excess = cache.size - MAX_CACHE_SIZE + 1;
      const keys = cache.keys();
      for (let i = 0; i < excess; i++) {
        const k = keys.next().value;
        if (k !== undefined) cache.delete(k);
      }
    }
  }
  cache.set(userId, { profile, expiresAt: Date.now() + TTL_MS });
}

export function invalidateCachedProfile(userId: string): void {
  cache.delete(userId);
}
