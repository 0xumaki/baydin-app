"use client";

import * as React from "react";
import {
  GlassCard, GoldButton, GhostButton, Pill, SectionTitle, ShellCard,
} from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LunarDay, LunarMonth } from "@/lib/lunar-calendar";
import {
  Calendar, ChevronLeft, ChevronRight, Moon, Star, Sun, Sparkles,
  Loader2, X, BookOpen, Zap, Droplet, Wind, Flame,
} from "lucide-react";
import { toast } from "sonner";

const DOW_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

type NakshatraDetail = {
  nakshatra: string;
  deity: string;
  symbol: string;
  meaning: string;
  nature: string;
};

export function LunarCalendarView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;

  const now = new Date();
  const [year, setYear] = React.useState(now.getFullYear());
  const [month, setMonth] = React.useState(now.getMonth() + 1);
  const [lunarMonth, setLunarMonth] = React.useState<LunarMonth | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [selectedDay, setSelectedDay] = React.useState<LunarDay | null>(null);
  const [nakshatraDetail, setNakshatraDetail] = React.useState<NakshatraDetail | null>(null);
  const [detailLoading, setDetailLoading] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    fetch(`/api/lunar-calendar?year=${year}&month=${month}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        if (d.month) setLunarMonth(d.month);
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user, year, month]);

  function prevMonth() {
    if (month === 1) { setYear((y) => y - 1); setMonth(12); }
    else setMonth((m) => m - 1);
  }
  function nextMonth() {
    if (month === 12) { setYear((y) => y + 1); setMonth(1); }
    else setMonth((m) => m + 1);
  }
  function goToday() {
    const n = new Date();
    setYear(n.getFullYear());
    setMonth(n.getMonth() + 1);
  }

  async function openDay(day: LunarDay) {
    setSelectedDay(day);
    setNakshatraDetail(null);
    setDetailLoading(true);
    try {
      const res = await api<{ day: LunarDay; nakshatraDetail: NakshatraDetail | null }>(
        `/api/lunar-calendar?date=${day.date}`
      );
      setSelectedDay(res.day);
      if (res.nakshatraDetail) setNakshatraDetail(res.nakshatraDetail);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDetailLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Moon className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to begin</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  // Showing single-day detail
  if (selectedDay) {
    return (
      <DayDetail
        day={selectedDay}
        nakshatraDetail={nakshatraDetail}
        loading={detailLoading}
        onBack={() => { setSelectedDay(null); setNakshatraDetail(null); }}
      />
    );
  }

  // Build calendar grid (Sunday-first)
  const firstDow = new Date(year, month - 1, 1).getDay();
  const totalDays = lunarMonth?.days.length || 30;
  const cells: (LunarDay | null)[] = [];
  for (let i = 0; i < firstDow; i++) cells.push(null);
  if (lunarMonth) {
    for (const d of lunarMonth.days) cells.push(d);
  } else {
    for (let i = 1; i <= totalDays; i++) cells.push(null);
  }
  while (cells.length % 7 !== 0) cells.push(null);

  // Monthly summary
  const summary = lunarMonth ? {
    festivals: lunarMonth.days.filter(d => d.isFestival),
    purnima: lunarMonth.days.filter(d => d.isPurnima),
    amavasya: lunarMonth.days.filter(d => d.isAmavasya),
    ekadashi: lunarMonth.days.filter(d => d.isEkadashi),
  } : null;

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
        {/* Header — serif headline + month nav */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4 lum-reveal">
          <div>
            <div className="text-[13px] text-[#6B6358] mb-2">Vedic panchanga</div>
            <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight">
              Lunar calendar
            </h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={goToday} className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition focus-ring rounded-sm">
              Today
            </button>
            <button onClick={prevMonth} aria-label="Previous month" className="p-1.5 text-[#6B6358] hover:text-[#E8E2D5] transition focus-ring rounded-sm">
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="serif-display text-[1.25rem] text-[#E8E2D5] min-w-[160px] text-center tabular-nums">
              {lunarMonth?.monthName ?? "…"} {year}
            </div>
            <button onClick={nextMonth} aria-label="Next month" className="p-1.5 text-[#6B6358] hover:text-[#E8E2D5] transition focus-ring rounded-sm">
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Month summary — text, not pills */}
        {summary && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-[12px] text-[#6B6358]">
            {summary.purnima.length > 0 && (
              <span>Purnima: <span className="text-[#C5A572]">{summary.purnima.map(d => d.date.slice(8)).join(", ")}</span></span>
            )}
            {summary.amavasya.length > 0 && (
              <span>Amavasya: <span className="text-[#9C9489]">{summary.amavasya.map(d => d.date.slice(8)).join(", ")}</span></span>
            )}
            {summary.ekadashi.length > 0 && (
              <span>Ekadashi: <span className="text-[#9C9489]">{summary.ekadashi.map(d => d.date.slice(8)).join(", ")}</span></span>
            )}
            {summary.festivals.length > 0 && (
              <span>{summary.festivals.length} festival{summary.festivals.length > 1 ? "s" : ""}</span>
            )}
          </div>
        )}

        {/* Calendar grid — hairline border, no glass */}
        <div className="border border-[#2A2722] mb-10">
          {/* DOW header */}
          <div className="grid grid-cols-7 border-b border-[#2A2722]">
            {DOW_LABELS.map((d, i) => (
              <div
                key={d}
                className={cn(
                  "text-center text-[11px] py-2.5 font-medium",
                  i === 0 ? "text-[#C5A572]" : i === 6 ? "text-[#9C9489]" : "text-[#6B6358]"
                )}
              >
                {d}
              </div>
            ))}
          </div>
          {/* Day cells */}
          <div className="grid grid-cols-7">
            {cells.map((day, idx) => (
              <DayCell key={idx} day={day} onClick={() => day && openDay(day)} />
            ))}
          </div>
        </div>

        {/* Legend — text, not cards */}
        <div className="flex flex-wrap gap-x-6 gap-y-2 mb-10 text-[12px] text-[#6B6358]">
          <span>🌑 Amavasya — new moon</span>
          <span>🌕 Purnima — full moon</span>
          <span>Ekadashi — 11th tithi</span>
          <span>★ Festival</span>
        </div>

        {/* Today's moon spotlight */}
        {lunarMonth && (
          <TodayMoonCard lunarMonth={lunarMonth} onOpenDay={openDay} />
        )}
      </div>
    </div>
  );
}

// ============================================================
// DAY CELL — one cell in the calendar grid
// ============================================================
function DayCell({ day, onClick }: { day: LunarDay | null; onClick: () => void }) {
  if (!day) return <div className="aspect-square min-h-[60px] border-r border-b border-[#1A1714]" />;

  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square min-h-[60px] p-2 flex flex-col items-center justify-start transition-colors relative border-r border-b border-[#1A1714] focus-ring",
        day.isToday
          ? "bg-[#1A1714]"
          : day.isFestival
          ? "bg-[#15110D] hover:bg-[#1A1714]"
          : day.isPurnima
          ? "bg-[#13110C] hover:bg-[#1A1714]"
          : "hover:bg-[#0F0D0B]"
      )}
    >
      {/* Day number — serif, tabular */}
      <div className="flex items-center justify-between w-full mb-1">
        <span className={cn(
          "text-[12px] leading-none tabular-nums",
          day.isToday ? "text-[#C5A572] font-medium" : "text-[#E8E2D5]"
        )}>
          {parseInt(day.date.slice(8), 10)}
        </span>
        {day.isToday && <span className="w-1 h-1 rounded-full bg-[#C5A572]" />}
      </div>
      {/* Moon phase SVG */}
      <div className="flex-1 flex items-center justify-center py-0.5">
        <MoonPhaseSvg phaseFrac={day.moonPhase.phaseFrac} size={day.isToday ? 24 : 20} />
      </div>
      {/* Nakshatra abbreviation — sentence case */}
      <div className="w-full text-center">
        <span className="text-[9px] text-[#6B6358] leading-none truncate block max-w-full" title={day.panchanga.nakshatra}>
          {day.panchanga.nakshatra.substring(0, 4)}
        </span>
      </div>
      {/* Festival marker — small gold dot in corner */}
      {day.isFestival && (
        <span className="absolute top-1.5 right-1.5 w-1 h-1 rounded-full bg-[#C5A572]" />
      )}
    </button>
  );
}

// ============================================================
// MOON PHASE SVG — accurate illumination rendering
// ============================================================
export function MoonPhaseSvg({ phaseFrac, size = 24 }: { phaseFrac: number; size?: number }) {
  // phaseFrac: 0 = new, 0.25 = first quarter, 0.5 = full, 0.75 = last quarter
  const r = size / 2;
  const illumination = (1 - Math.cos(phaseFrac * 2 * Math.PI)) / 2; // 0..1
  const waxing = phaseFrac < 0.5; // waxing = right side lit

  // Compute the terminator ellipse semi-width
  // At new moon (k=0): ellipse rx = -r (full dark overlap)
  // At first quarter (k=0.25): rx = 0 (straight line)
  // At full (k=0.5): rx = +r (fully lit)
  const k = phaseFrac * 2 * Math.PI; // 0..2π
  const ellipseRx = Math.abs(Math.cos(k)) * r;

  // Whether the lit side is on the right (waxing, k<π) or left (waning, k>π)
  // New moon: full dark. Full moon: full lit.
  // Between new and first quarter: crescent on the right.
  // Between first quarter and full: gibbous (mostly right, dark sliver on left).
  const isWaxing = phaseFrac < 0.5;
  const isCrescent = (isWaxing && phaseFrac < 0.25) || (!isWaxing && phaseFrac > 0.75);
  // For crescent: the lit area is bounded by the outer arc + the terminator ellipse on the SAME side
  // For gibbous: the lit area is bounded by the outer arc + the terminator ellipse on the OPPOSITE side

  // We'll render the moon as a circle with two halves:
  // - Left half + right half (split at x=r)
  // - The terminator ellipse intersects both halves

  // Lit side full (near full moon) → mostly bright
  // Dark side full (near new moon) → mostly dark

  // Simpler approach: render the dark circle as background, then overlay the lit arc using a path.
  // The lit region = the intersection of the disk with a half-plane defined by the terminator.

  // For a clean SVG, use two paths: full dark circle + lit shape via path.
  // Lit shape: outer semicircle (right if waxing, left if waning) + inner ellipse arc back.

  // Convert phaseFrac to a 0..1 "lit fraction on the right side" + "lit fraction on the left side"
  // Easier: use a single path that describes the lit region.
  // Lit region is bounded by:
  //   - The outer circle on the lit side (half-circle, 180°)
  //   - The terminator ellipse (semi-ellipse whose width = ellipseRx)

  // Right half lit means: outer arc goes from top to bottom on the right side (clockwise),
  // then the terminator ellipse goes back from bottom to top.
  // For waxing crescent (phase 0..0.25), the terminator bulges INTO the right side (ellipse on left).
  // For waxing gibbous (0.25..0.5), the terminator bulges OUTWARD (ellipse on right).

  // Build path:
  const cx = r;
  const cy = r;
  // Lit region path:
  // M cx,cy-r (top) → outer arc to bottom → ellipse arc back to top
  // Direction of outer arc: if waxing, lit is on right → arc goes clockwise (sweep=1) from top to bottom on the right
  // if waning, lit is on left → arc goes counter-clockwise (sweep=0) from top to bottom on the left

  // Build the path string
  let litPath = "";
  if (illumination < 0.001) {
    // New moon — no lit path
    litPath = "";
  } else if (illumination > 0.999) {
    // Full moon — full disk lit
    litPath = `M ${cx},${cy - r} A ${r},${r} 0 0 1 ${cx},${cy + r} A ${r},${r} 0 0 1 ${cx},${cy - r} Z`;
  } else {
    // Top point (cx, cy-r), Bottom point (cx, cy+r)
    // Outer half-circle (180°): from top, going down on the LIT side, to bottom
    // Then ellipse from bottom back to top
    const sweepOuter = isWaxing ? 1 : 0; // 1=clockwise=right side, 0=counter-clockwise=left side
    // For crescent: ellipse goes on the OPPOSITE side (bulges toward dark)
    // For gibbous: ellipse goes on the SAME side (bulges toward lit)
    const isGibbous = !isCrescent;
    const sweepEllipse = isWaxing
      ? (isGibbous ? 0 : 1)  // waxing gibbous: ellipse sweeps left (0); waxing crescent: sweeps right (1)
      : (isGibbous ? 1 : 0); // waning gibbous: ellipse sweeps right (1); waning crescent: sweeps left (0)

    litPath = `M ${cx},${cy - r} A ${r},${r} 0 0 ${sweepOuter} ${cx},${cy + r} A ${ellipseRx},${r} 0 0 ${sweepEllipse} ${cx},${cy - r} Z`;
  }

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      {/* Dark moon (full disk) */}
      <circle cx={cx} cy={cy} r={r - 0.5} fill="#1a1410" stroke="#3a2f1f" strokeWidth="0.5" />
      {/* Lit region */}
      {litPath && <path d={litPath} fill="#F0D9A8" />}
      {/* Subtle ring */}
      <circle cx={cx} cy={cy} r={r - 0.25} fill="none" stroke="#C5A87C" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ============================================================
// LEGEND ITEM
// ============================================================
function LegendItem({ emoji, label, desc }: { emoji: string; label: string; desc: string }) {
  return (
    <div className="p-2.5 rounded-xl lum-glass border border-white/5">
      <div className="flex items-center gap-2 mb-0.5">
        <span className="text-[14px]">{emoji}</span>
        <span className="text-[11px] text-ink font-medium">{label}</span>
      </div>
      <div className="text-[9px] text-ink-muted leading-tight">{desc}</div>
    </div>
  );
}

// ============================================================
// TODAY MOON CARD — spotlight at bottom
// ============================================================
function TodayMoonCard({ lunarMonth, onOpenDay }: { lunarMonth: LunarMonth; onOpenDay: (d: LunarDay) => void }) {
  const today = lunarMonth.days.find((d) => d.isToday);
  if (!today) return null;

  return (
    <ShellCard>
      <div className="p-5 lg:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Moon className="w-4 h-4 text-gold" />
          <div className="text-[10px] uppercase tracking-[0.2em] text-gold">Today's Moon</div>
        </div>
        <div className="flex items-start gap-5 flex-col sm:flex-row">
          <div className="flex items-center gap-4 shrink-0">
            <MoonPhaseSvg phaseFrac={today.moonPhase.phaseFrac} size={88} />
            <div>
              <div className="text-[18px] font-light text-ink">{today.moonPhase.name}</div>
              <div className="text-[11px] text-ink-muted mt-1">
                {today.moonPhase.emoji} {(today.moonPhase.illumination * 100).toFixed(0)}% illuminated
              </div>
              <div className="text-[11px] text-ink-muted">
                Age {today.moonPhase.age.toFixed(1)} days · in {today.moonPhase.zodiacSign}
              </div>
            </div>
          </div>
          <div className="flex-1 min-w-0 grid grid-cols-2 gap-3">
            <PanchangaMini label="Tithi" value={today.panchanga.tithi} />
            <PanchangaMini label="Nakshatra" value={`${today.panchanga.nakshatra} ${today.panchanga.nakshatra_pada}`} />
            <PanchangaMini label="Yoga" value={today.panchanga.yoga} />
            <PanchangaMini label="Karana" value={today.panchanga.karana} />
          </div>
        </div>
        <div className="mt-4">
          <GoldButton onClick={() => onOpenDay(today)} className="py-2 px-4 text-[12px]">
            View full day detail <ChevronRight className="w-3.5 h-3.5 inline ml-1" />
          </GoldButton>
        </div>
      </div>
    </ShellCard>
  );
}

function PanchangaMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
      <div className="text-[9px] uppercase tracking-[0.18em] text-ink-muted/70">{label}</div>
      <div className="text-[12px] text-ink mt-0.5 font-medium truncate" title={value}>{value}</div>
    </div>
  );
}

// ============================================================
// DAY DETAIL — full breakdown of a selected day
// ============================================================
function DayDetail({
  day, nakshatraDetail, loading, onBack,
}: {
  day: LunarDay;
  nakshatraDetail: NakshatraDetail | null;
  loading: boolean;
  onBack: () => void;
}) {
  const dateObj = new Date(day.date + "T12:00:00");
  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <button onClick={onBack} className="text-[12px] text-ink-muted hover:text-gold transition mb-4">
          ← Back to calendar
        </button>

        {/* Hero */}
        <div className="flex items-start gap-5 mb-6 flex-col sm:flex-row">
          <div className="shrink-0 flex justify-center">
            <MoonPhaseSvg phaseFrac={day.moonPhase.phaseFrac} size={120} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-gold">
              {day.dayOfWeekName}, {dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
            </div>
            <h1 className="text-[26px] lg:text-[32px] font-light text-ink mt-1">{day.moonPhase.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-gold-soft/30 border border-gold/20 text-gold">
                {day.moonPhase.emoji} {(day.moonPhase.illumination * 100).toFixed(0)}% lit
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                Age {day.moonPhase.age.toFixed(1)} days
              </span>
              <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 border border-white/10 text-ink-muted">
                Moon in {day.moonPhase.zodiacSign}
              </span>
            </div>
            {day.isToday && (
              <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-leaf/10 border border-leaf/30 text-leaf text-[10px] font-medium tracking-wide">
                <Star className="w-3 h-3" /> TODAY
              </div>
            )}
          </div>
        </div>

        {/* Panchanga — the 5 limbs */}
        <SectionTitle className="mb-3">Panchanga · The Five Limbs</SectionTitle>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <PanchangaCard
            icon={Moon}
            label="Tithi"
            value={day.panchanga.tithi}
            sub={`Lunar day ${(day.panchanga.tithi_number % 30) + 1} of 30 · ${day.panchanga.tithi_paksha} paksha`}
            accent="#C5A87C"
          />
          <PanchangaCard
            icon={Star}
            label="Nakshatra"
            value={`${day.panchanga.nakshatra} ${day.panchanga.nakshatra_pada}`}
            sub={`Pada ${day.panchanga.nakshatra_pada} of 4 · Constellation ${day.panchanga.nakshatra_index + 1} of 27`}
            accent="#D4A0B8"
          />
          <PanchangaCard
            icon={Sparkles}
            label="Yoga"
            value={day.panchanga.yoga}
            sub={`Yoga ${day.panchanga.yoga_index} of 27`}
            accent="#7A8B6F"
          />
          <PanchangaCard
            icon={Zap}
            label="Karana"
            value={day.panchanga.karana}
            sub={`Half-tithi ${day.panchanga.karana_index} of 11`}
            accent="#8FA37E"
          />
          <PanchangaCard
            icon={Sun}
            label="Vaara"
            value={day.dayOfWeekName}
            sub={`Planetary ruler: ${dayRuler(day.dayOfWeek)}`}
            accent="#E8B557"
          />
        </div>

        {/* Nakshatra detail */}
        {nakshatraDetail && (
          <ShellCard className="mb-6">
            <div className="p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-gold" />
                <div className="text-[10px] uppercase tracking-[0.2em] text-gold">
                  Nakshatra · {nakshatraDetail.nakshatra}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
                <NakMeta label="Deity" value={nakshatraDetail.deity} />
                <NakMeta label="Symbol" value={nakshatraDetail.symbol} />
                <NakMeta label="Nature" value={nakshatraDetail.nature} />
                <NakMeta label="Pada" value={String(day.panchanga.nakshatra_pada)} />
              </div>
              <div className="text-[12px] text-ink-muted leading-relaxed">
                <span className="text-gold">Meaning:</span> {nakshatraDetail.meaning}
              </div>
            </div>
          </ShellCard>
        )}

        {/* Special day indicators */}
        {(day.isPurnima || day.isAmavasya || day.isEkadashi || day.isFestival) && (
          <div className="mb-6">
            <SectionTitle className="mb-3">Today's Significance</SectionTitle>
            <div className="space-y-2">
              {day.isPurnima && (
                <SignificanceRow
                  icon={Moon}
                  title="Purnima (Full Moon)"
                  desc="A day of completion, fullness, and bright spiritual energy. Auspicious for new beginnings, meditation, and acts of generosity."
                  accent="#C5A87C"
                />
              )}
              {day.isAmavasya && (
                <SignificanceRow
                  icon={Sun}
                  title="Amavasya (New Moon)"
                  desc="The dark moon — a time for ancestor rituals (tarpanam), introspection, and seeding new intentions. Avoid major new ventures today."
                  accent="#8B7355"
                />
              )}
              {day.isEkadashi && (
                <SignificanceRow
                  icon={Sparkles}
                  title="Ekadashi (11th Tithi)"
                  desc="Sacred to Vishnu — a day of fasting (upavasa) and spiritual practice. Fasting on Ekadashi is said to purify the body and mind."
                  accent="#7A8B6F"
                />
              )}
              {day.isFestival && day.festivalName && (
                <SignificanceRow
                  icon={Star}
                  title={day.festivalName}
                  desc="A Vedic festival observed on this tithi. Special rituals, mantras, and offerings are traditionally performed."
                  accent="#D4A0B8"
                />
              )}
            </div>
          </div>
        )}

        {loading && (
          <div className="flex items-center justify-center gap-2 py-4 text-ink-muted">
            <Loader2 className="w-4 h-4 animate-spin" /> Loading nakshatra detail…
          </div>
        )}
      </div>
    </div>
  );
}

function PanchangaCard({
  icon: Icon, label, value, sub, accent,
}: { icon: any; label: string; value: string; sub: string; accent: string }) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <div className="text-[10px] uppercase tracking-[0.18em] text-ink-muted">{label}</div>
      </div>
      <div className="text-[15px] text-ink font-medium leading-tight">{value}</div>
      <div className="text-[10px] text-ink-muted mt-1">{sub}</div>
    </GlassCard>
  );
}

function NakMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-ink-muted/70">{label}</div>
      <div className="text-[12px] text-ink mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function SignificanceRow({
  icon: Icon, title, desc, accent,
}: { icon: any; title: string; desc: string; accent: string }) {
  return (
    <div className="p-4 rounded-xl border" style={{ background: `${accent}10`, borderColor: `${accent}40` }}>
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] text-ink font-medium">{title}</div>
          <div className="text-[12px] text-ink-muted leading-relaxed mt-1">{desc}</div>
        </div>
      </div>
    </div>
  );
}

function dayRuler(dow: number): string {
  return ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"][dow] || "—";
}
