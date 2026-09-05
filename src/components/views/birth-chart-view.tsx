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
import { CloverIcon } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { BaydinStar as Star, BaydinStar as Sparkles, BaydinPin as MapPin, BaydinSun as Sun } from "@/components/lumina/baydin-icons";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { ZODIAC_SYMBOLS, computeNavamsa, computeDasamsa, computeSaptamsa, computeHora, computeDwadasamsa, computeDrekkana, computeChaturthamsa, computeSolarReturn, computeShodasamsa, computeVimsamsa, computeChaturvimsamsa, computeTrimsamsa, computeKhavedamsa, computeAkshavedamsa, computeShashtiamsa, computeAshtakavarga, computeShadbala } from "@/lib/astrology";
import { SouthIndianChart } from "@/components/south-indian-chart";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋", Ascendant: "Asc",
};

const CHART_COST = 3;

export function BirthChartView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [chart, setChart] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [mode, setMode] = React.useState<"vedic" | "western" | "mahabote">("vedic");

  React.useEffect(() => {
    if (!user) return;
    if (!user.birthData) { setChart(null); return; }
  }, [user]);

  async function compute() {
    if (!user) { onAuth(); return; }
    if (!user.birthData) { toast.error("Add your birth details in profile first"); return; }
    setLoading(true);
    try {
      const res = await api<{ chart: any; error?: string; balance?: number }>(`/api/astrology/chart?mode=${mode}`);
      if (res.error) { toast.error(res.error); return; }
      setChart(res.chart);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="h-full overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        {/* Hero */}
        <div className="mb-6">
          <GlowPill color="#9E8AC9" className="text-[10px] mb-3">
            <Star className="w-2.5 h-2.5" /> Natal chart
          </GlowPill>
          <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] mb-2">
            Birth Chart
          </LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Computed with astronomical precision. Interpreted by Gemini.
          </p>
        </div>

        {/* Mode tabs — premium styled with gold underline */}
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.08} className="p-1.5 mb-4 inline-flex flex-wrap gap-1">
          {(["vedic", "western", "mahabote"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cn(
                "px-3 py-1.5 rounded-sm text-[12px] transition border-b-2",
                mode === m
                  ? "border-[#C5A572] text-[#C5A572] bg-[#C5A572]/10"
                  : "border-transparent text-[#9C9489] hover:text-[#E8E2D5]"
              )}
            >
              {m === "vedic" ? "Vedic (Sidereal)" : m === "western" ? "Western (Tropical)" : "Mahabote"}
            </button>
          ))}
        </AuroraGlowCard>

        {!user?.birthData ? (
          <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.15} className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/30 flex items-center justify-center">
              <MapPin className="w-6 h-6 text-[#C5A572]" />
            </div>
            <LiquidMetalText as="h2" className="text-[18px] mb-2">Birth details needed</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] mb-4">
              Open your profile (top-right settings icon) and add your birth date, time, and place.
            </p>
            {user ? (
              <GlowPill color="#9CB4D1" className="text-[10px]">Tap the settings icon →</GlowPill>
            ) : (
              <ShimmerButton onClick={onAuth}>Sign in to begin</ShimmerButton>
            )}
          </AuroraGlowCard>
        ) : (
          <>
            <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.16} className="p-4 mb-4">
              <ShimmerButton onClick={compute} disabled={loading} className="w-full">
                {loading ? (
                  <Sparkles className="w-4 h-4 animate-pulse" />
                ) : (
                  <Star className="w-4 h-4" />
                )}
                {loading ? "Computing chart…" : "Reveal my chart"}
                <span className="inline-flex items-center gap-1 opacity-80">
                  <CloverIcon className="w-3 h-3" /> <NumberTicker value={CHART_COST} />
                </span>
              </ShimmerButton>
            </AuroraGlowCard>

            {chart && <ChartDisplay chart={chart} mode={mode} />}
          </>
        )}
      </div>
    </div>
  );
}

function ChartDisplay({ chart, mode }: { chart: any; mode: string }) {
  if (mode === "mahabote") {
    const m = chart;
    return (
      <div className="space-y-4">
        <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.16} className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-[#C5A572]" />
            <GlowPill color="#9E8AC9" className="text-[10px]">Mahabote · Myanmar Traditional</GlowPill>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <Stat label="Weekday" value={m.weekday} />
            <Stat label="Ruling planet" value={`${PLANET_SYMBOLS[m.weekday_planet] ?? ""} ${m.weekday_planet}`} />
            <Stat label="Myanmar year" value={String(m.myanmar_year)} />
            <Stat label="Birth house" value={`House ${m.birth_house}`} />
          </div>
        </AuroraGlowCard>
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.14} className="p-5">
          <GlowPill color="#C5A572" className="text-[10px] mb-3">The Seven Houses</GlowPill>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {m.houses.map((h: any) => (
              <div key={h.house} className="text-center p-1 sm:p-2 rounded-lg bg-white/[0.02] border border-[#2A2722]">
                <div className="text-[8px] sm:text-[9px] text-[#9C9489]">{h.houseName}</div>
                <div className="text-sm sm:text-lg my-1">{PLANET_SYMBOLS[h.planet] ?? "?"}</div>
                <div className="text-[8px] sm:text-[9px] text-[#C5A572]">{h.planet}</div>
              </div>
            ))}
          </div>
        </AuroraGlowCard>
      </div>
    );
  }

  const c = chart as any;
  const asc = c.ascendant;
  const planets = c.planets || [];

  return (
    <div className="space-y-4">
      {/* Chart wheel (SVG) + South Indian grid side by side */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-5 flex flex-col items-center">
          <ChartWheel chart={c} />
          <div className="text-[11px] text-[#9C9489] mt-3 text-center">
            Ascendant: {ZODIAC_SYMBOLS[asc.signIndex]} {asc.sign} ({asc.signMy}) · {asc.degree.toFixed(2)}°
            {c.ayanamsa ? <> · Ayanamsa {c.ayanamsa}°</> : null}
          </div>
        </AuroraGlowCard>
        {mode === "vedic" && (
          <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.14} className="p-5 flex flex-col items-center">
            <GlowPill color="#9E8AC9" className="text-[10px] mb-2">South Indian Chart</GlowPill>
            <SouthIndianChart planets={planets} ascendant={asc} className="w-full max-w-[280px]" />
          </AuroraGlowCard>
        )}
      </div>

      {/* Planet table */}
      <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.14} className="p-5">
        <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2">
          <Star className="w-3.5 h-3.5 text-[#C5A572]" /> Planetary Positions
        </div>
        <div className="space-y-1.5">
          {planets.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] py-1.5 border-b border-[#2A2722] last:border-0">
              <span className="w-5 sm:w-6 text-center text-[#C5A572] text-sm sm:text-base">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
              <span className="w-16 sm:w-20 text-[#E8E2D5]">{p.name}</span>
              <span className="w-5 sm:w-6 text-center">{ZODIAC_SYMBOLS[p.signIndex]}</span>
              <span className="flex-1 text-[#9C9489] text-[10px] sm:text-[12px] truncate">{p.sign}<span className="hidden sm:inline">{p.signMy ? ` · ${p.signMy}` : ""}</span> · {p.degree.toFixed(1)}°</span>
              <span className="w-7 sm:w-8 text-center text-[9px] sm:text-[10px] text-[#9C9489]">H{p.house}</span>
              {p.retrograde && <span className="text-[9px] text-[#D4A0B8]">℞</span>}
              {p.dignity && p.dignity !== "neutral" && (
                <GlowPill color={p.dignity === "exalted" ? "#C5A572" : "#7A8B6F"} className="text-[8px] sm:text-[9px]">
                  {p.dignity}
                </GlowPill>
              )}
            </div>
          ))}
        </div>
      </AuroraGlowCard>

      {/* Planetary Aspects */}
      {c.aspects && c.aspects.length > 0 && (
        <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.14} className="p-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#C5A572]" /> Planetary Aspects
          </div>
          <div className="space-y-1">
            {c.aspects.map((a: any, i: number) => (
              <div key={i} className="flex items-center gap-2 text-[12px] py-1.5 border-b border-[#2A2722] last:border-0">
                <span className="w-6 text-center text-sm" style={{ color: a.color }}>{a.symbol}</span>
                <span className="text-[#E8E2D5] w-16">{a.planet1}</span>
                <span className="text-[10px] text-[#9C9489] flex-1 text-center">{a.aspect}</span>
                <span className="text-[#E8E2D5] w-16 text-right">{a.planet2}</span>
                <span className="text-[10px] text-[#9C9489] w-10 text-right tabular-nums">orb {a.orb.toFixed(1)}°</span>
                {a.applying && <span className="text-[9px] text-[#7A8B6F] serif-italic">applying</span>}
              </div>
            ))}
          </div>
        </AuroraGlowCard>
      )}

      {/* Dasha + Nakshatra */}
      {mode === "vedic" && c.dasha && (
        <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.16} className="p-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2">
            <Sparkles className="w-3.5 h-3.5 text-[#C5A572]" /> Vimshottari Dasha
          </div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Stat label="Moon Nakshatra" value={`${c.nakshatra} (pada ${c.nakshatraPada})`} />
            <Stat label="Birth Dasha" value={`${c.dasha.birth_dasha.lord} · ${c.dasha.birth_dasha.balance_years}y left`} />
            <Stat label="Current Mahadasha" value={c.dasha.current_mahadasha} />
          </div>
          <div className="flex gap-1 overflow-x-auto lum-no-scrollbar pb-1">
            {c.dasha.mahadashas.map((d: any, i: number) => (
              <div
                key={i}
                className={cn(
                  "shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] border tabular-nums",
                  d.lord === c.dasha.current_mahadasha
                    ? "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572]"
                    : "border-[#2A2722] bg-white/[0.02] text-[#9C9489]"
                )}
              >
                <div className="font-medium">{d.lord}</div>
                <div>{d.years.toFixed(1)}y</div>
              </div>
            ))}
          </div>
        </AuroraGlowCard>
      )}

      {/* Panchanga */}
      {c.panchanga && (
        <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.14} className="p-5">
          <GlowPill color="#9CB4D1" className="text-[10px] mb-3">Panchanga (Today)</GlowPill>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Tithi" value={c.panchanga.tithi} />
            <Stat label="Nakshatra" value={c.panchanga.nakshatra} />
            <Stat label="Yoga" value={String(c.panchanga.yoga)} />
            <Stat label="Karana" value={String(c.panchanga.karana)} />
          </div>
        </AuroraGlowCard>
      )}

      {/* Divisional charts — AuroraGlowCard per D-chart */}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeNavamsa} label="D-9" name="Navamsa" desc="Marriage & Dharma" accent="#D876A0" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeDasamsa} label="D-10" name="Dasamsa" desc="Career & Profession" accent="#C5A572" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeSaptamsa} label="D-7" name="Saptamsa" desc="Children & Progeny" accent="#9CB4D1" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeHora} label="D-2" name="Hora" desc="Wealth & Resources" accent="#F09A3D" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeDwadasamsa} label="D-12" name="Dwadasamsa" desc="Parents & Ancestry" accent="#9E8AC9" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeDrekkana} label="D-3" name="Drekkana" desc="Siblings & Courage" accent="#B5463A" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeChaturthamsa} label="D-4" name="Chaturthamsa" desc="Property & Residence" accent="#7A8B6F" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeShodasamsa} label="D-16" name="Shodasamsa" desc="Vehicles & Comforts" accent="#B5CD7E" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeVimsamsa} label="D-20" name="Vimsamsa" desc="Spiritual Practices" accent="#9E8AC9" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeChaturvimsamsa} label="D-24" name="Chaturvimsamsa" desc="Education & Knowledge" accent="#5FA9C7" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeTrimsamsa} label="D-30" name="Trimsamsa" desc="Struggles & Hidden Matters" accent="#b5463a" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeKhavedamsa} label="D-40" name="Khavedamsa" desc="Auspicious & Inauspicious Effects" accent="#C5A87C" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeAkshavedamsa} label="D-45" name="Akshavedamsa" desc="General Well-being" accent="#7A8B6F" />
      )}
      {mode === "vedic" && (
        <DivisionalCard chart={c} compute={computeShashtiamsa} label="D-60" name="Shashtiamsa" desc="Past Life Karma" accent="#C5A572" />
      )}

      {/* Ashtakavarga (BAV + SAV) */}
      {mode === "vedic" && (
        <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.14} className="p-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#C5A572]" />
            Ashtakavarga — Bindu Scores (SAV total: <NumberTicker value={computeAshtakavarga(c).savTotal} />)
          </div>
          {(() => {
            const av = computeAshtakavarga(c);
            return (
              <>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-3">
                  {av.sav.map((bindus, i) => (
                    <div key={i} className="text-center p-1 rounded bg-white/[0.02]">
                      <div className="text-[8px] text-[#9C9489]">{ZODIAC_SYMBOLS[i]}</div>
                      <div className={cn("text-[11px] font-medium tabular-nums", bindus >= 28 ? "text-[#7A8B6F]" : bindus < 25 ? "text-[#C26B5C]" : "text-[#E8E2D5]")}>
                        <NumberTicker value={bindus} />
                      </div>
                    </div>
                  ))}
                </div>
                {av.strong.length > 0 && (
                  <div className="text-[10px] text-[#7A8B6F] mb-1">Strong: {av.strong.map((s) => `${s.sign} (${s.bindus})`).join(", ")}</div>
                )}
                {av.weak.length > 0 && (
                  <div className="text-[10px] text-[#C26B5C]/70">Weak: {av.weak.map((s) => `${s.sign} (${s.bindus})`).join(", ")}</div>
                )}
                <div className="text-[9px] text-[#9C9489]/60 mt-1">SAV shows overall sign strength. 28+ = strong, below 25 = weak (out of 337 total bindus).</div>
              </>
            );
          })()}
        </AuroraGlowCard>
      )}

      {/* Shadbala (6-fold planetary strength) */}
      {mode === "vedic" && (
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.14} className="p-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#C5A572]" />
            Shadbala — Planetary Strength (6-fold)
          </div>
          {(() => {
            const sb = computeShadbala(c);
            return (
              <div className="space-y-1.5">
                {sb.planets.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                    <span className="text-[#C5A572]">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                    <span className="text-[#E8E2D5] w-16">{p.name}</span>
                    <div className="flex-1 grid grid-cols-6 gap-0.5 text-center">
                      <span className="text-[8px] text-[#9C9489]" title="Sthana">{p.sthana}</span>
                      <span className="text-[8px] text-[#9C9489]" title="Dig">{p.dig}</span>
                      <span className="text-[8px] text-[#9C9489]" title="Kala">{p.kala}</span>
                      <span className="text-[8px] text-[#9C9489]" title="Chesta">{p.chesta}</span>
                      <span className="text-[8px] text-[#9C9489]" title="Naisargika">{p.naisargika}</span>
                      <span className="text-[8px] text-[#9C9489]" title="Drik">{p.drik}</span>
                    </div>
                    <span className="text-[10px] text-[#E8E2D5] w-8 text-right tabular-nums">{p.totalRasis}R</span>
                    <GlowPill
                      color={
                        p.strength === "excellent" ? "#7A8B6F"
                        : p.strength === "good" ? "#C5A572"
                        : p.strength === "average" ? "#9C9489"
                        : "#C26B5C"
                      }
                      className="text-[8px]"
                    >
                      {p.strength}
                    </GlowPill>
                  </div>
                ))}
                <div className="text-[9px] text-[#9C9489]/60 mt-1 grid grid-cols-6 gap-0.5 text-center pl-[88px]">
                  <span>Sth</span><span>Dig</span><span>Kala</span><span>Che</span><span>Nai</span><span>Drik</span>
                </div>
              </div>
            );
          })()}
        </AuroraGlowCard>
      )}

      {/* Solar Return (Varshaphal) — year ahead */}
      {mode === "vedic" && (
        <AuroraGlowCard glowColor="#F09A3D" glowIntensity={0.14} className="p-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-[#C5A572]" />
            Solar Return (Varshaphal) — Your Year Ahead
          </div>
          {(() => {
            const sr = computeSolarReturn({ dob: c.meta.birth_datetime.slice(0, 10), tob: "12:00", latitude: c.meta.latitude, longitude: c.meta.longitude, timezone: c.meta.timezone }, c);
            if (!sr.planets.length) return <div className="text-[12px] text-[#9C9489]">Could not compute solar return.</div>;
            return (
              <>
                <div className="text-[11px] text-[#9C9489] mb-2">Return date: {sr.returnDate} · Sun in {sr.sunSign}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sr.planets.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                      <span className="text-[#C5A572]">{p.symbol}</span>
                      <span className="text-[#E8E2D5]">{p.name}</span>
                      <span className="text-[#9C9489] ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-[#9C9489]/60 mt-1">Varshaphal shows the themes and energies for your current solar year.</div>
              </>
            );
          })()}
        </AuroraGlowCard>
      )}
    </div>
  );
}

// ============================================================
// DivisionalChart — AuroraGlowCard wrapper for any D-chart
// ============================================================
function DivisionalCard({
  chart, compute, label, name, desc, accent,
}: {
  chart: any;
  compute: (c: any) => { planets: any[]; ascendant: any };
  label: string;
  name: string;
  desc: string;
  accent: string;
}) {
  const d = compute(chart);
  return (
    <AuroraGlowCard glowColor={accent} glowIntensity={0.16} className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2 min-w-0">
          <Star className="w-3.5 h-3.5 text-[#C5A572] shrink-0" />
          <div className="min-w-0">
            <GlowPill color={accent} className="text-[10px] mb-0.5">{label}</GlowPill>
            <div className="text-[12px] text-[#E8E2D5] truncate">{name} — {desc}</div>
          </div>
        </div>
        <MiniWheel planets={d.planets} ascendant={d.ascendant} label={label} />
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {d.planets.map((p) => (
          <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
            <span className="text-[#C5A572]">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
            <span className="text-[#E8E2D5]">{p.name}</span>
            <span className="text-[#9C9489] ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
          </div>
        ))}
      </div>
      <div className="text-[11px] text-[#9C9489] mt-2">
        Ascendant: {ZODIAC_SYMBOLS[d.ascendant.signIndex]} {d.ascendant.sign}
      </div>
      <div className="text-[10px] text-[#9C9489]/60 mt-1">{name} reveals {desc.toLowerCase()}.</div>
    </AuroraGlowCard>
  );
}

function ChartWheel({ chart }: { chart: any }) {
  const planets = [...(chart.planets || []), chart.ascendant];
  const size = 280;
  const cx = size / 2, cy = size / 2;
  const rOuter = size / 2 - 4, rInner = size / 2 - 30, rInnerMost = size / 2 - 60;
  const signs = Array.from({ length: 12 }, (_, i) => {
    const a0 = (i * 30 - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 30 - 90) * Math.PI / 180;
    return { i, a0, a1, mid: (a0 + a1) / 2 };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible max-w-full">
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(197,168,124,0.3)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInnerMost} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {signs.map((s) => (
        <g key={s.i}>
          <line x1={cx + rOuter * Math.cos(s.a0)} y1={cy + rOuter * Math.sin(s.a0)} x2={cx + rInner * Math.cos(s.a0)} y2={cy + rInner * Math.sin(s.a0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <text x={cx + (rOuter - 14) * Math.cos(s.mid)} y={cy + (rOuter - 14) * Math.sin(s.mid)} fill="#C5A87C" fontSize="14" textAnchor="middle" dominantBaseline="central">{ZODIAC_SYMBOLS[s.i]}</text>
        </g>
      ))}
      {planets.map((p: any, i: number) => {
        const angle = (p.signIndex * 30 + (p.degree ?? 15) - 90) * Math.PI / 180;
        const r = rInnerMost - (i % 2) * 12;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <g key={p.name + i}>
            <text x={x} y={y} fill={p.name === "Ascendant" ? "#E7D2A8" : "#E8EBE9"} fontSize="13" textAnchor="middle" dominantBaseline="central">{PLANET_SYMBOLS[p.name] ?? "•"}</text>
            {p.retrograde && <text x={x + 8} y={y} fill="#F09A3D" fontSize="8">℞</text>}
          </g>
        );
      })}
      <circle cx={cx} cy={cy} r="2" fill="#C5A87C" />
    </svg>
  );
}

/** Mini chart wheel for divisional charts (smaller, planet-only) */
function MiniWheel({ planets, ascendant, label }: { planets: { name: string; signIndex: number }[]; ascendant?: { signIndex: number }; label?: string }) {
  const size = 140;
  const cx = size / 2, cy = size / 2;
  const rOuter = size / 2 - 4, rInner = size / 2 - 16;
  const signs = Array.from({ length: 12 }, (_, i) => {
    const a0 = (i * 30 - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 30 - 90) * Math.PI / 180;
    return { i, a0, a1, mid: (a0 + a1) / 2 };
  });
  const allPlanets = [...planets];
  if (ascendant) allPlanets.push({ name: "Asc", signIndex: ascendant.signIndex });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible max-w-full">
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(197,168,124,0.2)" strokeWidth="0.5" />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
      {signs.map((s) => (
        <g key={s.i}>
          <line x1={cx + rOuter * Math.cos(s.a0)} y1={cy + rOuter * Math.sin(s.a0)} x2={cx + rInner * Math.cos(s.a0)} y2={cy + rInner * Math.sin(s.a0)} stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
          <text x={cx + (rOuter - 7) * Math.cos(s.mid)} y={cy + (rOuter - 7) * Math.sin(s.mid)} fill="rgba(197,168,124,0.6)" fontSize="7" textAnchor="middle" dominantBaseline="central">{ZODIAC_SYMBOLS[s.i]}</text>
        </g>
      ))}
      {allPlanets.map((p: any, i: number) => {
        const angle = (p.signIndex * 30 + 15 - 90) * Math.PI / 180;
        const r = rInner - 8 - (i % 2) * 8;
        const x = cx + r * Math.cos(angle);
        const y = cy + r * Math.sin(angle);
        return (
          <text key={p.name + i} x={x} y={y} fill={p.name === "Asc" ? "#E7D2A8" : "#E8EBE9"} fontSize="8" textAnchor="middle" dominantBaseline="central">{PLANET_SYMBOLS[p.name] ?? "•"}</text>
        );
      })}
      <circle cx={cx} cy={cy} r="1" fill="#C5A87C" />
      {label && <text x={cx} y={size - 2} fill="rgba(156,168,163,0.5)" fontSize="7" textAnchor="middle">{label}</text>}
    </svg>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#9C9489] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-[13px] text-[#E8E2D5]">{value}</div>
    </div>
  );
}
