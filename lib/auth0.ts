import { Auth0Client } from '@auth0/nextjs-auth0/server';

export const auth0 = new Auth0Client({
  // Use APP_BASE_URL for production deployments, fallback to AUTH0_BASE_URL
  appBaseUrl: process.env.APP_BASE_URL || process.env.AUTH0_BASE_URL,
  session: {
    cookie: {
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
    },
  },
});