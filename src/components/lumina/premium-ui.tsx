"use client";

import * as React from "react";
import {
  motion,
  useInView,
  useMotionValue,
  useSpring,
  useTransform,
} from "framer-motion";
import { cn } from "@/lib/utils";

/**
 * Baydin premium UI primitives — opt-in shimmering surface treatments
 * layered on top of the editorial primitives in ./primitives.tsx.
 *
 * Exports:
 *  - ShimmerButton: parchment button with a gold sheen sweep on hover
 *  - ShimmerCard: card with a subtle diagonal sheen sweep on hover
 *  - OrnamentDivider: gold ornament divider with center glyph
 *  - NumberTicker: count-up number using framer-motion springs
 *  - AuroraGlowCard: cursor-tracking radial glow card
 *  - GlowPill: badge with soft glow shadow
 *  - LiquidMetalText: gold→parchment flowing gradient text
 *  - MagneticHover: cursor-following magnetic translation
 *  - AnimatedGradientBackground: drifting aurora blobs
 *  - BackgroundBeams: diagonal parchment/gold beams
 *
 * These styles use `.lum-shimmer-sweep`, `.lum-liquid-metal`,
 * `.lum-aurora-blob`, `.lum-beam`, `.lum-glow-pill`, `.card-hover-lift`
 * defined in globals.css.
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

// ============================================================
// NumberTicker — count-up with framer-motion springs.
//
// useInView(margin: "0px") — the previous "-50px" margin caused
// elements that were already in viewport at mount to NEVER trigger
// `inView=true` on some viewports (notably inside Sheets/Dialogs).
// The 0px margin + a fallback useEffect that nudges the motion value
// after 200ms guards against the "stuck at 0" issue.
// ============================================================

export function NumberTicker({
  value,
  duration = 1.6,
  decimals = 0,
  prefix = "",
  suffix = "",
  className,
}: {
  value: number;
  duration?: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  className?: string;
}) {
  const ref = React.useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { margin: "0px", once: true });
  const motionValue = useMotionValue(0);
  const spring = useSpring(motionValue, {
    duration: duration * 1000,
    bounce: 0,
  });
  const display = useTransform(spring, (v) => {
    return `${prefix}${v.toFixed(decimals)}${suffix}`;
  });

  // Primary trigger: when inView becomes true, animate to value.
  React.useEffect(() => {
    if (inView && value > 0) {
      motionValue.set(value);
    }
  }, [inView, value, motionValue]);

  // Fallback safety net: if useInView fails to fire on an
  // already-in-view element (common inside Sheets/Dialogs/portals),
  // force the motion value to the target after 200ms.
  React.useEffect(() => {
    if (value <= 0) return;
    const t = setTimeout(() => {
      motionValue.set(value);
    }, 200);
    return () => clearTimeout(t);
  }, [value, motionValue]);

  return <motion.span ref={ref} className={className}>{display}</motion.span>;
}

// ============================================================
// AuroraGlowCard — cursor-tracking radial glow.
// ============================================================

export function AuroraGlowCard({
  children,
  className,
  glowColor = "#C5A572",
  glowIntensity = 0.15,
}: {
  children: React.ReactNode;
  className?: string;
  glowColor?: string;
  glowIntensity?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const [pos, setPos] = React.useState<{ x: number; y: number } | null>(null);

  return (
    <div
      ref={ref}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        setPos({
          x: ((e.clientX - r.left) / r.width) * 100,
          y: ((e.clientY - r.top) / r.height) * 100,
        });
      }}
      onMouseLeave={() => setPos(null)}
      className={cn(
        "card-hover-lift group relative overflow-hidden rounded-sm border border-[#2A2722] bg-[#0A0908]",
        className
      )}
    >
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 transition-opacity duration-300"
        style={{
          opacity: pos ? 1 : 0,
          background: pos
            ? `radial-gradient(600px circle at ${pos.x}% ${pos.y}%, ${hexToRgba(glowColor, glowIntensity)}, transparent 40%)`
            : "transparent",
        }}
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-[#C5A572]/60 to-transparent"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

// ============================================================
// GlowPill — badge with soft gold glow shadow.
// ============================================================

export function GlowPill({
  children,
  color = "#C5A572",
  className,
}: {
  children: React.ReactNode;
  color?: string;
  className?: string;
}) {
  const rgba = hexToRgba(color, 1);
  return (
    <span
      className={cn(
        "lum-glow-pill inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[11px] font-medium",
        className
      )}
      style={{
        color: rgba,
        borderColor: hexToRgba(color, 0.4),
        backgroundColor: hexToRgba(color, 0.08),
        boxShadow: `0 0 18px ${hexToRgba(color, 0.35)}`,
      }}
    >
      {children}
    </span>
  );
}

// ============================================================
// LiquidMetalText — gold→parchment flowing gradient text.
// ============================================================

export function LiquidMetalText({
  children,
  className,
  as = "span",
}: {
  children: React.ReactNode;
  className?: string;
  as?: "span" | "h1" | "h2" | "h3" | "div";
}) {
  const Tag = as as any;
  return (
    <Tag className={cn("lum-liquid-metal font-semibold", className)}>
      {children}
    </Tag>
  );
}

// ============================================================
// MagneticHover — cursor-following magnetic translation.
// ============================================================

export function MagneticHover({
  children,
  className,
  strength = 0.3,
}: {
  children: React.ReactNode;
  className?: string;
  strength?: number;
}) {
  const ref = React.useRef<HTMLDivElement>(null);
  const x = useMotionValue(0);
  const y = useMotionValue(0);
  const springX = useSpring(x, { stiffness: 200, damping: 15 });
  const springY = useSpring(y, { stiffness: 200, damping: 15 });

  return (
    <motion.div
      ref={ref}
      className={cn("inline-block", className)}
      style={{ x: springX, y: springY }}
      onMouseMove={(e) => {
        const r = ref.current?.getBoundingClientRect();
        if (!r) return;
        const cx = r.left + r.width / 2;
        const cy = r.top + r.height / 2;
        x.set((e.clientX - cx) * strength);
        y.set((e.clientY - cy) * strength);
      }}
      onMouseLeave={() => {
        x.set(0);
        y.set(0);
      }}
    >
      {children}
    </motion.div>
  );
}

// ============================================================
// AnimatedGradientBackground — drifting aurora blobs.
// ============================================================

export function AnimatedGradientBackground({
  variant = "default",
  className,
}: {
  variant?: "default" | "warm" | "cosmic" | "dawn";
  className?: string;
}) {
  const palettes: Record<string, string[]> = {
    default: ["#C5A572", "#7A8B6F", "#0A0908"],
    warm: ["#E7A264", "#C5A572", "#5A3E2E"],
    cosmic: ["#9E8AC9", "#C5A572", "#1E1A33"],
    dawn: ["#E7B296", "#B5CD7E", "#5A3E2E"],
  };
  const colors = palettes[variant] ?? palettes.default;
  return (
    <div className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)} aria-hidden>
      {colors.map((c, i) => (
        <motion.div
          key={i}
          className="lum-aurora-blob"
          style={{
            background: c,
            width: 360 + i * 80,
            height: 360 + i * 80,
            top: `${10 + i * 25}%`,
            left: `${-10 + i * 35}%`,
          }}
          animate={{
            x: [0, 40, -30, 0],
            y: [0, -30, 40, 0],
            scale: [1, 1.1, 0.95, 1],
          }}
          transition={{
            duration: 18 + i * 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: i * 1.5,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// BackgroundBeams — diagonal parchment/gold beams.
// ============================================================

export function BackgroundBeams({
  count = 5,
  className,
}: {
  count?: number;
  className?: string;
}) {
  const beams = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        left: (i + 1) * (100 / (count + 1)),
        delay: Math.random() * 3,
        duration: 4 + Math.random() * 3,
      })),
    [count]
  );
  return (
    <div
      className={cn("pointer-events-none absolute inset-0 overflow-hidden", className)}
      aria-hidden
    >
      {beams.map((b) => (
        <motion.span
          key={b.id}
          className="lum-beam"
          style={{ left: `${b.left}%` }}
          animate={{ opacity: [0, 0.6, 0], scaleY: [0.8, 1.2, 0.8] }}
          transition={{
            duration: b.duration,
            repeat: Infinity,
            ease: "easeInOut",
            delay: b.delay,
          }}
        />
      ))}
    </div>
  );
}

// ============================================================
// Helpers
// ============================================================

function hexToRgba(hex: string, alpha: number): string {
  // Accept #RGB, #RRGGBB, #RRGGBBAA
  let h = hex.replace("#", "");
  if (h.length === 3) h = h.split("").map((c) => c + c).join("");
  if (h.length !== 6 && h.length !== 8) return `rgba(197, 165, 114, ${alpha})`;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}
