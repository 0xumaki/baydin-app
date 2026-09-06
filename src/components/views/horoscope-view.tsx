"use client";

import * as React from "react";
import {
  StarField,
} from "@/components/lumina/primitives";
import {
  GlowPill,
  IconBgCard,
  LiquidMetalText,
  NumberTicker,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, ZodiacIcon, BaydinMoon, BaydinStar, BaydinLoader, BaydinCheck, BaydinX, BaydinCalendar, BaydinClock, BaydinSun, BaydinBreath, BaydinNumerology } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { BaydinStar as Palette } from "@/components/lumina/baydin-icons";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ZODIAC_SYMBOLS, ZODIAC_MY } from "@/lib/astrology";

const SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
] as const;

const SIGN_LABELS: Record<string, string> = {
  aries: "Aries", taurus: "Taurus", gemini: "Gemini", cancer: "Cancer",
  leo: "Leo", virgo: "Virgo", libra: "Libra", scorpio: "Scorpio",
  sagittarius: "Sagittarius", capricorn: "Capricorn", aquarius: "Aquarius", pisces: "Pisces",
};

const PERIODS = [
  { id: "daily", label: "Daily" },
  { id: "weekly", label: "Weekly" },
  { id: "monthly", label: "Monthly" },
] as const;

const LUCK_COST_PERSONALIZED = 2;

export function HoroscopeView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [sign, setSign] = React.useState<string>("aries");
  const [type, setType] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const [horoscope, setHoroscope] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  // Sync sign from birth data once user loads
  React.useEffect(() => {
    if (!user) return;
    if (user.birthData) {
      try {
        const bd = JSON.parse(user.birthData);
        if (bd?.dob) {
          const inferred = inferSunSign(bd.dob);
          if (inferred) setSign(inferred);
        }
      } catch {}
    }
  }, [user]);

  async function fetchH(s?: string, t?: typeof type) {
    if (!user) { onAuth(); return; }
    setLoading(true);
    try {
      const res = await api<{ horoscope: any }>(`/api/horoscope?sign=${s || sign}&type=${t || type}`);
      setHoroscope(res.horoscope);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  // Sign/period change does NOT auto-fetch — user must click "Read horoscope" to spend Luck
  function changeSign(s: string) { setSign(s); setHoroscope(null); }
  function changeType(t: typeof type) { setType(t); setHoroscope(null); }

  return (
    <div className="h-full overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== Hero ===== */}
        <div className="mb-7 lum-reveal">
          <GlowPill className="mb-3">
            <BaydinStar className="w-3 h-3" /> Daily guidance
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block mb-2">
            Your Horoscope
          </LiquidMetalText>
          <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Written by Gemini from live transit data. Personalized readings draw from your natal chart — costs {LUCK_COST_PERSONALIZED} Luck each. Generic sun-sign guidance is free.
          </p>
        </div>

        {/* ===== Sign selector ===== */}
        <div className="mb-5">
          <div className="flex items-center gap-2 mb-2.5">
            <BaydinStar className="w-3.5 h-3.5 text-[#C5A572]" />
            <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Choose your sign</span>
          </div>
          <div className="grid grid-cols-6 sm:grid-cols-12 gap-2 mb-3">
            {SIGNS.map((s, i) => (
              <button
                key={s}
                onClick={() => changeSign(s)}
                aria-pressed={sign === s}
                title={SIGN_LABELS[s]}
                className={`aspect-square rounded-lg border flex flex-col items-center justify-center transition-all duration-300 hover:scale-110 focus-ring ${
                  sign === s
                    ? "border-[#C5A572] bg-gradient-to-br from-[#C5A572]/20 to-transparent text-[#C5A572] shadow-[0_0_12px_rgba(197,165,114,0.3)]"
                    : "border-[#2A2722] bg-white/[0.02] text-[#9C9489] hover:text-[#E8E2D5] hover:border-[#C5A572]/30"
                }`}
              >
                <ZodiacIcon sign={s} className="w-7 h-7 sm:w-8 sm:h-8" />
              </button>
            ))}
          </div>
          <div className="mt-1.5 text-[11px] text-[#9C9489]">
            Selected · <span className="text-[#C5A572]">{SIGN_LABELS[sign]}</span>
            <span className="text-[#9C9489]/60"> · {ZODIAC_MY[SIGNS.indexOf(sign as typeof SIGNS[number])]}</span>
          </div>
        </div>

        {/* ===== Period tabs ===== */}
        <div className="mb-5">
          <div className="flex gap-2 border-b border-[#2A2722]">
            {PERIODS.map((p) => {
              const active = type === p.id;
              return (
                <button
                  key={p.id}
                  onClick={() => changeType(p.id)}
                  className={`relative px-4 py-2 text-[12px] font-medium transition focus-ring ${
                    active ? "text-[#C5A572]" : "text-[#9C9489] hover:text-[#E8E2D5]"
                  }`}
                >
                  {p.label}
                  {active && (
                    <span
                      aria-hidden
                      className="absolute left-0 right-0 -bottom-px h-[2px] bg-gradient-to-r from-transparent via-[#C5A572] to-transparent"
                    />
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* ===== Read horoscope button (the only fetch trigger) ===== */}
        <ShimmerButton
          onClick={() => fetchH()}
          disabled={loading}
          className="w-full mb-5 py-3"
        >
          {loading ? (
            <><BaydinLoader className="w-4 h-4" /> Reading the stars…</>
          ) : (
            <>
              <BaydinMoon className="w-4 h-4" />
              {user?.birthData ? (
                <>Personalized · {LUCK_COST_PERSONALIZED} <CloverIcon className="w-3.5 h-3.5" filled /></>
              ) : (
                <>Read horoscope</>
              )}
            </>
          )}
        </ShimmerButton>

        {/* ===== Loading state ===== */}
        {loading && (
          <IconBgCard icon={BaydinLoader} glowColor="#9E8AC9" glowIntensity={0.18} iconSize={180} iconOpacity={0.07} iconPosition="top-right" className="p-5 mb-5">
            <div className="animate-pulse space-y-3">
              <div className="flex items-center gap-2">
                <div className="h-3 w-24 bg-white/5 rounded" />
                <div className="h-3 w-12 bg-white/5 rounded" />
              </div>
              <div className="h-4 w-full bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-5/6 bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
              <div className="grid grid-cols-2 gap-3 pt-3">
                <div className="h-14 bg-white/[0.03] rounded" />
                <div className="h-14 bg-white/[0.03] rounded" />
              </div>
            </div>
          </IconBgCard>
        )}

        {/* ===== Main reading ===== */}
        {horoscope && !loading && (
          <div className="space-y-5">
            <IconBgCard icon={BaydinMoon} glowColor="#9E8AC9" glowIntensity={0.22} iconSize={220} iconOpacity={0.08} iconPosition="top-right" className="p-6">
              <div className="flex flex-wrap items-center gap-2 mb-3">
                <GlowPill color="#9E8AC9"><BaydinMoon className="w-3 h-3" /> {SIGN_LABELS[horoscope.sign] || SIGN_LABELS[sign]} · {horoscope.type}</GlowPill>
                {horoscope.personalized && (
                  <GlowPill color="#C5A572">
                    <BaydinStar className="w-3 h-3" /> Personalized for your chart
                  </GlowPill>
                )}
                {horoscope.luckCost > 0 && (
                  <GlowPill color="#7A8B6F">
                    <CloverIcon className="w-3 h-3" filled /> {horoscope.luckCost} spent
                  </GlowPill>
                )}
              </div>
              <div className="serif prose-editorial text-[14px] text-[#E8E2D5]/90 leading-[1.75]">
                <ReactMarkdown>{horoscope.content}</ReactMarkdown>
              </div>
            </IconBgCard>

            {/* ===== Lucky elements grid ===== */}
            <LuckyElementsGrid horoscope={horoscope} />

            {/* ===== DO / DON'T lists ===== */}
            <DoDontLists horoscope={horoscope} />

            {/* ===== Highlights ===== */}
            {Array.isArray(horoscope.highlights) && horoscope.highlights.length > 0 && (
              <IconBgCard icon={BaydinStar} glowColor="#C5A572" glowIntensity={0.18} iconSize={170} iconOpacity={0.07} iconPosition="top-right" className="p-5">
                <div className="flex items-center gap-2 mb-3">
                  <BaydinStar className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Highlights</span>
                </div>
                <ul className="space-y-2">
                  {horoscope.highlights.map((h: string, i: number) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <span className="text-[#C5A572] mt-0.5 shrink-0">✦</span>
                      <span className="text-[13px] text-[#E8E2D5]/90 leading-[1.6]">{h}</span>
                    </li>
                  ))}
                </ul>
              </IconBgCard>
            )}

            {/* ===== Transit summary ===== */}
            <TransitSummary horoscope={horoscope} />
          </div>
        )}

        {/* ===== Empty state ===== */}
        {!horoscope && !loading && (
          <IconBgCard icon={BaydinMoon} glowColor="#9E8AC9" glowIntensity={0.16} iconSize={180} iconOpacity={0.08} iconPosition="center" className="p-8 text-center">
            <div className="flex justify-center mb-4">
              <div className="w-12 h-12 rounded-full border border-[#C5A572]/30 bg-[#C5A572]/5 flex items-center justify-center">
                <BaydinMoon className="w-6 h-6 text-[#C5A572]" />
              </div>
            </div>
            <div className="serif-display text-[16px] text-[#E8E2D5] mb-1">The stars are quiet — for now.</div>
            <p className="text-[12px] text-[#9C9489] leading-[1.6] max-w-xs mx-auto mb-5">
              Select your sign above and tap <span className="text-[#C5A572]">Read horoscope</span> to receive today's guidance.
            </p>
            <ShimmerButton onClick={() => fetchH()} disabled={loading}>
              <BaydinMoon className="w-4 h-4" /> Reveal today's reading
            </ShimmerButton>
          </IconBgCard>
        )}
      </div>
    </div>
  );
}

// ============================================================
// LuckyElementsGrid — 4 AuroraGlowCards for lucky_color, lucky_number,
// lucky_time, lucky_day.
// ============================================================
function LuckyElementsGrid({ horoscope }: { horoscope: any }) {
  const g = horoscope?.guidance;
  const color = g?.lucky_color ?? g?.luckyColor;
  const number = g?.lucky_number ?? g?.luckyNumber;
  const time = g?.lucky_time ?? g?.luckyTime;
  const day = g?.lucky_day ?? g?.luckyDay ?? new Date().toLocaleDateString("en-US", { weekday: "long" });

  const items = [
    { label: "Lucky color", value: color, icon: Palette, accent: "#C5A572" },
    { label: "Lucky number", value: number !== undefined && number !== null ? String(number) : null, icon: BaydinNumerology, accent: "#9E8AC9" },
    { label: "Lucky time", value: time, icon: BaydinClock, accent: "#B5CD7E" },
    { label: "Lucky day", value: day, icon: BaydinCalendar, accent: "#D876A0" },
  ];
  const present = items.filter((it) => it.value);
  if (present.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BaydinStar className="w-3.5 h-3.5 text-[#C5A572]" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Lucky Elements</span>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {items.map((it) => {
          const Icon = it.icon;
          return (
            <IconBgCard key={it.label} icon={Icon} glowColor={it.accent} glowIntensity={0.2} iconSize={120} iconOpacity={0.07} iconPosition="top-right" className="p-5">
              <div className="flex items-center justify-between mb-2">
                <Icon className="w-4 h-4" style={{ color: it.accent }} />
              </div>
              <div className="text-[10px] uppercase tracking-wide text-[#9C9489] mb-1">{it.label}</div>
              <div className="text-[16px] text-[#E8E2D5] font-medium truncate">
                {it.value ? (
                  typeof it.value === "string" && /^\d+$/.test(it.value) ? (
                    <NumberTicker value={parseInt(it.value, 10)} />
                  ) : (
                    it.value
                  )
                ) : (
                  <span className="text-[#6B6358] text-[12px]">—</span>
                )}
              </div>
            </IconBgCard>
          );
        })}
      </div>
    </div>
  );
}

// ============================================================
// DoDontLists — 2-column grid of AuroraGlowCards with doList and dontList.
// Falls back to guidance.remedies (DO) and guidance.warnings (DON'T) if
// the API doesn't return explicit doList/dontList fields.
// ============================================================
function DoDontLists({ horoscope }: { horoscope: any }) {
  const g = horoscope?.guidance;
  const doList: string[] = Array.isArray(horoscope?.doList)
    ? horoscope.doList
    : Array.isArray(g?.remedies) ? g.remedies : [];
  const dontList: string[] = Array.isArray(horoscope?.dontList)
    ? horoscope.dontList
    : Array.isArray(g?.warnings) ? g.warnings : [];

  if (doList.length === 0 && dontList.length === 0) return null;

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <BaydinStar className="w-3.5 h-3.5 text-[#C5A572]" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Today's Guidance</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <IconBgCard icon={BaydinCheck} glowColor="#7A8B6F" glowIntensity={0.22} iconSize={140} iconOpacity={0.07} iconPosition="bottom-right" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-[#7A8B6F]/15 border border-[#7A8B6F]/30 flex items-center justify-center shrink-0">
              <BaydinCheck className="w-3.5 h-3.5 text-[#7A8B6F]" />
            </span>
            <span className="text-[12px] uppercase tracking-[0.2em] text-[#7A8B6F]">Do</span>
          </div>
          {doList.length > 0 ? (
            <ul className="space-y-2">
              {doList.slice(0, 5).map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#7A8B6F] mt-1 shrink-0">✓</span>
                  <span className="text-[12px] text-[#E8E2D5]/90 leading-[1.6]">{d}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[12px] text-[#6B6358] serif-italic">Lean into what feels alive today.</div>
          )}
        </IconBgCard>

        <IconBgCard icon={BaydinX} glowColor="#C26B5C" glowIntensity={0.22} iconSize={140} iconOpacity={0.07} iconPosition="bottom-right" className="p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-6 h-6 rounded-full bg-[#C26B5C]/15 border border-[#C26B5C]/30 flex items-center justify-center shrink-0">
              <BaydinX className="w-3.5 h-3.5 text-[#C26B5C]" />
            </span>
            <span className="text-[12px] uppercase tracking-[0.2em] text-[#C26B5C]">Don't</span>
          </div>
          {dontList.length > 0 ? (
            <ul className="space-y-2">
              {dontList.slice(0, 5).map((d: string, i: number) => (
                <li key={i} className="flex items-start gap-2">
                  <span className="text-[#C26B5C] mt-1 shrink-0">✕</span>
                  <span className="text-[12px] text-[#E8E2D5]/90 leading-[1.6]">{d}</span>
                </li>
              ))}
            </ul>
          ) : (
            <div className="text-[12px] text-[#6B6358] serif-italic">No sharp edges to avoid — proceed gently.</div>
          )}
        </IconBgCard>
      </div>
    </div>
  );
}

// ============================================================
// TransitSummary — "Moon in {sign}" + first natal aspect (best-effort).
// ============================================================
function TransitSummary({ horoscope }: { horoscope: any }) {
  const g = horoscope?.guidance;
  const moonSign = g?.moon_sign ?? g?.moonSign ?? null;
  const natalAspect = Array.isArray(g?.natal_aspects) && g.natal_aspects[0]
    ? g.natal_aspects[0]
    : (typeof g?.natal_aspects === "string" ? g.natal_aspects : null);

  if (!moonSign && !natalAspect) return null;

  return (
    <IconBgCard icon={BaydinBreath} glowColor="#5FA9C7" glowIntensity={0.2} iconSize={150} iconOpacity={0.06} iconPosition="top-right" className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <BaydinBreath className="w-4 h-4 text-[#5FA9C7]" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Transit Summary</span>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {moonSign && (
          <div className="p-3 rounded-sm border border-[#2A2722] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-1.5">
              <BaydinMoon className="w-3.5 h-3.5 text-[#5FA9C7]" />
              <span className="text-[10px] uppercase tracking-wide text-[#9C9489]">Moon</span>
            </div>
            <div className="text-[13px] text-[#E8E2D5]">in {moonSign}</div>
          </div>
        )}
        {natalAspect && (
          <div className="p-3 rounded-sm border border-[#2A2722] bg-white/[0.02]">
            <div className="flex items-center gap-2 mb-1.5">
              <BaydinSun className="w-3.5 h-3.5 text-[#C5A572]" />
              <span className="text-[10px] uppercase tracking-wide text-[#9C9489]">Natal Aspect</span>
            </div>
            <div className="text-[12px] text-[#E8E2D5] leading-[1.5]">
              {typeof natalAspect === "string" ? natalAspect : (natalAspect?.description || JSON.stringify(natalAspect))}
            </div>
          </div>
        )}
      </div>
    </IconBgCard>
  );
}

// ============================================================
// Helpers
// ============================================================

/** Infer Western sun sign from "YYYY-MM-DD". */
function inferSunSign(dob: string): string | null {
  if (!dob) return null;
  const m = dob.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return null;
  const month = parseInt(m[2], 10);
  const day = parseInt(m[3], 10);
  const ranges: { sign: string; from: [number, number]; to: [number, number] }[] = [
    { sign: "capricorn", from: [12, 22], to: [1, 19] },
    { sign: "aquarius", from: [1, 20], to: [2, 18] },
    { sign: "pisces", from: [2, 19], to: [3, 20] },
    { sign: "aries", from: [3, 21], to: [4, 19] },
    { sign: "taurus", from: [4, 20], to: [5, 20] },
    { sign: "gemini", from: [5, 21], to: [6, 20] },
    { sign: "cancer", from: [6, 21], to: [7, 22] },
    { sign: "leo", from: [7, 23], to: [8, 22] },
    { sign: "virgo", from: [8, 23], to: [9, 22] },
    { sign: "libra", from: [9, 23], to: [10, 22] },
    { sign: "scorpio", from: [10, 23], to: [11, 21] },
    { sign: "sagittarius", from: [11, 22], to: [12, 21] },
  ];
  for (const r of ranges) {
    const [fm, fd] = r.from;
    const [tm, td] = r.to;
    if (fm > tm) {
      // Capricorn wrap
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return r.sign;
    } else {
      if ((month === fm && day >= fd) || (month === tm && day <= td)) return r.sign;
    }
  }
  return null;
}
