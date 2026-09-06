"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * GlassCard — editorial surface (no more glass blur/shadows).
 * Now uses solid dark background with hairline border — content sits on the page.
 */
export function GlassCard({
  className,
  children,
  float,
  ...props
}: React.ComponentProps<"div"> & { float?: boolean }) {
  return (
    <div
      className={cn("bg-[#0A0908] border border-[#2A2722] rounded-sm", className)}
      {...props}
    >
      {children}
    </div>
  );
}

export function ShellCard({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div className={cn("bg-[#0A0908] border border-[#2A2722] rounded-sm", className)} {...props}>
      {children}
    </div>
  );
}

export function Pill({
  children,
  variant = "default",
  className,
  style,
}: {
  children: React.ReactNode;
  variant?: "default" | "gold" | "leaf";
  className?: string;
  style?: React.CSSProperties;
}) {
  const variants = {
    default: "bg-[#1A1714] text-[#9C9489] border-[#2A2722]",
    gold: "bg-[#1A1714] text-[#C5A572] border-[#C5A572]/20",
    leaf: "bg-[#1A1714] text-[#7A8B6F] border-[#7A8B6F]/20",
  };
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] border rounded-sm font-medium",
        variants[variant],
        className
      )}
      style={style}
    >
      {children}
    </span>
  );
}

export function SectionTitle({
  eyebrow,
  title,
  subtitle,
  className,
  children,
}: {
  eyebrow?: string;
  title?: React.ReactNode;
  subtitle?: React.ReactNode;
  className?: string;
  children?: React.ReactNode;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      {eyebrow && (
        <div className="text-[12px] text-[#6B6358] font-medium">
          {eyebrow}
        </div>
      )}
      {title && (
        <h2 className="serif-display text-[1.5rem] text-[#E8E2D5] tracking-tight">
          {title}
        </h2>
      )}
      {subtitle && (
        <p className="text-[13px] text-[#9C9489] leading-[1.6]">{subtitle}</p>
      )}
      {children}
    </div>
  );
}

export const GoldButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5",
      "bg-[#E8E2D5] text-[#0A0908] text-[13px] font-medium tracking-tight",
      "transition-all duration-150 hover:bg-white active:scale-[0.98]",
      "disabled:opacity-40 disabled:pointer-events-none",
      "focus-ring",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
GoldButton.displayName = "GoldButton";

export const GhostButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5",
      "text-[#9C9489] text-[13px] font-medium",
      "border border-[#2A2722] bg-transparent",
      "transition-all duration-150 hover:text-[#E8E2D5] hover:border-[#4A4540] active:scale-[0.98]",
      "disabled:opacity-40 disabled:pointer-events-none",
      "focus-ring",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
GhostButton.displayName = "GhostButton";

/** Gold-accent gradient button for premium CTAs — now uses solid parchment like GoldButton */
export const GradientButton = React.forwardRef<
  HTMLButtonElement,
  React.ComponentProps<"button">
>(({ className, children, ...props }, ref) => (
  <button
    ref={ref}
    className={cn(
      "inline-flex items-center justify-center gap-2 rounded-sm px-5 py-2.5",
      "bg-[#E8E2D5] text-[#0A0908] text-[13px] font-medium tracking-tight",
      "transition-all duration-150 hover:bg-white active:scale-[0.98]",
      "disabled:opacity-40 disabled:pointer-events-none",
      "focus-ring",
      className
    )}
    {...props}
  >
    {children}
  </button>
));
GradientButton.displayName = "GradientButton";

export function Divider({ className }: { className?: string }) {
  return <div className={cn("lum-divider", className)} />;
}

export function StarField({ count = 24 }: { count?: number }) {
  const stars = React.useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const isGold = Math.random() > 0.6;
        return {
          id: i,
          top: Math.random() * 100,
          left: Math.random() * 100,
          size: Math.random() * 2.5 + 0.8,
          delay: Math.random() * 5,
          dur: Math.random() * 4 + 2,
          opacity: Math.random() * 0.4 + 0.3,
          isGold,
        };
      }),
    [count]
  );
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s) => (
        <span
          key={s.id}
          className="absolute rounded-full"
          style={{
            top: `${s.top}%`,
            left: `${s.left}%`,
            width: s.size,
            height: s.size,
            background: s.isGold ? "#C5A572" : "#E8E2D5",
            opacity: s.opacity,
            boxShadow: s.isGold ? `0 0 ${s.size * 2}px rgba(197,165,114,0.4)` : "none",
            animation: `lum-twinkle ${s.dur}s ease-in-out ${s.delay}s infinite`,
          }}
        />
      ))}
    </div>
  );
}
