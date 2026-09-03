"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Sparkles, Moon, Star, Sun, Flame, Gift, ChevronRight, Heart, Calendar,
  TrendingUp, Wallet, Target, Compass, BookOpen, Share2, Snowflake, Clock,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ZODIAC_SYMBOLS, ZODIAC_MY } from "@/lib/astrology";

export function TodayView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [cardOfDay, setCardOfDay] = React.useState<any>(null);
  const [mood, setMood] = React.useState<any>(null);
  const [goals, setGoals] = React.useState<any[]>([]);
  const [loadingCard, setLoadingCard] = React.useState(false);
  const [activity, setActivity] = React.useState<any[]>([]);
  const [lucky, setLucky] = React.useState<any>(null);
  const [moon, setMoon] = React.useState<any>(null);
  const [muhurta, setMuhurta] = React.useState<any>(null);
  const [transits, setTransits] = React.useState<any>(null);
  const [gemstones, setGemstones] = React.useState<any>(null);
  const [nakshatra, setNakshatra] = React.useState<any>(null);
  const [mantras, setMantras] = React.useState<any>(null);
  const [yogas, setYogas] = React.useState<any>(null);
  const [tithi, setTithi] = React.useState<any>(null);
  const [namkaran, setNamkaran] = React.useState<any>(null);
  const [yadaya, setYadaya] = React.useState<any>(null);
  const [yogaToday, setYogaToday] = React.useState<any>(null);
  const [karana, setKarana] = React.useState<any>(null);
  const [panchasara, setPanchasara] = React.useState<any>(null);
  const [forecast, setForecast] = React.useState<any>(null);
  const [shraaddha, setShraaddha] = React.useState<any>(null);
  const [varshaphal, setVarshaphal] = React.useState<any>(null);
  const [marriageMatch, setMarriageMatch] = React.useState<any>(null);
  const [gochar, setGochar] = React.useState<any>(null);
  const [auspicious, setAuspicious] = React.useState<any>(null);
  const [planetaryHours, setPlanetaryHours] = React.useState<any>(null);
  const [taraBala, setTaraBala] = React.useState<any>(null);
  const [rahuKaal, setRahuKaal] = React.useState<any>(null);
  const [choghadiya, setChoghadiya] = React.useState<any>(null);
  const [nadi, setNadi] = React.useState<any>(null);
  const [dashaEffects, setDashaEffects] = React.useState<any>(null);
  const [grahaBala, setGrahaBala] = React.useState<any>(null);
  const [avastha, setAvastha] = React.useState<any>(null);
  const [panchaMahapurusha, setPanchaMahapurusha] = React.useState<any>(null);
  const [gocharPhala, setGocharPhala] = React.useState<any>(null);
  const [remedyTiming, setRemedyTiming] = React.useState<any>(null);
  const [arishta, setArishta] = React.useState<any>(null);
  const [ishtaDevata, setIshtaDevata] = React.useState<any>(null);
  const [spiritualPractice, setSpiritualPractice] = React.useState<any>(null);
  const [argala, setArgala] = React.useState<any>(null);
  const [drishti, setDrishti] = React.useState<any>(null);
  const [aspectsToday, setAspectsToday] = React.useState<any>(null);

  // Load card of day
  React.useEffect(() => {
    if (!user) return;
    setLoadingCard(true);
    fetch("/api/tarot/card-of-day").then((r) => r.json()).then((d) => setCardOfDay(d.reading)).catch(() => {}).finally(() => setLoadingCard(false));
    fetch("/api/mood").then((r) => r.json()).then((d) => { setMood(d.today); setGoals(d.goals || []); }).catch(() => {});
    fetch("/api/manifest/goals").then((r) => r.json()).then((d) => setGoals(d.goals || [])).catch(() => {});
    // Load 7-day activity from multi-source activity API
    fetch("/api/activity").then((r) => r.json()).then((d) => { setActivity(d.days || []); }).catch(() => {});
    // Load lucky numbers
    fetch("/api/lucky").then((r) => r.json()).then((d) => { setLucky(d.lucky); }).catch(() => {});
    // Load moon phase
    fetch("/api/moon").then((r) => r.json()).then((d) => { setMoon(d.moon); }).catch(() => {});
    // Load muhurta (auspicious time)
    fetch("/api/muhurta").then((r) => r.json()).then((d) => { setMuhurta(d.muhurta); }).catch(() => {});
    // Load transits
    fetch("/api/transits").then((r) => r.json()).then((d) => { setTransits(d.transits); }).catch(() => {});
    // Load gemstone recommendations
    fetch("/api/gemstones").then((r) => r.json()).then((d) => { setGemstones(d.gemstones); }).catch(() => {});
    // Load today's nakshatra
    fetch("/api/nakshatra").then((r) => r.json()).then((d) => { setNakshatra(d.nakshatra); }).catch(() => {});
    // Load mantra recommendations
    fetch("/api/mantra").then((r) => r.json()).then((d) => { setMantras(d.mantras); }).catch(() => {});
    // Load yogas
    fetch("/api/yogas").then((r) => r.json()).then((d) => { setYogas(d.yogas); }).catch(() => {});
    // Load today's tithi
    fetch("/api/tithi").then((r) => r.json()).then((d) => { setTithi(d.tithi); }).catch(() => {});
    // Load namkaran (naming suggestions)
    fetch("/api/namkaran").then((r) => r.json()).then((d) => { setNamkaran(d.namkaran); }).catch(() => {});
    // Load yadaya (remedial measures)
    fetch("/api/yadaya").then((r) => r.json()).then((d) => { setYadaya(d.yadaya); }).catch(() => {});
    // Load today's yoga
    fetch("/api/yoga-today").then((r) => r.json()).then((d) => { setYogaToday(d.yoga); }).catch(() => {});
    // Load today's karana
    fetch("/api/karana").then((r) => r.json()).then((d) => { setKarana(d.karana); }).catch(() => {});
    // Load panchasara (5-fold remedy)
    fetch("/api/panchasara").then((r) => r.json()).then((d) => { setPanchasara(d.panchasara); }).catch(() => {});
    // Load weekly forecast
    fetch("/api/weekly-forecast").then((r) => r.json()).then((d) => { setForecast(d.forecast); }).catch(() => {});
    // Load shraaddha recommendations
    fetch("/api/shraaddha").then((r) => r.json()).then((d) => { setShraaddha(d.shraaddha); }).catch(() => {});
    // Load varshaphal (year ahead)
    fetch("/api/varshaphal").then((r) => r.json()).then((d) => { setVarshaphal(d.varshaphal); }).catch(() => {});
    // Load marriage match
    fetch("/api/marriage-match").then((r) => r.json()).then((d) => { setMarriageMatch(d.match); }).catch(() => {});
    // Load gochar (transit predictions)
    fetch("/api/gochar").then((r) => r.json()).then((d) => { setGochar(d.gochar); }).catch(() => {});
    // Load auspicious activities
    fetch("/api/auspicious").then((r) => r.json()).then((d) => { setAuspicious(d.auspicious); }).catch(() => {});
    // Load planetary hours
    fetch("/api/planetary-hours").then((r) => r.json()).then((d) => { setPlanetaryHours(d.hours); }).catch(() => {});
    // Load tara bala
    fetch("/api/tara-bala").then((r) => r.json()).then((d) => { setTaraBala(d.taraBala); }).catch(() => {});
    // Load rahu kaal
    fetch("/api/rahu-kaal").then((r) => r.json()).then((d) => { setRahuKaal(d.rahuKaal); }).catch(() => {});
    // Load choghadiya
    fetch("/api/choghadiya").then((r) => r.json()).then((d) => { setChoghadiya(d.choghadiya); }).catch(() => {});
    // Load nadi
    fetch("/api/nadi").then((r) => r.json()).then((d) => { setNadi(d.nadi); }).catch(() => {});
    // Load dasha effects
    fetch("/api/dasha-effects").then((r) => r.json()).then((d) => { setDashaEffects(d.dashaEffects); }).catch(() => {});
    // Load graha bala
    fetch("/api/graha-bala").then((r) => r.json()).then((d) => { setGrahaBala(d.grahaBala); }).catch(() => {});
    // Load avastha
    fetch("/api/avastha").then((r) => r.json()).then((d) => { setAvastha(d.avastha); }).catch(() => {});
    // Load pancha mahapurusha
    fetch("/api/pancha-mahapurusha").then((r) => r.json()).then((d) => { setPanchaMahapurusha(d.yogas); }).catch(() => {});
    // Load gochar phala
    fetch("/api/gochar-phala").then((r) => r.json()).then((d) => { setGocharPhala(d.gocharPhala); }).catch(() => {});
    // Load remedy timing
    fetch("/api/remedy-timing").then((r) => r.json()).then((d) => { setRemedyTiming(d.timing); }).catch(() => {});
    // Load arishta (afflictions)
    fetch("/api/arishta").then((r) => r.json()).then((d) => { setArishta(d.arishta); }).catch(() => {});
    // Load ishta devata
    fetch("/api/ishta-devata").then((r) => r.json()).then((d) => { setIshtaDevata(d.ishtaDevata); }).catch(() => {});
    // Load spiritual practice
    fetch("/api/spiritual-practice").then((r) => r.json()).then((d) => { setSpiritualPractice(d.practice); }).catch(() => {});
    // Load argala
    fetch("/api/argala").then((r) => r.json()).then((d) => { setArgala(d.argala); }).catch(() => {});
    // Load drishti
    fetch("/api/drishti").then((r) => r.json()).then((d) => { setDrishti(d.drishti); }).catch(() => {});
    // Load aspects today
    fetch("/api/aspects-today").then((r) => r.json()).then((d) => { setAspectsToday(d.aspects); }).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
        <div className="max-w-2xl mx-auto px-6 py-12 lg:py-20">
          {/* The one distinctive moment — serif headline, no card chrome */}
          <div className="lum-reveal">
            <div className="text-[13px] text-[#6B6358] mb-3">
              {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
            </div>
            <h1 className="serif-display text-[2.75rem] sm:text-[3.5rem] leading-[1.05] text-[#E8E2D5] mb-5 tracking-tight">
              Read the sky<br />like a page.
            </h1>
            <p className="t-body-lg text-[#9C9489] max-w-md leading-[1.7] mb-10">
              Baydin is a daily astrologer, tarot reader, and ritual companion. Vedic, Western, and Myanmar Mahabote traditions, drawn from your birth chart and the moon overhead.
            </p>
            <button
              onClick={onAuth}
              className="inline-flex items-center gap-2 py-3 px-6 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition focus-ring rounded-sm"
            >
              Begin
              <ChevronRight className="w-4 h-4" />
            </button>
            <div className="mt-3 text-[12px] text-[#6B6358]">5 Luck to start. No card required.</div>
          </div>

          {/* Hairline divider */}
          <hr className="rule-h my-12" />

          {/* Three pillars — editorial, not card grid */}
          <div className="space-y-8">
            <Pillar
              n="i"
              title="Today's sky"
              body="Moon phase, nakshatra, tithi. The panchanga of the moment, computed from the same ephemeris used for natal charts."
            />
            <Pillar
              n="ii"
              title="Draw a card"
              body="Tarot grounded in your question and the chart overhead — not a random pull, but a considered reading."
            />
            <Pillar
              n="iii"
              title="Keep a practice"
              body="Manifest, ritual, frequencies, dream journal. Small daily gestures that compound into a pattern you can read back."
            />
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        {/* Hero — serif greeting, sentence-case date, no ALL-CAPS eyebrow */}
        <div className="mb-8 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">
            {dateStr}
          </div>
          <h1 className="serif-display text-[1.75rem] sm:text-[2.25rem] leading-[1.15] text-[#E8E2D5] mb-1.5 tracking-tight">
            {greeting()}, {user.name?.split(" ")[0] || user.email.split("@")[0]}.
          </h1>
          <p className="t-body text-[#9C9489]">
            {user.streak > 0 ? `${user.streak}-day streak. Keep it alive.` : "Begin your daily practice — claim your free Luck below."}
          </p>
        </div>

        {/* Recommended practice (personalized) */}
        <RecommendedPractice
          ritualDone={activity[6]?.activities?.ritual ?? false}
          moodDone={activity[6]?.activities?.mood ?? false}
          manifestDone={goals.every((g) => g.confirmedToday) && goals.length > 0}
          tarotDone={(activity[6]?.activities?.tarot ?? 0) > 0}
          streak={user.streak}
          onNavigate={setView}
        />

        {/* Quick actions grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <QuickAction icon={Sparkles} label="Ask Astrologer" desc="Chat" onClick={() => setView("chat")} />
          <QuickAction icon={Star} label="Draw Tarot" desc="Free daily" onClick={() => setView("tarot")} />
          <QuickAction icon={Moon} label="Horoscope" desc="Daily stars" onClick={() => setView("horoscope")} />
          <QuickAction icon={Target} label="Manifest" desc="Confirm goals" onClick={() => setView("manifest")} badge={goals.filter((g) => !g.confirmedToday).length} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card of the Day — large left */}
          <div className="lg:col-span-2 space-y-4">
            {/* Weekly practice summary */}
            {activity.length > 0 && (
              <GlassCard className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <TrendingUp className="w-4 h-4 text-leaf" />
                  <span className="text-[11px] uppercase tracking-[0.15em] text-ink-muted hidden sm:inline">This Week</span>
                </div>
                <div className="flex items-center gap-4 flex-1 overflow-x-auto lum-no-scrollbar">
                  <WeeklyStat label="Actions" value={activity.reduce((s: number, d: any) => s + (d?.total ?? 0), 0)} color="#C5A87C" />
                  <WeeklyStat label="Active days" value={activity.filter((d: any) => (d?.total ?? 0) > 0).length} color="#B5CD7E" />
                  <WeeklyStat label="Tarot" value={activity.reduce((s: number, d: any) => s + (d?.activities?.tarot ?? 0), 0)} color="#9E8AC9" />
                  <WeeklyStat label="Chat" value={activity.reduce((s: number, d: any) => s + (d?.activities?.chat ?? 0), 0)} color="#5FA9C7" />
                </div>
              </GlassCard>
            )}

            {/* Card of the day */}
            <GlassCard className="p-5 relative overflow-hidden">
              <div className="lum-glow-gold absolute inset-0 opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Card of the Day</span>
                  </div>
                  <Pill variant="leaf" className="text-[10px]">Free</Pill>
                </div>
                {loadingCard ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-24 bg-white/5 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                  </div>
                ) : cardOfDay ? (
                  <CardOfDayCard reading={cardOfDay} />
                ) : (
                  <div className="text-[13px] text-ink-muted">Could not load card of the day.</div>
                )}
              </div>
            </GlassCard>

            {/* Today's planetary transits */}
            {transits?.positions?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's Transits</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {transits.positions.slice(0, 7).map((p: any, i: number) => (
                    <div key={i} className="text-center p-1.5 rounded-lg bg-white/[0.02]">
                      <div className="text-base">{p.symbol}</div>
                      <div className="text-[8px] text-ink-muted uppercase">{p.name}</div>
                      <div className="text-[10px] text-gold">{p.signMy || p.sign}</div>
                      {p.retrograde && <span className="text-[8px] text-amber-400">℞</span>}
                    </div>
                  ))}
                </div>
                {transits.aspects?.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[9px] uppercase tracking-wide text-ink-muted mb-1">Aspects to your chart</div>
                    <div className="space-y-0.5">
                      {transits.aspects.slice(0, 3).map((a: string, i: number) => (
                        <div key={i} className="text-[10px] text-ink-muted">• {a}</div>
                      ))}
                    </div>
                  </div>
                )}
              </GlassCard>
            )}

            {/* Gemstone recommendations */}
            {gemstones?.recommendations?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Your Gemstones</span>
                </div>
                <div className="space-y-2">
                  {gemstones.recommendations.map((g: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 flex items-center justify-center text-[10px] text-gold shrink-0">
                        {g.gem[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-ink">{g.gem} <span className="text-[9px] text-ink-muted">({g.color})</span></div>
                        <div className="text-[10px] text-ink-muted">{g.benefit}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[9px] text-gold">{g.planet}</div>
                        <div className="text-[8px] text-ink-muted">{g.finger}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Mantra recommendations */}
            {mantras?.recommendations?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's Mantras</span>
                </div>
                <div className="space-y-2">
                  {mantras.recommendations.slice(0, 3).map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] text-gold font-medium">{m.sanskrit}</span>
                        <span className="text-[9px] text-ink-muted">{m.countMy}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">{m.meaning}</div>
                      <div className="text-[9px] text-ink-muted/60 mt-0.5">{m.reason}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Yoga detection */}
            {yogas?.detected?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Your Yogas</span>
                  </div>
                  <span className="text-[10px] text-gold">{yogas.count} found</span>
                </div>
                <div className="space-y-2">
                  {yogas.detected.slice(0, 5).map((y: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] text-ink font-medium">{y.name}</span>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", y.strength === "strong" ? "bg-leaf/15 text-leaf" : y.strength === "moderate" ? "bg-gold/15 text-gold" : "bg-white/5 text-ink-muted")}>{y.strength}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">{y.effect}</div>
                      <div className="text-[9px] text-ink-muted/60 mt-0.5">{y.planets}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Namkaran (naming suggestions) */}
            {namkaran && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Namkaran — Name Suggestions</span>
                </div>
                <div className="text-[11px] text-ink-muted mb-2">
                  Based on {namkaran.nakshatra} pada {namkaran.pada}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-ink-muted">Starting letters:</span>
                  {namkaran.startingLetters.map((l: string, i: number) => (
                    <span key={i} className={cn("px-2 py-0.5 rounded-full text-[10px] border", i === namkaran.pada - 1 ? "border-gold/30 bg-gold/10 text-gold" : "border-white/5 text-ink-muted")}>{l}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {namkaran.sampleNames.map((n: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-ink">{n}</span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Yadaya (remedial measures) */}
            {yadaya?.remedies?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Yadaya — Remedies</span>
                  </div>
                  <span className="text-[10px] text-gold">{yadaya.count} needed</span>
                </div>
                <div className="space-y-2">
                  {yadaya.remedies.slice(0, 3).map((r: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="text-[12px] text-gold font-medium mb-0.5">{r.planet}</div>
                      <div className="text-[10px] text-ink-muted mb-1.5">{r.problem}</div>
                      <div className="grid grid-cols-2 gap-1">
                        {r.remedies.map((rem: any, j: number) => (
                          <div key={j} className="text-[9px] text-ink-muted">
                            <span className="text-gold/70">{rem.type}:</span> {rem.detail}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Panchasara (5-fold remedy) */}
            {panchasara && panchasara.status === "remedy_needed" && panchasara.remedies?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Panchasara — 5-Fold Remedy</span>
                  </div>
                  <span className="text-[10px] text-gold">for {panchasara.planet}</span>
                </div>
                <div className="text-[10px] text-ink-muted mb-3">{panchasara.problem}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {panchasara.remedies.map((r: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{r.icon}</span>
                        <span className="text-[11px] text-gold font-medium">{r.name}</span>
                        <span className="text-[9px] text-ink-muted/60">{r.sanskrit}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted leading-relaxed">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
            {panchasara && panchasara.status === "balanced" && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-leaf" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Panchasara — Chart Balanced</span>
                </div>
                <div className="text-[12px] text-leaf leading-relaxed">{panchasara.message}</div>
              </GlassCard>
            )}

            {/* Weekly forecast */}
            {forecast?.days?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">7-Day Forecast</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    {forecast.bestDay && <span className="text-leaf">Best: {forecast.bestDay.dayName}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {forecast.days.map((day: any, i: number) => (
                    <div key={i} className="text-center p-1.5 rounded-lg bg-white/[0.02]">
                      <div className="text-[9px] text-ink-muted">{day.dayName.slice(0, 3)}</div>
                      <div className={cn("text-[11px] font-medium my-0.5", day.rating >= 5 ? "text-leaf" : day.rating >= 4 ? "text-gold" : day.rating >= 3 ? "text-ink" : "text-destructive/70")}>
                        {"★".repeat(Math.min(day.rating, 5))}
                      </div>
                      <div className="text-[8px] text-ink-muted leading-tight">{day.mood.split(" ")[0]}</div>
                    </div>
                  ))}
                </div>
                {forecast.challengingDay && (
                  <div className="text-[10px] text-destructive/60 mt-2">Challenging: {forecast.challengingDay.dayName} — {forecast.challengingDay.mood}</div>
                )}
              </GlassCard>
            )}

            {/* Shraaddha (ancestral rites) */}
            {shraaddha && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Shraaddha — Ancestral Rites</span>
                </div>
                <div className="text-[12px] text-ink mb-2 leading-relaxed">{shraaddha.practice}</div>
                {shraaddha.indicators?.length > 0 && (
                  <div className="space-y-0.5 mb-3">
                    {shraaddha.indicators.slice(0, 2).map((ind: string, i: number) => (
                      <div key={i} className="text-[10px] text-ink-muted">• {ind}</div>
                    ))}
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5">Simple remedies</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {shraaddha.remedies?.slice(0, 4).map((r: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-[10px] text-gold font-medium">{r.name} <span className="text-[8px] text-ink-muted">({r.timing})</span></div>
                      <div className="text-[9px] text-ink-muted leading-relaxed">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Varshaphal (year ahead) */}
            {varshaphal && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Varshaphal — Year Ahead</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 flex items-center justify-center text-[16px] font-light text-gold shrink-0">
                    {varshaphal.age}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-ink">Age {varshaphal.age} · Muntha in {varshaphal.munthaSign}</div>
                    <div className="text-[10px] text-gold">Year Lord: {varshaphal.yearLord}</div>
                    <div className="text-[10px] text-ink-muted">{varshaphal.effect}</div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {varshaphal.themes?.map((t: string, i: number) => (
                    <div key={i} className="text-[10px] text-ink-muted">• {t}</div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Marriage matching */}
            {marriageMatch && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Marriage Matching</span>
                </div>
                <div className="text-[11px] text-ink-muted mb-2">Based on {marriageMatch.yourNakshatra} nakshatra</div>
                <div className="space-y-2">
                  {Object.values(marriageMatch.checks || {}).map((check: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-gold font-medium">{check.name}</span>
                      </div>
                      <div className="text-[9px] text-ink-muted mb-1">{check.desc}</div>
                      <div className="text-[9px] text-ink-muted/70">{check.status}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Gochar (transit predictions) */}
            {gochar?.predictions?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Gochar — Transit Predictions</span>
                </div>
                <div className="space-y-1.5">
                  {gochar.keyTransits?.map((p: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <span className="text-gold text-[11px] font-medium shrink-0 w-16">{p.planet}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-ink">House {p.houseFromAsc} · {p.sign}</div>
                        <div className="text-[9px] text-ink-muted leading-relaxed">{p.prediction}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Auspicious activities */}
            {auspicious?.activities?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's Activities</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-leaf">{auspicious.summary.favorable} favorable</span>
                    <span className="text-destructive/70">{auspicious.summary.avoid} avoid</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {auspicious.activities.map((a: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 p-2 rounded-lg", a.status === "favorable" ? "bg-leaf/[0.04]" : a.status === "avoid" ? "bg-destructive/[0.04]" : "bg-white/[0.02]")}>
                      <span className={cn("w-2 h-2 rounded-full shrink-0", a.status === "favorable" ? "bg-leaf" : a.status === "avoid" ? "bg-destructive" : "bg-white/20")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-ink truncate">{a.name}</div>
                        <div className="text-[9px] text-ink-muted truncate">{a.note}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Tara Bala (9-fold nakshatra compatibility) */}
            {taraBala?.currentTara && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Tara Bala</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", taraBala.currentTara.nature === "auspicious" ? "bg-leaf/15 text-leaf" : "bg-destructive/15 text-destructive")}>
                    {taraBala.currentTara.name} (#{taraBala.currentTara.number}/9)
                  </span>
                </div>
                <div className="text-[11px] text-ink mb-1">Birth: {taraBala.birthNakshatra} · Today: {taraBala.todayNakshatra}</div>
                <div className="text-[10px] text-ink-muted mb-3">{taraBala.currentTara.effect}</div>
                <div className="flex items-center gap-1 mb-2">
                  {taraBala.dailyForecast?.slice(0, 9).map((d: any, i: number) => (
                    <div key={i} className={cn("shrink-0 px-1.5 py-1 rounded text-[8px] text-center", i === 0 ? "ring-1 ring-gold/30" : "", d.nature === "auspicious" ? "bg-leaf/[0.06] text-leaf" : "bg-destructive/[0.06] text-destructive/70")} title={d.taraName}>
                      {d.day.slice(0, 1)}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-ink-muted">{taraBala.recommendation}</div>
              </GlassCard>
            )}

            {/* Nadi (pulse/dosha) */}
            {nadi && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Nadi — {nadi.nadiName}</span>
                  </div>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", nadi.dosha === "Vata" ? "bg-purple-500/15 text-purple-300" : nadi.dosha === "Pitta" ? "bg-destructive/15 text-destructive" : "bg-leaf/15 text-leaf")}>
                    {nadi.dosha} · {nadi.element}
                  </span>
                </div>
                <div className="text-[11px] text-ink mb-1">Nakshatra: {nadi.nakshatra} · Moon: {nadi.moonSign}</div>
                <div className="text-[10px] text-ink-muted mb-2">{nadi.temperament}</div>
                <div className="text-[10px] text-ink-muted mb-2"><span className="text-gold">Health:</span> {nadi.health}</div>
                <div className="text-[10px] text-ink-muted mb-2"><span className="text-gold">Spiritual:</span> {nadi.spiritual}</div>
                <div className="text-[10px] text-ink-muted mb-1"><span className="text-gold">Marriage:</span> {nadi.incompatible}</div>
                <div className="text-[10px] text-ink-muted"><span className="text-gold">Remedies:</span> {nadi.remedies[0]}</div>
              </GlassCard>
            )}

            {/* Dasha effects */}
            {dashaEffects?.current && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Dasha Effects</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", dashaEffects.current.placementEffect === "beneficial" ? "bg-leaf/15 text-leaf" : dashaEffects.current.placementEffect === "challenging" ? "bg-destructive/15 text-destructive" : "bg-gold/15 text-gold")}>
                    {dashaEffects.current.mahadasha}
                  </span>
                </div>
                <div className="text-[12px] text-ink mb-1">{dashaEffects.current.general}</div>
                <div className="text-[10px] text-ink-muted mb-2">{dashaEffects.current.natalPlacement}</div>
                <div className="text-[10px] text-leaf mb-1">✓ {dashaEffects.current.beneficial}</div>
                <div className="text-[10px] text-destructive/70 mb-2">⚠ {dashaEffects.current.challenging}</div>
                <div className="text-[10px] text-gold">Remedy: {dashaEffects.current.remedies[0]}</div>
              </GlassCard>
            )}

            {/* Graha Bala (planetary power ranking) */}
            {grahaBala?.planets?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Graha Bala — Power Ranking</span>
                </div>
                <div className="space-y-1">
                  {grahaBala.planets.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-gold w-4">{i + 1}.</span>
                      <span className="text-base w-5 text-center">{p.symbol}</span>
                      <span className="text-ink w-16">{p.planet}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.power}%`, background: p.color }} />
                      </div>
                      <span className={cn("text-[9px] w-12 text-right", p.rating === "dominant" ? "text-leaf" : p.rating === "strong" ? "text-gold" : p.rating === "weak" ? "text-destructive/70" : "text-ink-muted")}>{p.power}</span>
                    </div>
                  ))}
                </div>
                {grahaBala.dominant && (
                  <div className="text-[10px] text-ink-muted mt-2">{grahaBala.dominant.summary}</div>
                )}
              </GlassCard>
            )}

            {/* Pancha Mahapurusha Yoga */}
            {panchaMahapurusha?.formedCount > 0 && (
              <GlassCard className="p-5 relative overflow-hidden">
                <div className="lum-glow-gold absolute inset-0 opacity-30" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Pancha Mahapurusha Yoga</span>
                  </div>
                  {panchaMahapurusha.formed.map((y: any, i: number) => (
                    <div key={i} className="mb-2 p-2 rounded-lg bg-gold/[0.04] border border-gold/10">
                      <div className="text-[12px] text-gold font-medium">{y.yoga} ({y.sanskrit})</div>
                      <div className="text-[10px] text-ink-muted">{y.qualities}</div>
                      <div className="text-[9px] text-ink-muted/60">{y.effects}</div>
                    </div>
                  ))}
                  <div className="text-[10px] text-gold/70">Exceptionally rare and auspicious!</div>
                </div>
              </GlassCard>
            )}

            {/* Gochar Phala (transit effects) */}
            {gocharPhala?.majorTransits?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Gochar Phala — Transit Effects</span>
                  </div>
                  <span className="text-[10px] text-ink-muted">{gocharPhala.beneficialCount} beneficial · {gocharPhala.challengingCount} challenging</span>
                </div>
                <div className="space-y-1.5">
                  {gocharPhala.majorTransits.map((t: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-gold font-medium">{t.planet}</span>
                        <span className="text-[9px] text-ink-muted">{t.duration}</span>
                      </div>
                      <div className="text-[10px] text-ink-muted">{t.sign} · {t.houseFromMoon}{ordinalSuffix(t.houseFromMoon)} from Moon</div>
                      <div className="text-[9px] text-ink-muted/70 mt-0.5">{t.houseEffect}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Remedy timing */}
            {remedyTiming?.recommendations?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Remedy Timing</span>
                </div>
                <div className="space-y-1">
                  {remedyTiming.recommendations.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className={cn("flex items-start gap-2 p-1.5 rounded-lg", r.priority === "high" ? "bg-gold/[0.04]" : "bg-white/[0.02]")}>
                      <span className={cn("text-[8px] px-1 py-0.5 rounded-full shrink-0", r.priority === "high" ? "bg-gold/15 text-gold" : "bg-white/5 text-ink-muted")}>{r.priority}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-ink">{r.remedy}</div>
                        <div className="text-[9px] text-ink-muted">⏰ {r.bestHour}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Arishta (afflictions) */}
            {arishta && arishta.total > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Flame className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Arishta — Afflictions</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", arishta.overall === "minimal" ? "bg-leaf/15 text-leaf" : arishta.overall === "mild" ? "bg-gold/15 text-gold" : "bg-destructive/15 text-destructive")}>
                    {arishta.overall}
                  </span>
                </div>
                <div className="text-[10px] text-ink-muted mb-3">{arishta.summary}</div>
                <div className="space-y-1.5">
                  {arishta.afflictions.slice(0, 5).map((a: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-ink font-medium">{a.name}</span>
                        <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", a.severity === "high" ? "bg-destructive/15 text-destructive" : a.severity === "medium" ? "bg-gold/15 text-gold" : "bg-white/5 text-ink-muted")}>{a.severity}</span>
                      </div>
                      <div className="text-[9px] text-ink-muted">{a.description}</div>
                      <div className="text-[9px] text-gold/70 mt-0.5">Remedy: {a.remedy}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Ishta Devata (personal deity) */}
            {ishtaDevata?.primary && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Ishta Devata</span>
                </div>
                <div className="text-[13px] text-gold font-medium mb-1">{ishtaDevata.primary.deity}</div>
                <div className="text-[10px] text-ink-muted mb-2">{ishtaDevata.primary.description}</div>
                <div className="p-2 rounded-lg bg-white/[0.02] mb-2">
                  <div className="text-[10px] text-gold">Mantra</div>
                  <div className="text-[11px] text-ink">{ishtaDevata.primary.mantra}</div>
                </div>
                <div className="text-[10px] text-ink-muted">{ishtaDevata.primary.form}</div>
                {ishtaDevata.nakshatraDevata && (
                  <div className="text-[9px] text-ink-muted/60 mt-1">Nakshatra Devata: {ishtaDevata.nakshatraDevata.deity}</div>
                )}
              </GlassCard>
            )}

            {/* Today's spiritual practice */}
            {spiritualPractice?.morning && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's Spiritual Practice</span>
                </div>
                <div className="text-[10px] text-ink-muted mb-1">{spiritualPractice.day} · {spiritualPractice.dayLord} day · {spiritualPractice.nadi}</div>
                <div className="p-2 rounded-lg bg-gold/[0.04] mb-2">
                  <div className="text-[10px] text-gold mb-0.5">🌅 Morning ({spiritualPractice.morning.time.split("—")[0].trim()})</div>
                  <div className="text-[10px] text-ink">{spiritualPractice.morning.primary}</div>
                  <div className="text-[9px] text-ink-muted mt-0.5">{spiritualPractice.morning.mantra}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] mb-2">
                  <div className="text-[10px] text-gold mb-0.5">☀️ Afternoon</div>
                  <div className="text-[10px] text-ink-muted">{spiritualPractice.afternoon.practice}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] mb-2">
                  <div className="text-[10px] text-gold mb-0.5">🌙 Evening</div>
                  <div className="text-[10px] text-ink-muted">{spiritualPractice.evening.practice}</div>
                </div>
                <div className="text-[9px] text-ink-muted">📿 {spiritualPractice.dailyActivity}</div>
                <div className="text-[9px] text-leaf">🤲 {spiritualPractice.charity}</div>
              </GlassCard>
            )}

            {/* Today's aspects */}
            {aspectsToday?.aspects?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's Aspects</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-leaf">{aspectsToday.beneficial} beneficial</span>
                    <span className="text-destructive/70">{aspectsToday.malefic} challenging</span>
                  </div>
                </div>
                <div className="text-[10px] text-ink-muted mb-2">{aspectsToday.summary}</div>
                <div className="space-y-1">
                  {aspectsToday.aspects.slice(0, 5).map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                      <span className={cn("text-[8px] px-1 py-0.5 rounded-full shrink-0", a.nature === "benefic" ? "bg-leaf/15 text-leaf" : "bg-destructive/15 text-destructive")}>{a.aspectType.split(" ")[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-ink">{a.transitPlanet} → {a.natalPlanet}</div>
                        <div className="text-[9px] text-ink-muted">{a.effect}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Manifest confirmations */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-leaf" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's intentions</span>
                </div>
                <button onClick={() => setView("manifest")} className="text-[11px] text-gold hover:underline flex items-center gap-0.5">
                  All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {goals.length === 0 ? (
                <button onClick={() => setView("manifest")} className="w-full p-3 rounded-xl border border-dashed border-white/10 text-[12px] text-ink-muted hover:border-gold/20 hover:text-gold transition text-left">
                  + Set your first intention
                </button>
              ) : (
                <div className="space-y-1.5">
                  {goals.slice(0, 3).map((g) => <GoalRow key={g.id} goal={g} />)}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right column: mood + streak + upsell */}
          <div className="space-y-4">
            {/* Mood check-in */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Mood</span>
              </div>
              <MoodPicker current={mood?.mood} onPick={async (m) => {
                try {
                  await api("/api/mood", { method: "POST", json: { mood: m } });
                  setMood({ ...mood, mood: m });
                  toast.success("Mood saved");
                  qc.invalidateQueries({ queryKey: ["mood"] });
                } catch (e: any) { toast.error(e.message); }
              }} />
            </GlassCard>

            {/* Luck balance + streak */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Your Luck</span>
              </div>
              <div className="text-[32px] font-light text-gold leading-none mb-1">{user.luckBalance}</div>
              <div className="text-[11px] text-ink-muted mb-2">
                {user.streak}-day streak · {user.totalLuckEarned} earned lifetime
              </div>
              {/* Streak freeze indicator */}
              {user.streak > 0 && (
                <div className="flex items-center gap-1.5 mb-3 text-[10px] text-leaf/80">
                  <Snowflake className="w-3 h-3" />
                  Streak freeze active — miss 1 day without losing your streak
                </div>
              )}
              {user.streak === 0 && (
                <div className="mb-3" />
              )}
              <GradientButton onClick={() => setView("luck-store")} className="w-full py-2 text-[12px]">
                Top up Luck
              </GradientButton>
            </GlassCard>

            {/* 7-day activity heatmap */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">7-day practice</span>
                <Flame className="w-3.5 h-3.5 text-leaf" />
              </div>
              <div className="flex items-end justify-between gap-1.5 h-16">
                {(activity.length > 0 ? activity : Array(7).fill(null)).map((day: any, i: number) => {
                  const total = day?.total ?? 0;
                  const dayLabel = day?.label ?? ["S", "M", "T", "W", "T", "F", "S"][i];
                  const isToday = i === 6;
                  const height = total > 0 ? `${30 + Math.min(total, 6) * 12}%` : "18%";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${total > 0 ? "bg-gradient-to-t from-leaf/40 to-leaf/80" : "bg-white/[0.04]"}`}
                        style={{ height }}
                      />
                      <span className={`text-[9px] ${isToday ? "text-gold font-medium" : "text-ink-muted/60"}`}>{dayLabel[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-ink-muted mt-2 text-center">
                {activity.reduce((sum: number, d: any) => sum + (d?.total ?? 0), 0)} actions this week
              </div>
            </GlassCard>

            {/* Moon phase + Nakshatra */}
            {moon && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-3xl">{moon.icon}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Moon Phase</div>
                  <div className="text-[13px] text-ink">{moon.phase}</div>
                  <div className="text-[10px] text-ink-muted">{moon.illumination}% illuminated · {moon.age}d old · in {moon.sign}</div>
                </div>
              </GlassCard>
            )}
            {nakshatra && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">✦</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Today's Nakshatra</div>
                  <div className="text-[13px] text-ink">{nakshatra.name} <span className="text-[10px] text-gold">pada {nakshatra.pada}</span></div>
                  <div className="text-[10px] text-ink-muted">Lord: {nakshatra.lord} · Deity: {nakshatra.deity}</div>
                </div>
              </GlassCard>
            )}
            {tithi && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">{tithi.special?.includes("Full") ? "🌕" : tithi.special?.includes("New") ? "🌑" : tithi.special?.includes("Ekadashi") ? "🕉" : "📅"}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Today's Tithi</div>
                  <div className="text-[13px] text-ink">{tithi.name}</div>
                  <div className="text-[10px] text-ink-muted">{tithi.paksha}{tithi.special ? ` · ${tithi.special}` : ""}</div>
                </div>
              </GlassCard>
            )}
            {yogaToday && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">{yogaToday.nature?.includes("Auspicious") ? "✦" : yogaToday.nature?.includes("Inauspicious") ? "⚠" : "◇"}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Today's Yoga</div>
                  <div className="text-[13px] text-ink">{yogaToday.name} <span className="text-[10px] text-ink-muted">#{yogaToday.number}/27</span></div>
                  <div className={cn("text-[10px]", yogaToday.nature?.includes("Auspicious") ? "text-leaf" : yogaToday.nature?.includes("Inauspicious") ? "text-destructive/70" : "text-ink-muted")}>{yogaToday.nature}</div>
                  <div className="text-[9px] text-ink-muted/60 mt-0.5">{yogaToday.effect}</div>
                </div>
              </GlassCard>
            )}
            {karana && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">{karana.nature?.includes("Auspicious") ? "✦" : karana.nature?.includes("Inauspicious") ? "⚠" : "◇"}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Today's Karana</div>
                  <div className="text-[13px] text-ink">{karana.name} <span className="text-[10px] text-ink-muted">#{karana.index}/60</span></div>
                  <div className={cn("text-[10px]", karana.nature?.includes("Auspicious") ? "text-leaf" : karana.nature?.includes("Inauspicious") ? "text-destructive/70" : "text-ink-muted")}>{karana.nature}</div>
                </div>
              </GlassCard>
            )}
            {planetaryHours?.current && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Planetary Hours</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border" style={{ borderColor: planetaryHours.current.color + "40", background: planetaryHours.current.color + "15", color: planetaryHours.current.color }}>
                    {planetaryHours.current.symbol}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-ink">{planetaryHours.current.planet} hour <span className="text-[10px] text-ink-muted">({planetaryHours.current.hour}:00)</span></div>
                    <div className="text-[10px] text-ink-muted">{planetaryHours.current.effect}</div>
                  </div>
                </div>
                <div className="text-[9px] text-ink-muted mb-1">Day ruler: {planetaryHours.dayRuler} {planetaryHours.dayRulerSymbol}</div>
                {/* Mini hour strip */}
                <div className="flex gap-0.5 overflow-x-auto lum-no-scrollbar">
                  {planetaryHours.all?.slice(0, 12).map((h: any, i: number) => (
                    <div key={i} className={cn("shrink-0 px-1 py-0.5 rounded text-[8px] text-center transition", h.isCurrent ? "bg-gold/15 text-gold" : "bg-white/[0.02] text-ink-muted")} title={`${h.planet} hour`}>
                      {h.symbol}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
            {rahuKaal?.periods?.length > 0 && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Rahu Kaal Timings</span>
                </div>
                {rahuKaal.currentlyInauspicious && (
                  <div className="px-2 py-1 rounded-full bg-destructive/15 text-destructive text-[10px] inline-block mb-2">
                    ⚠ Currently in {rahuKaal.currentPeriod}
                  </div>
                )}
                <div className="space-y-1">
                  {rahuKaal.periods.map((p: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 text-[10px]", p.active ? "text-destructive" : "text-ink-muted")}>
                      <span className="text-sm">{p.icon}</span>
                      <span className="flex-1">{p.name}</span>
                      <span className={cn("font-mono", p.active && "font-medium")}>{p.start} – {p.end}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-ink-muted/60 mt-2">Sunrise: {rahuKaal.sunrise} · Sunset: {rahuKaal.sunset}</div>
                {!rahuKaal.currentlyInauspicious && rahuKaal.nextStarting && (
                  <div className="text-[10px] text-gold mt-1">Next: {rahuKaal.nextStarting}</div>
                )}
              </GlassCard>
            )}
            {choghadiya?.current && (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Choghadiya</span>
                  </div>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", choghadiya.current.nature === "auspicious" ? "bg-leaf/15 text-leaf" : "bg-destructive/15 text-destructive")}>
                    {choghadiya.current.icon} {choghadiya.current.name}
                  </span>
                </div>
                <div className="text-[10px] text-ink-muted mb-2">{choghadiya.current.start} – {choghadiya.current.end}</div>
                <div className="text-[10px] text-ink-muted mb-3">{choghadiya.current.effect}</div>
                <div className="text-[9px] text-ink-muted mb-1">Day periods</div>
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {choghadiya.dayPeriods?.map((p: any, i: number) => (
                    <div key={i} className={cn("shrink-0 px-1 py-0.5 rounded text-[8px] text-center", p.active ? "ring-1 ring-gold/40" : "", p.nature === "auspicious" ? "bg-leaf/[0.06] text-leaf" : "bg-destructive/[0.06] text-destructive/70")} title={`${p.name} ${p.start}-${p.end}`}>
                      {p.icon}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-gold">{choghadiya.nextAuspicious}</div>
              </GlassCard>
            )}

            {/* Today's lucky numbers */}
            {lucky && (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-3.5 h-3.5 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's Luck</span>
                  </div>
                  <button
                    onClick={async () => {
                      const text = `My lucky numbers today: ${lucky.numbers.join(", ")}\nColor: ${lucky.color}\nTime: ${lucky.time}\n\n✦ Baydin — AI Astrologer`;
                      if (navigator.share) {
                        try { await navigator.share({ title: "My Baydin Lucky Numbers", text, url: window.location.origin }); } catch {}
                      } else {
                        await navigator.clipboard.writeText(text + "\n" + window.location.origin);
                        toast.success("Lucky numbers copied ✦");
                      }
                    }}
                    className="p-1 rounded-full text-ink-muted/50 hover:text-gold transition"
                    title="Share lucky numbers"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {lucky.numbers.map((n: number, i: number) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/30 flex items-center justify-center text-[15px] font-light text-gold">
                      {n}
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-ink-muted">Color</div>
                    <div className="text-gold">{lucky.color}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-ink-muted">Time</div>
                    <div className="text-ink">{lucky.time}</div>
                  </div>
                </div>
              </GlassCard>
            )}

            {/* Muhurta (auspicious time) */}
            {muhurta && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-gold" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Auspicious Time</span>
                </div>
                {/* Inauspicious (active highlighted) */}
                <div className="space-y-1.5 mb-3">
                  {muhurta.inauspicious.map((per: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 text-[11px]", per.active ? "text-destructive" : "text-ink-muted")}>
                      <span className="text-sm">{per.icon}</span>
                      <span className="flex-1">{per.name}</span>
                      <span className={cn("font-mono", per.active && "font-medium")}>{per.time}</span>
                      {per.active && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-destructive/15 text-destructive">NOW</span>}
                    </div>
                  ))}
                </div>
                {/* Upcoming auspicious */}
                {muhurta.upcoming?.length > 0 && (
                  <div className="pt-2 border-t border-white/5">
                    <div className="text-[9px] uppercase tracking-wide text-ink-muted mb-1">Next favorable</div>
                    {muhurta.upcoming.map((u: any, i: number) => (
                      <div key={i} className={cn("flex items-center justify-between text-[11px]", u.note.includes("Current") ? "text-leaf" : "text-ink-muted")}>
                        <span>{u.time}</span>
                        <span className="text-[10px]">{u.note}</span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Deep dive upsell */}
            <ShellCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Deep readings</span>
              </div>
              <div className="text-[13px] text-ink mb-3">Unlock your full chart with deep astrological insights.</div>
              <div className="space-y-1.5">
                <UpsellRow icon={BookOpen} label="Life Report" cost={15} desc="7-section comprehensive" onClick={() => setView("life-report")} />
                <UpsellRow icon={Compass} label="Insights" cost={3} desc="Yogas, transits, dasha…" onClick={() => setView("insights")} />
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function QuickAction({ icon: Icon, label, desc, onClick, badge }: { icon: any; label: string; desc: string; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className="group relative p-3 rounded-xl lum-glass border border-white/5 hover:border-gold/20 hover:bg-gold/[0.03] transition text-left">
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
        {badge ? <Pill variant="gold" className="text-[9px] py-0">{badge}</Pill> : null}
      </div>
      <div className="text-[12px] text-ink leading-tight">{label}</div>
      <div className="text-[10px] text-ink-muted">{desc}</div>
    </button>
  );
}

function CardOfDayCard({ reading }: { reading: any }) {
  const qc = useQueryClient();
  const [reflection, setReflection] = React.useState(reading.reflection || "");
  const [saved, setSaved] = React.useState(!!reading.reflection);
  const [saving, setSaving] = React.useState(false);
  let cards: any[] = [];
  try { cards = JSON.parse(reading.cardsJson); } catch {}
  const card = cards[0];
  if (!card) return <div className="text-[13px] text-ink-muted">{reading.interpretation?.slice(0, 200)}…</div>;

  async function saveReflection() {
    if (!reflection.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tarot/card-of-day", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ reflection }),
      });
      const data = await res.json();
      if (data.bonusLuck) {
        toast.success(`Reflection saved · +${data.bonusLuck} Luck ✦`);
      } else {
        toast.success("Reflection updated");
      }
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch { toast.error("Could not save reflection"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex gap-4 mb-3">
        <div className={cn("w-20 h-32 rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 flex flex-col items-center justify-center shrink-0", card.reversed && "rotate-180")}>
          <div className="text-2xl mb-1">{card.symbol || "✦"}</div>
          <div className="text-[9px] text-ink px-1 text-center">{card.nameShort || card.id}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="text-[13px] text-ink font-medium">{card.name || "Card of the Day"}</div>
            <button
              onClick={async () => {
                const text = `${card.name || "Card of the Day"} (${card.reversed ? "Reversed" : "Upright"})\n\n${reading.interpretation?.replace(/[#*_`]/g, "").slice(0, 200)}`;
                if (navigator.share) {
                  try { await navigator.share({ title: "My Baydin Card of the Day", text, url: window.location.origin }); } catch {}
                } else {
                  await navigator.clipboard.writeText(text + "\n\n" + window.location.origin);
                  toast.success("Card shared ✦");
                }
              }}
              className="p-1 rounded-full text-ink-muted/60 hover:text-gold transition shrink-0"
              title="Share this card"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] text-gold mb-1.5">{card.reversed ? "Reversed" : "Upright"}</div>
          <div className="text-[12px] text-ink-muted line-clamp-3 leading-relaxed">{reading.interpretation?.replace(/\*\*/g, "").slice(0, 180)}…</div>
        </div>
      </div>
      {/* Reflection journal */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5 flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-gold" /> Your reflection {saved && <span className="text-leaf">· saved</span>}
        </div>
        <textarea
          value={reflection}
          onChange={(e) => { setReflection(e.target.value); setSaved(false); }}
          placeholder="What does this card mean to you today?"
          className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-[12px] text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold/20 resize-none min-h-[48px]"
          rows={2}
        />
        {reflection.trim() && !saved && (
          <button
            onClick={saveReflection}
            disabled={saving}
            className="mt-1.5 px-3 py-1 rounded-full text-[10px] border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 active:scale-95 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save reflection · +1 Luck"}
          </button>
        )}
      </div>
    </div>
  );
}

function GoalRow({ goal }: { goal: any }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = React.useState(false);
  async function confirm() {
    setConfirming(true);
    try {
      const res = await api<{ ok: boolean; bonusLuck?: number; error?: string }>("/api/manifest/confirm", {
        method: "POST", json: { goalId: goal.id },
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`Intention confirmed${res.bonusLuck ? ` · +${res.bonusLuck} Luck` : ""} ✦`);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["manifest-goals"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirming(false); }
  }
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
      <Flame className={cn("w-3.5 h-3.5 shrink-0", goal.streak > 0 ? "text-leaf" : "text-ink-muted/40")} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-ink truncate">{goal.title}</div>
        {goal.streak > 0 && <div className="text-[10px] text-leaf">{goal.streak}-day streak</div>}
      </div>
      <button
        onClick={confirm}
        disabled={confirming || goal.confirmedToday}
        className={cn(
          "px-2.5 py-1 rounded-full text-[10px] transition border",
          goal.confirmedToday
            ? "border-leaf/20 bg-leaf/10 text-leaf"
            : "border-gold/20 bg-gold/10 text-gold hover:bg-gold/20"
        )}
      >
        {goal.confirmedToday ? "✓ Done" : confirming ? "…" : "Confirm"}
      </button>
    </div>
  );
}

function MoodPicker({ current, onPick }: { current?: number; onPick: (m: number) => void }) {
  const [val, setVal] = React.useState(current);
  React.useEffect(() => setVal(current), [current]);
  const moods = [
    { v: 1, e: "😞", l: "Low" },
    { v: 2, e: "😕", l: "Off" },
    { v: 3, e: "😐", l: "OK" },
    { v: 4, e: "🙂", l: "Good" },
    { v: 5, e: "😊", l: "Great" },
  ];
  return (
    <div className="grid grid-cols-5 gap-1">
      {moods.map((m) => (
        <button
          key={m.v}
          onClick={() => { setVal(m.v); onPick(m.v); }}
          className={cn(
            "flex flex-col items-center gap-1 py-2 rounded-lg border transition",
            val === m.v ? "border-gold/30 bg-gold/10" : "border-transparent hover:bg-white/[0.03]"
          )}
        >
          <span className="text-lg">{m.e}</span>
          <span className={cn("text-[9px]", val === m.v ? "text-gold" : "text-ink-muted")}>{m.l}</span>
        </button>
      ))}
    </div>
  );
}

function UpsellRow({ icon: Icon, label, cost, desc, onClick }: { icon: any; label: string; cost: number; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition text-left">
      <Icon className="w-3.5 h-3.5 text-gold shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-ink">{label}</div>
        <div className="text-[10px] text-ink-muted">{desc}</div>
      </div>
      <Pill variant="gold" className="text-[9px]">{cost} Luck</Pill>
    </button>
  );
}

function RecommendedPractice({ ritualDone, moodDone, manifestDone, tarotDone, streak, onNavigate }: {
  ritualDone: boolean; moodDone: boolean; manifestDone: boolean; tarotDone: boolean; streak: number; onNavigate: (v: any) => void;
}) {
  // Determine what's left to do today
  const tasks: { label: string; desc: string; icon: any; view: string; done: boolean; color: string }[] = [
    { label: "Check your mood", desc: "1 tap · +1 Luck", icon: Heart, view: "today", done: moodDone, color: "#D876A0" },
    { label: "Confirm your intention", desc: "Daily manifest · +1 Luck", icon: Target, view: "manifest", done: manifestDone, color: "#B5CD7E" },
    { label: "Draw a tarot card", desc: "Free daily reading", icon: Star, view: "tarot", done: tarotDone, color: "#C5A87C" },
    { label: "Complete your ritual", desc: "4 steps · +7 Luck", icon: Flame, view: "ritual", done: ritualDone, color: "#F09A3D" },
  ];
  const next = tasks.find((t) => !t.done);

  if (!next) {
    return (
      <ShellCard className="p-4 mb-5 lum-anim-float-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-leaf/15 border border-leaf/30 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-leaf" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-ink font-medium">Today's practice complete ✦</div>
            <div className="text-[11px] text-ink-muted">You've done everything. Come back tomorrow to keep your {streak}-day streak alive.</div>
          </div>
        </div>
      </ShellCard>
    );
  }

  return (
    <button onClick={() => onNavigate(next.view)} className="block w-full text-left mb-5 lum-anim-float-up group">
      <ShellCard className="p-4 hover:border-gold/30 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{ background: `${next.color}15`, borderColor: `${next.color}40` }}>
            <next.icon className="w-5 h-5" style={{ color: next.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Recommended next</div>
            <div className="text-[14px] text-ink font-medium group-hover:text-gold transition">{next.label}</div>
            <div className="text-[11px] text-ink-muted">{next.desc}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-gold group-hover:translate-x-0.5 transition shrink-0" />
        </div>
      </ShellCard>
    </button>
  );
}

function WeeklyStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="shrink-0 text-center">
      <div className="text-[18px] font-light leading-none" style={{ color }}>{value}</div>
      <div className="text-[9px] text-ink-muted mt-0.5">{label}</div>
    </div>
  );
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function Pillar({ n, title, body }: { n: string; title: string; body: string }) {
  return (
    <div className="grid grid-cols-[auto_1fr] gap-5">
      <div className="serif-italic text-[#C5A572] text-[1.5rem] leading-none mt-1 select-none">
        {n}
      </div>
      <div>
        <div className="t-title text-[#E8E2D5] mb-1.5">{title}</div>
        <div className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch]">{body}</div>
      </div>
    </div>
  );
}
