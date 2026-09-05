import * as React from "react";
import { cn } from "@/lib/utils";

/* ============================================================
 * FEATURE ICONS — 22 line-art icons rendered as PNGs in /public.
 * Used across today cards, life-report sections, ritual tiles, etc.
 *
 * Each icon is a 1024×1024 PNG with a colored stroke on transparent bg.
 * Source SVGs are lucide-style (1.2 stroke, rounded caps/joins).
 * ============================================================ */

export const FEATURE_ICONS = [
  "career",
  "heart",
  "health",
  "brain",
  "spiritual",
  "children",
  "flame",
  "waves",
  "target",
  "moon",
  "sparkles",
  "message",
  "calendar",
  "clock",
  "user",
  "shield",
  "book",
  "chart",
  "telescope",
  "link",
  "star",
  "users",
] as const;

export type FeatureIconName = (typeof FEATURE_ICONS)[number];

export type FeatureIconSize = "sm" | "md" | "lg" | "xl";

const SIZE_PX: Record<FeatureIconSize, string> = {
  sm: "h-4 w-4",
  md: "h-6 w-6",
  lg: "h-9 w-9",
  xl: "h-14 w-14",
};

export interface FeatureIconProps
  extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "alt"> {
  /** Icon name; must be one of FEATURE_ICONS. */
  name: FeatureIconName;
  /** Size bucket. Default: md. */
  size?: FeatureIconSize;
  /** Accessible alt text. Defaults to the icon name title-cased. */
  alt?: string;
}

/** Default alt text helper. */
function defaultAlt(name: FeatureIconName): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}

/**
 * FeatureIcon — a single 1024×1024 line-art PNG from /public/icons/feature/.
 * Use for inline iconography in cards, tiles, list items.
 */
export function FeatureIcon({
  name,
  className,
  style,
  alt,
  size = "md",
  ...props
}: FeatureIconProps) {
  return (
    <img
      src={`/icons/feature/feature-${name}.png`}
      alt={alt ?? defaultAlt(name)}
      className={cn("shrink-0", SIZE_PX[size], className)}
      style={style}
      {...props}
    />
  );
}

export interface FeatureWatermarkProps {
  /** Icon name; must be one of FEATURE_ICONS. */
  name: FeatureIconName;
  /** Extra classes for the wrapper. */
  className?: string;
  /** Inline styles for the wrapper. */
  style?: React.CSSProperties;
  /** Opacity for the watermark image. Default: 0.12. */
  opacity?: number;
}

/**
 * FeatureWatermark — large background version of a feature icon,
 * absolutely positioned in a pointer-events-none, overflow-hidden wrapper.
 * Drop inside a `relative` parent to render a faded watermark behind content.
 */
export function FeatureWatermark({
  name,
  className,
  style,
  opacity = 0.12,
}: FeatureWatermarkProps) {
  return (
    <div
      aria-hidden
      className={cn(
        "pointer-events-none absolute overflow-hidden",
        className
      )}
      style={style}
    >
      <img
        src={`/icons/feature/feature-${name}.png`}
        alt=""
        className="h-full w-full max-w-none object-contain"
        style={{ opacity }}
      />
    </div>
  );
}
