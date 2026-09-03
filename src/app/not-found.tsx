/**
 * 404 page — branded not-found view.
 */
import Link from "next/link";
import { GoldButton } from "@/components/lumina/primitives";
import { Compass, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[100dvh] flex items-center justify-center px-6 py-12 bg-background lum-aurora">
      <div className="max-w-md w-full text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gold-soft/30 border border-gold/15 mb-5">
          <Compass className="w-7 h-7 text-gold" />
        </div>
        <div className="text-[12px] uppercase tracking-[0.2em] text-gold mb-2">
          404 · Lost in the cosmos
        </div>
        <h1 className="text-[26px] font-light text-ink tracking-tight mb-2">
          This page wandered off
        </h1>
        <p className="text-[13px] text-ink-muted leading-relaxed mb-6">
          The page you're looking for doesn't exist, or has moved. Let's get you back to the stars.
        </p>
        <div className="flex items-center justify-center gap-2">
          <Link href="/" className="inline-flex items-center gap-2 py-2.5 px-5 text-[13px] text-ink-muted hover:text-gold transition">
            <ArrowLeft className="w-3.5 h-3.5" /> Go back
          </Link>
          <Link href="/">
            <GoldButton className="py-2.5 px-5 text-[13px]">
              Return to Baydin
            </GoldButton>
          </Link>
        </div>
      </div>
    </div>
  );
}
