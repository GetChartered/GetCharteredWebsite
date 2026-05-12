import { Auth0Client } from '@auth0/nextjs-auth0/server';
import { NextResponse } from 'next/server';

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
