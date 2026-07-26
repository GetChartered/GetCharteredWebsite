import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';

// Split out of lib/auth0.ts so lib/gcApi.ts (which every authenticated
// backend call, including the new /profile and /complete-onboarding calls,
// goes through) can import the client instance WITHOUT importing lib/auth0.ts
// itself. lib/auth0.ts's requireOnboardedSession() now calls lib/gcApi.ts's
// callGcApi() directly (to check GET /profile's onboardingCompleted) — if
// lib/gcApi.ts still imported `auth0` from lib/auth0.ts, that would be a
// circular import (auth0.ts -> gcApi.ts -> auth0.ts). Every other call site
// keeps importing `auth0` from '@/lib/auth0' unchanged, since lib/auth0.ts
// re-exports it from here.
const appBaseUrl =
  process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL || 'http://localhost:3000';

export const auth0 = new Auth0Client({
  appBaseUrl,
  authorizationParameters: {
    // Scopes the session's access token to the GetChartered AWS API Gateway
    // backend from login, so auth0.getAccessToken() (see lib/gcApi.ts) can
    // return a token that Gateway's JWT authorizer will accept.
    audience: 'https://getchartered.app/api/authVerify',
    // MUST be listed explicitly alongside `audience`, not omitted: the
    // SDK's Auth0Client/AuthClient constructor does
    // `options.authorizationParameters || { scope: DEFAULT_SCOPES }`
    // (node_modules/@auth0/nextjs-auth0/dist/server/auth-client.js) — a
    // whole-object fallback, not a per-key one. Passing ANY
    // authorizationParameters object (even one that only sets `audience`)
    // is truthy, so it replaces the SDK's default `{ scope: DEFAULT_SCOPES
    // }` entirely rather than extending it. Omitting `scope` here previously
    // meant the /authorize request carried no scope param at all, so no
    // offline_access was requested and Auth0 never issued a refresh token —
    // access tokens then expired with no way to silently refresh
    // ("AccessTokenError: ... missing_refresh_token"). This string is the
    // SDK's own DEFAULT_SCOPES value (dist/utils/constants.js), copied
    // explicitly rather than imported since it isn't part of the package's
    // public API surface.
    scope: 'openid profile email offline_access',
  },
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
  async onCallback(error, ctx) {
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
