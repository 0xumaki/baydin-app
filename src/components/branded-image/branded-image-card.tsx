"use client";

import * as React from "react";
import {
  type CertificateKind,
  type LeaderboardEntry,
} from "@/lib/branded-image";

/* ============================================================
 * BAYDIN — BrandedImageCard (premium certificate mirror)
 * ------------------------------------------------------------
 * This component is the CLIENT-side React mirror of the
 * server-side SVG renderers in `src/lib/branded-image.ts`.
 * Both files must render visually identical premium designs so
 * that:
 *   1. The client-side PNG export (via html-to-image) matches
 *      the server-side SVG snapshot.
 *   2. Users see a premium certificate in both the modal
 *      preview AND the downloaded PNG.
 *
 * Design rules (html-to-image compatibility):
 *   - Inline `style` props for ALL colors / backgrounds /
 *     borders / opacities (Tailwind classes only for layout
 *     sizing + the `animate-ping` keyframe).
 *   - Inline `<svg>` for vector primitives (clover, shield,
 *     seal, corner ornament) so they rasterize crisply.
 *   - HTML `<div>` / `<span>` for text so fonts render with
 *     the browser's already-loaded font stack (html-to-image
 *     with `skipFonts: true`).
 *   - Serif text uses `Georgia, "Times New Roman", serif`.
 * ============================================================ */

// ============================================================
// Premium design tokens — mirror src/lib/branded-image.ts
// ============================================================
const GOLD = "#C5A87C";
const GOLD_LIGHT = "#E7D2A8";
const GOLD_DARK = "#9C7F54";
const PARCHMENT = "#F5E6C2";
const INK = "#E8EBE9";
const INK_DIM = "#9CA8A3";
const SURFACE = "#0A0908";
const SURFACE_2 = "#121815";

const SERIF = 'Georgia, "Times New Roman", serif';
const SANS = 'Inter, Arial, sans-serif';

// ============================================================
// Helpers — match branded-image.ts exactly
// ============================================================
function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function titleCase(s: string): string {
  return s
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

function formalIssueDate(d: Date): string {
  // "Issued on the Nth day of Month, Year" — premium formal date format
  const day = d.getDate();
  const month = d.toLocaleString("en-US", { month: "long" });
  const year = d.getFullYear();
  const ordinal = (n: number) => {
    const sfx = ["th", "st", "nd", "rd"];
    const v = n % 100;
    return n + (sfx[(v - 20) % 10] || sfx[v] || sfx[0]);
  };
  return `Issued on the ${ordinal(day)} day of ${month}, ${year}`;
}

function shortIssueDate(d: Date): string {
  // Mirrors the SVG's `date` field: "October 15, 2024"
  return d.toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

function generateCertId(): string {
  return `BAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(
    Math.random() * 9999
  )
    .toString(36)
    .toUpperCase()}`;
}

// ============================================================
// Text — SVG-like positioned text element
// ------------------------------------------------------------
// SVG <text x y> uses the BASELINE as the y anchor. CSS uses
// the TOP of the box as the y anchor. We approximate the
// baseline by offsetting `top` by `fontSize * 0.85` (typical
// Georgia / Inter baseline ratio at line-height: 1).
// ============================================================
type TextAlign = "start" | "middle" | "end";

type TextProps = {
  x: number;
  y: number;
  fontSize: number;
  fontFamily?: string;
  color?: string;
  fontWeight?: number | string;
  letterSpacing?: number | string;
  align?: TextAlign;
  opacity?: number;
  whiteSpace?: React.CSSProperties["whiteSpace"];
  children: React.ReactNode;
};

function Text({
  x,
  y,
  fontSize,
  fontFamily = SERIF,
  color = INK,
  fontWeight,
  letterSpacing,
  align = "start",
  opacity = 1,
  whiteSpace = "nowrap",
  children,
}: TextProps) {
  const baselineOffset = fontSize * 0.85;
  const transform =
    align === "middle"
      ? "translateX(-50%)"
      : align === "end"
      ? "translateX(-100%)"
      : undefined;
  return (
    <div
      style={{
        position: "absolute",
        left: x,
        top: y - baselineOffset,
        margin: 0,
        padding: 0,
        fontSize,
        fontFamily,
        color,
        fontWeight,
        letterSpacing:
          typeof letterSpacing === "number" ? `${letterSpacing}px` : letterSpacing,
        opacity,
        lineHeight: 1,
        whiteSpace,
        transform,
      }}
    >
      {children}
    </div>
  );
}

// ============================================================
// SVG vector primitives (no <text>, pure paths / circles)
// ============================================================

/**
 * CloverMark — 4-leaf clover + center dot.
 * Mirrors `cloverMark(cx, cy, scale)` in branded-image.ts.
 *
 * SVG: `const s = 8 * scale; <g transform="translate(cx,cy) scale(scale)">`
 * Local paths use `s` as base unit; rendered extent is `s * 1.5 * scale` =
 * `12 * scale^2` in each direction (total `24 * scale^2`).
 */
function CloverMark({
  cx,
  cy,
  scale = 1,
  color = GOLD,
  opacity = 0.9,
}: {
  cx: number;
  cy: number;
  scale?: number;
  color?: string;
  opacity?: number;
}) {
  const s = 8 * scale;
  const renderedHalf = s * 1.5 * scale; // = 12 * scale^2
  const renderedSize = renderedHalf * 2;
  return (
    <svg
      width={renderedSize}
      height={renderedSize}
      viewBox={`${-renderedHalf} ${-renderedHalf} ${renderedSize} ${renderedSize}`}
      style={{
        position: "absolute",
        left: cx - renderedHalf,
        top: cy - renderedHalf,
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <g transform={`scale(${scale})`} fill={color} opacity={opacity}>
        <path d={`M0,0 Q${-s},${-s} 0,${-s * 1.5} Q${s},${-s} 0,0 Z`} />
        <path d={`M0,0 Q${s},${-s} ${s * 1.5},0 Q${s},${s} 0,0 Z`} />
        <path d={`M0,0 Q${s},${s} 0,${s * 1.5} Q${-s},${s} 0,0 Z`} />
        <path d={`M0,0 Q${-s},${s} ${-s * 1.5},0 Q${-s},${-s} 0,0 Z`} />
        <circle cx={0} cy={0} r={s * 0.25} fill={GOLD_DARK} />
      </g>
    </svg>
  );
}

/**
 * CornerOrnament — small filigree "L" shape at a corner.
 * Mirrors `cornerOrnament(x, y, size)` in branded-image.ts.
 *
 * The same L-shape (vertex at top-left, opening down-right) is
 * placed at all 4 corners — matches the SVG exactly.
 */
function CornerOrnament({
  x,
  y,
  size = 24,
}: {
  x: number;
  y: number;
  size?: number;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${size} ${size}`}
      style={{
        position: "absolute",
        left: x,
        top: y,
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <g stroke={GOLD} strokeWidth={0.8} fill="none" opacity={0.7}>
        <path d={`M0,${size} L0,0 L${size},0`} strokeLinecap="round" />
        <path d={`M4,${size - 4} L4,4 L${size - 4},4`} opacity={0.5} />
        <circle cx={0} cy={0} r={2} fill={GOLD} opacity={0.6} />
        <circle cx={size} cy={0} r={1.5} fill={GOLD} opacity={0.4} />
        <circle cx={0} cy={size} r={1.5} fill={GOLD} opacity={0.4} />
      </g>
    </svg>
  );
}

/**
 * ShieldBadge — small shield icon for the certificate tier.
 * Mirrors `shieldBadge(cx, cy, scale)` in branded-image.ts.
 *
 * SVG: `const s = 18 * scale; <g transform="translate(cx-s,cy-s) scale(scale)">`
 * Local paths use `s` as base unit; rendered extent is `s * 2 * scale` =
 * `36 * scale^2`.
 */
function ShieldBadge({
  cx,
  cy,
  scale = 1,
}: {
  cx: number;
  cy: number;
  scale?: number;
}) {
  const s = 18 * scale;
  const elemSize = 2 * s * scale; // = 36 * scale^2
  return (
    <svg
      width={elemSize}
      height={elemSize}
      viewBox={`0 0 ${elemSize} ${elemSize}`}
      style={{
        position: "absolute",
        left: cx - s,
        top: cy - s,
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <g transform={`scale(${scale})`} fill="none" stroke={GOLD} strokeWidth={1.2}>
        <path
          d={`M${s} 2 L${s * 2 - 2} ${s * 0.5} L${s * 2 - 2} ${s * 1.2} Q${s * 2 - 2} ${s * 1.9} ${s} ${s * 2 - 2} Q2 ${s * 1.9} 2 ${s * 1.2} L2 ${s * 0.5} Z`}
          fill={SURFACE}
          opacity={0.95}
        />
        <path
          d={`M${s} 6 L${s * 0.7} ${s} L${s} ${s * 1.4} L${s * 1.3} ${s} Z`}
          fill={GOLD}
          opacity={0.8}
        />
      </g>
    </svg>
  );
}

/**
 * SealOfAuthenticity — circular gold wax-style seal.
 * Mirrors `sealOfAuthenticity(cx, cy, r)` in branded-image.ts.
 *
 * Uses inline SVG `<text>` (with `fontFamily={SERIF}`) so the
 * "BAYDIN" / "AUTHENTIC" labels render at exact pixel sizes
 * matching the SVG. html-to-image rasterizes SVG text via the
 * browser's font renderer — safe for system fonts.
 */
function SealOfAuthenticity({
  cx,
  cy,
  r = 36,
}: {
  cx: number;
  cy: number;
  r?: number;
}) {
  return (
    <svg
      width={2 * r}
      height={2 * r}
      viewBox={`0 0 ${2 * r} ${2 * r}`}
      style={{
        position: "absolute",
        left: cx - r,
        top: cy - r,
        overflow: "visible",
        pointerEvents: "none",
      }}
      aria-hidden
    >
      <circle cx={r} cy={r} r={r} fill={GOLD_DARK} opacity={0.85} />
      <circle
        cx={r}
        cy={r}
        r={r - 4}
        fill="none"
        stroke={GOLD_LIGHT}
        strokeWidth={1.2}
      />
      <circle
        cx={r}
        cy={r}
        r={r - 10}
        fill="none"
        stroke={PARCHMENT}
        strokeWidth={0.5}
        opacity={0.6}
      />
      <text
        x={r}
        y={r - 2}
        fontFamily={SERIF}
        fontSize={r * 0.32}
        fill={SURFACE}
        textAnchor="middle"
        fontWeight={700}
      >
        BAYDIN
      </text>
      <text
        x={r}
        y={r + r * 0.32}
        fontFamily={SERIF}
        fontSize={r * 0.18}
        fill={SURFACE}
        textAnchor="middle"
        letterSpacing={2}
      >
        AUTHENTIC
      </text>
    </svg>
  );
}

// ============================================================
// BackgroundLayers — shared bg gradient + sheen + watermark
// ============================================================

function BackgroundLayers({
  width,
  height,
  showWatermark = false,
}: {
  width: number;
  height: number;
  showWatermark?: boolean;
}) {
  return (
    <>
      {/* Base linear gradient (mirrors url(#bg)) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          background: `linear-gradient(135deg, ${SURFACE_2} 0%, ${SURFACE} 100%)`,
          pointerEvents: "none",
        }}
      />
      {/* Radial sheen (mirrors url(#sheen)) */}
      <div
        style={{
          position: "absolute",
          left: 0,
          top: 0,
          width,
          height,
          background: `radial-gradient(ellipse at 50% 36%, rgba(245,230,194,0.08) 0%, rgba(245,230,194,0) 60%)`,
          pointerEvents: "none",
        }}
      />
      {/* Large central CloverIcon watermark (opacity 0.04) */}
      {showWatermark && (
        <div
          style={{
            position: "absolute",
            left: 0,
            top: 0,
            width,
            height,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            opacity: 0.04,
            pointerEvents: "none",
          }}
          aria-hidden
        >
          <svg
            width={Math.min(width, height) * 0.7}
            height={Math.min(width, height) * 0.7}
            viewBox="-100 -100 200 200"
            aria-hidden
          >
            <g fill={GOLD}>
              <path d="M0,0 Q-80,-80 0,-120 Q80,-80 0,0 Z" />
              <path d="M0,0 Q80,-80 120,0 Q80,80 0,0 Z" />
              <path d="M0,0 Q80,80 0,120 Q-80,80 0,0 Z" />
              <path d="M0,0 Q-80,80 -120,0 Q-80,-80 0,0 Z" />
              <circle cx={0} cy={0} r={20} fill={GOLD_DARK} />
            </g>
          </svg>
        </div>
      )}
    </>
  );
}

// ============================================================
// OuterChrome — double border + 4 corner ornaments
// ------------------------------------------------------------
// Premium variant: outer 2.5px gold + inner 0.6px gold at 50%
// opacity, ~8px gap. Standard variant: same double border
// (matches SVG which uses double borders everywhere).
// ============================================================

function OuterChrome({
  width,
  height,
  outerInset = 24,
  innerInset = 36,
  outerStroke = 2.5,
  innerStroke = 0.6,
  innerOpacity = 0.5,
  cornerSize = 28,
  cornerInset = 48,
  roundedOuter = 6,
  roundedInner = 4,
}: {
  width: number;
  height: number;
  outerInset?: number;
  innerInset?: number;
  outerStroke?: number;
  innerStroke?: number;
  innerOpacity?: number;
  cornerSize?: number;
  cornerInset?: number;
  roundedOuter?: number;
  roundedInner?: number;
}) {
  return (
    <>
      {/* Outer border */}
      <div
        style={{
          position: "absolute",
          left: outerInset,
          top: outerInset,
          width: width - outerInset * 2,
          height: height - outerInset * 2,
          border: `${outerStroke}px solid ${GOLD}`,
          borderRadius: roundedOuter,
          pointerEvents: "none",
        }}
      />
      {/* Inner border (8px gap from outer) */}
      <div
        style={{
          position: "absolute",
          left: innerInset,
          top: innerInset,
          width: width - innerInset * 2,
          height: height - innerInset * 2,
          border: `${innerStroke}px solid ${GOLD}`,
          opacity: innerOpacity,
          borderRadius: roundedInner,
          pointerEvents: "none",
        }}
      />
      {/* 4 corner ornaments */}
      <CornerOrnament x={cornerInset} y={cornerInset} size={cornerSize} />
      <CornerOrnament
        x={width - cornerInset - cornerSize}
        y={cornerInset}
        size={cornerSize}
      />
      <CornerOrnament
        x={cornerInset}
        y={height - cornerInset - cornerSize}
        size={cornerSize}
      />
      <CornerOrnament
        x={width - cornerInset - cornerSize}
        y={height - cornerInset - cornerSize}
        size={cornerSize}
      />
    </>
  );
}

// ============================================================
// Variant content renderers
// ============================================================

type CertificateProps = {
  userName: string | null;
  userEmail: string;
  tier: string;
  language?: string;
};

type LeaderboardProps = {
  kind: "user" | "reseller";
  metric: string;
  entries: LeaderboardEntry[];
  topN: number;
  generatedAt?: Date;
};

type CampaignFlyerProps = {
  name: string;
  tierId: string;
  kind: "user" | "reseller";
  mmkOverride?: number | null;
  bonusPctOverride?: number | null;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  description?: string | null;
  language?: string;
};

type ReferralShareProps = {
  userName: string | null;
  userEmail: string;
  referralCode: string;
  signupBonusLuck: number;
  referralUrl?: string;
};

function CertificateContent({
  certificate,
  kind,
}: {
  certificate: CertificateProps;
  kind: CertificateKind;
}) {
  const { userName, userEmail, tier } = certificate;
  const displayName = (userName && userName.trim()) || userEmail.split("@")[0];
  const tierLabel = titleCase(tier.replace(/^reseller_/, ""));
  const kindLabel = titleCase(kind);

  const formalDate = React.useMemo(
    () => formalIssueDate(new Date()),
    []
  );
  const shortDate = React.useMemo(() => shortIssueDate(new Date()), []);
  const certId = React.useMemo(() => generateCertId(), []);

  const headingText =
    kind === "promotion"
      ? "Reseller Promotion"
      : kind === "tier_upgrade"
      ? "Tier Advancement"
      : "Reseller Welcome";

  return (
    <>
      {/* Background + watermark */}
      <BackgroundLayers width={900} height={560} showWatermark />

      {/* Double border + 4 corner ornaments */}
      <OuterChrome width={900} height={560} />

      {/* Baydin wordmark + clover at (72,90) */}
      <CloverMark cx={84} cy={102} scale={1.4} />
      <Text
        x={108}
        y={110}
        fontSize={22}
        fontFamily={SERIF}
        color={PARCHMENT}
        letterSpacing={1}
      >
        Baydin
      </Text>
      <Text
        x={108}
        y={126}
        fontSize={9}
        fontFamily={SANS}
        color={GOLD}
        letterSpacing={3}
      >
        CERTIFIED PARTNER
      </Text>

      {/* Title block */}
      <Text
        x={450}
        y={160}
        fontSize={36}
        fontFamily={SERIF}
        color={PARCHMENT}
        fontWeight={700}
        align="middle"
      >
        {headingText}
      </Text>
      <Text
        x={450}
        y={190}
        fontSize={13}
        fontFamily={SANS}
        color={GOLD}
        align="middle"
        letterSpacing={6}
      >
        CERTIFICATE OF ACHIEVEMENT
      </Text>

      {/* Gold rule + center clover */}
      <div
        style={{
          position: "absolute",
          left: 260,
          top: 210,
          width: 380,
          height: 1.2,
          background: `linear-gradient(to right, ${GOLD_LIGHT}, ${GOLD}, ${GOLD_DARK})`,
          pointerEvents: "none",
        }}
      />
      <CloverMark cx={450} cy={210} scale={0.7} />

      {/* Recipient name */}
      <Text
        x={450}
        y={270}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={4}
      >
        AWARDED TO
      </Text>
      <Text
        x={450}
        y={312}
        fontSize={32}
        fontFamily={SERIF}
        color={INK}
        fontWeight={600}
        align="middle"
      >
        {truncate(displayName, 36)}
      </Text>
      <Text
        x={450}
        y={338}
        fontSize={12}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        opacity={0.7}
      >
        {userEmail}
      </Text>

      {/* Tier block */}
      <Text
        x={450}
        y={390}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={4}
      >
        {kindLabel.toUpperCase()} · TIER
      </Text>
      <Text
        x={450}
        y={424}
        fontSize={28}
        fontFamily={SERIF}
        color={GOLD}
        fontWeight={700}
        align="middle"
        letterSpacing={2}
      >
        {tierLabel}
      </Text>

      {/* Premium metadata area (between tier + signature) */}
      <div
        style={{
          position: "absolute",
          left: 200,
          top: 444,
          width: 500,
          height: 24,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 12,
          pointerEvents: "none",
        }}
      >
        <span
          style={{
            fontSize: 9,
            fontFamily: SANS,
            color: INK_DIM,
            letterSpacing: 3,
            textTransform: "uppercase",
            opacity: 0.7,
          }}
        >
          {formalDate}
        </span>
      </div>

      {/* Signature line (bottom-left) */}
      <div
        style={{
          position: "absolute",
          left: 120,
          top: 490,
          width: 200,
          height: 0.8,
          background: GOLD,
          opacity: 0.7,
          pointerEvents: "none",
        }}
      />
      <Text
        x={220}
        y={508}
        fontSize={13}
        fontFamily={SERIF}
        color={INK}
        align="middle"
      >
        Baydin Astrology Council
      </Text>
      <Text
        x={220}
        y={524}
        fontSize={10}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
      >
        Authorized Signatory
      </Text>

      {/* Seal of authenticity (bottom-right) */}
      <SealOfAuthenticity cx={720} cy={488} r={40} />

      {/* Shield badge (between seal and signature) */}
      <ShieldBadge cx={560} cy={484} scale={1.4} />

      {/* Footer cert id */}
      <Text
        x={450}
        y={544}
        fontSize={10}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        opacity={0.6}
      >
        Issued {shortDate} · {certId}
      </Text>
    </>
  );
}

function LeaderboardContent({
  leaderboard,
  height,
}: {
  leaderboard: LeaderboardProps;
  height: number;
}) {
  const { kind, metric, entries, topN, generatedAt } = leaderboard;
  const title = kind === "reseller" ? "Top Resellers" : "Top Seekers";
  const subtitle = `By ${metric.replace(/_/g, " ")} · Top ${topN}`;
  const dateStr = (generatedAt ?? new Date()).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <>
      {/* Background (no watermark for leaderboard) */}
      <BackgroundLayers width={900} height={height} />

      {/* Double border + 4 corner ornaments */}
      <OuterChrome
        width={900}
        height={height}
        outerStroke={2}
        innerStroke={0.5}
        innerOpacity={0.4}
        cornerSize={24}
        cornerInset={48}
      />

      {/* Brand wordmark + clover */}
      <CloverMark cx={72} cy={84} scale={1.2} />
      <Text
        x={92}
        y={90}
        fontSize={20}
        fontFamily={SERIF}
        color={PARCHMENT}
        letterSpacing={1}
      >
        Baydin
      </Text>

      {/* Title */}
      <Text
        x={450}
        y={100}
        fontSize={32}
        fontFamily={SERIF}
        color={PARCHMENT}
        fontWeight={700}
        align="middle"
      >
        {title}
      </Text>
      <Text
        x={450}
        y={128}
        fontSize={13}
        fontFamily={SANS}
        color={GOLD}
        align="middle"
        letterSpacing={4}
      >
        {subtitle.toUpperCase()}
      </Text>
      <CloverMark cx={450} cy={150} scale={0.8} />

      {/* Rows */}
      {entries.slice(0, topN).map((e, i) => {
        const y = 180 + i * 32;
        const medal =
          e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `${e.rank}.`;
        const name = truncate(e.name || e.email.split("@")[0], 28);
        const value = e.metric.toLocaleString();
        const isTop3 = e.rank <= 3;
        return (
          <React.Fragment key={`row-${i}-${e.email}`}>
            {isTop3 && (
              <div
                style={{
                  position: "absolute",
                  left: 60,
                  top: y - 18,
                  width: 780,
                  height: 28,
                  background: GOLD,
                  opacity: 0.07,
                  borderRadius: 3,
                  pointerEvents: "none",
                }}
              />
            )}
            <Text
              x={76}
              y={y}
              fontSize={14}
              fontFamily={SANS}
              color={isTop3 ? GOLD : INK_DIM}
              fontWeight={isTop3 ? 700 : 400}
            >
              {medal}
            </Text>
            <Text
              x={120}
              y={y}
              fontSize={13}
              fontFamily={SANS}
              color={INK}
            >
              {name}
            </Text>
            <Text
              x={540}
              y={y}
              fontSize={12}
              fontFamily={SANS}
              color={INK_DIM}
            >
              {truncate(e.email, 30)}
            </Text>
            <Text
              x={824}
              y={y}
              fontSize={14}
              fontFamily={SERIF}
              color={GOLD}
              fontWeight={isTop3 ? 700 : 500}
              align="end"
            >
              {value}
            </Text>
          </React.Fragment>
        );
      })}

      {/* Footer rule + lines */}
      <div
        style={{
          position: "absolute",
          left: 60,
          top: height - 60,
          width: 780,
          height: 0.4,
          background: GOLD,
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <Text
        x={60}
        y={height - 40}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
      >
        Generated {dateStr}
      </Text>
      <Text
        x={840}
        y={height - 40}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="end"
      >
        baydin.app/leaderboard
      </Text>
    </>
  );
}

function CampaignFlyerContent({ campaign }: { campaign: CampaignFlyerProps }) {
  const {
    name,
    tierId,
    kind,
    mmkOverride,
    bonusPctOverride,
    validFrom,
    validUntil,
    description,
  } = campaign;

  const tierLabel = titleCase(tierId.replace(/^reseller_/, ""));
  const headline =
    bonusPctOverride != null
      ? `+${bonusPctOverride}% BONUS`
      : mmkOverride != null
      ? `${mmkOverride.toLocaleString()} MMK TIER`
      : "LIMITED TIME";

  const fromDate = validFrom ? new Date(validFrom) : new Date();
  const untilDate = validUntil ? new Date(validUntil) : new Date();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const window =
    validFrom || validUntil
      ? `${fmtDate(fromDate)} – ${fmtDate(untilDate)}`
      : "Active now";

  return (
    <>
      {/* Background + watermark */}
      <BackgroundLayers width={600} height={800} showWatermark />

      {/* Double border + corners */}
      <OuterChrome
        width={600}
        height={800}
        outerInset={20}
        innerInset={30}
        outerStroke={2}
        innerStroke={0.5}
        innerOpacity={0.4}
        cornerSize={22}
        cornerInset={40}
      />

      {/* Top brand */}
      <CloverMark cx={72} cy={92} scale={1.2} />
      <Text
        x={92}
        y={98}
        fontSize={18}
        fontFamily={SERIF}
        color={PARCHMENT}
      >
        Baydin
      </Text>
      <Text
        x={540}
        y={92}
        fontSize={11}
        fontFamily={SANS}
        color={GOLD}
        align="end"
        letterSpacing={3}
      >
        SEASONAL CAMPAIGN
      </Text>

      {/* Headline */}
      <Text
        x={300}
        y={200}
        fontSize={13}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={4}
      >
        LIMITED OFFER
      </Text>
      <Text
        x={300}
        y={260}
        fontSize={46}
        fontFamily={SERIF}
        color={PARCHMENT}
        fontWeight={800}
        align="middle"
      >
        {headline}
      </Text>
      <CloverMark cx={300} cy={310} scale={1.5} />

      {/* Tier block */}
      <Text
        x={300}
        y={380}
        fontSize={12}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={3}
      >
        {kind.toUpperCase()} TIER
      </Text>
      <Text
        x={300}
        y={420}
        fontSize={32}
        fontFamily={SERIF}
        color={GOLD}
        fontWeight={700}
        align="middle"
      >
        {tierLabel}
      </Text>

      {/* Campaign name */}
      <Text
        x={300}
        y={478}
        fontSize={22}
        fontFamily={SERIF}
        color={INK}
        align="middle"
      >
        {truncate(name, 32)}
      </Text>

      {/* Description */}
      {description && (
        <div
          style={{
            position: "absolute",
            left: 60,
            top: 500,
            width: 480,
            fontFamily: SANS,
            fontSize: 13,
            color: INK_DIM,
            textAlign: "center",
            lineHeight: 1.5,
            padding: "0 20px",
          }}
        >
          {truncate(description, 240)}
        </div>
      )}

      {/* Validity window */}
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 660,
          width: 240,
          height: 0.6,
          background: GOLD,
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <Text
        x={300}
        y={690}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={3}
      >
        VALID
      </Text>
      <Text
        x={300}
        y={712}
        fontSize={18}
        fontFamily={SERIF}
        color={INK}
        align="middle"
      >
        {window}
      </Text>

      {/* Footer */}
      <Text
        x={300}
        y={752}
        fontSize={10}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        opacity={0.6}
      >
        baydin.app · Powered by Baydin Astrology
      </Text>
    </>
  );
}

function ReferralShareContent({ referral }: { referral: ReferralShareProps }) {
  const { userName, userEmail, referralCode, signupBonusLuck, referralUrl } =
    referral;
  const displayName = (userName && userName.trim()) || userEmail.split("@")[0];
  const url = referralUrl || `https://baydin.app/r/${referralCode}`;

  return (
    <>
      {/* Background + watermark */}
      <BackgroundLayers width={600} height={700} showWatermark />

      {/* Double border + corners */}
      <OuterChrome
        width={600}
        height={700}
        outerInset={20}
        innerInset={30}
        outerStroke={2}
        innerStroke={0.5}
        innerOpacity={0.4}
        cornerSize={22}
        cornerInset={40}
      />

      {/* Brand */}
      <CloverMark cx={72} cy={92} scale={1.2} />
      <Text
        x={92}
        y={98}
        fontSize={18}
        fontFamily={SERIF}
        color={PARCHMENT}
      >
        Baydin
      </Text>
      <Text
        x={540}
        y={92}
        fontSize={11}
        fontFamily={SANS}
        color={GOLD}
        align="end"
        letterSpacing={3}
      >
        INVITATION
      </Text>

      {/* Headline */}
      <Text
        x={300}
        y={200}
        fontSize={13}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={4}
      >
        YOUR FRIEND INVITES YOU
      </Text>
      <Text
        x={300}
        y={252}
        fontSize={34}
        fontFamily={SERIF}
        color={PARCHMENT}
        fontWeight={700}
        align="middle"
      >
        Begin Your Journey
      </Text>
      <CloverMark cx={300} cy={290} scale={1.4} />

      <Text
        x={300}
        y={340}
        fontSize={22}
        fontFamily={SERIF}
        color={INK}
        align="middle"
      >
        {truncate(displayName, 28)} invites you
      </Text>
      <Text
        x={300}
        y={368}
        fontSize={12}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
      >
        Sign up with this code to receive
      </Text>

      {/* Bonus block */}
      <div
        style={{
          position: "absolute",
          left: 180,
          top: 390,
          width: 240,
          height: 80,
          background: GOLD,
          opacity: 0.08,
          borderRadius: 6,
          pointerEvents: "none",
        }}
      />
      <Text
        x={300}
        y={424}
        fontSize={32}
        fontFamily={SERIF}
        color={GOLD}
        fontWeight={700}
        align="middle"
      >
        {signupBonusLuck} Luck
      </Text>
      <Text
        x={300}
        y={450}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={3}
      >
        SIGNUP BONUS
      </Text>

      {/* Referral code */}
      <Text
        x={300}
        y={510}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
        letterSpacing={3}
      >
        YOUR CODE
      </Text>
      <Text
        x={300}
        y={546}
        fontSize={28}
        fontFamily={SERIF}
        color={PARCHMENT}
        fontWeight={700}
        align="middle"
        letterSpacing={4}
      >
        {referralCode}
      </Text>

      <div
        style={{
          position: "absolute",
          left: 180,
          top: 580,
          width: 240,
          height: 0.5,
          background: GOLD,
          opacity: 0.4,
          pointerEvents: "none",
        }}
      />
      <Text
        x={300}
        y={610}
        fontSize={11}
        fontFamily={SANS}
        color={INK_DIM}
        align="middle"
      >
        Sign up at
      </Text>
      <Text
        x={300}
        y={630}
        fontSize={14}
        fontFamily={SERIF}
        color={INK}
        align="middle"
      >
        {truncate(url, 38)}
      </Text>

      {/* Small seal at top-right corner (decorative) */}
      <SealOfAuthenticity cx={540} cy={80} r={22} />
    </>
  );
}

// ============================================================
// Main BrandedImageCard (forwardRef)
// ============================================================

export type BrandedImageVariant =
  | "leaderboard-user"
  | "leaderboard-reseller"
  | "certificate-promotion"
  | "certificate-tier-upgrade"
  | "certificate-welcome"
  | "campaign-flyer"
  | "referral-share";

export type BrandedImageCardProps = {
  variant: BrandedImageVariant;
  className?: string;
  certificate?: CertificateProps;
  leaderboard?: LeaderboardProps;
  campaign?: CampaignFlyerProps;
  referral?: ReferralShareProps;
  /** Optional caption override for the pulsing green "live preview" dot. */
  caption?: string;
  /**
   * Hide the "live preview" pulse dot overlay. Useful when the
   * card is mounted offscreen purely for PNG export (cleaner
   * rasterization without the captured-frame animation state).
   */
  hideLiveBadge?: boolean;
};

const LIVE_CAPTIONS: Record<BrandedImageVariant, string> = {
  "leaderboard-user": "Live user leaderboard",
  "leaderboard-reseller": "Live reseller leaderboard",
  "certificate-promotion": "Promotion certificate",
  "certificate-tier-upgrade": "Tier upgrade certificate",
  "certificate-welcome": "Welcome certificate",
  "campaign-flyer": "Live campaign flyer",
  "referral-share": "Shareable referral card",
};

const CERT_KIND_MAP: Partial<Record<BrandedImageVariant, CertificateKind>> = {
  "certificate-promotion": "promotion",
  "certificate-tier-upgrade": "tier_upgrade",
  "certificate-welcome": "welcome",
};

export const BrandedImageCard = React.forwardRef<
  HTMLDivElement,
  BrandedImageCardProps
>(function BrandedImageCard(props, ref) {
  const {
    variant,
    className,
    certificate,
    leaderboard,
    campaign,
    referral,
    caption,
    hideLiveBadge,
  } = props;

  // Compute natural dimensions per variant (mirror SVG viewBox)
  let naturalWidth = 900;
  let naturalHeight = 560;
  let content: React.ReactNode = null;

  if (
    variant === "certificate-promotion" ||
    variant === "certificate-tier-upgrade" ||
    variant === "certificate-welcome"
  ) {
    naturalWidth = 900;
    naturalHeight = 560;
    if (certificate) {
      const kind = CERT_KIND_MAP[variant] ?? "welcome";
      content = <CertificateContent certificate={certificate} kind={kind} />;
    }
  } else if (
    variant === "leaderboard-user" ||
    variant === "leaderboard-reseller"
  ) {
    naturalWidth = 900;
    // SVG: height = 200 + entries.length * 32 + 60
    naturalHeight = leaderboard
      ? 200 + leaderboard.entries.length * 32 + 60
      : 260;
    if (leaderboard) {
      content = (
        <LeaderboardContent leaderboard={leaderboard} height={naturalHeight} />
      );
    }
  } else if (variant === "campaign-flyer") {
    naturalWidth = 600;
    naturalHeight = 800;
    if (campaign) {
      content = <CampaignFlyerContent campaign={campaign} />;
    }
  } else if (variant === "referral-share") {
    naturalWidth = 600;
    naturalHeight = 700;
    if (referral) {
      content = <ReferralShareContent referral={referral} />;
    }
  }

  const liveLabel = caption ?? LIVE_CAPTIONS[variant];

  return (
    <div
      ref={ref}
      className={className}
      style={{
        position: "relative",
        width: naturalWidth,
        height: naturalHeight,
        overflow: "hidden",
        borderRadius: 6,
        border: `1px solid #2A2722`,
        background: SURFACE,
        margin: "0 auto",
        flexShrink: 0,
      }}
    >
      {/* Live preview pulse (top-left, NOT scaled, fixed pixel size) */}
      {!hideLiveBadge && (
        <div
          style={{
            position: "absolute",
            top: 12,
            left: 12,
            zIndex: 10,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            borderRadius: 9999,
            background: "rgba(10, 9, 8, 0.8)",
            backdropFilter: "blur(4px)",
            WebkitBackdropFilter: "blur(4px)",
          }}
        >
          <span
            style={{
              position: "relative",
              display: "inline-flex",
              width: 8,
              height: 8,
            }}
          >
            <span
              className="animate-ping"
              style={{
                position: "absolute",
                display: "inline-flex",
                width: "100%",
                height: "100%",
                borderRadius: "50%",
                background: "#7A8B6F",
                opacity: 0.75,
              }}
            />
            <span
              style={{
                position: "relative",
                display: "inline-flex",
                width: 8,
                height: 8,
                borderRadius: "50%",
                background: "#7A8B6F",
              }}
            />
          </span>
          <span
            style={{
              fontSize: 10,
              fontWeight: 500,
              textTransform: "uppercase",
              letterSpacing: "0.05em",
              color: "#9CA8A3",
              fontFamily: SANS,
            }}
          >
            {liveLabel}
          </span>
        </div>
      )}

      {/* Premium content (absolutely positioned at natural pixel coords) */}
      {content ?? (
        <div
          style={{
            position: "absolute",
            inset: 0,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "#6B6358",
            fontSize: 12,
            fontFamily: SANS,
          }}
        >
          No data to preview
        </div>
      )}
    </div>
  );
});

export { brandedFilename } from "@/lib/use-branded-image-download";
