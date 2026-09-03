import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * CORS + credentials middleware.
 *
 * The preview gateway serves the app at https://preview-chat-*.space-z.ai
 * but proxies to http://localhost:3000. For the cross-origin fetch() calls
 * (with credentials: "include") to work, the response must include:
 *   - Access-Control-Allow-Origin: <origin>  (NOT * when credentials are involved)
 *   - Access-Control-Allow-Credentials: true
 *
 * We echo back the request Origin (if present) so dev/preview/prod all work.
 */

const ALWAYS_PUBLIC_PATHS = [
  "/api/auth/login",
  "/api/auth/register",
  "/api/auth/demo-admin",
  "/api/auth/logout",
];

export function proxy(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  const isHttps =
    req.headers.get("x-forwarded-proto")?.includes("https") ||
    process.env.NODE_ENV === "production";

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

  return res;
}

export const config = {
  // Apply to all routes (page + API)
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sw.js|manifest.json|icon-|maskable-|apple-touch|favicon-|offline.html|robots.txt).*)"],
};
