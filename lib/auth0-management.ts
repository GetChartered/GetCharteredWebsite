import 'server-only';
import { invalidateCachedUserMetadata, setCachedUserMetadata } from '@/lib/onboardingCache';

// Validate environment variables at module load time
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
  throw new Error(
    'Missing required Auth0 environment variables: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET'
  );
}

const AUTH0_MGMT_DOMAIN = process.env.AUTH0_MANAGEMENT_DOMAIN || AUTH0_DOMAIN;
const AUTH0_BASE = `https://${AUTH0_MGMT_DOMAIN}`;

let cachedToken: { token: string; expiresAt: number } | null = null;

/**
 * Custom error class for Auth0 Management API errors
 */
class Auth0ManagementError extends Error {
  constructor(
    message: string,
    public statusCode: number,
    public context?: Record<string, any>
  ) {
    super(message);
    this.name = 'Auth0ManagementError';
  }
}

/**
 * Standardized error handler for Auth0 API responses
 */
async function handleAuth0Error(
  response: Response,
  operation: string,
  context?: Record<string, any>
): Promise<never> {
  let errorMessage = 'Auth0 API error';

  try {
    const error = await response.json();
    errorMessage = error.error_description || error.message || errorMessage;
  } catch {
    // JSON parse failed, response might be HTML
    errorMessage = `HTTP ${response.status}: ${response.statusText}`;
  }

  const errorContext = {
    operation,
    status: response.status,
    ...context,
  };

  console.error('Auth0 Management API Error:', errorContext, errorMessage);

  throw new Auth0ManagementError(
    `${operation} failed: ${errorMessage}`,
    response.status,
    errorContext
  );
}

async function getManagementToken(): Promise<string> {
  if (cachedToken && Date.now() < cachedToken.expiresAt) {
    return cachedToken.token;
  }

  const response = await fetch(`${AUTH0_BASE}/oauth/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      grant_type: 'client_credentials',
      client_id: AUTH0_CLIENT_ID,
      client_secret: AUTH0_CLIENT_SECRET,
      audience: `${AUTH0_BASE}/api/v2/`,
    }),
  });

  if (!response.ok) {
    await handleAuth0Error(response, 'Get Management Token');
  }

  const data = await response.json();
  cachedToken = {
    token: data.access_token,
    expiresAt: Date.now() + (data.expires_in - 60) * 1000,
  };

  return data.access_token;
}

export async function updateUserProfile(userId: string, data: { name?: string }) {
  const token = await getManagementToken();

  const response = await fetch(`${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    await handleAuth0Error(response, 'Update User Profile', { userId });
  }

  const updatedUser = await response.json();
  // Root `name` changes are also surfaced through getUserMetadataCached
  // (my-account's displayed name) — seed the cache straight from this PATCH
  // response's user_metadata (see the longer comment on updateUserMetadata
  // for why this replaced a plain invalidate-and-refetch).
  seedOrInvalidateCache(userId, updatedUser);

  return updatedUser;
}

export const QUALIFICATIONS = ['ACA', 'ACCA', 'CISI', 'CII', 'CIMA', 'CFA'] as const;
export type Qualification = (typeof QUALIFICATIONS)[number];

export const HEARD_FROM_OPTIONS = [
  'LinkedIn',
  'Search engine',
  'Social media',
  'Friend or colleague',
  'Online ad',
  'University or training provider',
  'Other',
] as const;
export type HeardFromOption = (typeof HEARD_FROM_OPTIONS)[number];

export const TARGET_EXAM_WINDOWS = [
  { value: 'within_3_months', label: 'Within 3 months' },
  { value: '3_to_6_months', label: '3 to 6 months' },
  { value: '6_to_12_months', label: '6 to 12 months' },
  { value: 'over_12_months', label: 'More than 12 months' },
  { value: 'not_sure', label: 'Not sure yet' },
] as const;
export type TargetExamWindow = (typeof TARGET_EXAM_WINDOWS)[number]['value'];

export const QUALIFICATION_STAGES = [
  { value: 'just_starting', label: 'Just starting out' },
  { value: 'mid_way', label: 'Mid-way through' },
  { value: 'final_stages', label: 'Final stages' },
  { value: 'resitting', label: 'Resitting an exam' },
] as const;
export type QualificationStage = (typeof QUALIFICATION_STAGES)[number]['value'];

export interface OnboardingMetadata {
  full_name?: string;
  qualifications?: Qualification[];
  company?: string;
  role?: string;
  linkedin_url?: string;
  heard_from?: HeardFromOption;
  heard_from_detail?: string;
  target_exam_window?: TargetExamWindow;
  qualification_stage?: QualificationStage;
  // Audit-trail timestamps (ISO 8601). Server-stamped, never client-supplied.
  terms_accepted_at?: string;
  marketing_consent?: boolean;
  marketing_consent_at?: string;
  onboarding_completed?: boolean;
}

/**
 * Returns a normalised view of an Auth0 user: their email/verification status
 * straight from Auth0 (NOT the session cookie, which is stale until re-login)
 * plus their `user_metadata` payload. Use this when callers need anything
 * beyond just the onboarding metadata.
 */
export async function getUserAccount(userId: string): Promise<{
  email: string;
  email_verified: boolean;
  metadata: OnboardingMetadata;
}> {
  const token = await getManagementToken();

  const response = await fetch(
    `${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`,
    { headers: { Authorization: `Bearer ${token}` } }
  );

  if (!response.ok) {
    await handleAuth0Error(response, 'Get User Account', { userId });
  }

  const user = await response.json();
  return {
    email: user.email ?? '',
    email_verified: user.email_verified === true,
    metadata: (user.user_metadata ?? {}) as OnboardingMetadata,
  };
}

// NOTE: the onboarding flow (app/onboarding/OnboardingForm.tsx,
// app/api/onboarding/route.ts) no longer calls this — onboarding data now
// lives in DynamoDB behind our own GET /profile / POST /complete-onboarding
// Lambdas (see lib/profile.ts), with Auth0 as identity/login only. This
// function is still very much in use elsewhere though — don't delete it:
// app/my-account/layout.tsx calls it (via getUserMetadataCached in
// lib/auth0.ts) to resolve the display name shown in account settings, and
// app/api/profile/route.ts (an unrelated PATCH-only route for editing that
// display name — not to be confused with the new backend GET /profile
// endpoint, an unfortunate naming collision) calls it indirectly too.
export async function getUserMetadata(userId: string): Promise<OnboardingMetadata> {
  const token = await getManagementToken();

  const url = new URL(`${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`);
  url.searchParams.set('fields', 'user_metadata');
  url.searchParams.set('include_fields', 'true');

  const response = await fetch(url.toString(), {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (!response.ok) {
    await handleAuth0Error(response, 'Get User Metadata', { userId });
  }

  const data = await response.json();
  return (data.user_metadata ?? {}) as OnboardingMetadata;
}

/**
 * Updates a user's Auth0 record. Top-level `name` and `user_metadata` are
 * patched in the same Management API call. Auth0 merges `user_metadata`
 * one level deep, so partial updates preserve existing keys.
 *
 * NOTE: the onboarding flow no longer calls this (see the comment on
 * getUserMetadata above) — it's kept because app/api/profile/route.ts still
 * calls it directly for social-connection users' display-name edits.
 */
export async function updateUserMetadata(
  userId: string,
  payload: { name?: string; metadata?: Partial<OnboardingMetadata> }
) {
  const token = await getManagementToken();

  const body: Record<string, unknown> = {};
  if (payload.name !== undefined) body.name = payload.name;
  if (payload.metadata !== undefined) body.user_metadata = payload.metadata;

  const response = await fetch(`${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    await handleAuth0Error(response, 'Update User Metadata', { userId });
  }

  const updatedUser = await response.json();
  // Critical for onboarding specifically: this is what flips
  // onboarding_completed false -> true, and requireOnboardedSession must
  // see that on the very next request, not up to TTL_MS later (which would
  // otherwise bounce a just-onboarded user straight back to /onboarding).
  //
  // Originally this just called invalidateCachedUserMetadata(userId) and
  // relied on the next read to fetch fresh — that reintroduced exactly the
  // bug it was meant to prevent: a PATCH immediately followed by a GET
  // against Auth0's Management API is not guaranteed to be read-after-write
  // consistent, so the very next requireOnboardedSession check (moments
  // after onboarding completes) could still see the pre-write
  // onboarding_completed value and bounce back to /onboarding — a loop.
  // Auth0's PATCH response body already IS the full updated user (Auth0
  // computes the one-level-deep user_metadata merge server-side and
  // returns the result), so seeding the cache directly from `updatedUser`
  // here uses the authoritative post-merge state with no extra read and no
  // race window at all, instead of invalidating and hoping.
  seedOrInvalidateCache(userId, updatedUser);

  return updatedUser;
}

/** Seeds the cache from a Management API PATCH response's user_metadata
 *  (the authoritative merged state, no extra read needed) — falls back to
 *  a plain invalidate if the response is missing/malformed for any reason,
 *  so a later read just goes to Auth0 fresh rather than caching garbage. */
function seedOrInvalidateCache(userId: string, updatedUser: unknown): void {
  if (
    updatedUser &&
    typeof updatedUser === 'object' &&
    'user_metadata' in updatedUser &&
    typeof (updatedUser as { user_metadata?: unknown }).user_metadata === 'object' &&
    (updatedUser as { user_metadata?: unknown }).user_metadata !== null
  ) {
    setCachedUserMetadata(
      userId,
      (updatedUser as { user_metadata: OnboardingMetadata }).user_metadata
    );
  } else {
    invalidateCachedUserMetadata(userId);
  }
}

/**
 * Triggers Auth0 to send a password-reset email for a database-connection user.
 * Uses the public `/dbconnections/change_password` endpoint (no Management token needed),
 * so this works for users authenticated via username/password only. Users who signed
 * up with a social provider (e.g., google-oauth2|...) don't have a password to reset.
 */
export async function sendPasswordResetEmail(email: string) {
  const connection =
    process.env.AUTH0_DB_CONNECTION || 'Username-Password-Authentication';

  const response = await fetch(`${AUTH0_BASE}/dbconnections/change_password`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      client_id: AUTH0_CLIENT_ID,
      email,
      connection,
    }),
  });

  if (!response.ok) {
    await handleAuth0Error(response, 'Send Password Reset Email', {
      connection,
    });
  }

  // Endpoint returns a plain-text confirmation string, not JSON.
  return response.text();
}

export async function deleteUser(userId: string) {
  const token = await getManagementToken();

  const response = await fetch(`${AUTH0_BASE}/api/v2/users/${encodeURIComponent(userId)}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    await handleAuth0Error(response, 'Delete User', { userId });
  }

  invalidateCachedUserMetadata(userId);
}
