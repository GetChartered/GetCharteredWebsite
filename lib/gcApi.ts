import 'server-only';
// Imports from lib/auth0Client.ts (not lib/auth0.ts) deliberately — lib/auth0.ts
// itself now calls into this file (requireOnboardedSession -> callGcApi, to
// check GET /profile), so importing lib/auth0.ts here would be circular.
import { auth0 } from '@/lib/auth0Client';

// Same physical Gateway the mobile app targets (see GetChartered_app's
// components/useBackendData.tsx / hooks/useCourseSelection.ts).
const GC_API_BASE = 'https://mqtt2y9shf.execute-api.eu-west-2.amazonaws.com';

/**
 * Server-side proxy to the GetChartered AWS API Gateway backend, authenticated
 * with the caller's Auth0 session. Intentionally *not* exposed to the client —
 * callers are Next.js Server Components / Route Handlers, which keeps the
 * access token off the browser entirely (same-origin proxy pattern, as opposed
 * to the SDK's client-side /auth/access-token endpoint).
 *
 * Callers must gate their route with requireSession/requireOnboardedSession
 * first; this throws rather than redirecting if there's no session, since a
 * redirect from inside a fetch helper would be surprising.
 */
export async function callGcApi(
  path: string,
  options: RequestInit = {}
): Promise<Response> {
  const session = await auth0.getSession();
  if (!session) {
    throw new Error(
      'callGcApi: no active session. Gate the calling route with requireSession/requireOnboardedSession before calling callGcApi().'
    );
  }

  const { token } = await auth0.getAccessToken();

  const response = await fetch(`${GC_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // Deliberately last so a caller-supplied header can never shadow it.
      Authorization: `Bearer ${token}`,
    },
  });

  return response;
}
