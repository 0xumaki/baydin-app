"use client";

import * as React from "react";
import { GoldButton, GhostButton } from "@/components/lumina/primitives";
import { RefreshCw, AlertTriangle } from "lucide-react";

/**
 * Global error boundary — catches render errors in any route segment.
 * Shows a branded, non-scary error page with a retry button.
 */
export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  React.useEffect(() => {
    // Log to console for dev (in prod this would go to Sentry/etc.)
    console.error("App error:", error);
  }, [error]);

  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12 bg-background lum-aurora">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-soft/30 border border-gold/15 mb-5">
          <AlertTriangle className="w-7 h-7 text-gold" />
        </div>
        <h1 className="text-[22px] font-light text-ink tracking-tight mb-2">
          Something stirred in the stars
        </h1>
        <p className="text-[13px] text-ink-muted leading-relaxed mb-6">
          An unexpected error occurred. Your data is safe — try again, or refresh the page.
        </p>
        {process.env.NODE_ENV !== "production" && (
          <details className="mb-5 text-left">
            <summary className="text-[11px] text-ink-muted cursor-pointer hover:text-gold transition">
              Show error details (dev only)
            </summary>
            <pre className="mt-2 p-3 rounded-lg bg-black/40 border border-white/5 text-[10px] text-red-400/80 overflow-x-auto whitespace-pre-wrap break-words">
              {error.message}
              {error.digest ? `\n\nDigest: ${error.digest}` : ""}
              {error.stack ? `\n\n${error.stack}` : ""}
            </pre>
          </details>
        )}
        <div className="flex items-center justify-center gap-2">
          <GhostButton onClick={() => window.location.reload()} className="py-2.5 px-5 text-[13px]">
            <RefreshCw className="w-3.5 h-3.5" /> Refresh page
          </GhostButton>
          <GoldButton onClick={reset} className="py-2.5 px-5 text-[13px]">
            Try again
          </GoldButton>
        </div>
      </div>
    </div>
  );
}
