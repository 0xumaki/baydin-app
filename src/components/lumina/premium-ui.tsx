"use client";

import * as React from "react";

/**
 * Baydin premium UI primitives — opt-in shimmering surface treatments
 * layered on top of the editorial primitives in ./primitives.tsx.
 *
 * Currently exports:
 *  - ShimmerButton: parchment button with a gold sheen sweep on hover
 *  - ShimmerCard: card with a subtle diagonal sheen sweep on hover
 *  - OrnamentDivider: gold ornament divider with center glyph
 *
 * These styles use `.lum-shimmer-sweep` defined in globals.css.
 */

export const ShimmerButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button"> & { tone?: "gold" | "parchment" }
>(({ className = "", children, tone = "gold", ...props }, ref) => {
  const base =
    "group relative inline-flex items-center justify-center gap-2 overflow-hidden rounded-sm px-5 py-2.5 text-[13px] font-medium tracking-tight transition-all duration-200 active:scale-[0.98] focus-ring disabled:opacity-40 disabled:pointer-events-none";
  const toneCls =
    tone === "gold"
      ? "bg-[#1A1714] text-[#E8E2D5] border border-[#C5A572]/30 hover:border-[#C5A572]/60"
      : "bg-[#E8E2D5] text-[#0A0908] hover:bg-white";
  return (
    <button ref={ref} className={`${base} ${toneCls} ${className}`} {...props}>
      <span
        aria-hidden
        className="lum-shimmer-sweep pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
      />
      <span className="relative z-10 inline-flex items-center gap-2">{children}</span>
    </button>
  );
});
ShimmerButton.displayName = "ShimmerButton";

export function ShimmerCard({
  className = "",
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      className={`group relative overflow-hidden rounded-sm border border-[#2A2722] bg-[#0A0908] ${className}`}
      {...props}
    >
      <span
        aria-hidden
        className="lum-shimmer-sweep pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-60"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function OrnamentDivider({
  glyph = "✦",
  className = "",
}: {
  glyph?: string;
  className?: string;
}) {
  return (
    <div
      className={`flex items-center justify-center gap-3 text-[#6B6358] ${className}`}
      aria-hidden
    >
      <span className="h-px w-12 bg-gradient-to-r from-transparent to-[#2A2722]" />
      <span className="text-[12px] text-[#C5A572]">{glyph}</span>
      <span className="h-px w-12 bg-gradient-to-l from-transparent to-[#2A2722]" />
    </div>
  );
}
