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

  // TEMPORARY DIAGNOSTIC — decode (NOT verify) the outgoing access token's
  // claims for debugging the production /complete-onboarding failure.
  // Remove decodeJwtClaimsForDebug, this block, and the Object.assign below
  // once the error has been captured.
  const tokenClaims = decodeJwtClaimsForDebug(token);
  console.error('callGcApi — outgoing token claims:', path, tokenClaims);

  const response = await fetch(`${GC_API_BASE}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
      // Deliberately last so a caller-supplied header can never shadow it.
      Authorization: `Bearer ${token}`,
    },
  });

  // TEMPORARY DIAGNOSTIC — stash the decoded claims on the Response object
  // so callers (e.g. app/api/onboarding/route.ts) can surface them in a
  // debug payload without changing callGcApi's return type. Remove alongside
  // the rest of this diagnostic.
  Object.assign(response, { __debugTokenClaims: tokenClaims });

  return response;
}

// TEMPORARY DIAGNOSTIC — decodes (does NOT verify) a JWT's payload segment
// for debugging the production /complete-onboarding failure. Never use this
// for auth decisions — it performs no signature check. Only captures
// iss/aud/azp/exp/iat plus the token's length and first 10 characters (not
// the full token). Remove once the error has been captured.
function decodeJwtClaimsForDebug(token: string): {
  iss?: string;
  aud?: unknown;
  azp?: string;
  exp?: number;
  iat?: number;
  tokenLength: number;
  tokenPrefix: string;
} {
  const base = {
    tokenLength: token.length,
    tokenPrefix: token.slice(0, 10),
  };
  try {
    const parts = token.split('.');
    if (parts.length < 2) return base;
    const base64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const padded = base64 + '='.repeat((4 - (base64.length % 4)) % 4);
    const json = Buffer.from(padded, 'base64').toString('utf-8');
    const claims = JSON.parse(json) as Record<string, unknown>;
    return {
      ...base,
      iss: typeof claims.iss === 'string' ? claims.iss : undefined,
      aud: claims.aud,
      azp: typeof claims.azp === 'string' ? claims.azp : undefined,
      exp: typeof claims.exp === 'number' ? claims.exp : undefined,
      iat: typeof claims.iat === 'number' ? claims.iat : undefined,
    };
  } catch {
    return base;
  }
}
