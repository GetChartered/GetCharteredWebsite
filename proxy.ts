import type { NextRequest } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
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
