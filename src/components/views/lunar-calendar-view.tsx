"use client";

import * as React from "react";
import { StarField } from "@/components/lumina/primitives";
import {
  AuroraGlowCard,
  GlowPill,
  LiquidMetalText,
  NumberTicker,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, BaydinCalendar, BaydinChevronLeft, BaydinChevronRight, BaydinMoon, BaydinStar, BaydinSun, BaydinLoader } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { LunarDay, LunarMonth } from "@/lib/lunar-calendar";
import { BaydinStar as Zap } from "@/components/lumina/baydin-icons";
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
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.18} className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#9CB4D1]/15 border border-[#9CB4D1]/30 flex items-center justify-center">
              <BaydinMoon className="w-6 h-6 text-[#9CB4D1]" />
            </div>
            <LiquidMetalText as="h1" className="text-[20px] mb-1">Sign in to begin</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] mb-4 max-w-sm mx-auto">
              Vedic panchanga — tithi, nakshatra, yoga, karana. Auspicious times for every day.
            </p>
            <ShimmerButton onClick={onAuth}>Sign in</ShimmerButton>
          </AuroraGlowCard>
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
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        {/* Hero + month nav */}
        <div className="flex items-end justify-between mb-6 flex-wrap gap-4">
          <div>
            <GlowPill color="#9CB4D1" className="text-[10px] mb-3">
              <BaydinMoon className="w-2.5 h-2.5" /> Vedic panchanga
            </GlowPill>
            <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] leading-[1.1]">
              Lunar Calendar
            </LiquidMetalText>
          </div>
          <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.12} className="p-2 flex items-center gap-2">
            <ShimmerButton tone="parchment" onClick={goToday} className="text-[11px] px-3 py-1.5">
              <BaydinCalendar className="w-3 h-3" /> Today
            </ShimmerButton>
            <button onClick={prevMonth} aria-label="Previous month" className="p-2 text-[#9C9489] hover:text-[#C5A572] transition focus-ring rounded-sm">
              <BaydinChevronLeft className="w-4 h-4" />
            </button>
            <div className="serif-display text-[1.25rem] text-[#E8E2D5] min-w-[160px] text-center tabular-nums">
              {lunarMonth?.monthName ?? "…"} {year}
            </div>
            <button onClick={nextMonth} aria-label="Next month" className="p-2 text-[#9C9489] hover:text-[#C5A572] transition focus-ring rounded-sm">
              <BaydinChevronRight className="w-4 h-4" />
            </button>
          </AuroraGlowCard>
        </div>

        {/* Month summary pills */}
        {summary && (
          <div className="flex flex-wrap gap-2 mb-6">
            {summary.purnima.length > 0 && (
              <GlowPill color="#C5A87C" className="text-[10px]">
                <BaydinMoon className="w-2.5 h-2.5" /> Purnima: {summary.purnima.map(d => d.date.slice(8)).join(", ")}
              </GlowPill>
            )}
            {summary.amavasya.length > 0 && (
              <GlowPill color="#9C9489" className="text-[10px]">
                Amavasya: {summary.amavasya.map(d => d.date.slice(8)).join(", ")}
              </GlowPill>
            )}
            {summary.ekadashi.length > 0 && (
              <GlowPill color="#7A8B6F" className="text-[10px]">
                Ekadashi: {summary.ekadashi.map(d => d.date.slice(8)).join(", ")}
              </GlowPill>
            )}
            {summary.festivals.length > 0 && (
              <GlowPill color="#D4A0B8" className="text-[10px]">
                <BaydinStar className="w-2.5 h-2.5" /> <NumberTicker value={summary.festivals.length} /> festival{summary.festivals.length > 1 ? "s" : ""}
              </GlowPill>
            )}
          </div>
        )}

        {/* Calendar grid — AuroraGlowCard wrapper */}
        <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.1} className="p-3 mb-8">
          {/* DOW header */}
          <div className="grid grid-cols-7 border-b border-[#2A2722] mb-1">
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
          <div className="grid grid-cols-7 gap-1">
            {cells.map((day, idx) => (
              <DayCell key={idx} day={day} onClick={() => day && openDay(day)} />
            ))}
          </div>
        </AuroraGlowCard>

        {/* Legend */}
        <div className="flex flex-wrap gap-2 mb-8">
          <GlowPill color="#9C9489" className="text-[10px]">🌑 Amavasya — new moon</GlowPill>
          <GlowPill color="#C5A87C" className="text-[10px]">🌕 Purnima — full moon</GlowPill>
          <GlowPill color="#7A8B6F" className="text-[10px]">Ekadashi — 11th tithi</GlowPill>
          <GlowPill color="#D4A0B8" className="text-[10px]">★ Festival</GlowPill>
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
  if (!day) return <div className="aspect-square min-h-[60px] rounded-sm bg-white/[0.01]" />;

  return (
    <button
      onClick={onClick}
      className={cn(
        "aspect-square min-h-[60px] p-2 flex flex-col items-center justify-start transition-colors relative rounded-sm focus-ring",
        day.isToday
          ? "bg-[#1A1714] ring-1 ring-[#C5A572]/40"
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
      {/* Nakshatra abbreviation */}
      <div className="w-full text-center">
        <span className="text-[9px] text-[#6B6358] leading-none truncate block max-w-full" title={day.panchanga.nakshatra}>
          {day.panchanga.nakshatra.substring(0, 4)}
        </span>
      </div>
      {/* Festival marker */}
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
  const r = size / 2;
  const illumination = (1 - Math.cos(phaseFrac * 2 * Math.PI)) / 2; // 0..1
  const waxing = phaseFrac < 0.5; // waxing = right side lit

  const k = phaseFrac * 2 * Math.PI;
  const ellipseRx = Math.abs(Math.cos(k)) * r;

  const isWaxing = phaseFrac < 0.5;
  const isCrescent = (isWaxing && phaseFrac < 0.25) || (!isWaxing && phaseFrac > 0.75);
  const isGibbous = !isCrescent;

  let litPath = "";
  if (illumination < 0.001) {
    litPath = "";
  } else if (illumination > 0.999) {
    litPath = `M ${r},${r - r} A ${r},${r} 0 0 1 ${r},${r + r} A ${r},${r} 0 0 1 ${r},${r - r} Z`;
  } else {
    const sweepOuter = isWaxing ? 1 : 0;
    const sweepEllipse = isWaxing
      ? (isGibbous ? 0 : 1)
      : (isGibbous ? 1 : 0);
    litPath = `M ${r},${r - r} A ${r},${r} 0 0 ${sweepOuter} ${r},${r + r} A ${ellipseRx},${r} 0 0 ${sweepEllipse} ${r},${r - r} Z`;
  }

  // Use waxing variable so eslint doesn't complain about unused
  void waxing;

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="shrink-0">
      <circle cx={r} cy={r} r={r - 0.5} fill="#1a1410" stroke="#3a2f1f" strokeWidth="0.5" />
      {litPath && <path d={litPath} fill="#F0D9A8" />}
      <circle cx={r} cy={r} r={r - 0.25} fill="none" stroke="#C5A87C" strokeWidth="0.5" opacity="0.4" />
    </svg>
  );
}

// ============================================================
// TODAY MOON CARD — spotlight at bottom
// ============================================================
function TodayMoonCard({ lunarMonth, onOpenDay }: { lunarMonth: LunarMonth; onOpenDay: (d: LunarDay) => void }) {
  const today = lunarMonth.days.find((d) => d.isToday);
  if (!today) return null;

  const illumPct = Math.round(today.moonPhase.illumination * 100);

  return (
    <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.18} className="p-5 lg:p-6 mb-6">
      <div className="flex items-center gap-2 mb-3">
        <BaydinMoon className="w-4 h-4 text-[#C5A572]" />
        <GlowPill color="#C5A572" className="text-[10px]">Today's Moon</GlowPill>
      </div>
      <div className="flex items-start gap-5 flex-col sm:flex-row">
        <div className="flex items-center gap-4 shrink-0">
          <MoonPhaseSvg phaseFrac={today.moonPhase.phaseFrac} size={88} />
          <div>
            <div className="text-[18px] font-light text-[#E8E2D5]">{today.moonPhase.name}</div>
            <div className="text-[11px] text-[#9C9489] mt-1 tabular-nums">
              {today.moonPhase.emoji} <NumberTicker value={illumPct} />% illuminated
            </div>
            <div className="text-[11px] text-[#9C9489] tabular-nums">
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
        <ShimmerButton onClick={() => onOpenDay(today)} className="py-2 px-4 text-[12px]">
          View full day detail <BaydinChevronRight className="w-3.5 h-3.5" />
        </ShimmerButton>
      </div>
    </AuroraGlowCard>
  );
}

function PanchangaMini({ label, value }: { label: string; value: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-black/20 border border-[#2A2722]">
      <div className="text-[9px] uppercase tracking-[0.18em] text-[#9C9489]/70">{label}</div>
      <div className="text-[12px] text-[#E8E2D5] mt-0.5 font-medium truncate" title={value}>{value}</div>
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
  const illumPct = Math.round(day.moonPhase.illumination * 100);
  const moonAge = day.moonPhase.age.toFixed(1);

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        <button onClick={onBack} className="flex items-center gap-1.5 text-[12px] text-[#9C9489] hover:text-[#C5A572] transition mb-4">
          <BaydinChevronLeft className="w-3.5 h-3.5" /> Back to calendar
        </button>

        {/* Hero card */}
        <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.18} className="p-6 mb-6">
          <div className="flex items-start gap-5 mb-6 flex-col sm:flex-row">
            <div className="shrink-0 flex justify-center">
              <MoonPhaseSvg phaseFrac={day.moonPhase.phaseFrac} size={120} />
            </div>
            <div className="flex-1 min-w-0">
              <GlowPill color="#C5A572" className="text-[10px] mb-2">
                <BaydinMoon className="w-2.5 h-2.5" /> {day.dayOfWeekName}, {dateObj.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" })}
              </GlowPill>
              <LiquidMetalText as="h1" className="text-[26px] lg:text-[32px]">{day.moonPhase.name}</LiquidMetalText>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <GlowPill color="#C5A572" className="text-[10px]">
                  {day.moonPhase.emoji} <NumberTicker value={illumPct} />% lit
                </GlowPill>
                <GlowPill color="#9CB4D1" className="text-[10px] tabular-nums">
                  Age {moonAge} days
                </GlowPill>
                <GlowPill color="#9E8AC9" className="text-[10px]">
                  Moon in {day.moonPhase.zodiacSign}
                </GlowPill>
              </div>
              {day.isToday && (
                <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-leaf/10 border border-leaf/30 text-[#7A8B6F] text-[10px] font-medium tracking-wide">
                  <BaydinStar className="w-3 h-3" /> TODAY
                </div>
              )}
            </div>
          </div>
        </AuroraGlowCard>

        {/* Panchanga — the 5 limbs */}
        <GlowPill color="#9CB4D1" className="text-[10px] mb-3">Panchanga · The Five Limbs</GlowPill>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
          <PanchangaCard
            icon={BaydinMoon}
            label="Tithi"
            value={day.panchanga.tithi}
            sub={`Lunar day ${(day.panchanga.tithi_number % 30) + 1} of 30 · ${day.panchanga.tithi_paksha} paksha`}
            accent="#C5A87C"
          />
          <PanchangaCard
            icon={BaydinStar}
            label="Nakshatra"
            value={`${day.panchanga.nakshatra} ${day.panchanga.nakshatra_pada}`}
            sub={`Pada ${day.panchanga.nakshatra_pada} of 4 · Constellation ${day.panchanga.nakshatra_index + 1} of 27`}
            accent="#D4A0B8"
          />
          <PanchangaCard
            icon={BaydinStar}
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
            icon={BaydinSun}
            label="Vaara"
            value={day.dayOfWeekName}
            sub={`Planetary ruler: ${dayRuler(day.dayOfWeek)}`}
            accent="#E8B557"
          />
        </div>

        {/* Nakshatra detail */}
        {nakshatraDetail && (
          <AuroraGlowCard glowColor="#D4A0B8" glowIntensity={0.16} className="p-5 lg:p-6 mb-6">
            <div className="flex items-center gap-2 mb-3">
              <BaydinStar className="w-4 h-4 text-[#C5A572]" />
              <GlowPill color="#D4A0B8" className="text-[10px]">Nakshatra · {nakshatraDetail.nakshatra}</GlowPill>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-3">
              <NakMeta label="Deity" value={nakshatraDetail.deity} />
              <NakMeta label="Symbol" value={nakshatraDetail.symbol} />
              <NakMeta label="Nature" value={nakshatraDetail.nature} />
              <NakMeta label="Pada" value={String(day.panchanga.nakshatra_pada)} />
            </div>
            <div className="text-[12px] text-[#9C9489] leading-relaxed">
              <span className="text-[#C5A572]">Meaning:</span> {nakshatraDetail.meaning}
            </div>
          </AuroraGlowCard>
        )}

        {/* Special day indicators */}
        {(day.isPurnima || day.isAmavasya || day.isEkadashi || day.isFestival) && (
          <div className="mb-6">
            <GlowPill color="#C5A572" className="text-[10px] mb-3">Today's Significance</GlowPill>
            <div className="space-y-2">
              {day.isPurnima && (
                <SignificanceRow
                  icon={BaydinMoon}
                  title="Purnima (Full Moon)"
                  desc="A day of completion, fullness, and bright spiritual energy. Auspicious for new beginnings, meditation, and acts of generosity."
                  accent="#C5A87C"
                />
              )}
              {day.isAmavasya && (
                <SignificanceRow
                  icon={BaydinSun}
                  title="Amavasya (New Moon)"
                  desc="The dark moon — a time for ancestor rituals (tarpanam), introspection, and seeding new intentions. Avoid major new ventures today."
                  accent="#8B7355"
                />
              )}
              {day.isEkadashi && (
                <SignificanceRow
                  icon={BaydinStar}
                  title="Ekadashi (11th Tithi)"
                  desc="Sacred to Vishnu — a day of fasting (upavasa) and spiritual practice. Fasting on Ekadashi is said to purify the body and mind."
                  accent="#7A8B6F"
                />
              )}
              {day.isFestival && day.festivalName && (
                <SignificanceRow
                  icon={BaydinStar}
                  title={day.festivalName}
                  desc="A Vedic festival observed on this tithi. Special rituals, mantras, and offerings are traditionally performed."
                  accent="#D4A0B8"
                />
              )}
            </div>
          </div>
        )}

        {loading && (
          <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.12} className="p-6 flex items-center justify-center gap-2 text-[#9C9489]">
            <BaydinLoader className="w-4 h-4" /> Loading nakshatra detail…
          </AuroraGlowCard>
        )}
      </div>
    </div>
  );
}

function PanchangaCard({
  icon: Icon, label, value, sub, accent,
}: { icon: any; label: string; value: string; sub: string; accent: string }) {
  return (
    <AuroraGlowCard glowColor={accent} glowIntensity={0.12} className="p-4">
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4" style={{ color: accent }} />
        <GlowPill color={accent} className="text-[10px]">{label}</GlowPill>
      </div>
      <div className="text-[15px] text-[#E8E2D5] font-medium leading-tight">{value}</div>
      <div className="text-[10px] text-[#9C9489] mt-1">{sub}</div>
    </AuroraGlowCard>
  );
}

function NakMeta({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[9px] uppercase tracking-[0.18em] text-[#9C9489]/70">{label}</div>
      <div className="text-[12px] text-[#E8E2D5] mt-0.5 font-medium">{value}</div>
    </div>
  );
}

function SignificanceRow({
  icon: Icon, title, desc, accent,
}: { icon: any; title: string; desc: string; accent: string }) {
  return (
    <AuroraGlowCard glowColor={accent} glowIntensity={0.14} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0"
          style={{ background: `${accent}20`, color: accent }}
        >
          <Icon className="w-4 h-4" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] text-[#E8E2D5] font-medium">{title}</div>
          <div className="text-[12px] text-[#9C9489] leading-relaxed mt-1">{desc}</div>
        </div>
      </div>
    </AuroraGlowCard>
  );
}

function dayRuler(dow: number): string {
  return ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"][dow] || "—";
}
