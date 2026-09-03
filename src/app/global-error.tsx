"use client";

/**
 * Global error boundary — catches errors that error.tsx cannot,
 * such as errors in the root layout itself.
 */
import { GoldButton } from "@/components/lumina/primitives";
import { AlertTriangle } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en" className="dark">
      <body className="bg-background text-foreground antialiased">
        <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12">
          <div className="max-w-md w-full text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-soft/30 border border-gold/15 mb-5">
              <AlertTriangle className="w-7 h-7 text-gold" />
            </div>
            <h1 className="text-[22px] font-light text-ink tracking-tight mb-2">
              Something went wrong
            </h1>
            <p className="text-[13px] text-ink-muted leading-relaxed mb-6">
              An unexpected error occurred. Please try again.
            </p>
            <GoldButton onClick={reset} className="py-2.5 px-5 text-[13px]">
              Try again
            </GoldButton>
          </div>
        </div>
      </body>
    </html>
  );
}
