import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
  // Password gate is disabled while the site is in pre-launch marketing mode.
  // The /access page and /api/verify-access route are kept in the repo so the
  // gate can be re-enabled later by restoring the `if (process.env.ACCESS_PASSWORD) { ... }`
  // block here and setting ACCESS_PASSWORD in the environment.
  return await auth0.middleware(request);
}

// Configure which routes the proxy should run on
export const config = {
  matcher: [
    // Match all routes except static files
    // This allows the middleware to handle /auth/* routes automatically
    '/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)',
  ],
};
