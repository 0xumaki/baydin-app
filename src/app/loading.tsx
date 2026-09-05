/**
 * Root loading skeleton — shown during route transitions and initial load.
 */
import { Moon } from "lucide-react";

export default function Loading() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center bg-background lum-aurora">
      <div className="text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-soft/30 border border-gold/15 mb-4 relative">
          <Moon className="w-7 h-7 text-gold animate-pulse" />
          <div className="absolute inset-0 rounded-2xl border border-gold/20 animate-ping opacity-30" />
        </div>
        <div className="text-[12px] text-ink-muted tracking-[0.2em] uppercase animate-pulse">
          Aligning the stars…
        </div>
      </div>
    </div>
  );
}
