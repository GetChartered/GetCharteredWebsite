import 'server-only';

// Validate environment variables at module load time
const AUTH0_DOMAIN = process.env.AUTH0_DOMAIN;
const AUTH0_CLIENT_ID = process.env.AUTH0_CLIENT_ID;
const AUTH0_CLIENT_SECRET = process.env.AUTH0_CLIENT_SECRET;

if (!AUTH0_DOMAIN || !AUTH0_CLIENT_ID || !AUTH0_CLIENT_SECRET) {
  throw new Error(
    'Missing required Auth0 environment variables: AUTH0_DOMAIN, AUTH0_CLIENT_ID, AUTH0_CLIENT_SECRET'
  );
}

// The Management API does not serve on Auth0 custom domains — only on the
// canonical tenant URL. When AUTH0_DOMAIN is a custom domain (e.g.
// auth.getchartered.app), AUTH0_MANAGEMENT_DOMAIN must be set to the canonical
// tenant (e.g. dev-xxx.us.auth0.com). Falls back to AUTH0_DOMAIN for setups
// where the canonical tenant is used directly.
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

  return response.json();
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

  return response.json();
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
}
