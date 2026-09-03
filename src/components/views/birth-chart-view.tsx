"use client";

import * as React from "react";
import { GlassCard, GoldButton, Pill, SectionTitle } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { Star, Wallet, Sparkles, MapPin, Sun } from "lucide-react";
import { toast } from "sonner";
import { ZODIAC_SYMBOLS, ZODIAC_MY, PLANET_MY, computeNavamsa, computeDasamsa, computeSaptamsa, computeHora, computeDwadasamsa, computeDrekkana, computeChaturthamsa, computeSolarReturn, computeShodasamsa, computeVimsamsa, computeChaturvimsamsa, computeTrimsamsa, computeKhavedamsa, computeAkshavedamsa, computeShashtiamsa, computeAshtakavarga, computeShadbala } from "@/lib/astrology";
import { useQuery } from "@tanstack/react-query";

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋", Ascendant: "Asc",
};

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
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Natal chart" title="Your Birth Chart" subtitle="Computed with astronomical precision. Interpreted by Gemini." className="mb-6" />

        <div className="flex items-center gap-2 mb-4">
          {(["vedic", "western", "mahabote"] as const).map((m) => (
            <button key={m} onClick={() => setMode(m)} className={`px-3 py-1.5 rounded-full text-[12px] border transition ${mode === m ? "bg-gold/15 text-gold border-gold/30" : "border-white/10 text-ink-muted hover:text-ink"}`}>
              {m === "vedic" ? "Vedic (Sidereal)" : m === "western" ? "Western (Tropical)" : "Mahabote"}
            </button>
          ))}
        </div>

        {!user?.birthData ? (
          <GlassCard className="p-6 text-center">
            <MapPin className="w-8 h-8 text-gold mx-auto mb-3" />
            <div className="text-[14px] text-ink mb-1">Birth details needed</div>
            <div className="text-[12px] text-ink-muted mb-4">Open your profile (top-right settings icon) and add your birth date, time, and place.</div>
            {user ? (
              <Pill variant="gold">Tap the settings icon →</Pill>
            ) : (
              <GoldButton onClick={onAuth}>Sign in to begin</GoldButton>
            )}
          </GlassCard>
        ) : (
          <>
            <GoldButton onClick={compute} disabled={loading} className="w-full mb-4">
              {loading ? "Computing chart…" : <><Star className="w-4 h-4" /> Reveal my chart · 3 Luck</>}
            </GoldButton>

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
        <GlassCard className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <Sparkles className="w-4 h-4 text-gold" />
            <span className="text-[13px] text-gold">Mahabote · Myanmar Traditional</span>
          </div>
          <div className="grid grid-cols-2 gap-3 text-[13px]">
            <Stat label="Weekday" value={m.weekday} />
            <Stat label="Ruling planet" value={`${PLANET_SYMBOLS[m.weekday_planet] ?? ""} ${m.weekday_planet}`} />
            <Stat label="Myanmar year" value={String(m.myanmar_year)} />
            <Stat label="Birth house" value={`House ${m.birth_house}`} />
          </div>
        </GlassCard>
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3">The Seven Houses</div>
          <div className="grid grid-cols-7 gap-1 sm:gap-1.5">
            {m.houses.map((h: any) => (
              <div key={h.house} className="text-center p-1 sm:p-2 rounded-lg bg-white/[0.02] border border-white/5">
                <div className="text-[8px] sm:text-[9px] text-ink-muted">{h.houseName}</div>
                <div className="text-sm sm:text-lg my-1">{PLANET_SYMBOLS[h.planet] ?? "?"}</div>
                <div className="text-[8px] sm:text-[9px] text-gold">{h.planet}</div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    );
  }

  const c = chart as any;
  const asc = c.ascendant;
  const planets = c.planets || [];
  const wheel = [...planets, asc];

  return (
    <div className="space-y-4">
      {/* Chart wheel (SVG) */}
      <GlassCard className="p-5 flex flex-col items-center">
        <ChartWheel chart={c} />
        <div className="text-[11px] text-ink-muted mt-3 text-center">
          Ascendant: {ZODIAC_SYMBOLS[asc.signIndex]} {asc.sign} ({asc.signMy}) · {asc.degree.toFixed(2)}°
          {c.ayanamsa ? <> · Ayanamsa {c.ayanamsa}°</> : null}
        </div>
      </GlassCard>

      {/* Planet table */}
      <GlassCard className="p-5">
        <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2"><Star className="w-3.5 h-3.5 text-gold" /> Planetary Positions</div>
        <div className="space-y-1.5">
          {planets.map((p: any) => (
            <div key={p.name} className="flex items-center gap-2 sm:gap-3 text-[12px] sm:text-[13px] py-1.5 border-b border-white/5 last:border-0">
              <span className="w-5 sm:w-6 text-center text-gold text-sm sm:text-base">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
              <span className="w-16 sm:w-20 text-ink">{p.name}</span>
              <span className="w-5 sm:w-6 text-center">{ZODIAC_SYMBOLS[p.signIndex]}</span>
              <span className="flex-1 text-ink-muted text-[10px] sm:text-[12px] truncate">{p.sign}<span className="hidden sm:inline">{p.signMy ? ` · ${p.signMy}` : ""}</span> · {p.degree.toFixed(1)}°</span>
              <span className="w-7 sm:w-8 text-center text-[9px] sm:text-[10px] text-ink-muted">H{p.house}</span>
              {p.retrograde && <span className="text-[9px] text-amber-400">℞</span>}
              {p.dignity && p.dignity !== "neutral" && <Pill variant={p.dignity === "exalted" ? "gold" : "leaf"} className="text-[8px] sm:text-[9px]">{p.dignity}</Pill>}
            </div>
          ))}
        </div>
      </GlassCard>

      {/* Dasha + Nakshatra */}
      {mode === "vedic" && c.dasha && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2"><Sparkles className="w-3.5 h-3.5 text-gold" /> Vimshottari Dasha</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <Stat label="Moon Nakshatra" value={`${c.nakshatra} (pada ${c.nakshatraPada})`} />
            <Stat label="Birth Dasha" value={`${c.dasha.birth_dasha.lord} · ${c.dasha.birth_dasha.balance_years}y left`} />
            <Stat label="Current Mahadasha" value={c.dasha.current_mahadasha} />
          </div>
          <div className="flex gap-1 overflow-x-auto lum-no-scrollbar pb-1">
            {c.dasha.mahadashas.map((d: any, i: number) => (
              <div key={i} className={`shrink-0 px-2.5 py-1.5 rounded-lg text-[10px] border ${d.lord === c.dasha.current_mahadasha ? "border-gold/30 bg-gold/10 text-gold" : "border-white/5 bg-white/[0.02] text-ink-muted"}`}>
                <div className="font-medium">{d.lord}</div>
                <div>{d.years.toFixed(1)}y</div>
              </div>
            ))}
          </div>
        </GlassCard>
      )}

      {/* Panchanga */}
      {c.panchanga && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3">Panchanga (Today)</div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            <Stat label="Tithi" value={c.panchanga.tithi} />
            <Stat label="Nakshatra" value={c.panchanga.nakshatra} />
            <Stat label="Yoga" value={String(c.panchanga.yoga)} />
            <Stat label="Karana" value={String(c.panchanga.karana)} />
          </div>
        </GlassCard>
      )}

      {/* Navamsa (D-9) divisional chart */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Navamsa (D-9) — Marriage & Dharma
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const nav = computeNavamsa(c);
              return nav.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[11px] text-ink-muted mt-2">
            Ascendant: {ZODIAC_SYMBOLS[computeNavamsa(c).ascendant.signIndex]} {computeNavamsa(c).ascendant.sign}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">The D-9 confirms the strength of the D-1 for marriage, relationships & dharma.</div>
        </GlassCard>
      )}

      {/* Dasamsa (D-10) — career */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Dasamsa (D-10) — Career & Profession
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d10 = computeDasamsa(c);
              return d10.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-10 reveals career potential, professional success & public standing.</div>
        </GlassCard>
      )}

      {/* Saptamsa (D-7) — children */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Saptamsa (D-7) — Children & Progeny
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d7 = computeSaptamsa(c);
              return d7.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-7 shows the promise and nature of children, creative output & legacy.</div>
        </GlassCard>
      )}

      {/* Hora (D-2) — wealth */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Hora (D-2) — Wealth & Resources
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d2 = computeHora(c);
              return d2.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-2 reveals wealth potential, financial resources & material well-being.</div>
        </GlassCard>
      )}

      {/* Dwadasamsa (D-12) — parents */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Dwadasamsa (D-12) — Parents & Ancestry
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d12 = computeDwadasamsa(c);
              return d12.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-12 shows the influence of parents, family lineage & ancestral karma.</div>
        </GlassCard>
      )}

      {/* Drekkana (D-3) — siblings */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Drekkana (D-3) — Siblings & Courage
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d3 = computeDrekkana(c);
              return d3.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-3 reveals siblings, courage, self-effort & inner drive.</div>
        </GlassCard>
      )}

      {/* Chaturthamsa (D-4) — property */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Chaturthamsa (D-4) — Property & Residence
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d4 = computeChaturthamsa(c);
              return d4.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-4 shows property, fixed assets, residence & land fortune.</div>
        </GlassCard>
      )}

      {/* Shodasamsa (D-16) — vehicles */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Shodasamsa (D-16) — Vehicles & Comforts
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d16 = computeShodasamsa(c);
              return d16.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-16 reveals vehicles, comforts, conveniences & material enjoyments.</div>
        </GlassCard>
      )}

      {/* Vimsamsa (D-20) — spiritual */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Vimsamsa (D-20) — Spiritual Practices
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d20 = computeVimsamsa(c);
              return d20.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-20 shows spiritual pursuits, religious inclinations & inner growth.</div>
        </GlassCard>
      )}

      {/* Chaturvimsamsa (D-24) — education */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Chaturvimsamsa (D-24) — Education & Knowledge
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d24 = computeChaturvimsamsa(c);
              return d24.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-24 reveals education, learning, knowledge & intellectual pursuits.</div>
        </GlassCard>
      )}

      {/* Trimsamsa (D-30) — misfortunes */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Trimsamsa (D-30) — Struggles & Hidden Matters
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d30 = computeTrimsamsa(c);
              return d30.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-30 shows challenges, hidden forces & areas of potential difficulty to transform.</div>
        </GlassCard>
      )}

      {/* Khavedamsa (D-40) — auspicious/inauspicious */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Khavedamsa (D-40) — Auspicious & Inauspicious Effects
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d40 = computeKhavedamsa(c);
              return d40.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-40 reveals overall auspicious and inauspicious patterns in life.</div>
        </GlassCard>
      )}

      {/* Akshavedamsa (D-45) — general well-being */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Akshavedamsa (D-45) — General Well-being
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d45 = computeAkshavedamsa(c);
              return d45.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-45 indicates all general matters and overall life well-being.</div>
        </GlassCard>
      )}

      {/* Shashtiamsa (D-60) — past karma */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Shashtiamsa (D-60) — Past Life Karma
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {(() => {
              const d60 = computeShashtiamsa(c);
              return d60.planets.map((p) => (
                <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                  <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                  <span className="text-ink">{p.name}</span>
                  <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                </div>
              ));
            })()}
          </div>
          <div className="text-[10px] text-ink-muted/60 mt-1">D-60 reveals karma from past lives & all hidden matters. The most important chart after D-1.</div>
        </GlassCard>
      )}

      {/* Ashtakavarga (BAV + SAV) */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Ashtakavarga — Bindu Scores (SAV total: {computeAshtakavarga(c).savTotal})
          </div>
          {(() => {
            const av = computeAshtakavarga(c);
            return (
              <>
                <div className="grid grid-cols-6 sm:grid-cols-12 gap-1 mb-3">
                  {av.sav.map((bindus, i) => (
                    <div key={i} className="text-center p-1 rounded bg-white/[0.02]">
                      <div className="text-[8px] text-ink-muted">{ZODIAC_SYMBOLS[i]}</div>
                      <div className={cn("text-[11px] font-medium", bindus >= 28 ? "text-leaf" : bindus < 25 ? "text-destructive" : "text-ink")}>{bindus}</div>
                    </div>
                  ))}
                </div>
                {av.strong.length > 0 && (
                  <div className="text-[10px] text-leaf mb-1">Strong: {av.strong.map((s) => `${s.sign} (${s.bindus})`).join(", ")}</div>
                )}
                {av.weak.length > 0 && (
                  <div className="text-[10px] text-destructive/70">Weak: {av.weak.map((s) => `${s.sign} (${s.bindus})`).join(", ")}</div>
                )}
                <div className="text-[9px] text-ink-muted/60 mt-1">SAV shows overall sign strength. 28+ = strong, below 25 = weak (out of 337 total bindus).</div>
              </>
            );
          })()}
        </GlassCard>
      )}

      {/* Shadbala (6-fold planetary strength) */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-gold" />
            Shadbala — Planetary Strength (6-fold)
          </div>
          {(() => {
            const sb = computeShadbala(c);
            return (
              <div className="space-y-1.5">
                {sb.planets.map((p) => (
                  <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                    <span className="text-gold">{PLANET_SYMBOLS[p.name] ?? "•"}</span>
                    <span className="text-ink w-16">{p.name}</span>
                    <div className="flex-1 grid grid-cols-6 gap-0.5 text-center">
                      <span className="text-[8px] text-ink-muted" title="Sthana">{p.sthana}</span>
                      <span className="text-[8px] text-ink-muted" title="Dig">{p.dig}</span>
                      <span className="text-[8px] text-ink-muted" title="Kala">{p.kala}</span>
                      <span className="text-[8px] text-ink-muted" title="Chesta">{p.chesta}</span>
                      <span className="text-[8px] text-ink-muted" title="Naisargika">{p.naisargika}</span>
                      <span className="text-[8px] text-ink-muted" title="Drik">{p.drik}</span>
                    </div>
                    <span className="text-[10px] text-ink w-8 text-right">{p.totalRasis}R</span>
                    <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", p.strength === "excellent" ? "bg-leaf/15 text-leaf" : p.strength === "good" ? "bg-gold/15 text-gold" : p.strength === "average" ? "bg-white/5 text-ink-muted" : "bg-destructive/15 text-destructive")}>{p.strength}</span>
                  </div>
                ))}
                <div className="text-[9px] text-ink-muted/60 mt-1 grid grid-cols-6 gap-0.5 text-center pl-[88px]">
                  <span>Sth</span><span>Dig</span><span>Kala</span><span>Che</span><span>Nai</span><span>Drik</span>
                </div>
              </div>
            );
          })()}
        </GlassCard>
      )}

      {/* Solar Return (Varshaphal) — year ahead */}
      {mode === "vedic" && (
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2">
            <Sun className="w-3.5 h-3.5 text-gold" />
            Solar Return (Varshaphal) — Your Year Ahead
          </div>
          {(() => {
            const sr = computeSolarReturn({ dob: c.meta.birth_datetime.slice(0, 10), tob: "12:00", latitude: c.meta.latitude, longitude: c.meta.longitude, timezone: c.meta.timezone }, c);
            if (!sr.planets.length) return <div className="text-[12px] text-ink-muted">Could not compute solar return.</div>;
            return (
              <>
                <div className="text-[11px] text-ink-muted mb-2">Return date: {sr.returnDate} · Sun in {sr.sunSign}</div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  {sr.planets.map((p) => (
                    <div key={p.name} className="flex items-center gap-2 text-[11px] py-1 px-2 rounded-lg bg-white/[0.02]">
                      <span className="text-gold">{p.symbol}</span>
                      <span className="text-ink">{p.name}</span>
                      <span className="text-ink-muted ml-auto">{ZODIAC_SYMBOLS[p.signIndex]}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-ink-muted/60 mt-1">Varshaphal shows the themes and energies for your current solar year.</div>
              </>
            );
          })()}
        </GlassCard>
      )}
    </div>
  );
}

function ChartWheel({ chart }: { chart: any }) {
  const planets = [...(chart.planets || []), chart.ascendant];
  const size = 280;
  const cx = size / 2, cy = size / 2;
  const rOuter = size / 2 - 4, rInner = size / 2 - 30, rInnerMost = size / 2 - 60;
  // 12 sign divisions
  const signs = Array.from({ length: 12 }, (_, i) => {
    const a0 = (i * 30 - 90) * Math.PI / 180;
    const a1 = ((i + 1) * 30 - 90) * Math.PI / 180;
    return { i, a0, a1, mid: (a0 + a1) / 2 };
  });
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="overflow-visible">
      <circle cx={cx} cy={cy} r={rOuter} fill="none" stroke="rgba(197,168,124,0.3)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInner} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
      <circle cx={cx} cy={cy} r={rInnerMost} fill="none" stroke="rgba(255,255,255,0.04)" strokeWidth="1" />
      {signs.map((s) => (
        <g key={s.i}>
          <line x1={cx + rOuter * Math.cos(s.a0)} y1={cy + rOuter * Math.sin(s.a0)} x2={cx + rInner * Math.cos(s.a0)} y2={cy + rInner * Math.sin(s.a0)} stroke="rgba(255,255,255,0.1)" strokeWidth="1" />
          <text x={cx + (rOuter - 14) * Math.cos(s.mid)} y={cy + (rOuter - 14) * Math.sin(s.mid)} fill="#C5A87C" fontSize="14" textAnchor="middle" dominantBaseline="central">{ZODIAC_SYMBOLS[s.i]}</text>
        </g>
      ))}
      {/* planets */}
      {planets.map((p: any, i: number) => {
        const angle = (p.signIndex * 30 + p.degree - 90) * Math.PI / 180;
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

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-ink-muted uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-[13px] text-ink">{value}</div>
    </div>
  );
}
