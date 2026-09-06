import { NextResponse } from "next/server";

/**
 * BAYDIN API error handler wrapper.
 *
 * Wraps an async Next.js Route Handler so any thrown `Error` with a `.status`
 * field of 401 or 403 (produced by `requireUser`, `requireAdmin`,
 * `requireReseller` in `src/lib/auth.ts`) becomes a proper JSON response with
 * the matching HTTP status. Any other error is logged and returned as a 500.
 *
 * Existing response shapes are preserved — when the handler returns normally
 * its NextResponse is passed through untouched.
 */
export function withAuth<TArgs extends any[]>(
  handler: (...args: TArgs) => Promise<NextResponse>
): (...args: TArgs) => Promise<NextResponse> {
  return async (...args: TArgs) => {
    try {
      return await handler(...args);
    } catch (e: any) {
      // Check for auth errors (401/403)
      if (e?.status === 401) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
      if (e?.status === 403) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
      }
      console.error("[api-handler] error:", e);
      const msg = e?.message || "Internal server error";
      return NextResponse.json({ error: msg }, { status: 500 });
    }
  };
}
