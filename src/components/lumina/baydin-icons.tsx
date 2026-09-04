"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
 * BAYDIN ICONS — Luck = four-leaf clover (not diamond/wallet).
 * ============================================================ */

const CLOVER_LEAF_PATH =
  "M 12,12 C 9,11 7,10 7,7 C 7,4 10,4 12,5 C 14,4 17,4 17,7 C 17,10 15,11 12,12 Z";

const CLOVER_STEM_PATH = "M 12,12 C 11.5,15 12.5,18 12,21";

export interface CloverIconProps extends React.SVGProps<SVGSVGElement> {
  /** Filled leaf vs stroke-only outline. Default: false. */
  filled?: boolean;
  /** Stroke width for the clover outline. Default: 1.6. */
  strokeWidth?: number;
  /** When true, screen readers ignore this icon (decorative). */
  "aria-hidden"?: boolean | "true" | "false";
  /** Accessible label for the icon; sets role="img" if present. */
  "aria-label"?: string;
}

/**
 * CloverIcon — inline SVG four-leaf clover with 4 heart-shaped leaves
 * arranged at 45°/135°/225°/315° around the center, plus a curved stem
 * extending downward. Luck = four-leaf clover, never a diamond or wallet.
 */
export function CloverIcon({
  className,
  style,
  filled = false,
  strokeWidth = 1.6,
  "aria-hidden": ariaHidden = true,
  "aria-label": ariaLabel,
  ...props
}: CloverIconProps) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill={filled ? "currentColor" : "none"}
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden={ariaLabel ? undefined : ariaHidden ? "true" : undefined}
      aria-label={ariaLabel}
      role={ariaLabel ? "img" : undefined}
      {...props}
    >
      <g>
        <path d={CLOVER_LEAF_PATH} transform="rotate(45 12 12)" />
        <path d={CLOVER_LEAF_PATH} transform="rotate(135 12 12)" />
        <path d={CLOVER_LEAF_PATH} transform="rotate(225 12 12)" />
        <path d={CLOVER_LEAF_PATH} transform="rotate(315 12 12)" />
      </g>
      <path d={CLOVER_STEM_PATH} fill="none" />
    </svg>
  );
}

/**
 * CloverPNG — raster clover image (gold gradient) for large watermarks
 * and contexts where the inline SVG would be too heavy. Reads from
 * /icons/luck-clover.svg (served by the public folder).
 */
export function CloverPNG({
  className,
  style,
  alt = "Baydin luck clover",
  ...props
}: React.ImgHTMLAttributes<HTMLImageElement>) {
  return (
    <img
      src="/icons/luck-clover.svg"
      alt={alt}
      className={className}
      style={style}
      {...props}
    />
  );
}

/**
 * BaydinLogo — wordmark + clover combo.
 * Inline SVG wordmark in the editorial serif style, prefixed by a
 * gold-accented CloverIcon.
 */
export interface BaydinLogoProps
  extends Omit<React.HTMLAttributes<HTMLDivElement>, "children"> {
  /** Hide the wordmark (icon-only). */
  iconOnly?: boolean;
  /** Size variant. Default: md. */
  size?: "sm" | "md" | "lg";
  /** Optional click handler. */
  onClick?: React.MouseEventHandler<HTMLDivElement>;
}

const SIZES: Record<NonNullable<BaydinLogoProps["size"]>, {
  icon: string;
  word: string;
  gap: string;
}> = {
  sm: { icon: "h-4 w-4", word: "text-[15px]", gap: "gap-1.5" },
  md: { icon: "h-5 w-5", word: "text-[17px]", gap: "gap-2" },
  lg: { icon: "h-7 w-7", word: "text-[22px]", gap: "gap-2.5" },
};

export function BaydinLogo({
  className,
  style,
  iconOnly = false,
  size = "md",
  onClick,
  ...props
}: BaydinLogoProps) {
  const sz = SIZES[size];
  const isInteractive = typeof onClick === "function";
  return (
    <div
      onClick={onClick}
      role={isInteractive ? "button" : undefined}
      tabIndex={isInteractive ? 0 : undefined}
      className={cn(
        "inline-flex items-center",
        sz.gap,
        isInteractive && "cursor-pointer focus-ring",
        className
      )}
      style={style}
      {...props}
    >
      <CloverIcon
        className={cn("text-[#C5A87C]", sz.icon)}
        strokeWidth={1.6}
        aria-hidden
      />
      {!iconOnly && (
        <span
          className={cn(
            "serif-display tracking-tight text-[#E8E2D5]",
            sz.word
          )}
        >
          Baydin
        </span>
      )}
    </div>
  );
}

/**
 * LotusIcon — eight-petal lotus for ritual / manifest surfaces.
 * Inherits color via currentColor and responds to w-/h- size utilities.
 */
export function LotusIcon({
  className,
  style,
  strokeWidth = 1.4,
  ...props
}: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <path d="M12 4c1.5 2 2.5 4 2.5 7S13.5 17 12 19c-1.5-2-2.5-4-2.5-8S10.5 6 12 4z" />
      <path d="M12 19c-3-1-5-2.5-5-5.5 2.5.5 4 1.5 5 3" />
      <path d="M12 19c3-1 5-2.5 5-5.5-2.5.5-4 1.5-5 3" />
      <path d="M12 19c-4 0-7-1.5-9-3.5 2.5-1 5-1 7-.5" />
      <path d="M12 19c4 0 7-1.5 9-3.5-2.5-1-5-1-7-.5" />
    </svg>
  );
}

/**
 * StarGlyphIcon — 8-point star for divination / chat surfaces.
 * Inherits color via currentColor and responds to w-/h- size utilities.
 */
export function StarGlyphIcon({
  className,
  style,
  strokeWidth = 1.2,
  ...props
}: React.SVGProps<SVGSVGElement> & { strokeWidth?: number }) {
  const pts: string[] = [];
  for (let i = 0; i < 16; i++) {
    const r = i % 2 === 0 ? 10 : 4;
    const a = (Math.PI / 8) * i - Math.PI / 2;
    pts.push(`${12 + r * Math.cos(a)},${12 + r * Math.sin(a)}`);
  }
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      style={style}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinejoin="round"
      aria-hidden
      {...props}
    >
      <polygon points={pts.join(" ")} />
    </svg>
  );
}
