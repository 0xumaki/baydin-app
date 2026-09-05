import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS + security headers proxy (Next.js 16 "proxy" convention, formerly middleware).
 *
 * Responsibilities:
 * 1. CORS: For cross-origin requests (preview gateway), echo Origin + allow credentials
 * 2. Cache-Control: All /api/* responses get no-store to prevent credential/session leakage via cache
 * 3. Security headers: X-Content-Type-Options, X-Frame-Options, Referrer-Policy
 */

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const isHttps =
    req.headers.get("x-forwarded-proto")?.includes("https") ||
    process.env.NODE_ENV === "production";
  const isApiRoute = req.nextUrl.pathname.startsWith("/api/");

  // Handle CORS preflight (OPTIONS) for cross-origin API calls
  if (req.method === "OPTIONS") {
    const res = new NextResponse(null, { status: 204 });
    if (origin) {
      res.headers.set("Access-Control-Allow-Origin", origin);
      res.headers.set("Access-Control-Allow-Credentials", "true");
      res.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
      res.headers.set(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization, X-Requested-With"
      );
      res.headers.set("Access-Control-Max-Age", "86400");
    }
    return res;
  }

  const res = NextResponse.next();

  // For cross-origin requests (preview gateway), set CORS headers
  if (origin && isHttps) {
    res.headers.set("Access-Control-Allow-Origin", origin);
    res.headers.set("Access-Control-Allow-Credentials", "true");
    res.headers.set("Vary", "Origin");
  }

  // All API responses should never be cached (they may contain user data)
  if (isApiRoute) {
    res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, max-age=0");
    res.headers.set("Pragma", "no-cache");
  }

  // Security headers on all responses
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("X-DNS-Prefetch-Control", "off");

  return res;
}

export const config = {
  // Apply to all routes (page + API), skipping static assets
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-|maskable-|apple-touch|favicon-|offline.html|robots.txt).*)"],
};

