import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { auth0 } from "@/lib/auth0";

export async function proxy(request: NextRequest) {
  // Password gate logic - runs before Auth0
  // Skip access check if ACCESS_PASSWORD is not set (local development without password)
  if (process.env.ACCESS_PASSWORD) {
    const { pathname } = request.nextUrl;

    // Allow access to the access page and all API routes
    // API routes should handle their own authentication if needed
    if (pathname === "/access" || pathname.startsWith("/api")) {
      return NextResponse.next();
    }

    // Allow access to static files
    if (
      pathname.startsWith("/_next") ||
      pathname.startsWith("/favicon") ||
      pathname.match(/\.(png|jpg|jpeg|gif|svg|ico|css|js|woff|woff2|ttf|eot)$/)
    ) {
      return NextResponse.next();
    }

    // Check if user has access cookie
    const hasAccess = request.cookies.get("site-access")?.value === "granted";

    if (!hasAccess) {
      // Redirect to access page with return URL
      const url = request.nextUrl.clone();
      url.pathname = "/access";
      url.searchParams.set("returnUrl", pathname);
      return NextResponse.redirect(url);
    }
  }

  // If password gate passed (or disabled), proceed to Auth0 middleware
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
