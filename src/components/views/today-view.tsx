"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, Pill, ShellCard, StarField } from "@/components/lumina/primitives";
import {
  AuroraGlowCard,
  GlowPill,
  LiquidMetalText,
  NumberTicker,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon } from "@/components/lumina/baydin-icons";
import { TarotCardFace } from "@/components/tarot-card-face";
import { CardDetailModal } from "@/components/card-detail-modal";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";
import { cn } from "@/lib/utils";
import {
  Sparkles, Moon, Star, Sun, Flame, Gift, ChevronRight, Heart, Calendar,
  TrendingUp, Target, Compass, BookOpen, Share2, Snowflake, Clock,
} from "lucide-react";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

export function TodayView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const t = useT();
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
  const [claimingDaily, setClaimingDaily] = React.useState(false);

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
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-12 lg:py-20 relative z-10 min-w-0 overflow-hidden">
          {/* The one distinctive moment — serif headline, no card chrome */}
          <div className="lum-reveal">
            <GlowPill className="mb-4">
              <Sparkles className="w-3 h-3" /> Welcome
            </GlowPill>
            <LiquidMetalText as="h1" className="serif-display text-[2.75rem] sm:text-[3.5rem] leading-[1.05] tracking-tight block mb-5">
              {t("hero_read_sky")}
            </LiquidMetalText>
            <p className="t-body-lg text-[#9C9489] max-w-md leading-[1.7] mb-10">
              Baydin is a daily astrologer, tarot reader, and ritual companion. Vedic, Western, and Myanmar Mahabote traditions, drawn from your birth chart and the moon overhead.
            </p>
            <ShimmerButton onClick={onAuth} className="px-6 py-3">
              Begin
              <ChevronRight className="w-4 h-4" />
            </ShimmerButton>
            <div className="mt-3 text-[12px] text-[#6B6358] flex items-center gap-1.5">
              <CloverIcon className="w-3.5 h-3.5" /> 5 Luck to start. No card required.
            </div>
          </div>

          {/* Hairline divider */}
          <hr className="rule-h my-12" />

          {/* Three pillars — editorial, not card grid */}
          <div className="space-y-8">
            <Pillar
              n="i"
              title={t("hero_pillar_today")}
              body="Moon phase, nakshatra, tithi. The panchanga of the moment, computed from the same ephemeris used for natal charts."
            />
            <Pillar
              n="ii"
              title={t("hero_pillar_card")}
              body="Tarot grounded in your question and the chart overhead — not a random pull, but a considered reading."
            />
            <Pillar
              n="iii"
              title={t("hero_pillar_practice")}
              body="Manifest, ritual, frequencies, dream journal. Small daily gestures that compound into a pattern you can read back."
            />
          </div>
        </div>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  // Daily reward already claimed today? (user.lastDailyAt is set when claimed)
  const lastDaily = user.lastDailyAt ? new Date(user.lastDailyAt) : null;
  const alreadyClaimedToday = !!lastDaily && lastDaily.toDateString() === today.toDateString();

  async function claimDailyReward() {
    if (claimingDaily || alreadyClaimedToday) return;
    setClaimingDaily(true);
    try {
      const res = await api<{ ok: boolean; amount?: number; streak?: number; dayNumber?: number; reason?: string; message?: string }>("/api/luck/daily-reward", { method: "POST" });
      if (res.ok && res.amount) {
        toast.success(`Daily Luck claimed · +${res.amount}`);
        qc.invalidateQueries({ queryKey: ["me"] });
      } else if (res.reason === "already_claimed") {
        toast.info(res.message || "Already claimed today");
        qc.invalidateQueries({ queryKey: ["me"] });
      } else {
        toast.error("Could not claim daily Luck right now");
      }
    } catch (e: any) { toast.error(e.message); }
    finally { setClaimingDaily(false); }
  }

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8 relative z-10 min-w-0 overflow-hidden">
        {/* Hero — serif greeting, sentence-case date, no ALL-CAPS eyebrow */}
        <div className="mb-8 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">
            {dateStr}
          </div>
          <LiquidMetalText as="h1" className="serif-display text-[1.75rem] sm:text-[2.25rem] leading-[1.15] tracking-tight block mb-1.5">
            {greeting()}, {user.name?.split(" ")[0] || user.email.split("@")[0]}.
          </LiquidMetalText>
          <p className="t-body text-[#9C9489]">
            {user.streak > 0 ? (
              <><NumberTicker value={user.streak} className="text-[#C5A572]" />-day streak. Keep it alive.</>
            ) : (
              "Begin your daily practice — claim your free Luck below."
            )}
          </p>
        </div>

        {/* Daily reward claim */}
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={alreadyClaimedToday ? 0.1 : 0.25} className="p-4 mb-5 lum-reveal">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-[#C5A572]/15 border border-[#C5A572]/30 flex items-center justify-center shrink-0">
              <Gift className="w-5 h-5 text-[#C5A572]" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-0.5">
                <span className="text-[10px] uppercase tracking-[0.2em] text-[#9C9489]">Daily reward</span>
                {alreadyClaimedToday && (
                  <GlowPill color="#7A8B6F" className="text-[9px]">
                    <Flame className="w-3 h-3" /> Claimed
                  </GlowPill>
                )}
              </div>
              <div className="text-[14px] text-[#E8E2D5] font-medium leading-tight">
                {alreadyClaimedToday
                  ? `Come back tomorrow — streak at ${user.streak}.`
                  : "Claim your daily Luck to grow the streak."}
              </div>
              <div className="text-[11px] text-[#9C9489] flex items-center gap-1">
                <CloverIcon className="w-3 h-3" /> {alreadyClaimedToday ? "Reward already in your balance" : "Free Luck, every day"}
              </div>
            </div>
            <ShimmerButton
              onClick={claimDailyReward}
              disabled={claimingDaily || alreadyClaimedToday}
              className="shrink-0"
            >
              {claimingDaily ? (
                "Claiming…"
              ) : alreadyClaimedToday ? (
                "✓ Claimed"
              ) : (
                <>
                  <CloverIcon className="w-3.5 h-3.5" filled /> Claim
                </>
              )}
            </ShimmerButton>
          </div>
        </AuroraGlowCard>

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
              <AuroraGlowCard glowColor="#7A8B6F" glowIntensity={0.15} className="p-4 flex items-center gap-4">
                <div className="flex items-center gap-2 shrink-0">
                  <TrendingUp className="w-4 h-4 text-[#7A8B6F]" />
                  <span className="text-[11px] uppercase tracking-[0.15em] text-[#9C9489] hidden sm:inline">This Week</span>
                </div>
                <div className="flex items-center gap-4 flex-1 overflow-x-auto lum-no-scrollbar">
                  <WeeklyStat label="Actions" value={activity.reduce((s: number, d: any) => s + (d?.total ?? 0), 0)} color="#C5A87C" />
                  <WeeklyStat label="Active days" value={activity.filter((d: any) => (d?.total ?? 0) > 0).length} color="#B5CD7E" />
                  <WeeklyStat label="Tarot" value={activity.reduce((s: number, d: any) => s + (d?.activities?.tarot ?? 0), 0)} color="#9E8AC9" />
                  <WeeklyStat label="Chat" value={activity.reduce((s: number, d: any) => s + (d?.activities?.chat ?? 0), 0)} color="#5FA9C7" />
                </div>
              </AuroraGlowCard>
            )}

            {/* Card of the day */}
            <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-6 relative overflow-hidden">
              <div className="relative">
                {loadingCard ? (
                  <div className="animate-pulse space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="h-4 w-24 bg-white/5 rounded-sm" />
                      <div className="h-4 w-12 bg-white/5 rounded-sm" />
                    </div>
                    <div className="flex justify-center py-4">
                      <div className="w-[160px] h-[240px] bg-white/5 rounded-sm" />
                    </div>
                    <div className="h-3 w-full bg-white/5 rounded-sm" />
                    <div className="h-3 w-3/4 bg-white/5 rounded-sm mx-auto" />
                  </div>
                ) : cardOfDay ? (
                  <CardOfDayCard reading={cardOfDay} />
                ) : (
                  <div className="text-[13px] text-[#9C9489] py-4 text-center">Could not load card of the day.</div>
                )}
              </div>
            </AuroraGlowCard>

            {/* Today's planetary transits */}
            {transits?.positions?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Transits</span>
                  </div>
                </div>
                <div className="grid grid-cols-3 sm:grid-cols-5 gap-2 mb-3">
                  {transits.positions.slice(0, 7).map((p: any, i: number) => (
                    <div key={i} className="text-center p-1.5 rounded-lg bg-white/[0.02]">
                      <div className="text-base">{p.symbol}</div>
                      <div className="text-[8px] text-[#9C9489] uppercase">{p.name}</div>
                      <div className="text-[10px] text-[#C5A572]">{p.signMy || p.sign}</div>
                      {p.retrograde && <span className="text-[8px] text-[#D4A0B8]">℞</span>}
                    </div>
                  ))}
                </div>
                {transits.aspects?.length > 0 && (
                  <div className="pt-2 border-t border-[#2A2722]">
                    <div className="text-[9px] uppercase tracking-wide text-[#9C9489] mb-1">Aspects to your chart</div>
                    <div className="space-y-0.5">
                      {transits.aspects.slice(0, 3).map((a: string, i: number) => (
                        <div key={i} className="text-[10px] text-[#9C9489]">• {a}</div>
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
                  <Sparkles className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Your Gemstones</span>
                </div>
                <div className="space-y-2">
                  {gemstones.recommendations.map((g: any, i: number) => (
                    <div key={i} className="flex items-center gap-3 p-2 rounded-lg bg-white/[0.02]">
                      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-[#C5A572]/20 flex items-center justify-center text-[10px] text-[#C5A572] shrink-0">
                        {g.gem[0]}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-[12px] text-[#E8E2D5]">{g.gem} <span className="text-[9px] text-[#9C9489]">({g.color})</span></div>
                        <div className="text-[10px] text-[#9C9489]">{g.benefit}</div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[9px] text-[#C5A572]">{g.planet}</div>
                        <div className="text-[8px] text-[#9C9489]">{g.finger}</div>
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
                  <Star className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Mantras</span>
                </div>
                <div className="space-y-2">
                  {mantras.recommendations.slice(0, 3).map((m: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] text-[#C5A572] font-medium">{m.sanskrit}</span>
                        <span className="text-[9px] text-[#9C9489]">{m.countMy}</span>
                      </div>
                      <div className="text-[10px] text-[#9C9489]">{m.meaning}</div>
                      <div className="text-[9px] text-[#9C9489]/60 mt-0.5">{m.reason}</div>
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
                    <Star className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Your Yogas</span>
                  </div>
                  <span className="text-[10px] text-[#C5A572]">{yogas.count} found</span>
                </div>
                <div className="space-y-2">
                  {yogas.detected.slice(0, 5).map((y: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[12px] text-[#E8E2D5] font-medium">{y.name}</span>
                        <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", y.strength === "strong" ? "bg-leaf/15 text-[#7A8B6F]" : y.strength === "moderate" ? "bg-[#C5A572]/15 text-[#C5A572]" : "bg-white/5 text-[#9C9489]")}>{y.strength}</span>
                      </div>
                      <div className="text-[10px] text-[#9C9489]">{y.effect}</div>
                      <div className="text-[9px] text-[#9C9489]/60 mt-0.5">{y.planets}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Namkaran (naming suggestions) */}
            {namkaran && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Namkaran — Name Suggestions</span>
                </div>
                <div className="text-[11px] text-[#9C9489] mb-2">
                  Based on {namkaran.nakshatra} pada {namkaran.pada}
                </div>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[10px] text-[#9C9489]">Starting letters:</span>
                  {namkaran.startingLetters.map((l: string, i: number) => (
                    <span key={i} className={cn("px-2 py-0.5 rounded-full text-[10px] border", i === namkaran.pada - 1 ? "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572]" : "border-[#2A2722] text-[#9C9489]")}>{l}</span>
                  ))}
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {namkaran.sampleNames.map((n: string, i: number) => (
                    <span key={i} className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-[#2A2722] text-[11px] text-[#E8E2D5]">{n}</span>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Yadaya (remedial measures) */}
            {yadaya?.remedies?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Star className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Yadaya — Remedies</span>
                  </div>
                  <span className="text-[10px] text-[#C5A572]">{yadaya.count} needed</span>
                </div>
                <div className="space-y-2">
                  {yadaya.remedies.slice(0, 3).map((r: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="text-[12px] text-[#C5A572] font-medium mb-0.5">{r.planet}</div>
                      <div className="text-[10px] text-[#9C9489] mb-1.5">{r.problem}</div>
                      <div className="grid grid-cols-2 gap-1">
                        {r.remedies.map((rem: any, j: number) => (
                          <div key={j} className="text-[9px] text-[#9C9489]">
                            <span className="text-[#C5A572]/70">{rem.type}:</span> {rem.detail}
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
                    <Star className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Panchasara — 5-Fold Remedy</span>
                  </div>
                  <span className="text-[10px] text-[#C5A572]">for {panchasara.planet}</span>
                </div>
                <div className="text-[10px] text-[#9C9489] mb-3">{panchasara.problem}</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {panchasara.remedies.map((r: any, i: number) => (
                    <div key={i} className="p-2.5 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <span className="text-base">{r.icon}</span>
                        <span className="text-[11px] text-[#C5A572] font-medium">{r.name}</span>
                        <span className="text-[9px] text-[#9C9489]/60">{r.sanskrit}</span>
                      </div>
                      <div className="text-[10px] text-[#9C9489] leading-relaxed">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
            {panchasara && panchasara.status === "balanced" && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-2">
                  <Star className="w-4 h-4 text-[#7A8B6F]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Panchasara — Chart Balanced</span>
                </div>
                <div className="text-[12px] text-[#7A8B6F] leading-relaxed">{panchasara.message}</div>
              </GlassCard>
            )}

            {/* Weekly forecast */}
            {forecast?.days?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">7-Day Forecast</span>
                  </div>
                  <div className="flex items-center gap-2 text-[10px]">
                    {forecast.bestDay && <span className="text-[#7A8B6F]">Best: {forecast.bestDay.dayName}</span>}
                  </div>
                </div>
                <div className="grid grid-cols-7 gap-1">
                  {forecast.days.map((day: any, i: number) => (
                    <div key={i} className="text-center p-1.5 rounded-lg bg-white/[0.02]">
                      <div className="text-[9px] text-[#9C9489]">{day.dayName.slice(0, 3)}</div>
                      <div className={cn("text-[11px] font-medium my-0.5", day.rating >= 5 ? "text-[#7A8B6F]" : day.rating >= 4 ? "text-[#C5A572]" : day.rating >= 3 ? "text-[#E8E2D5]" : "text-[#C26B5C]/70")}>
                        {"★".repeat(Math.min(day.rating, 5))}
                      </div>
                      <div className="text-[8px] text-[#9C9489] leading-tight">{day.mood.split(" ")[0]}</div>
                    </div>
                  ))}
                </div>
                {forecast.challengingDay && (
                  <div className="text-[10px] text-[#C26B5C]/60 mt-2">Challenging: {forecast.challengingDay.dayName} — {forecast.challengingDay.mood}</div>
                )}
              </GlassCard>
            )}

            {/* Shraaddha (ancestral rites) */}
            {shraaddha && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Shraaddha — Ancestral Rites</span>
                </div>
                <div className="text-[12px] text-[#E8E2D5] mb-2 leading-relaxed">{shraaddha.practice}</div>
                {shraaddha.indicators?.length > 0 && (
                  <div className="space-y-0.5 mb-3">
                    {shraaddha.indicators.slice(0, 2).map((ind: string, i: number) => (
                      <div key={i} className="text-[10px] text-[#9C9489]">• {ind}</div>
                    ))}
                  </div>
                )}
                <div className="text-[10px] uppercase tracking-wide text-[#9C9489] mb-1.5">Simple remedies</div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {shraaddha.remedies?.slice(0, 4).map((r: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="text-[10px] text-[#C5A572] font-medium">{r.name} <span className="text-[8px] text-[#9C9489]">({r.timing})</span></div>
                      <div className="text-[9px] text-[#9C9489] leading-relaxed">{r.desc}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Varshaphal (year ahead) */}
            {varshaphal && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Varshaphal — Year Ahead</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-[#C5A572]/20 flex items-center justify-center text-[16px] font-light text-[#C5A572] shrink-0">
                    {varshaphal.age}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-[#E8E2D5]">Age {varshaphal.age} · Muntha in {varshaphal.munthaSign}</div>
                    <div className="text-[10px] text-[#C5A572]">Year Lord: {varshaphal.yearLord}</div>
                    <div className="text-[10px] text-[#9C9489]">{varshaphal.effect}</div>
                  </div>
                </div>
                <div className="space-y-0.5">
                  {varshaphal.themes?.map((t: string, i: number) => (
                    <div key={i} className="text-[10px] text-[#9C9489]">• {t}</div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Marriage matching */}
            {marriageMatch && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Heart className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Marriage Matching</span>
                </div>
                <div className="text-[11px] text-[#9C9489] mb-2">Based on {marriageMatch.yourNakshatra} nakshatra</div>
                <div className="space-y-2">
                  {Object.values(marriageMatch.checks || {}).map((check: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-[#C5A572] font-medium">{check.name}</span>
                      </div>
                      <div className="text-[9px] text-[#9C9489] mb-1">{check.desc}</div>
                      <div className="text-[9px] text-[#9C9489]/70">{check.status}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Gochar (transit predictions) */}
            {gochar?.predictions?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sun className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Gochar — Transit Predictions</span>
                </div>
                <div className="space-y-1.5">
                  {gochar.keyTransits?.map((p: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-2 rounded-lg bg-white/[0.02]">
                      <span className="text-[#C5A572] text-[11px] font-medium shrink-0 w-16">{p.planet}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#E8E2D5]">House {p.houseFromAsc} · {p.sign}</div>
                        <div className="text-[9px] text-[#9C9489] leading-relaxed">{p.prediction}</div>
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
                    <Star className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Activities</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-[#7A8B6F]">{auspicious.summary.favorable} favorable</span>
                    <span className="text-[#C26B5C]/70">{auspicious.summary.avoid} avoid</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                  {auspicious.activities.map((a: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 p-2 rounded-lg", a.status === "favorable" ? "bg-leaf/[0.04]" : a.status === "avoid" ? "bg-[#C26B5C]/[0.04]" : "bg-white/[0.02]")}>
                      <span className={cn("w-2 h-2 rounded-full shrink-0", a.status === "favorable" ? "bg-leaf" : a.status === "avoid" ? "bg-[#C26B5C]" : "bg-white/20")} />
                      <div className="flex-1 min-w-0">
                        <div className="text-[11px] text-[#E8E2D5] truncate">{a.name}</div>
                        <div className="text-[9px] text-[#9C9489] truncate">{a.note}</div>
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
                    <Star className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Tara Bala</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", taraBala.currentTara.nature === "auspicious" ? "bg-leaf/15 text-[#7A8B6F]" : "bg-[#C26B5C]/15 text-[#C26B5C]")}>
                    {taraBala.currentTara.name} (#{taraBala.currentTara.number}/9)
                  </span>
                </div>
                <div className="text-[11px] text-[#E8E2D5] mb-1">Birth: {taraBala.birthNakshatra} · Today: {taraBala.todayNakshatra}</div>
                <div className="text-[10px] text-[#9C9489] mb-3">{taraBala.currentTara.effect}</div>
                <div className="flex items-center gap-1 mb-2">
                  {taraBala.dailyForecast?.slice(0, 9).map((d: any, i: number) => (
                    <div key={i} className={cn("shrink-0 px-1.5 py-1 rounded text-[8px] text-center", i === 0 ? "ring-1 ring-gold/30" : "", d.nature === "auspicious" ? "bg-leaf/[0.06] text-[#7A8B6F]" : "bg-[#C26B5C]/[0.06] text-[#C26B5C]/70")} title={d.taraName}>
                      {d.day.slice(0, 1)}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-[#9C9489]">{taraBala.recommendation}</div>
              </GlassCard>
            )}

            {/* Nadi (pulse/dosha) */}
            {nadi && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Heart className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Nadi — {nadi.nadiName}</span>
                  </div>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", nadi.dosha === "Vata" ? "bg-purple-500/15 text-purple-300" : nadi.dosha === "Pitta" ? "bg-[#C26B5C]/15 text-[#C26B5C]" : "bg-leaf/15 text-[#7A8B6F]")}>
                    {nadi.dosha} · {nadi.element}
                  </span>
                </div>
                <div className="text-[11px] text-[#E8E2D5] mb-1">Nakshatra: {nadi.nakshatra} · Moon: {nadi.moonSign}</div>
                <div className="text-[10px] text-[#9C9489] mb-2">{nadi.temperament}</div>
                <div className="text-[10px] text-[#9C9489] mb-2"><span className="text-[#C5A572]">Health:</span> {nadi.health}</div>
                <div className="text-[10px] text-[#9C9489] mb-2"><span className="text-[#C5A572]">Spiritual:</span> {nadi.spiritual}</div>
                <div className="text-[10px] text-[#9C9489] mb-1"><span className="text-[#C5A572]">Marriage:</span> {nadi.incompatible}</div>
                <div className="text-[10px] text-[#9C9489]"><span className="text-[#C5A572]">Remedies:</span> {nadi.remedies[0]}</div>
              </GlassCard>
            )}

            {/* Dasha effects */}
            {dashaEffects?.current && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Dasha Effects</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", dashaEffects.current.placementEffect === "beneficial" ? "bg-leaf/15 text-[#7A8B6F]" : dashaEffects.current.placementEffect === "challenging" ? "bg-[#C26B5C]/15 text-[#C26B5C]" : "bg-[#C5A572]/15 text-[#C5A572]")}>
                    {dashaEffects.current.mahadasha}
                  </span>
                </div>
                <div className="text-[12px] text-[#E8E2D5] mb-1">{dashaEffects.current.general}</div>
                <div className="text-[10px] text-[#9C9489] mb-2">{dashaEffects.current.natalPlacement}</div>
                <div className="text-[10px] text-[#7A8B6F] mb-1">✓ {dashaEffects.current.beneficial}</div>
                <div className="text-[10px] text-[#C26B5C]/70 mb-2">⚠ {dashaEffects.current.challenging}</div>
                <div className="text-[10px] text-[#C5A572]">Remedy: {dashaEffects.current.remedies[0]}</div>
              </GlassCard>
            )}

            {/* Graha Bala (planetary power ranking) */}
            {grahaBala?.planets?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Graha Bala — Power Ranking</span>
                </div>
                <div className="space-y-1">
                  {grahaBala.planets.slice(0, 5).map((p: any, i: number) => (
                    <div key={i} className="flex items-center gap-2 text-[11px]">
                      <span className="text-[#C5A572] w-4">{i + 1}.</span>
                      <span className="text-base w-5 text-center">{p.symbol}</span>
                      <span className="text-[#E8E2D5] w-16">{p.planet}</span>
                      <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${p.power}%`, background: p.color }} />
                      </div>
                      <span className={cn("text-[9px] w-12 text-right", p.rating === "dominant" ? "text-[#7A8B6F]" : p.rating === "strong" ? "text-[#C5A572]" : p.rating === "weak" ? "text-[#C26B5C]/70" : "text-[#9C9489]")}>{p.power}</span>
                    </div>
                  ))}
                </div>
                {grahaBala.dominant && (
                  <div className="text-[10px] text-[#9C9489] mt-2">{grahaBala.dominant.summary}</div>
                )}
              </GlassCard>
            )}

            {/* Pancha Mahapurusha Yoga */}
            {panchaMahapurusha?.formedCount > 0 && (
              <GlassCard className="p-5 relative overflow-hidden">
                <div className="" />
                <div className="relative">
                  <div className="flex items-center gap-2 mb-3">
                    <Star className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A572]">Pancha Mahapurusha Yoga</span>
                  </div>
                  {panchaMahapurusha.formed.map((y: any, i: number) => (
                    <div key={i} className="mb-2 p-2 rounded-lg bg-[#C5A572]/[0.04] border border-[#C5A572]/10">
                      <div className="text-[12px] text-[#C5A572] font-medium">{y.yoga} ({y.sanskrit})</div>
                      <div className="text-[10px] text-[#9C9489]">{y.qualities}</div>
                      <div className="text-[9px] text-[#9C9489]/60">{y.effects}</div>
                    </div>
                  ))}
                  <div className="text-[10px] text-[#C5A572]/70">Exceptionally rare and auspicious!</div>
                </div>
              </GlassCard>
            )}

            {/* Gochar Phala (transit effects) */}
            {gocharPhala?.majorTransits?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Gochar Phala — Transit Effects</span>
                  </div>
                  <span className="text-[10px] text-[#9C9489]">{gocharPhala.beneficialCount} beneficial · {gocharPhala.challengingCount} challenging</span>
                </div>
                <div className="space-y-1.5">
                  {gocharPhala.majorTransits.map((t: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-[#C5A572] font-medium">{t.planet}</span>
                        <span className="text-[9px] text-[#9C9489]">{t.duration}</span>
                      </div>
                      <div className="text-[10px] text-[#9C9489]">{t.sign} · {t.houseFromMoon}{ordinalSuffix(t.houseFromMoon)} from Moon</div>
                      <div className="text-[9px] text-[#9C9489]/70 mt-0.5">{t.houseEffect}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Remedy timing */}
            {remedyTiming?.recommendations?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Remedy Timing</span>
                </div>
                <div className="space-y-1">
                  {remedyTiming.recommendations.slice(0, 5).map((r: any, i: number) => (
                    <div key={i} className={cn("flex items-start gap-2 p-1.5 rounded-lg", r.priority === "high" ? "bg-[#C5A572]/[0.04]" : "bg-white/[0.02]")}>
                      <span className={cn("text-[8px] px-1 py-0.5 rounded-full shrink-0", r.priority === "high" ? "bg-[#C5A572]/15 text-[#C5A572]" : "bg-white/5 text-[#9C9489]")}>{r.priority}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#E8E2D5]">{r.remedy}</div>
                        <div className="text-[9px] text-[#9C9489]">⏰ {r.bestHour}</div>
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
                    <Flame className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Arishta — Afflictions</span>
                  </div>
                  <span className={cn("text-[10px] px-2 py-0.5 rounded-full", arishta.overall === "minimal" ? "bg-leaf/15 text-[#7A8B6F]" : arishta.overall === "mild" ? "bg-[#C5A572]/15 text-[#C5A572]" : "bg-[#C26B5C]/15 text-[#C26B5C]")}>
                    {arishta.overall}
                  </span>
                </div>
                <div className="text-[10px] text-[#9C9489] mb-3">{arishta.summary}</div>
                <div className="space-y-1.5">
                  {arishta.afflictions.slice(0, 5).map((a: any, i: number) => (
                    <div key={i} className="p-2 rounded-lg bg-white/[0.02]">
                      <div className="flex items-center justify-between mb-0.5">
                        <span className="text-[11px] text-[#E8E2D5] font-medium">{a.name}</span>
                        <span className={cn("text-[8px] px-1.5 py-0.5 rounded-full", a.severity === "high" ? "bg-[#C26B5C]/15 text-[#C26B5C]" : a.severity === "medium" ? "bg-[#C5A572]/15 text-[#C5A572]" : "bg-white/5 text-[#9C9489]")}>{a.severity}</span>
                      </div>
                      <div className="text-[9px] text-[#9C9489]">{a.description}</div>
                      <div className="text-[9px] text-[#C5A572]/70 mt-0.5">Remedy: {a.remedy}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Ishta Devata (personal deity) */}
            {ishtaDevata?.primary && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Ishta Devata</span>
                </div>
                <div className="text-[13px] text-[#C5A572] font-medium mb-1">{ishtaDevata.primary.deity}</div>
                <div className="text-[10px] text-[#9C9489] mb-2">{ishtaDevata.primary.description}</div>
                <div className="p-2 rounded-lg bg-white/[0.02] mb-2">
                  <div className="text-[10px] text-[#C5A572]">Mantra</div>
                  <div className="text-[11px] text-[#E8E2D5]">{ishtaDevata.primary.mantra}</div>
                </div>
                <div className="text-[10px] text-[#9C9489]">{ishtaDevata.primary.form}</div>
                {ishtaDevata.nakshatraDevata && (
                  <div className="text-[9px] text-[#9C9489]/60 mt-1">Nakshatra Devata: {ishtaDevata.nakshatraDevata.deity}</div>
                )}
              </GlassCard>
            )}

            {/* Today's spiritual practice */}
            {spiritualPractice?.morning && (
              <GlassCard className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Star className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Spiritual Practice</span>
                </div>
                <div className="text-[10px] text-[#9C9489] mb-1">{spiritualPractice.day} · {spiritualPractice.dayLord} day · {spiritualPractice.nadi}</div>
                <div className="p-2 rounded-lg bg-[#C5A572]/[0.04] mb-2">
                  <div className="text-[10px] text-[#C5A572] mb-0.5">🌅 Morning ({spiritualPractice.morning.time.split("—")[0].trim()})</div>
                  <div className="text-[10px] text-[#E8E2D5]">{spiritualPractice.morning.primary}</div>
                  <div className="text-[9px] text-[#9C9489] mt-0.5">{spiritualPractice.morning.mantra}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] mb-2">
                  <div className="text-[10px] text-[#C5A572] mb-0.5">☀️ Afternoon</div>
                  <div className="text-[10px] text-[#9C9489]">{spiritualPractice.afternoon.practice}</div>
                </div>
                <div className="p-2 rounded-lg bg-white/[0.02] mb-2">
                  <div className="text-[10px] text-[#C5A572] mb-0.5">🌙 Evening</div>
                  <div className="text-[10px] text-[#9C9489]">{spiritualPractice.evening.practice}</div>
                </div>
                <div className="text-[9px] text-[#9C9489]">📿 {spiritualPractice.dailyActivity}</div>
                <div className="text-[9px] text-[#7A8B6F]">🤲 {spiritualPractice.charity}</div>
              </GlassCard>
            )}

            {/* Today's aspects */}
            {aspectsToday?.aspects?.length > 0 && (
              <GlassCard className="p-5">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sun className="w-4 h-4 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Aspects</span>
                  </div>
                  <div className="flex items-center gap-2 text-[9px]">
                    <span className="text-[#7A8B6F]">{aspectsToday.beneficial} beneficial</span>
                    <span className="text-[#C26B5C]/70">{aspectsToday.malefic} challenging</span>
                  </div>
                </div>
                <div className="text-[10px] text-[#9C9489] mb-2">{aspectsToday.summary}</div>
                <div className="space-y-1">
                  {aspectsToday.aspects.slice(0, 5).map((a: any, i: number) => (
                    <div key={i} className="flex items-start gap-2 p-1.5 rounded-lg bg-white/[0.02]">
                      <span className={cn("text-[8px] px-1 py-0.5 rounded-full shrink-0", a.nature === "benefic" ? "bg-leaf/15 text-[#7A8B6F]" : "bg-[#C26B5C]/15 text-[#C26B5C]")}>{a.aspectType.split(" ")[0]}</span>
                      <div className="flex-1 min-w-0">
                        <div className="text-[10px] text-[#E8E2D5]">{a.transitPlanet} → {a.natalPlanet}</div>
                        <div className="text-[9px] text-[#9C9489]">{a.effect}</div>
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
                  <Target className="w-4 h-4 text-[#7A8B6F]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's intentions</span>
                </div>
                <button onClick={() => setView("manifest")} className="text-[11px] text-[#C5A572] hover:underline flex items-center gap-0.5">
                  All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {goals.length === 0 ? (
                <button onClick={() => setView("manifest")} className="w-full p-3 rounded-sm border border-dashed border-[#2A2722] text-[12px] text-[#9C9489] hover:border-[#C5A572]/20 hover:text-[#C5A572] transition text-left">
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
                <Heart className="w-4 h-4 text-[#C5A572]" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Mood</span>
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
            <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.2} className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <CloverIcon className="w-4 h-4 text-[#C5A572]" filled />
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Your Luck</span>
              </div>
              <div className="text-[32px] font-light text-[#C5A572] leading-none mb-1 flex items-center gap-1.5">
                <NumberTicker value={user.luckBalance} />
                <CloverIcon className="w-5 h-5" />
              </div>
              <div className="text-[11px] text-[#9C9489] mb-2">
                <NumberTicker value={user.streak} />-day streak · <NumberTicker value={user.totalLuckEarned} /> earned lifetime
              </div>
              {/* Streak freeze indicator */}
              {user.streak > 0 && (
                <div className="flex items-center gap-1.5 mb-3 text-[10px] text-[#7A8B6F]/80">
                  <Snowflake className="w-3 h-3" />
                  Streak freeze active — miss 1 day without losing your streak
                </div>
              )}
              {user.streak === 0 && (
                <div className="mb-3" />
              )}
              <ShimmerButton onClick={() => setView("luck-store")} className="w-full py-2 text-[12px]">
                Top up Luck
              </ShimmerButton>
            </AuroraGlowCard>

            {/* 7-day activity heatmap */}
            <AuroraGlowCard glowColor="#7A8B6F" glowIntensity={0.15} className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">7-day practice</span>
                <Flame className="w-3.5 h-3.5 text-[#7A8B6F]" />
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
                      <span className={`text-[9px] ${isToday ? "text-[#C5A572] font-medium" : "text-[#9C9489]/60"}`}>{dayLabel[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-[#9C9489] mt-2 text-center">
                <NumberTicker value={activity.reduce((sum: number, d: any) => sum + (d?.total ?? 0), 0)} /> actions this week
              </div>
            </AuroraGlowCard>

            {/* Moon phase + Nakshatra */}
            {moon && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-3xl">{moon.icon}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489] mb-0.5">Moon Phase</div>
                  <div className="text-[13px] text-[#E8E2D5]">{moon.phase}</div>
                  <div className="text-[10px] text-[#9C9489]">{moon.illumination}% illuminated · {moon.age}d old · in {moon.sign}</div>
                </div>
              </GlassCard>
            )}
            {nakshatra && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">✦</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489] mb-0.5">Today's Nakshatra</div>
                  <div className="text-[13px] text-[#E8E2D5]">{nakshatra.name} <span className="text-[10px] text-[#C5A572]">pada {nakshatra.pada}</span></div>
                  <div className="text-[10px] text-[#9C9489]">Lord: {nakshatra.lord} · Deity: {nakshatra.deity}</div>
                </div>
              </GlassCard>
            )}
            {tithi && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">{tithi.special?.includes("Full") ? "🌕" : tithi.special?.includes("New") ? "🌑" : tithi.special?.includes("Ekadashi") ? "🕉" : "📅"}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489] mb-0.5">Today's Tithi</div>
                  <div className="text-[13px] text-[#E8E2D5]">{tithi.name}</div>
                  <div className="text-[10px] text-[#9C9489]">{tithi.paksha}{tithi.special ? ` · ${tithi.special}` : ""}</div>
                </div>
              </GlassCard>
            )}
            {yogaToday && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">{yogaToday.nature?.includes("Auspicious") ? "✦" : yogaToday.nature?.includes("Inauspicious") ? "⚠" : "◇"}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489] mb-0.5">Today's Yoga</div>
                  <div className="text-[13px] text-[#E8E2D5]">{yogaToday.name} <span className="text-[10px] text-[#9C9489]">#{yogaToday.number}/27</span></div>
                  <div className={cn("text-[10px]", yogaToday.nature?.includes("Auspicious") ? "text-[#7A8B6F]" : yogaToday.nature?.includes("Inauspicious") ? "text-[#C26B5C]/70" : "text-[#9C9489]")}>{yogaToday.nature}</div>
                  <div className="text-[9px] text-[#9C9489]/60 mt-0.5">{yogaToday.effect}</div>
                </div>
              </GlassCard>
            )}
            {karana && (
              <GlassCard className="p-4 flex items-center gap-3">
                <div className="text-2xl">{karana.nature?.includes("Auspicious") ? "✦" : karana.nature?.includes("Inauspicious") ? "⚠" : "◇"}</div>
                <div className="flex-1">
                  <div className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489] mb-0.5">Today's Karana</div>
                  <div className="text-[13px] text-[#E8E2D5]">{karana.name} <span className="text-[10px] text-[#9C9489]">#{karana.index}/60</span></div>
                  <div className={cn("text-[10px]", karana.nature?.includes("Auspicious") ? "text-[#7A8B6F]" : karana.nature?.includes("Inauspicious") ? "text-[#C26B5C]/70" : "text-[#9C9489]")}>{karana.nature}</div>
                </div>
              </GlassCard>
            )}
            {planetaryHours?.current && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Planetary Hours</span>
                </div>
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border" style={{ borderColor: planetaryHours.current.color + "40", background: planetaryHours.current.color + "15", color: planetaryHours.current.color }}>
                    {planetaryHours.current.symbol}
                  </div>
                  <div className="flex-1">
                    <div className="text-[13px] text-[#E8E2D5]">{planetaryHours.current.planet} hour <span className="text-[10px] text-[#9C9489]">({planetaryHours.current.hour}:00)</span></div>
                    <div className="text-[10px] text-[#9C9489]">{planetaryHours.current.effect}</div>
                  </div>
                </div>
                <div className="text-[9px] text-[#9C9489] mb-1">Day ruler: {planetaryHours.dayRuler} {planetaryHours.dayRulerSymbol}</div>
                {/* Mini hour strip */}
                <div className="flex gap-0.5 overflow-x-auto lum-no-scrollbar">
                  {planetaryHours.all?.slice(0, 12).map((h: any, i: number) => (
                    <div key={i} className={cn("shrink-0 px-1 py-0.5 rounded text-[8px] text-center transition", h.isCurrent ? "bg-[#C5A572]/15 text-[#C5A572]" : "bg-white/[0.02] text-[#9C9489]")} title={`${h.planet} hour`}>
                      {h.symbol}
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
            {rahuKaal?.periods?.length > 0 && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Rahu Kaal Timings</span>
                </div>
                {rahuKaal.currentlyInauspicious && (
                  <div className="px-2 py-1 rounded-full bg-[#C26B5C]/15 text-[#C26B5C] text-[10px] inline-block mb-2">
                    ⚠ Currently in {rahuKaal.currentPeriod}
                  </div>
                )}
                <div className="space-y-1">
                  {rahuKaal.periods.map((p: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 text-[10px]", p.active ? "text-[#C26B5C]" : "text-[#9C9489]")}>
                      <span className="text-sm">{p.icon}</span>
                      <span className="flex-1">{p.name}</span>
                      <span className={cn("font-mono", p.active && "font-medium")}>{p.start} – {p.end}</span>
                    </div>
                  ))}
                </div>
                <div className="text-[9px] text-[#9C9489]/60 mt-2">Sunrise: {rahuKaal.sunrise} · Sunset: {rahuKaal.sunset}</div>
                {!rahuKaal.currentlyInauspicious && rahuKaal.nextStarting && (
                  <div className="text-[10px] text-[#C5A572] mt-1">Next: {rahuKaal.nextStarting}</div>
                )}
              </GlassCard>
            )}
            {choghadiya?.current && (
              <GlassCard className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Clock className="w-3.5 h-3.5 text-[#C5A572]" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Choghadiya</span>
                  </div>
                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded-full", choghadiya.current.nature === "auspicious" ? "bg-leaf/15 text-[#7A8B6F]" : "bg-[#C26B5C]/15 text-[#C26B5C]")}>
                    {choghadiya.current.icon} {choghadiya.current.name}
                  </span>
                </div>
                <div className="text-[10px] text-[#9C9489] mb-2">{choghadiya.current.start} – {choghadiya.current.end}</div>
                <div className="text-[10px] text-[#9C9489] mb-3">{choghadiya.current.effect}</div>
                <div className="text-[9px] text-[#9C9489] mb-1">Day periods</div>
                <div className="flex flex-wrap gap-0.5 mb-2">
                  {choghadiya.dayPeriods?.map((p: any, i: number) => (
                    <div key={i} className={cn("shrink-0 px-1 py-0.5 rounded text-[8px] text-center", p.active ? "ring-1 ring-gold/40" : "", p.nature === "auspicious" ? "bg-leaf/[0.06] text-[#7A8B6F]" : "bg-[#C26B5C]/[0.06] text-[#C26B5C]/70")} title={`${p.name} ${p.start}-${p.end}`}>
                      {p.icon}
                    </div>
                  ))}
                </div>
                <div className="text-[10px] text-[#C5A572]">{choghadiya.nextAuspicious}</div>
              </GlassCard>
            )}

            {/* Today's lucky numbers */}
            {lucky && (
              <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <CloverIcon className="w-3.5 h-3.5 text-[#C5A572]" filled />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Luck</span>
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
                    className="p-1 rounded-full text-[#9C9489]/50 hover:text-[#C5A572] transition"
                    title="Share lucky numbers"
                  >
                    <Share2 className="w-3 h-3" />
                  </button>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {lucky.numbers.map((n: number, i: number) => (
                    <div key={i} className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-[#C5A572]/30 flex items-center justify-center text-[15px] font-light text-[#C5A572]">
                      <NumberTicker value={n} />
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#9C9489]">Color</div>
                    <div className="text-[#C5A572]">{lucky.color}</div>
                  </div>
                  <div>
                    <div className="text-[9px] uppercase tracking-wide text-[#9C9489]">Time</div>
                    <div className="text-[#E8E2D5]">{lucky.time}</div>
                  </div>
                </div>
              </AuroraGlowCard>
            )}

            {/* Muhurta (auspicious time) */}
            {muhurta && (
              <GlassCard className="p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Clock className="w-3.5 h-3.5 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Auspicious Time</span>
                </div>
                {/* Inauspicious (active highlighted) */}
                <div className="space-y-1.5 mb-3">
                  {muhurta.inauspicious.map((per: any, i: number) => (
                    <div key={i} className={cn("flex items-center gap-2 text-[11px]", per.active ? "text-[#C26B5C]" : "text-[#9C9489]")}>
                      <span className="text-sm">{per.icon}</span>
                      <span className="flex-1">{per.name}</span>
                      <span className={cn("font-mono", per.active && "font-medium")}>{per.time}</span>
                      {per.active && <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-[#C26B5C]/15 text-[#C26B5C]">NOW</span>}
                    </div>
                  ))}
                </div>
                {/* Upcoming auspicious */}
                {muhurta.upcoming?.length > 0 && (
                  <div className="pt-2 border-t border-[#2A2722]">
                    <div className="text-[9px] uppercase tracking-wide text-[#9C9489] mb-1">Next favorable</div>
                    {muhurta.upcoming.map((u: any, i: number) => (
                      <div key={i} className={cn("flex items-center justify-between text-[11px]", u.note.includes("Current") ? "text-[#7A8B6F]" : "text-[#9C9489]")}>
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
                <Compass className="w-4 h-4 text-[#C5A572]" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#C5A572]">Deep readings</span>
              </div>
              <div className="text-[13px] text-[#E8E2D5] mb-3">Unlock your full chart with deep astrological insights.</div>
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
    <button onClick={onClick} className="group relative p-3 rounded-sm bg-[#0A0908] border border-[#2A2722] hover:border-[#4A4540] hover:bg-[#0F0D0B] transition text-left">
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="w-4 h-4 text-[#C5A572] group-hover:scale-110 transition-transform" />
        {badge ? <Pill variant="gold" className="text-[9px] py-0">{badge}</Pill> : null}
      </div>
      <div className="text-[12px] text-[#E8E2D5] leading-tight">{label}</div>
      <div className="text-[10px] text-[#9C9489]">{desc}</div>
    </button>
  );
}

function CardOfDayCard({ reading }: { reading: any }) {
  const qc = useQueryClient();
  const [reflection, setReflection] = React.useState(reading.reflection || "");
  const [saved, setSaved] = React.useState(!!reading.reflection);
  const [saving, setSaving] = React.useState(false);
  const [cardRevealed, setCardRevealed] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);

  let cards: any[] = [];
  try { cards = JSON.parse(reading.cardsJson); } catch {}
  const card = cards[0];

  const fullCard = React.useMemo(() => {
    if (reading.cards && Array.isArray(reading.cards) && reading.cards[0]?.card) {
      return reading.cards[0].card;
    }
    return { id: card?.id || "the-fool", name: card?.name || card?.id || "Card", nameShort: card?.nameShort || card?.id || "Card", symbol: card?.symbol || "✦", suit: "major", arcana: "major", number: 0, meaningUpright: reading.interpretation?.slice(0, 200) || "", meaningReversed: "", keywordsUpright: [], keywordsReversed: [], element: "", astrology: "", yesNoUpright: "maybe", yesNoReversed: "maybe", affirmation: "", numerology: "" };
  }, [card, reading]);

  if (!card) return <div className="text-[13px] text-[#9C9489]">{reading.interpretation?.slice(0, 200)}…</div>;

  const reversed = card.reversed;

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
        toast.success(`Reflection saved · +${data.bonusLuck} Luck`);
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
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="text-[12px] text-[#6B6358] font-medium">Card of the Day</div>
          <div className="text-[11px] text-[#9C9489] mt-0.5">
            {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
          </div>
        </div>
        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 text-[11px] border border-[#C5A572]/20 text-[#C5A572] rounded-sm">
          {reversed ? "Reversed" : "Upright"}
        </span>
      </div>

      {/* Card with reveal animation */}
      <div className="flex flex-col items-center">
        <button
          onClick={() => {
            if (!cardRevealed) {
              setCardRevealed(true);
            } else {
              setDetailOpen(true);
            }
          }}
          className="relative group focus-ring rounded-sm"
          aria-label={`View details for ${fullCard.name}`}
          style={{ filter: cardRevealed ? "drop-shadow(0 0 20px rgba(197,168,124,0.25))" : "none" }}
        >
          <motion.div
            animate={{
              filter: cardRevealed ? "blur(0px)" : "blur(14px)",
              opacity: cardRevealed ? 1 : 0.5,
            }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
          >
            <TarotCardFace card={fullCard} reversed={reversed} size="md" />
          </motion.div>
          {!cardRevealed && (
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <motion.div
                animate={{ scale: [1, 1.15, 1], opacity: [0.5, 1, 0.5] }}
                transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                className="text-[32px] text-[#C5A572]"
                style={{ filter: "drop-shadow(0 0 12px rgba(197,168,124,0.5))" }}
              >
                ✦
              </motion.div>
              <div className="text-[11px] text-[#C5A572] font-medium mt-2">Tap to reveal</div>
            </div>
          )}
          {cardRevealed && (
            <div className="absolute inset-0 rounded-sm bg-[#C5A572]/0 group-hover:bg-[#C5A572]/10 transition-colors" />
          )}
        </button>
      </div>

      {/* Card name + meaning — hidden until revealed */}
      <AnimatePresence>
        {cardRevealed ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.3 }}
            className="mt-5 text-center"
          >
            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="text-xl leading-none">{fullCard.symbol}</span>
              <h3 className="serif text-[18px] text-[#E8E2D5]">{fullCard.name}</h3>
              {reversed && <span className="text-[11px] text-[#C5A572] serif-italic">· Rev</span>}
            </div>
            <p className="text-[13px] leading-[20px] text-[#9C9489] max-w-[300px] mx-auto">
              {reversed ? (fullCard.meaningReversed || reading.interpretation?.slice(0, 180)) : (fullCard.meaningUpright || reading.interpretation?.slice(0, 180))}
            </p>
            {fullCard.keywordsUpright?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 justify-center mt-3">
                {(reversed ? fullCard.keywordsReversed : fullCard.keywordsUpright).slice(0, 3).map((k: string) => (
                  <span key={k} className="text-[11px] px-2.5 py-0.5 border border-[#C5A572]/20 text-[#C5A572] rounded-sm">{k}</span>
                ))}
              </div>
            )}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="mt-5 text-center"
          >
            <div className="h-5 w-40 bg-white/[0.06] rounded-full mx-auto mb-3" style={{ filter: "blur(8px)" }} />
            <div className="space-y-2 max-w-[260px] mx-auto">
              <div className="h-3 bg-white/[0.04] rounded-full" style={{ filter: "blur(6px)" }} />
              <div className="h-3 w-3/4 bg-white/[0.04] rounded-full mx-auto" style={{ filter: "blur(6px)" }} />
            </div>
            <p className="text-[12px] text-[#6B6358] serif-italic mt-4">Reveal to discover today's message</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Affirmation + Reflection — hidden until revealed */}
      <AnimatePresence>
        {cardRevealed && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, delay: 0.5 }}
          >
            <hr className="rule-h my-4" />

            {/* Affirmation */}
            {fullCard.affirmation && (
              <div className="p-3 border border-[#C5A572]/15 mb-3" style={{ background: "rgba(197,168,124,0.04)" }}>
                <div className="text-[12px] text-[#C5A572] font-medium mb-1">Today's affirmation</div>
                <p className="serif-italic text-[14px] leading-[20px] text-[#E8E2D5]">"{fullCard.affirmation}"</p>
              </div>
            )}

            {/* Reflection */}
            <div className="mt-3">
              <div className="text-[12px] text-[#6B6358] font-medium mb-1.5 flex items-center gap-1.5">
                <BookOpen className="w-3 h-3 text-[#C5A572]" /> Your reflection {saved && <span className="text-[#7A8B6F] serif-italic">· saved</span>}
              </div>
              <textarea
                value={reflection}
                onChange={(e) => { setReflection(e.target.value); setSaved(false); }}
                placeholder="How does this card speak to your day?"
                className="w-full bg-transparent border border-[#2A2722] rounded-sm px-3 py-2 text-[12px] text-[#E8E2D5] placeholder:text-[#4A4540] outline-none focus:border-[#C5A572] resize-none min-h-[48px] transition"
                rows={2}
              />
              {reflection.trim() && !saved && (
                <button
                  onClick={saveReflection}
                  disabled={saving}
                  className="mt-2 px-4 py-1.5 text-[11px] border border-[#C5A572]/30 text-[#C5A572] hover:bg-[#C5A572]/10 active:scale-95 transition rounded-sm disabled:opacity-50 focus-ring"
                >
                  {saving ? "Saving…" : "Save reflection · +1 Luck"}
                </button>
              )}
            </div>

            {/* Share */}
            <button
              onClick={async () => {
                const text = `${fullCard.name || "Card of the Day"} (${reversed ? "Reversed" : "Upright"})\n\n${reading.interpretation?.replace(/[#*_`]/g, "").slice(0, 200)}`;
                if (navigator.share) {
                  try { await navigator.share({ title: "My Baydin Card of the Day", text, url: window.location.origin }); } catch {}
                } else {
                  await navigator.clipboard.writeText(text + "\n\n" + window.location.origin);
                  toast.success("Card shared");
                }
              }}
              className="mt-3 inline-flex items-center gap-1.5 text-[12px] text-[#6B6358] hover:text-[#C5A572] transition focus-ring rounded-sm"
            >
              <Share2 className="w-3.5 h-3.5" /> Share this card
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CardDetailModal card={fullCard} reversed={reversed} open={detailOpen} onOpenChange={setDetailOpen} />
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
      <Flame className={cn("w-3.5 h-3.5 shrink-0", goal.streak > 0 ? "text-[#7A8B6F]" : "text-[#9C9489]/40")} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-[#E8E2D5] truncate">{goal.title}</div>
        {goal.streak > 0 && <div className="text-[10px] text-[#7A8B6F]">{goal.streak}-day streak</div>}
      </div>
      <button
        onClick={confirm}
        disabled={confirming || goal.confirmedToday}
        className={cn(
          "px-2.5 py-1 rounded-full text-[10px] transition border",
          goal.confirmedToday
            ? "border-leaf/20 bg-leaf/10 text-[#7A8B6F]"
            : "border-[#C5A572]/20 bg-[#C5A572]/10 text-[#C5A572] hover:bg-[#C5A572]/20"
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
            val === m.v ? "border-[#C5A572]/30 bg-[#C5A572]/10" : "border-transparent hover:bg-white/[0.03]"
          )}
        >
          <span className="text-lg">{m.e}</span>
          <span className={cn("text-[9px]", val === m.v ? "text-[#C5A572]" : "text-[#9C9489]")}>{m.l}</span>
        </button>
      ))}
    </div>
  );
}

function UpsellRow({ icon: Icon, label, cost, desc, onClick }: { icon: any; label: string; cost: number; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition text-left">
      <Icon className="w-3.5 h-3.5 text-[#C5A572] shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-[#E8E2D5]">{label}</div>
        <div className="text-[10px] text-[#9C9489]">{desc}</div>
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
      <AuroraGlowCard glowColor="#7A8B6F" glowIntensity={0.2} className="p-4 mb-5 lum-reveal">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-leaf/15 border border-leaf/30 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-[#7A8B6F]" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-[#E8E2D5] font-medium">Today's practice complete ✦</div>
            <div className="text-[11px] text-[#9C9489]">You've done everything. Come back tomorrow to keep your <NumberTicker value={streak} />-day streak alive.</div>
          </div>
        </div>
      </AuroraGlowCard>
    );
  }

  return (
    <button onClick={() => onNavigate(next.view)} className="block w-full text-left mb-5 lum-reveal group">
      <AuroraGlowCard glowColor={next.color} glowIntensity={0.18} className="p-4 hover:border-[#C5A572]/30 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{ background: `${next.color}15`, borderColor: `${next.color}40` }}>
            <next.icon className="w-5 h-5" style={{ color: next.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#9C9489] mb-0.5">Recommended next</div>
            <div className="text-[14px] text-[#E8E2D5] font-medium group-hover:text-[#C5A572] transition">{next.label}</div>
            <div className="text-[11px] text-[#9C9489]">{next.desc}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-[#9C9489] group-hover:text-[#C5A572] group-hover:translate-x-0.5 transition shrink-0" />
        </div>
      </AuroraGlowCard>
    </button>
  );
}

function WeeklyStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="shrink-0 text-center">
      <div className="text-[18px] font-light leading-none" style={{ color }}>{value}</div>
      <div className="text-[9px] text-[#9C9489] mt-0.5">{label}</div>
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
