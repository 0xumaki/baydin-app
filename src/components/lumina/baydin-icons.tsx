"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
 * BAYDIN ICONS — Luck = four-leaf clover (not diamond/wallet).
 *
 * Comprehensive custom black-and-gold SVG icon system.
 * - 24×24 viewBox, stroke="currentColor" so icons inherit
 *   surrounding text color (gold #C5A572 inside gold elements,
 *   parchment #E8E2D5 in normal contexts).
 * - 1.5px stroke, round caps & joins for premium feel.
 * - All paths hand-crafted (no auto-generation).
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
function CloverIcon({
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
function CloverPNG({
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

function BaydinLogo({
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
function LotusIcon({
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
function StarGlyphIcon({
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

/* ============================================================
 * BAYDIN ICON SYSTEM — Custom gold-themed SVG icons
 *
 * Every icon below uses the BaydinSvg shell which guarantees:
 *   - 24×24 viewBox
 *   - stroke="currentColor" (inherit surrounding text color)
 *   - stroke-width 1.5, round caps & joins
 *   - aria-hidden="true" by default (decorative)
 *   - role="img" + aria-label when an aria-label is supplied
 *
 * Pass `filled` to fill the icon's main shape with currentColor
 * (works naturally for Star, Heart, Play, etc.).
 * ============================================================ */

export type BaydinIconProps = React.SVGProps<SVGSVGElement> & {
  /** Fill the icon's main shape with currentColor. Default: false. */
  filled?: boolean;
  /** Stroke width. Default: 1.5. */
  strokeWidth?: number;
};

/** Internal shell that keeps every Baydin icon visually consistent. */
function BaydinSvg({
  children,
  filled = false,
  strokeWidth = 1.5,
  className,
  style,
  "aria-label": ariaLabel,
  "aria-hidden": ariaHidden,
  ...props
}: BaydinIconProps & { children: React.ReactNode }) {
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
      role={ariaLabel ? "img" : undefined}
      aria-hidden={ariaLabel ? undefined : ariaHidden ?? "true"}
      aria-label={ariaLabel}
      {...props}
    >
      {children}
    </svg>
  );
}

/* ============================================================
 * CATEGORY 1 — UI ACTION ICONS (40)
 * Drop-in replacements for the most-used lucide-react icons,
 * rendered in the Baydin gold line-art aesthetic.
 * ============================================================ */

/** BaydinSend — paper plane with a soft gold trail. */
function BaydinSend(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M22 2 L15 22 L11 13 L2 9 Z" />
      <path d="M22 2 L11 13" />
      <path d="M4 17 C 7 15 9 14 11 13" opacity="0.5" />
    </BaydinSvg>
  );
}

/** BaydinDownload — downward arrow descending into a tray. */
function BaydinDownload(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 3 V15" />
      <path d="M7 10 L12 15 L17 10" />
      <path d="M4 17 V19 a2 2 0 0 0 2 2 H18 a2 2 0 0 0 2-2 V17" />
    </BaydinSvg>
  );
}

/** BaydinSearch — magnifying glass with a tapered gold handle. */
function BaydinSearch(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="11" cy="11" r="7" />
      <path d="M16.5 16.5 L21 21" />
    </BaydinSvg>
  );
}

/** BaydinPlus — circular plus sign wrapped in a gold ring. */
function BaydinPlus(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8 V16" />
      <path d="M8 12 H16" />
    </BaydinSvg>
  );
}

/** BaydinCheck — checkmark with a small gold flourish curl. */
function BaydinCheck(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M4 12 L9 17 L20 6" />
      <path d="M19 5 C 21 5 22 7 21 9" opacity="0.6" />
    </BaydinSvg>
  );
}

/** BaydinX — X with rounded gold caps. */
function BaydinX(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M6 6 L18 18" />
      <path d="M18 6 L6 18" />
    </BaydinSvg>
  );
}

/** BaydinChevronRight — right chevron. */
function BaydinChevronRight(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M9 5 L16 12 L9 19" />
    </BaydinSvg>
  );
}

/** BaydinChevronLeft — left chevron. */
function BaydinChevronLeft(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M15 5 L8 12 L15 19" />
    </BaydinSvg>
  );
}

/** BaydinChevronDown — down chevron. */
function BaydinChevronDown(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M5 9 L12 16 L19 9" />
    </BaydinSvg>
  );
}

/** BaydinCopy — overlapping rectangles, only the visible L-shape drawn. */
function BaydinCopy(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <rect x="9" y="9" width="11" height="11" rx="1.5" />
      <path d="M3 9 V4.5 a1.5 1.5 0 0 1 1.5-1.5 H13.5 a1.5 1.5 0 0 1 1.5 1.5 V9" />
    </BaydinSvg>
  );
}

/** BaydinShare — three connected dots with thread-like gold lines. */
function BaydinShare(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="6" cy="12" r="2.2" />
      <circle cx="18" cy="6" r="2.2" />
      <circle cx="18" cy="18" r="2.2" />
      <path d="M8 11 L16 7" />
      <path d="M8 13 L16 17" />
    </BaydinSvg>
  );
}

/** BaydinEdit — pencil with rounded gold tip. */
function BaydinEdit(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M17 3 a2.85 2.83 0 1 1 4 4 L7.5 20.5 L2 22 L3.5 16.5 Z" />
      <path d="M15 5 L19 9" />
    </BaydinSvg>
  );
}

/** BaydinTrash — trash can with gold lid handle. */
function BaydinTrash(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M3 6 H21" />
      <path d="M5 6 V20 a1.5 1.5 0 0 0 1.5 1.5 H17.5 a1.5 1.5 0 0 0 1.5-1.5 V6" />
      <path d="M8 6 V4 a1.5 1.5 0 0 1 1.5-1.5 H14.5 a1.5 1.5 0 0 1 1.5 1.5 V6" />
      <path d="M10 11 V17" />
      <path d="M14 11 V17" />
    </BaydinSvg>
  );
}

/** BaydinEye — eye with a gold iris. */
function BaydinEye(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M2 12 C 5 6 19 6 22 12 C 19 18 5 18 2 12 Z" />
      <circle cx="12" cy="12" r="3" />
    </BaydinSvg>
  );
}

/** BaydinStar — 5-pointed star; pass `filled` for a solid gold star. */
function BaydinStar(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 2 L14.4 8.8 L21.5 8.9 L15.8 13.2 L17.9 20.1 L12 16 L6.1 20.1 L8.2 13.2 L2.5 8.9 L9.6 8.8 Z" />
    </BaydinSvg>
  );
}

/** BaydinHeart — heart with a gold EKG pulse line. */
function BaydinHeart(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 21 C 3 14 3 7 7 5 C 10 3.5 12 5 12 7 C 12 5 14 3.5 17 5 C 21 7 21 14 12 21 Z" />
      <path d="M6 13 H9 L11 10 L13 16 L15 13 H18" opacity="0.85" />
    </BaydinSvg>
  );
}

/** BaydinMoon — crescent moon with a thin gold edge. */
function BaydinMoon(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M21 12.5 A 9 9 0 1 1 11 3 A 7 7 0 0 0 21 12.5 Z" />
    </BaydinSvg>
  );
}

/** BaydinSun — sun with eight radiating gold rays. */
function BaydinSun(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2 V5" />
      <path d="M12 19 V22" />
      <path d="M2 12 H5" />
      <path d="M19 12 H22" />
      <path d="M5 5 L7 7" />
      <path d="M17 17 L19 19" />
      <path d="M19 5 L17 7" />
      <path d="M7 17 L5 19" />
    </BaydinSvg>
  );
}

/** BaydinFlame — stylized flame with an inner gold highlight. */
function BaydinFlame(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 2 C 10 6 7 8 7 13 A 5 5 0 0 0 17 13 C 17 9 14 8 12 2 Z" />
      <path d="M12 13 C 11 14 11 16 12 17 C 13 16 13 14 12 13" opacity="0.7" />
    </BaydinSvg>
  );
}

/** BaydinBell — bell with a small gold clapper hanging below. */
function BaydinBell(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M18 8 A 6 6 0 0 0 6 8 C 6 14 4 16 4 16 H 20 C 20 16 18 14 18 8 Z" />
      <path d="M10 20 a2 2 0 0 0 4 0" />
    </BaydinSvg>
  );
}

/** BaydinClock — clock with two gold hands. */
function BaydinClock(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7 V12 L15.5 14" />
    </BaydinSvg>
  );
}

/** BaydinCalendar — calendar with twin gold binding rings on top. */
function BaydinCalendar(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <rect x="3" y="5" width="18" height="16" rx="2" />
      <path d="M3 10 H21" />
      <path d="M8 3 V7" />
      <path d="M16 3 V7" />
    </BaydinSvg>
  );
}

/** BaydinMenu — three horizontal lines, each prefaced by a gold dot. */
function BaydinMenu(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M5 6 H21" />
      <path d="M5 12 H21" />
      <path d="M5 18 H21" />
      <circle cx="3" cy="6" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="3" cy="12" r="0.6" fill="currentColor" stroke="none" />
      <circle cx="3" cy="18" r="0.6" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** BaydinPin — teardrop map pin with a gold point. */
function BaydinPin(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 22 C 12 22 5 14 5 9 A 7 7 0 0 1 19 9 C 19 14 12 22 12 22 Z" />
      <circle cx="12" cy="9" r="2.5" />
    </BaydinSvg>
  );
}

/** BaydinBookmark — bookmark with a small gold tassel bead. */
function BaydinBookmark(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M6 3 H18 V18 L12 15 L6 18 Z" />
      <path d="M12 15 V20" opacity="0.7" />
      <circle cx="12" cy="20.5" r="0.8" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** BaydinShuffle — two crossed arrows with gold chevron heads. */
function BaydinShuffle(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M3 7 H7 C 10 7 12 9 14 12 L17 17 H21" />
      <path d="M3 17 H7 C 10 17 12 15 14 12 L17 7 H21" />
      <path d="M18 4 L21 7 L18 10" />
      <path d="M18 14 L21 17 L18 20" />
    </BaydinSvg>
  );
}

/** BaydinPlay — play triangle with a gold border. */
function BaydinPlay(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M7 5 L19 12 L7 19 Z" />
    </BaydinSvg>
  );
}

/** BaydinPause — two vertical bars. */
function BaydinPause(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <rect x="6" y="5" width="4" height="14" rx="0.5" />
      <rect x="14" y="5" width="4" height="14" rx="0.5" />
    </BaydinSvg>
  );
}

/** BaydinRefresh — three-quarter circular arrow with a gold corner head. */
function BaydinRefresh(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M21 12 A 9 9 0 1 1 12 3 C 14.5 3 16.9 4 18.7 5.7 L 21 8" />
      <path d="M21 3 V8 H16" />
    </BaydinSvg>
  );
}

/** BaydinTrending — upward zigzag line with a gold arrowhead. */
function BaydinTrending(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M3 17 L9 11 L13 15 L21 7" />
      <path d="M15 7 H21 V13" />
    </BaydinSvg>
  );
}

/** BaydinUsers — two figures with subtle gold halos. */
function BaydinUsers(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M16 21 V19 a4 4 0 0 0-4-4 H6 a4 4 0 0 0-4 4 V21" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21 V19 a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13 a4 4 0 0 1 0 7.75" />
    </BaydinSvg>
  );
}

/** BaydinWallet — wallet with a small gold clasp dot. */
function BaydinWallet(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M3 8 V18 a2 2 0 0 0 2 2 H19 a2 2 0 0 0 2-2 V8 Z" />
      <path d="M3 8 V6 a2 2 0 0 1 2-2 H17 a1 1 0 0 1 1 1 V8" />
      <circle cx="16" cy="13" r="1.2" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** BaydinGlobe — globe with equator and a vertical gold meridian. */
function BaydinGlobe(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12 H21" />
      <ellipse cx="12" cy="12" rx="4" ry="9" />
    </BaydinSvg>
  );
}

/** BaydinSave — floppy disk with a gold label slot. */
function BaydinSave(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M5 3 H17 L21 7 V19 a2 2 0 0 1-2 2 H5 a2 2 0 0 1-2-2 V5 a2 2 0 0 1 2-2 Z" />
      <rect x="8" y="3" width="8" height="5" />
      <rect x="8" y="13" width="8" height="6" rx="0.5" />
    </BaydinSvg>
  );
}

/** BaydinHelp — question mark circled in gold. */
function BaydinHelp(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5 a2.5 2.5 0 0 1 4 2 c0 2-2 2-2 4" />
      <circle cx="12" cy="18" r="0.7" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** BaydinAlert — warning triangle with a gold exclamation. */
function BaydinAlert(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 3 L22 20 H2 Z" />
      <path d="M12 9 V14" />
      <circle cx="12" cy="17" r="0.7" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** BaydinLogout — door outline with a rightward gold arrow. */
function BaydinLogout(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M14 4 H6 a2 2 0 0 0-2 2 V18 a2 2 0 0 0 2 2 H14" />
      <path d="M16 12 H9" />
      <path d="M13 9 L16 12 L13 15" />
    </BaydinSvg>
  );
}

/** BaydinArrowLeft — left arrow with a tapered gold shaft. */
function BaydinArrowLeft(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M19 12 H5" />
      <path d="M9 8 L5 12 L9 16" />
    </BaydinSvg>
  );
}

/** BaydinArrowRight — right arrow with a tapered gold shaft. */
function BaydinArrowRight(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M5 12 H19" />
      <path d="M15 8 L19 12 L15 16" />
    </BaydinSvg>
  );
}

/** BaydinLoader — three-quarter spinning arc; merges `animate-spin`. */
function BaydinLoader({ className, ...props }: BaydinIconProps) {
  return (
    <BaydinSvg {...props} className={cn("animate-spin", className)}>
      <path d="M21 12 A 9 9 0 1 1 12 3" />
    </BaydinSvg>
  );
}

/* ============================================================
 * CATEGORY 2 — ZODIAC SIGNS (12)
 * Each glyph hand-drawn as SVG paths — not unicode glyphs.
 * ============================================================ */

/** ZodiacAries — ram's horns curling from a central stem. */

/* ============================================================
 * 3D ZODIAC ICONS — dimensional gold symbols with gradient
 * fills, drop shadows, and bevelled edges for a premium
 * sculpted look. Each icon uses SVG <defs> with linear/radial
 * gradients to simulate depth and lighting.
 * ============================================================ */

/** Shared 3D wrapper — provides gradient defs + drop shadow. */
function Zodiac3DShell({ id, children, className, style }: {
  id: string;
  children: React.ReactNode;
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      viewBox="0 0 32 32"
      className={className}
      style={style}
      fill="none"
      aria-hidden="true"
      role="img"
    >
      <defs>
        <linearGradient id={`${id}-gold`} x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#E7D2A8" />
          <stop offset="40%" stopColor="#C5A572" />
          <stop offset="100%" stopColor="#8a6d3b" />
        </linearGradient>
        <linearGradient id={`${id}-highlight`} x1="0%" y1="0%" x2="50%" y2="50%">
          <stop offset="0%" stopColor="#F5E6C8" stopOpacity="0.8" />
          <stop offset="100%" stopColor="#C5A572" stopOpacity="0" />
        </linearGradient>
        <radialGradient id={`${id}-glow`} cx="50%" cy="40%" r="60%">
          <stop offset="0%" stopColor="#E7D2A8" stopOpacity="0.3" />
          <stop offset="100%" stopColor="#C5A572" stopOpacity="0" />
        </radialGradient>
        <filter id={`${id}-shadow`} x="-20%" y="-20%" width="140%" height="140%">
          <feDropShadow dx="0" dy="1" stdDeviation="0.8" floodColor="#000000" floodOpacity="0.5" />
          <feDropShadow dx="0" dy="0.5" stdDeviation="0.3" floodColor="#C5A572" floodOpacity="0.3" />
        </filter>
      </defs>
      {/* Background glow disc */}
      <circle cx="16" cy="16" r="14" fill={`url(#${id}-glow)`} />
      {children}
    </svg>
  );
}

/** 3D Aries — sculpted ram's horns with gold gradient + depth shadow. */
function ZodiacAries(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="aries" {...props}>
      <g filter="url(#aries-shadow)">
        {/* Left horn — thick sculpted curve */}
        <path d="M16 22 C 16 18 16 14 16 10 C 16 6 12 5 9 7 C 6 9 5 13 7 16 C 9 18 12 17 13 14"
          fill="url(#aries-gold)" stroke="#E7D2A8" strokeWidth="0.5" strokeLinecap="round" />
        {/* Right horn — mirror */}
        <path d="M16 22 C 16 18 16 14 16 10 C 16 6 20 5 23 7 C 26 9 27 13 25 16 C 23 18 20 17 19 14"
          fill="url(#aries-gold)" stroke="#E7D2A8" strokeWidth="0.5" strokeLinecap="round" />
        {/* Center stem */}
        <path d="M16 10 V24" stroke="url(#aries-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Highlight */}
        <path d="M15 11 C 15 14 15 18 15 22" stroke="url(#aries-highlight)" strokeWidth="1" strokeLinecap="round" fill="none" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Taurus — dimensional bull's head with gold ring. */
function ZodiacTaurus(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="taurus" {...props}>
      <g filter="url(#taurus-shadow)">
        {/* Head circle */}
        <circle cx="16" cy="18" r="5" fill="url(#taurus-gold)" stroke="#E7D2A8" strokeWidth="0.5" />
        {/* Left horn */}
        <path d="M11 15 C 7 10 4 12 5 16 C 6 19 9 19 11 17"
          fill="url(#taurus-gold)" stroke="#E7D2A8" strokeWidth="0.5" strokeLinecap="round" />
        {/* Right horn */}
        <path d="M21 15 C 25 10 28 12 27 16 C 26 19 23 19 21 17"
          fill="url(#taurus-gold)" stroke="#E7D2A8" strokeWidth="0.5" strokeLinecap="round" />
        {/* Highlight on head */}
        <ellipse cx="14" cy="16" rx="2" ry="2.5" fill="url(#taurus-highlight)" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Gemini — twin pillars with dimensional gold bars. */
function ZodiacGemini(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="gemini" {...props}>
      <g filter="url(#gemini-shadow)">
        {/* Left pillar */}
        <rect x="8" y="6" width="3.5" height="20" rx="1.5" fill="url(#gemini-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Right pillar */}
        <rect x="20.5" y="6" width="3.5" height="20" rx="1.5" fill="url(#gemini-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Top bar */}
        <rect x="6" y="8" width="20" height="3" rx="1.5" fill="url(#gemini-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Bottom bar */}
        <rect x="6" y="21" width="20" height="3" rx="1.5" fill="url(#gemini-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Highlights */}
        <rect x="9" y="7" width="1" height="18" fill="url(#gemini-highlight)" rx="0.5" />
        <rect x="21.5" y="7" width="1" height="18" fill="url(#gemini-highlight)" rx="0.5" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Cancer — dimensional crab claws with gold spheres. */
function ZodiacCancer(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="cancer" {...props}>
      <g filter="url(#cancer-shadow)">
        {/* Top claw arc */}
        <path d="M10 8 C 5 8 4 14 9 15 C 13 15 14 11 12 9"
          fill="url(#cancer-gold)" stroke="#E7D2A8" strokeWidth="0.5" strokeLinecap="round" />
        {/* Bottom claw arc */}
        <path d="M22 24 C 27 24 28 18 23 17 C 19 17 18 21 20 23"
          fill="url(#cancer-gold)" stroke="#E7D2A8" strokeWidth="0.5" strokeLinecap="round" />
        {/* Gold dot accents */}
        <circle cx="8" cy="10" r="1.5" fill="url(#cancer-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        <circle cx="24" cy="22" r="1.5" fill="url(#cancer-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        {/* Highlights */}
        <circle cx="7.5" cy="9.5" r="0.5" fill="#F5E6C8" opacity="0.8" />
        <circle cx="23.5" cy="21.5" r="0.5" fill="#F5E6C8" opacity="0.8" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Leo — dimensional lion's head with curling mane. */
function ZodiacLeo(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="leo" {...props}>
      <g filter="url(#leo-shadow)">
        {/* Head */}
        <circle cx="12" cy="13" r="4" fill="url(#leo-gold)" stroke="#E7D2A8" strokeWidth="0.5" />
        {/* Curling tail/mane */}
        <path d="M15 16 C 20 16 24 18 24 22 C 24 26 20 27 18 25 C 16 23 18 21 20 22"
          fill="none" stroke="url(#leo-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Ear tufts */}
        <path d="M10 9 C 9 7 10 6 11 7" fill="url(#leo-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        <path d="M14 9 C 15 7 14 6 13 7" fill="url(#leo-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        {/* Highlight */}
        <ellipse cx="11" cy="12" rx="1.5" ry="2" fill="url(#leo-highlight)" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Virgo — dimensional M-shape with gold wheat stalk. */
function ZodiacVirgo(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="virgo" {...props}>
      <g filter="url(#virgo-shadow)">
        {/* M-shape */}
        <path d="M6 24 V8 L12 16 L18 8 V24"
          fill="none" stroke="url(#virgo-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Curling tail */}
        <path d="M18 24 C 24 24 26 20 22 18 C 19 17 18 20 20 21"
          fill="none" stroke="url(#virgo-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Wheat grains */}
        <circle cx="6" cy="7" r="1.2" fill="url(#virgo-gold)" />
        <circle cx="12" cy="15" r="1" fill="url(#virgo-gold)" />
        <circle cx="18" cy="7" r="1.2" fill="url(#virgo-gold)" />
        {/* Highlight */}
        <path d="M7 9 L12 17" stroke="url(#virgo-highlight)" strokeWidth="1" fill="none" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Libra — dimensional scales with gold pans and chain. */
function ZodiacLibra(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="libra" {...props}>
      <g filter="url(#libra-shadow)">
        {/* Crossbar */}
        <rect x="4" y="10" width="24" height="2.5" rx="1.25" fill="url(#libra-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Center post */}
        <rect x="14.75" y="10" width="2.5" height="14" rx="1" fill="url(#libra-gold)" />
        {/* Base */}
        <ellipse cx="16" cy="25" rx="6" ry="2" fill="url(#libra-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Left pan — dimensional curve */}
        <path d="M6 12 L4 18 C 4 21 8 21 10 18 L8 12 Z"
          fill="url(#libra-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Right pan */}
        <path d="M26 12 L24 18 C 24 21 28 21 30 18 L28 12 Z" transform="translate(-4 0)"
          fill="url(#libra-gold)" stroke="#E7D2A8" strokeWidth="0.4" />
        {/* Chains */}
        <line x1="6" y1="12" x2="6" y2="12" stroke="#E7D2A8" strokeWidth="0.5" />
        <line x1="10" y1="12" x2="10" y2="12" stroke="#E7D2A8" strokeWidth="0.5" />
        {/* Highlights */}
        <rect x="5" y="10.5" width="22" height="0.8" fill="url(#libra-highlight)" rx="0.4" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Scorpio — dimensional M-shape with sculpted tail + arrow. */
function ZodiacScorpio(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="scorpio" {...props}>
      <g filter="url(#scorpio-shadow)">
        {/* M body */}
        <path d="M6 24 V8 L12 16 L18 8 V24"
          fill="none" stroke="url(#scorpio-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Curling tail with arrow */}
        <path d="M18 24 C 26 24 28 18 24 18 L27 15 M24 18 L27 21"
          fill="none" stroke="url(#scorpio-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Tail stinger */}
        <path d="M24 18 L27 15 M24 18 L27 21"
          fill="none" stroke="#E7D2A8" strokeWidth="1.5" strokeLinecap="round" />
        {/* Highlight */}
        <path d="M7 9 L12 17" stroke="url(#scorpio-highlight)" strokeWidth="1" fill="none" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Sagittarius — dimensional arrow with gold crossbar + fletching. */
function ZodiacSagittarius(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="sagittarius" {...props}>
      <g filter="url(#sagittarius-shadow)">
        {/* Arrow shaft */}
        <line x1="6" y1="26" x2="26" y2="6" stroke="url(#sagittarius-gold)" strokeWidth="3" strokeLinecap="round" />
        {/* Arrowhead */}
        <path d="M20 6 L26 6 L26 12" fill="none" stroke="url(#sagittarius-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Crossbar */}
        <line x1="11" y1="21" x2="17" y2="15" stroke="url(#sagittarius-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Fletching detail */}
        <path d="M7 25 L5 27 M8 24 L6 26" stroke="#E7D2A8" strokeWidth="1" strokeLinecap="round" />
        {/* Highlight on shaft */}
        <line x1="7" y1="25" x2="25" y2="7" stroke="url(#sagittarius-highlight)" strokeWidth="1" strokeLinecap="round" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Capricorn — dimensional V-shape with sculpted sea-goat tail. */
function ZodiacCapricorn(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="capricorn" {...props}>
      <g filter="url(#capricorn-shadow)">
        {/* V body */}
        <path d="M6 10 L12 24 L18 10"
          fill="none" stroke="url(#capricorn-gold)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
        {/* Looping tail */}
        <path d="M18 10 C 24 10 24 24 20 24 C 17 24 17 20 19 20 C 21 20 21 22 20 22"
          fill="none" stroke="url(#capricorn-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Horn accent */}
        <circle cx="6" cy="9" r="1.5" fill="url(#capricorn-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        <circle cx="18" cy="9" r="1.5" fill="url(#capricorn-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        {/* Highlight */}
        <path d="M7 11 L12 23" stroke="url(#capricorn-highlight)" strokeWidth="1" fill="none" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Aquarius — dimensional zigzag waves with gold gradient. */
function ZodiacAquarius(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="aquarius" {...props}>
      <g filter="url(#aquarius-shadow)">
        {/* Top wave */}
        <path d="M4 12 L8 9 L12 12 L16 9 L20 12 L24 9 L28 12"
          fill="none" stroke="url(#aquarius-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Bottom wave */}
        <path d="M4 20 L8 17 L12 20 L16 17 L20 20 L24 17 L28 20"
          fill="none" stroke="url(#aquarius-gold)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        {/* Water droplets */}
        <circle cx="8" cy="14" r="1" fill="url(#aquarius-gold)" opacity="0.6" />
        <circle cx="16" cy="14" r="1" fill="url(#aquarius-gold)" opacity="0.6" />
        <circle cx="24" cy="14" r="1" fill="url(#aquarius-gold)" opacity="0.6" />
        {/* Highlights */}
        <path d="M4 11 L8 8" stroke="url(#aquarius-highlight)" strokeWidth="1" fill="none" />
      </g>
    </Zodiac3DShell>
  );
}

/** 3D Pisces — dimensional opposing arcs with gold binding thread. */
function ZodiacPisces(props: BaydinIconProps) {
  return (
    <Zodiac3DShell id="pisces" {...props}>
      <g filter="url(#pisces-shadow)">
        {/* Left fish arc */}
        <path d="M6 6 C 12 8 12 24 6 26"
          fill="none" stroke="url(#pisces-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Right fish arc */}
        <path d="M26 6 C 20 8 20 24 26 26"
          fill="none" stroke="url(#pisces-gold)" strokeWidth="2.5" strokeLinecap="round" />
        {/* Binding thread */}
        <line x1="4" y1="16" x2="28" y2="16" stroke="url(#pisces-gold)" strokeWidth="2" strokeLinecap="round" />
        {/* Fish eye dots */}
        <circle cx="7" cy="9" r="1" fill="url(#pisces-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        <circle cx="25" cy="9" r="1" fill="url(#pisces-gold)" stroke="#E7D2A8" strokeWidth="0.3" />
        {/* Highlights */}
        <path d="M7 7 C 11 9 11 23 7 25" stroke="url(#pisces-highlight)" strokeWidth="0.8" fill="none" />
      </g>
    </Zodiac3DShell>
  );
}

/* ============================================================
 * CATEGORY 3 — FEATURE / PRACTICE ICONS (17)
 * Used across the app's feature cards, nav rail, and section headers.
 * ============================================================ */

/** BaydinTarot — tarot card with a gold star inlay. */
function BaydinTarot(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <rect x="6" y="3" width="12" height="18" rx="1" />
      <path d="M12 8 L13 11 L16 11 L13.5 13 L14.5 16 L12 14 L9.5 16 L10.5 13 L8 11 L11 11 Z" />
    </BaydinSvg>
  );
}

/** BaydinAstrologer — crystal ball on a trapezoid gold stand. */
function BaydinAstrologer(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="10" r="6" />
      <path d="M8 16 L6 21 H18 L16 16 Z" />
      <path d="M9 8 C 10 7 11 7 12 8" opacity="0.6" />
    </BaydinSvg>
  );
}

/** BaydinManifest — five-petal lotus with a central spire. */
function BaydinManifest(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 4 C 13.5 6 14 8 14 11 C 14 14 13 16 12 18 C 11 16 10 14 10 11 C 10 8 10.5 6 12 4 Z" />
      <path d="M12 18 C 9 17 7 15 7 12 C 9 12 11 13 12 15" />
      <path d="M12 18 C 15 17 17 15 17 12 C 15 12 13 13 12 15" />
      <path d="M12 18 C 8 18 5 16 3 13 C 5 12 8 12 11 14" />
      <path d="M12 18 C 16 18 19 16 21 13 C 19 12 16 12 13 14" />
    </BaydinSvg>
  );
}

/** BaydinRitual — candle with a gold flame and soft side glow. */
function BaydinRitual(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <rect x="9" y="14" width="6" height="7" rx="0.5" />
      <path d="M12 4 C 13 8 14 11 14 14 A 2 2 0 0 1 10 14 C 10 11 11 8 12 4 Z" />
      <path d="M5 12 C 5 8 8 5 12 5" opacity="0.4" />
      <path d="M19 12 C 19 8 16 5 12 5" opacity="0.4" />
    </BaydinSvg>
  );
}

/** BaydinFrequency — sound-wave bars of varying gold heights. */
function BaydinFrequency(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M3 12 H4" />
      <path d="M6 8 V16" />
      <path d="M9 5 V19" />
      <path d="M12 7 V17" />
      <path d="M15 9 V15" />
      <path d="M18 6 V18" />
      <path d="M20 10 V14" />
    </BaydinSvg>
  );
}

/** BaydinBreath — twin lung leaves around a central gold windpipe. */
function BaydinBreath(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 4 V20" />
      <path d="M12 8 C 8 9 6 12 6 16 C 6 19 8 20 9 19 C 10 18 10 14 12 12" />
      <path d="M12 8 C 16 9 18 12 18 16 C 18 19 16 20 15 19 C 14 18 14 14 12 12" />
    </BaydinSvg>
  );
}

/** BaydinPositivity — half-sun rising above a gold horizon. */
function BaydinPositivity(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M2 18 H22" />
      <path d="M5 18 A 7 7 0 0 1 19 18" />
      <path d="M12 5 V7" />
      <path d="M5 8 L7 10" />
      <path d="M19 8 L17 10" />
    </BaydinSvg>
  );
}

/** BaydinDream — crescent moon beside gold stars and a soft cloud. */
function BaydinDream(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M18 4 A 6 6 0 1 0 18 16 A 5 5 0 0 1 18 4 Z" />
      <circle cx="6" cy="5" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="9" r="0.7" fill="currentColor" stroke="none" />
      <path d="M3 19 C 5 17 8 17 10 19 C 12 18 15 18 17 20" opacity="0.6" />
    </BaydinSvg>
  );
}

/** BaydinNumerology — "7" glyph circumscribed in a gold ring. */
function BaydinNumerology(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M8 9 H16 L12 16" />
    </BaydinSvg>
  );
}

/** BaydinCompatibility — two interlocking gold rings. */
function BaydinCompatibility(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="9" cy="12" r="5" />
      <circle cx="15" cy="12" r="5" />
    </BaydinSvg>
  );
}

/** BaydinLifeReport — book with a gold seal at the lower-right. */
function BaydinLifeReport(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M6 3 H16 a2 2 0 0 1 2 2 V17 a4 4 0 0 1-4 4 H8 a2 2 0 0 1-2-2 V5 a2 2 0 0 1 2-2 Z" />
      <path d="M9 8 H15" />
      <path d="M9 11 H15" />
      <path d="M9 14 H13" />
      <circle cx="15" cy="18" r="1.5" />
    </BaydinSvg>
  );
}

/** BaydinBirthChart — circular chart wheel with 8 gold divisions. */
function BaydinBirthChart(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12 H21" />
      <path d="M12 3 V21" />
      <path d="M5.6 5.6 L18.4 18.4" />
      <path d="M18.4 5.6 L5.6 18.4" />
    </BaydinSvg>
  );
}

/** BaydinLunarCalendar — three moon phases in a gold row. */
function BaydinLunarCalendar(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="6" cy="12" r="2" />
      <circle cx="12" cy="12" r="2" />
      <path d="M12 10 A 2 2 0 0 1 12 14 Z" fill="currentColor" stroke="none" />
      <circle cx="18" cy="12" r="2" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** BaydinInsights — all-seeing eye inside a gold triangle. */
function BaydinInsights(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 3 L21 20 H3 Z" />
      <path d="M7 14 C 10 11 14 11 17 14" />
      <path d="M7 14 C 10 17 14 17 17 14" />
      <circle cx="12" cy="14" r="1.5" />
    </BaydinSvg>
  );
}

/** BaydinStore — shopfront with a striped gold awning. */
function BaydinStore(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M4 9 H20 V20 H4 Z" />
      <path d="M4 9 L5 4 H19 L20 9" />
      <path d="M8 9 V4" />
      <path d="M12 9 V4" />
      <path d="M16 9 V4" />
      <path d="M10 20 V14 H14 V20" />
    </BaydinSvg>
  );
}

/** BaydinAdmin — shield crest with a filled gold star inlay. */
function BaydinAdmin(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M12 3 L4 6 V12 C 4 17 8 20 12 21 C 16 20 20 17 20 12 V6 Z" />
      <path
        d="M12 8 L13 11 L16 11 L13.5 13 L14.5 16 L12 14 L9.5 16 L10.5 13 L8 11 L11 11 Z"
        fill="currentColor"
        stroke="none"
      />
    </BaydinSvg>
  );
}

/** BaydinGift — gift box with a vertical gold ribbon and bow loops. */
function BaydinGift(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <rect x="4" y="9" width="16" height="11" rx="0.5" />
      <rect x="3" y="6" width="18" height="4" rx="0.5" />
      <path d="M12 6 V20" />
      <path d="M12 6 C 9 3 6 5 8 7 C 10 8 12 7 12 6 Z" />
      <path d="M12 6 C 15 3 18 5 16 7 C 14 8 12 7 12 6 Z" />
    </BaydinSvg>
  );
}

/* ============================================================
 * CATEGORY 4 — PLANET ICONS (9)
 * Classical Vedic-astrology planetary symbols, gold line-art.
 * ============================================================ */

/** PlanetSun — sun disk with a gold core and corona rays. */
function PlanetSun(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="5" />
      <circle cx="12" cy="12" r="2" fill="currentColor" stroke="none" />
      <path d="M12 2 V5" />
      <path d="M12 19 V22" />
      <path d="M2 12 H5" />
      <path d="M19 12 H22" />
      <path d="M5 5 L7 7" />
      <path d="M17 17 L19 19" />
      <path d="M19 5 L17 7" />
      <path d="M7 17 L5 19" />
    </BaydinSvg>
  );
}

/** PlanetMoon — crescent moon with two small gold crater dots. */
function PlanetMoon(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M21 12.5 A 9 9 0 1 1 11 3 A 7 7 0 0 0 21 12.5 Z" />
      <circle cx="14" cy="9" r="0.7" fill="currentColor" stroke="none" opacity="0.7" />
      <circle cx="16" cy="13" r="0.5" fill="currentColor" stroke="none" opacity="0.6" />
    </BaydinSvg>
  );
}

/** PlanetMercury — winged circle with cross below and crescent above. */
function PlanetMercury(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="11" r="3" />
      <path d="M12 14 V19" />
      <path d="M9 19 H15" />
      <path d="M9 6 a3 3 0 0 0 6 0" />
      <path d="M4 4 L7 6" />
      <path d="M20 4 L17 6" />
    </BaydinSvg>
  );
}

/** PlanetVenus — female symbol: circle above a gold cross. */
function PlanetVenus(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="9" r="4" />
      <path d="M12 13 V20" />
      <path d="M8 17 H16" />
    </BaydinSvg>
  );
}

/** PlanetMars — male symbol: circle with a gold arrow upper-right. */
function PlanetMars(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="9" cy="14" r="4" />
      <path d="M12 11 L19 4" />
      <path d="M14 4 H19 V9" />
    </BaydinSvg>
  );
}

/** PlanetJupiter — stylized "4" glyph with a curved gold crown. */
function PlanetJupiter(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M15 5 C 8 5 6 12 13 13" />
      <path d="M5 13 H19" />
      <path d="M11 7 V19" />
    </BaydinSvg>
  );
}

/** PlanetSaturn — ringed planet with a tilted gold ellipse. */
function PlanetSaturn(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <circle cx="12" cy="12" r="4" />
      <ellipse
        cx="12"
        cy="12"
        rx="9"
        ry="3"
        transform="rotate(-25 12 12)"
      />
    </BaydinSvg>
  );
}

/** PlanetRahu — dragon head with horns and two gold eyes. */
function PlanetRahu(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M4 6 C 4 14 8 18 12 18 C 16 18 20 14 20 6" />
      <path d="M4 6 L3 4" />
      <path d="M20 6 L21 4" />
      <circle cx="9" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="15" cy="11" r="1" fill="currentColor" stroke="none" />
    </BaydinSvg>
  );
}

/** PlanetKetu — dragon tail with a curling gold knot. */
function PlanetKetu(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M5 19 C 5 11 9 7 12 7 C 15 7 16 10 14 11 C 12 12 11 10 12 9" />
      <path d="M5 19 L4 21" />
    </BaydinSvg>
  );
}

/* ============================================================
 * HELPER — ZodiacIcon
 * Picks the right zodiac icon by sign name (lowercase).
 * Falls back to BaydinStar if the sign is unrecognized.
 * ============================================================ */

type ZodiacComp = React.ComponentType<BaydinIconProps>;

function ZodiacIcon({
  sign,
  className,
  style,
}: {
  sign: string;
  className?: string;
  style?: React.CSSProperties;
}) {
  const map: Record<string, ZodiacComp> = {
    aries: ZodiacAries,
    taurus: ZodiacTaurus,
    gemini: ZodiacGemini,
    cancer: ZodiacCancer,
    leo: ZodiacLeo,
    virgo: ZodiacVirgo,
    libra: ZodiacLibra,
    scorpio: ZodiacScorpio,
    sagittarius: ZodiacSagittarius,
    capricorn: ZodiacCapricorn,
    aquarius: ZodiacAquarius,
    pisces: ZodiacPisces,
  };
  const key = (sign ?? "").toLowerCase();
  const Comp = map[key] ?? BaydinStar;
  return <Comp className={className} style={style} />;
}

/* ============================================================
 * BARREL EXPORT
 * Single explicit export list — every icon above is referenced
 * here so consumers can `import { ... } from "@/components/lumina/baydin-icons"`.
 * ============================================================ */

export {
  // Original Baydin icons (preserved)
  CloverIcon,
  CloverPNG,
  BaydinLogo,
  LotusIcon,
  StarGlyphIcon,
  // ── UI actions ────────────────────────────────────────────────
  BaydinSend,
  BaydinDownload,
  BaydinSearch,
  BaydinPlus,
  BaydinCheck,
  BaydinX,
  BaydinChevronRight,
  BaydinChevronLeft,
  BaydinChevronDown,
  BaydinCopy,
  BaydinShare,
  BaydinEdit,
  BaydinTrash,
  BaydinEye,
  BaydinStar,
  BaydinHeart,
  BaydinMoon,
  BaydinSun,
  BaydinFlame,
  BaydinBell,
  BaydinClock,
  BaydinCalendar,
  BaydinMenu,
  BaydinPin,
  BaydinBookmark,
  BaydinShuffle,
  BaydinPlay,
  BaydinPause,
  BaydinRefresh,
  BaydinTrending,
  BaydinUsers,
  BaydinWallet,
  BaydinGlobe,
  BaydinSave,
  BaydinHelp,
  BaydinAlert,
  BaydinLogout,
  BaydinArrowLeft,
  BaydinArrowRight,
  BaydinLoader,
  // ── Zodiac signs ──────────────────────────────────────────────
  ZodiacAries,
  ZodiacTaurus,
  ZodiacGemini,
  ZodiacCancer,
  ZodiacLeo,
  ZodiacVirgo,
  ZodiacLibra,
  ZodiacScorpio,
  ZodiacSagittarius,
  ZodiacCapricorn,
  ZodiacAquarius,
  ZodiacPisces,
  // ── Feature / practice icons ─────────────────────────────────
  BaydinTarot,
  BaydinAstrologer,
  BaydinManifest,
  BaydinRitual,
  BaydinFrequency,
  BaydinBreath,
  BaydinPositivity,
  BaydinDream,
  BaydinNumerology,
  BaydinCompatibility,
  BaydinLifeReport,
  BaydinBirthChart,
  BaydinLunarCalendar,
  BaydinInsights,
  BaydinStore,
  BaydinAdmin,
  BaydinGift,
  // ── Planets ───────────────────────────────────────────────────
  PlanetSun,
  PlanetMoon,
  PlanetMercury,
  PlanetVenus,
  PlanetMars,
  PlanetJupiter,
  PlanetSaturn,
  PlanetRahu,
  PlanetKetu,
  // ── Helpers ───────────────────────────────────────────────────
  ZodiacIcon,
};
