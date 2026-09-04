"use client";

import { useRef, useState, useMemo, useEffect, useCallback } from "react";
import { toPng } from "html-to-image";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Share2, Sparkles, Moon, MessageCircle } from "lucide-react";
import { toast } from "sonner";

/* ------------------------------------------------------------------ */
/* Types                                                               */
/* ------------------------------------------------------------------ */

export type ShareCardReading =
  | {
      type: "tarot";
      question: string;
      cards: { name: string; reversed?: boolean; position?: string }[];
      interpretation: string;
      spreadName: string;
    }
  | {
      type: "horoscope";
      sign: string;
      signSymbol: string;
      period: string;
      date: string;
      summary: string;
      luckyColor?: string;
      luckyNumber?: number;
      luckyTime?: string;
      highlights?: string[];
    }
  | { type: "chat"; question: string; answer: string; mode?: string };

export type ShareReading = ShareCardReading;

type Template = "editorial" | "celestial" | "minimal";
type Aspect = "story" | "square" | "portrait";

const ASPECT_DIMS: Record<Aspect, { w: number; h: number; label: string }> = {
  story: { w: 1080, h: 1920, label: "Story 9:16" },
  square: { w: 1080, h: 1080, label: "Square 1:1" },
  portrait: { w: 1080, h: 1350, label: "Portrait 4:5" },
};

/* ------------------------------------------------------------------ */
/* Palette per template                                                */
/* ------------------------------------------------------------------ */

const PALETTE: Record<
  Template,
  {
    bg: string;
    surface: string;
    border: string;
    ink: string;
    inkSoft: string;
    accent: string;
    accentSoft: string;
    goldRule: string;
    eyebrow: string;
  }
> = {
  editorial: {
    bg: "#0A0908",
    surface: "rgba(255,255,255,0.04)",
    border: "#2A2722",
    ink: "#E8E2D5",
    inkSoft: "#9C9489",
    accent: "#C5A572",
    accentSoft: "rgba(197,165,114,0.14)",
    goldRule: "#C5A572",
    eyebrow: "#6B6358",
  },
  celestial: {
    bg: "#070612",
    surface: "rgba(255,255,255,0.05)",
    border: "rgba(197,165,114,0.18)",
    ink: "#F1ECDD",
    inkSoft: "#9B9CB8",
    accent: "#D6BC8C",
    accentSoft: "rgba(214,188,140,0.12)",
    goldRule: "#D6BC8C",
    eyebrow: "#7A7B96",
  },
  minimal: {
    bg: "#F5EFE0",
    surface: "rgba(0,0,0,0.03)",
    border: "#D9CFB8",
    ink: "#2A2722",
    inkSoft: "#6B6358",
    accent: "#8A6A2B",
    accentSoft: "rgba(138,106,43,0.10)",
    goldRule: "#8A6A2B",
    eyebrow: "#9C9489",
  },
};

/* ------------------------------------------------------------------ */
/* Helpers                                                            */
/* ------------------------------------------------------------------ */

function truncate(s: string, n: number) {
  if (!s) return "";
  return s.length > n ? s.slice(0, n - 1).trimEnd() + "…" : s;
}

function wrapLines(text: string, perLine: number): string[] {
  const words = (text || "").split(/\s+/).filter(Boolean);
  const out: string[] = [];
  let cur = "";
  for (const w of words) {
    if ((cur + " " + w).trim().length <= perLine) {
      cur = (cur + " " + w).trim();
    } else {
      if (cur) out.push(cur);
      cur = w;
    }
  }
  if (cur) out.push(cur);
  return out;
}

/* ------------------------------------------------------------------ */
/* Celestial background SVG                                           */
/* ------------------------------------------------------------------ */

function CelestialBackdrop({ w, h }: { w: number; h: number }) {
  // Deterministic starfield so re-renders are stable
  const stars = useMemo(() => {
    const rng = mulberry32(20260904);
    return Array.from({ length: 90 }, (_, i) => ({
      id: i,
      x: rng() * w,
      y: rng() * h,
      r: rng() * 1.2 + 0.3,
      o: rng() * 0.6 + 0.2,
    }));
  }, [w, h]);
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <defs>
        <radialGradient id="cb-nebula" cx="30%" cy="20%" r="80%">
          <stop offset="0%" stopColor="#2A2350" stopOpacity="0.45" />
          <stop offset="55%" stopColor="#0B0A1F" stopOpacity="0.35" />
          <stop offset="100%" stopColor="#070612" stopOpacity="0" />
        </radialGradient>
        <radialGradient id="cb-glow" cx="50%" cy="55%" r="35%">
          <stop offset="0%" stopColor="#D6BC8C" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#D6BC8C" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="#070612" />
      <rect width={w} height={h} fill="url(#cb-nebula)" />
      <rect width={w} height={h} fill="url(#cb-glow)" />
      {stars.map((s) => (
        <circle key={s.id} cx={s.x} cy={s.y} r={s.r} fill="#F1ECDD" opacity={s.o} />
      ))}
      {/* Faint constellations */}
      <g stroke="#D6BC8C" strokeWidth="0.5" opacity="0.18" fill="none">
        <polyline points={`${w * 0.18},${h * 0.12} ${w * 0.32},${h * 0.22} ${w * 0.48},${h * 0.16}`} />
        <polyline points={`${w * 0.62},${h * 0.7} ${w * 0.78},${h * 0.76} ${w * 0.88},${h * 0.66}`} />
      </g>
      {/* Crescent moon glyph */}
      <g transform={`translate(${w * 0.78}, ${h * 0.16})`} opacity="0.7">
        <circle r={26} fill="#D6BC8C" opacity="0.10" />
        <path
          d="M -10 -16 A 18 18 0 1 0 -10 16 A 14 14 0 1 1 -10 -16 Z"
          fill="#D6BC8C"
        />
      </g>
    </svg>
  );
}

function MinimalParchment({ w, h }: { w: number; h: number }) {
  return (
    <svg
      width={w}
      height={h}
      viewBox={`0 0 ${w} ${h}`}
      style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
    >
      <defs>
        <linearGradient id="pa-vignette" x1="50%" y1="0%" x2="50%" y2="100%">
          <stop offset="0%" stopColor="#EFE7D2" />
          <stop offset="50%" stopColor="#F5EFE0" />
          <stop offset="100%" stopColor="#E8DFC6" />
        </linearGradient>
        <radialGradient id="pa-grain" cx="50%" cy="50%" r="60%">
          <stop offset="0%" stopColor="#000000" stopOpacity="0" />
          <stop offset="100%" stopColor="#000000" stopOpacity="0.06" />
        </radialGradient>
      </defs>
      <rect width={w} height={h} fill="url(#pa-vignette)" />
      <rect width={w} height={h} fill="url(#pa-grain)" />
    </svg>
  );
}

/* Small deterministic PRNG so SVG starfields are stable per render */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/* ------------------------------------------------------------------ */
/* Card contents per reading type                                     */
/* ------------------------------------------------------------------ */

function TarotCardContent({ r, p, scale }: { r: Extract<ShareCardReading, { type: "tarot" }>; p: typeof PALETTE.editorial; scale: number }) {
  const cardRows = r.cards.slice(0, 6);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 * scale }}>
      <div>
        <div
          style={{
            fontSize: 11 * scale,
            letterSpacing: 4 * scale,
            textTransform: "uppercase",
            color: p.eyebrow,
            marginBottom: 8 * scale,
            fontWeight: 600,
          }}
        >
          {r.spreadName}
        </div>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 30 * scale,
            lineHeight: 1.25,
            color: p.ink,
            fontStyle: "italic",
          }}
        >
          “{truncate(r.question, 120)}”
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${p.border}`,
          paddingTop: 24 * scale,
        }}
      >
        <div
          style={{
            fontSize: 11 * scale,
            letterSpacing: 3 * scale,
            textTransform: "uppercase",
            color: p.eyebrow,
            marginBottom: 16 * scale,
            fontWeight: 600,
          }}
        >
          The Draw
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 14 * scale }}>
          {cardRows.map((c, i) => (
            <div key={i} style={{ display: "flex", alignItems: "baseline", gap: 16 * scale }}>
              <div
                style={{
                  width: 32 * scale,
                  flexShrink: 0,
                  fontSize: 11 * scale,
                  color: p.accent,
                  fontVariantNumeric: "tabular-nums",
                  fontWeight: 600,
                }}
              >
                {String(i + 1).padStart(2, "0")}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 17 * scale,
                    color: p.ink,
                    fontWeight: 500,
                    lineHeight: 1.2,
                  }}
                >
                  {c.name}
                  {c.reversed ? (
                    <span style={{ color: p.accent, marginLeft: 8 * scale, fontSize: 12 * scale }}>
                      ⟲ reversed
                    </span>
                  ) : null}
                </div>
                {c.position ? (
                  <div style={{ fontSize: 12 * scale, color: p.inkSoft, marginTop: 2 * scale }}>
                    {c.position}
                  </div>
                ) : null}
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={{ borderTop: `1px solid ${p.border}`, paddingTop: 24 * scale }}>
        <div
          style={{
            fontSize: 11 * scale,
            letterSpacing: 3 * scale,
            textTransform: "uppercase",
            color: p.eyebrow,
            marginBottom: 14 * scale,
            fontWeight: 600,
          }}
        >
          Reading
        </div>
        <div
          style={{
            fontSize: 16 * scale,
            lineHeight: 1.6,
            color: p.ink,
          }}
        >
          {truncate(r.interpretation, 520)}
        </div>
      </div>
    </div>
  );
}

function HoroscopeCardContent({ r, p, scale }: { r: Extract<ShareCardReading, { type: "horoscope" }>; p: typeof PALETTE.editorial; scale: number }) {
  const highlights = (r.highlights ?? []).slice(0, 4);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 * scale }}>
      <div style={{ display: "flex", alignItems: "center", gap: 18 * scale }}>
        <div
          style={{
            width: 76 * scale,
            height: 76 * scale,
            borderRadius: "50%",
            border: `1.5px solid ${p.accent}`,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontSize: 36 * scale,
            color: p.accent,
            background: p.accentSoft,
          }}
        >
          {r.signSymbol}
        </div>
        <div>
          <div
            style={{
              fontSize: 11 * scale,
              letterSpacing: 3 * scale,
              textTransform: "uppercase",
              color: p.eyebrow,
              fontWeight: 600,
              marginBottom: 4 * scale,
            }}
          >
            {r.period}
          </div>
          <div
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 34 * scale,
              lineHeight: 1,
              color: p.ink,
              textTransform: "capitalize",
            }}
          >
            {r.sign}
          </div>
          <div style={{ fontSize: 12 * scale, color: p.inkSoft, marginTop: 6 * scale }}>{r.date}</div>
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${p.border}`,
          paddingTop: 24 * scale,
          fontSize: 17 * scale,
          lineHeight: 1.6,
          color: p.ink,
          fontStyle: "italic",
          fontFamily: "Georgia, 'Times New Roman', serif",
        }}
      >
        {truncate(r.summary, 480)}
      </div>

      {(r.luckyColor || r.luckyNumber || r.luckyTime) && (
        <div
          style={{
            display: "flex",
            gap: 12 * scale,
            flexWrap: "wrap",
          }}
        >
          {r.luckyColor && (
            <LuckyPill p={p} scale={scale} label="Color" value={r.luckyColor} swatch={r.luckyColor} />
          )}
          {typeof r.luckyNumber === "number" && (
            <LuckyPill p={p} scale={scale} label="Number" value={String(r.luckyNumber)} />
          )}
          {r.luckyTime && <LuckyPill p={p} scale={scale} label="Time" value={r.luckyTime} />}
        </div>
      )}

      {highlights.length > 0 && (
        <div>
          <div
            style={{
              fontSize: 11 * scale,
              letterSpacing: 3 * scale,
              textTransform: "uppercase",
              color: p.eyebrow,
              marginBottom: 14 * scale,
              fontWeight: 600,
            }}
          >
            Highlights
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: 10 * scale }}>
            {highlights.map((h, i) => (
              <div key={i} style={{ display: "flex", gap: 12 * scale, alignItems: "baseline" }}>
                <span style={{ color: p.accent, fontSize: 13 * scale }}>✦</span>
                <span style={{ fontSize: 15 * scale, color: p.ink, lineHeight: 1.4 }}>{h}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function LuckyPill({
  p,
  scale,
  label,
  value,
  swatch,
}: {
  p: typeof PALETTE.editorial;
  scale: number;
  label: string;
  value: string;
  swatch?: string;
}) {
  return (
    <div
      style={{
        border: `1px solid ${p.border}`,
        background: p.surface,
        borderRadius: 8 * scale,
        padding: `${10 * scale}px ${14 * scale}px`,
        display: "flex",
        alignItems: "center",
        gap: 8 * scale,
      }}
    >
      {swatch && (
        <span
          style={{
            width: 14 * scale,
            height: 14 * scale,
            borderRadius: "50%",
            background: swatch,
            border: `1px solid ${p.border}`,
            display: "inline-block",
          }}
        />
      )}
      <span style={{ fontSize: 11 * scale, color: p.inkSoft, letterSpacing: 1 * scale, textTransform: "uppercase" }}>
        {label}
      </span>
      <span style={{ fontSize: 14 * scale, color: p.ink, fontWeight: 500 }}>{value}</span>
    </div>
  );
}

function ChatCardContent({ r, p, scale }: { r: Extract<ShareCardReading, { type: "chat" }>; p: typeof PALETTE.editorial; scale: number }) {
  const ansLines = wrapLines(truncate(r.answer, 600), 64);
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 28 * scale }}>
      <div>
        <div
          style={{
            fontSize: 11 * scale,
            letterSpacing: 3 * scale,
            textTransform: "uppercase",
            color: p.eyebrow,
            marginBottom: 12 * scale,
            fontWeight: 600,
          }}
        >
          {r.mode ? r.mode : "Consultation"}
        </div>
        <div
          style={{
            fontFamily: "Georgia, 'Times New Roman', serif",
            fontSize: 26 * scale,
            lineHeight: 1.3,
            color: p.ink,
            fontStyle: "italic",
          }}
        >
          {truncate(r.question, 140)}
        </div>
      </div>

      <div
        style={{
          borderTop: `1px solid ${p.border}`,
          paddingTop: 24 * scale,
        }}
      >
        <div
          style={{
            fontSize: 11 * scale,
            letterSpacing: 3 * scale,
            textTransform: "uppercase",
            color: p.eyebrow,
            marginBottom: 14 * scale,
            fontWeight: 600,
          }}
        >
          The Reading
        </div>
        <div style={{ fontSize: 16 * scale, lineHeight: 1.7, color: p.ink }}>
          {ansLines.slice(0, 9).map((l, i) => (
            <div key={i} style={{ marginBottom: 4 * scale }}>
              {l}
            </div>
          ))}
          {ansLines.length > 9 && <div style={{ color: p.inkSoft }}>…</div>}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The card frame (renders inside an offscreen absolutely-sized div)  */
/* ------------------------------------------------------------------ */

function CardFrame({
  reading,
  template,
  aspect,
  dims,
}: {
  reading: ShareCardReading;
  template: Template;
  aspect: Aspect;
  dims: { w: number; h: number };
}) {
  const p = PALETTE[template];
  // scale ~ px-per-pt so typography is proportional regardless of aspect
  const scale = dims.w / 1080;
  const padX = 96 * scale;
  const padTop = 80 * scale;
  const padBottom = 130 * scale; // room for wordmark

  const titleByType: Record<ShareCardReading["type"], string> = {
    tarot: "Tarot Reading",
    horoscope: "Horoscope",
    chat: "Astrologer",
  };
  const iconByType: Record<ShareCardReading["type"], string> = {
    tarot: "✦",
    horoscope: "☾",
    chat: "✺",
  };

  return (
    <div
      style={{
        position: "relative",
        width: dims.w,
        height: dims.h,
        background: p.bg,
        overflow: "hidden",
        fontFamily:
          "Inter, -apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
        color: p.ink,
      }}
    >
      {/* Backgrounds */}
      {template === "celestial" && <CelestialBackdrop w={dims.w} h={dims.h} />}
      {template === "minimal" && <MinimalParchment w={dims.w} h={dims.h} />}
      {template === "editorial" && (
        <svg
          width={dims.w}
          height={dims.h}
          viewBox={`0 0 ${dims.w} ${dims.h}`}
          style={{ position: "absolute", inset: 0, pointerEvents: "none" }}
        >
          <defs>
            <radialGradient id="ed-vignette" cx="50%" cy="40%" r="80%">
              <stop offset="0%" stopColor="#0A0908" stopOpacity="0" />
              <stop offset="100%" stopColor="#000000" stopOpacity="0.6" />
            </radialGradient>
          </defs>
          <rect width={dims.w} height={dims.h} fill="url(#ed-vignette)" />
        </svg>
      )}

      {/* Header */}
      <div
        style={{
          position: "absolute",
          top: padTop,
          left: padX,
          right: padX,
          display: "flex",
          alignItems: "center",
          gap: 16 * scale,
        }}
      >
        <span style={{ fontSize: 18 * scale, color: p.accent }}>{iconByType[reading.type]}</span>
        <span
          style={{
            fontSize: 12 * scale,
            letterSpacing: 4 * scale,
            textTransform: "uppercase",
            color: p.accent,
            fontWeight: 600,
          }}
        >
          {titleByType[reading.type]}
        </span>
        <div
          style={{
            flex: 1,
            height: 1,
            background: `linear-gradient(to right, ${p.goldRule}55, transparent)`,
          }}
        />
      </div>

      {/* Content body */}
      <div
        style={{
          position: "absolute",
          top: padTop + 64 * scale,
          left: padX,
          right: padX,
          bottom: padBottom,
          overflow: "hidden",
        }}
      >
        {reading.type === "tarot" && <TarotCardContent r={reading} p={p} scale={scale} />}
        {reading.type === "horoscope" && <HoroscopeCardContent r={reading} p={p} scale={scale} />}
        {reading.type === "chat" && <ChatCardContent r={reading} p={p} scale={scale} />}
      </div>

      {/* Wordmark — bottom right */}
      <div
        style={{
          position: "absolute",
          bottom: 48 * scale,
          left: padX,
          right: padX,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <div
          style={{
            fontSize: 11 * scale,
            color: p.inkSoft,
            letterSpacing: 1 * scale,
          }}
        >
          {aspect === "story" ? "Baydin · Fortune, stars, ritual" : "Fortune, stars, ritual"}
        </div>
        <div
          style={{
            display: "flex",
            alignItems: "baseline",
            gap: 6 * scale,
          }}
        >
          <span
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: 22 * scale,
              color: p.ink,
              letterSpacing: "0.02em",
            }}
          >
            Baydin
          </span>
          <span
            style={{
              width: 4 * scale,
              height: 4 * scale,
              borderRadius: "50%",
              background: p.accent,
              display: "inline-block",
            }}
          />
        </div>
      </div>

      {/* Top hairline accent (editorial only) */}
      {template === "editorial" && (
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            right: 0,
            height: 4 * scale,
            background: `linear-gradient(to right, transparent, ${p.accent}, transparent)`,
          }}
        />
      )}
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* The exported modal component                                       */
/* ------------------------------------------------------------------ */

export function ShareCardModal({
  open,
  onOpenChange,
  reading,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  reading: ShareCardReading | null;
}) {
  const [template, setTemplate] = useState<Template>("editorial");
  const [aspect, setAspect] = useState<Aspect>("square");
  const [generating, setGenerating] = useState(false);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const offscreenRef = useRef<HTMLDivElement | null>(null);

  const dims = ASPECT_DIMS[aspect];

  // Auto-regenerate preview whenever inputs change
  const regenerate = useCallback(async () => {
    if (!offscreenRef.current || !reading) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(offscreenRef.current, {
        skipFonts: true,
        pixelRatio: 2,
        cacheBust: true,
        width: dims.w,
        height: dims.h,
      });
      setPreviewUrl(dataUrl);
    } catch (err) {
      console.error("ShareCard preview failed:", err);
    } finally {
      setGenerating(false);
    }
  }, [reading, template, aspect, dims.w, dims.h]);

  // Debounce regeneration
  useEffect(() => {
    if (!open || !reading) return;
    const id = setTimeout(() => {
      regenerate();
    }, 150);
    return () => clearTimeout(id);
  }, [open, reading, regenerate]);

  // Clean up preview URL when closed
  useEffect(() => {
    if (!open && previewUrl) {
      setPreviewUrl(null);
    }
  }, [open, previewUrl]);

  const handleDownload = useCallback(async () => {
    if (!offscreenRef.current || !reading) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(offscreenRef.current, {
        skipFonts: true,
        pixelRatio: 2,
        cacheBust: true,
        width: dims.w,
        height: dims.h,
      });
      const a = document.createElement("a");
      const slug =
        reading.type === "tarot"
          ? "tarot"
          : reading.type === "horoscope"
          ? `horoscope-${reading.sign}`
          : "astrologer";
      a.href = dataUrl;
      a.download = `baydin-${slug}-${aspect}.png`;
      a.click();
      toast.success("Saved share card");
    } catch (err: any) {
      toast.error("Couldn't generate card: " + (err?.message ?? "unknown error"));
    } finally {
      setGenerating(false);
    }
  }, [reading, aspect, dims.w, dims.h]);

  const handleShare = useCallback(async () => {
    if (!offscreenRef.current || !reading) return;
    setGenerating(true);
    try {
      const dataUrl = await toPng(offscreenRef.current, {
        skipFonts: true,
        pixelRatio: 2,
        cacheBust: true,
        width: dims.w,
        height: dims.h,
      });
      const blob = await (await fetch(dataUrl)).blob();
      const file = new File([blob], `baydin-share-${aspect}.png`, { type: "image/png" });

      const shareText = shareCaption(reading);

      if (
        typeof navigator !== "undefined" &&
        typeof (navigator as any).canShare === "function" &&
        (navigator as any).canShare({ files: [file] })
      ) {
        try {
          await (navigator as any).share({
            files: [file],
            text: shareText,
            title: "Baydin",
          });
          toast.success("Shared");
        } catch (err: any) {
          if (err?.name !== "AbortError") {
            toast.error("Share failed: " + (err?.message ?? "unknown"));
          }
        }
      } else {
        // Fallback: copy image to clipboard if supported
        try {
          const navAny = navigator as any;
          if (navAny.clipboard && navAny.clipboard.write) {
            await navAny.clipboard.write([
              new ClipboardItem({ "image/png": blob }),
            ]);
            toast.success("Card copied to clipboard");
            return;
          }
        } catch {}
        // Final fallback: just download
        await handleDownload();
        toast("Image downloaded — share from your files");
      }
    } catch (err: any) {
      toast.error("Couldn't share: " + (err?.message ?? "unknown error"));
    } finally {
      setGenerating(false);
    }
  }, [reading, aspect, dims.w, dims.h, handleDownload]);

  // Offscreen render of the actual full-resolution card (1080×H)
  // — kept mounted inside the modal but visually hidden behind the preview.
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
        <DialogHeader>
          <DialogTitle className="serif-display text-[1.125rem] text-[#E8E2D5]">
            Share card
          </DialogTitle>
          <DialogDescription className="text-[12px] text-[#9C9489]">
            Pick a template and aspect, then download or share the PNG.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-4 mt-2">
          {/* Preview pane */}
          <div className="rounded-sm bg-[#070608] border border-[#2A2722] p-3 flex items-center justify-center min-h-[280px]">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="Share card preview"
                className="max-h-[420px] w-auto rounded-sm"
              />
            ) : (
              <div className="text-[12px] text-[#6B6358]">Rendering…</div>
            )}
          </div>

          {/* Controls */}
          <div className="flex flex-col gap-4">
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B6358] mb-2">
                Template
              </div>
              <Tabs value={template} onValueChange={(v) => setTemplate(v as Template)}>
                <TabsList className="grid grid-cols-3 bg-[#0A0908] border border-[#2A2722] h-auto p-1">
                  <TabsTrigger value="editorial" className="text-[11px] data-[state=active]:bg-[#1A1714] data-[state=active]:text-[#C5A572]">
                    Editorial
                  </TabsTrigger>
                  <TabsTrigger value="celestial" className="text-[11px] data-[state=active]:bg-[#1A1714] data-[state=active]:text-[#C5A572]">
                    Celestial
                  </TabsTrigger>
                  <TabsTrigger value="minimal" className="text-[11px] data-[state=active]:bg-[#1A1714] data-[state=active]:text-[#C5A572]">
                    Minimal
                  </TabsTrigger>
                </TabsList>
              </Tabs>
            </div>

            <div>
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B6358] mb-2">
                Format
              </div>
              <Tabs value={aspect} onValueChange={(v) => setAspect(v as Aspect)}>
                <TabsList className="grid grid-cols-3 bg-[#0A0908] border border-[#2A2722] h-auto p-1">
                  <TabsTrigger value="square" className="text-[11px] data-[state=active]:bg-[#1A1714] data-[state=active]:text-[#C5A572]">
                    Square
                  </TabsTrigger>
                  <TabsTrigger value="portrait" className="text-[11px] data-[state=active]:bg-[#1A1714] data-[state=active]:text-[#C5A572]">
                    Portrait
                  </TabsTrigger>
                  <TabsTrigger value="story" className="text-[11px] data-[state=active]:bg-[#1A1714] data-[state=active]:text-[#C5A572]">
                    Story
                  </TabsTrigger>
                </TabsList>
              </Tabs>
              <div className="text-[10px] text-[#6B6358] mt-1">
                {dims.w}×{dims.h}px
              </div>
            </div>

            <div className="flex flex-col gap-2 mt-2">
              <Button
                onClick={handleDownload}
                disabled={generating || !reading}
                className="bg-[#E8E2D5] text-[#0A0908] hover:bg-white text-[13px]"
              >
                <Download className="w-4 h-4 mr-2" />
                Download PNG
              </Button>
              <Button
                onClick={handleShare}
                disabled={generating || !reading}
                variant="outline"
                className="border-[#2A2722] bg-transparent text-[#E8E2D5] hover:bg-[#1A1714] hover:text-[#C5A572] text-[13px]"
              >
                <Share2 className="w-4 h-4 mr-2" />
                Share
              </Button>
            </div>

            <div className="text-[10px] text-[#6B6358] leading-relaxed mt-1">
              {reading?.type === "tarot" && (
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="w-3 h-3" /> Tarot · {reading.spreadName}
                </span>
              )}
              {reading?.type === "horoscope" && (
                <span className="inline-flex items-center gap-1">
                  <Moon className="w-3 h-3" /> Horoscope · {reading.sign}
                </span>
              )}
              {reading?.type === "chat" && (
                <span className="inline-flex items-center gap-1">
                  <MessageCircle className="w-3 h-3" /> Astrologer chat
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Offscreen full-resolution card mount — used by html-to-image.
            Positioned off-viewport so it's invisible but rendered at full
            opacity (html-to-image needs the node to have non-zero opacity
            and a measurable layout box). */}
        <div
          aria-hidden
          style={{
            position: "fixed",
            left: -100000,
            top: 0,
            width: dims.w,
            height: dims.h,
            pointerEvents: "none",
            zIndex: -1,
          }}
        >
          {reading && (
            <div ref={offscreenRef}>
              <CardFrame reading={reading} template={template} aspect={aspect} dims={dims} />
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}

/* ------------------------------------------------------------------ */
/* Caption helper for native share sheet                              */
/* ------------------------------------------------------------------ */

function shareCaption(r: ShareCardReading): string {
  switch (r.type) {
    case "tarot":
      return `Tarot reading — ${r.spreadName}. "${truncate(r.question, 80)}"`;
    case "horoscope":
      return `${r.sign} ${r.period} horoscope — ${r.date}`;
    case "chat":
      return `Baydin astrologer consultation`;
  }
}

/* ------------------------------------------------------------------ */
/* Tiny standalone trigger button + hook for convenience              */
/* ------------------------------------------------------------------ */

export function useShareCard() {
  const [open, setOpen] = useState(false);
  const [reading, setReading] = useState<ShareCardReading | null>(null);

  const share = useCallback((r: ShareCardReading) => {
    setReading(r);
    setOpen(true);
  }, []);

  return { open, setOpen, reading, share };
}
