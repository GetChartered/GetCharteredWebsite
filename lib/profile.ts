import { callGcApi } from '@/lib/gcApi';
import type { ProfileResponse } from '@/lib/profileCache';

/** Parses a raw GET /profile response body — factored out of
 *  fetchProfileData so it can be exercised directly (e.g. in tests) without
 *  a live session/network call, matching lib/practice/fetchProgress.ts's
 *  parseProgressData pattern. Doesn't trust the raw JSON blindly since this
 *  is a new endpoint with no prior track record on the website side. */
export function parseProfileData(data: unknown): ProfileResponse {
  const raw = (data ?? {}) as Record<string, unknown>;

  const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
  const bool = (v: unknown): boolean | undefined => (typeof v === 'boolean' ? v : undefined);

  return {
    userId: str(raw.userId) ?? '',
    email: str(raw.email) ?? '',
    name: str(raw.name) ?? '',
    createdAt: str(raw.createdAt) ?? '',
    premium: bool(raw.premium) ?? false,
    course: str(raw.course) ?? null,
    examDate: str(raw.examDate) ?? null,
    leaderboardOptIn: bool(raw.leaderboardOptIn) ?? null,
    selectedModules: Array.isArray(raw.selectedModules)
      ? raw.selectedModules.filter((m): m is string => typeof m === 'string')
      : [],
    onboardingCompleted: bool(raw.onboardingCompleted) ?? false,
    fullName: str(raw.fullName) ?? '',
    company: str(raw.company),
    role: str(raw.role),
    linkedinUrl: str(raw.linkedinUrl),
    heardFrom: str(raw.heardFrom),
    heardFromDetail: str(raw.heardFromDetail),
    targetExamWindow: str(raw.targetExamWindow),
    qualificationStage: str(raw.qualificationStage),
    marketingConsent: bool(raw.marketingConsent),
  };
}

/**
 * Fetches + parses GET /profile — the new backend-Lambda/DynamoDB-backed
 * replacement for Auth0 user_metadata (Auth0 remains identity/login only).
 * Throws on a non-OK response (matching the old getUserMetadata's
 * throw-on-error behaviour from lib/auth0-management.ts) rather than
 * returning null, so a backend outage surfaces as an error page instead of
 * silently redirecting an already-onboarded user back into /onboarding.
 *
 * A 404 is the one expected non-OK response: a brand-new user who hasn't
 * completed onboarding yet has no profile row in DynamoDB at all. That's not
 * an error — return parseProfileData's empty-input defaults (course: null,
 * fullName: '', onboardingCompleted: false, etc.) so the onboarding form
 * renders with blank fields instead of erroring out.
 */
export async function fetchProfileData(): Promise<ProfileResponse> {
  const response = await callGcApi('/profile');
  if (response.status === 404) {
    return parseProfileData(null);
  }
  if (!response.ok) {
    throw new Error(`GET /profile failed: HTTP ${response.status}`);
  }
  const data = await response.json().catch(() => null);
  return parseProfileData(data);
}
