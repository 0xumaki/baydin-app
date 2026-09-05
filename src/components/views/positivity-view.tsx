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
import { cn } from "@/lib/utils";
import { POSITIVITY_CATEGORIES } from "@/lib/positivity";
import ReactMarkdown from "react-markdown";
import {
  Heart, Play, Pause, RefreshCw, Loader2, Sparkles,
  ChevronLeft, Volume2, Clock,
} from "lucide-react";
import { toast } from "sonner";

const DAILY_FREE = 1;

export function PositivityView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [selectedCat, setSelectedCat] = React.useState<string | null>(null);
  const [script, setScript] = React.useState("");
  const [session, setSession] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [playing, setPlaying] = React.useState(false);
  const [wordIndex, setWordIndex] = React.useState(0);
  const [intention, setIntention] = React.useState("");
  const [todayCount, setTodayCount] = React.useState(0);
  const [history, setHistory] = React.useState<any[]>([]);
  const intervalRef = React.useRef<any>(null);

  React.useEffect(() => {
    fetch("/api/positivity/generate")
      .then((r) => r.json())
      .then((d) => {
        setTodayCount(d.todayCount ?? 0);
        if (Array.isArray(d.history)) setHistory(d.history);
      })
      .catch(() => {});
  }, []);

  async function generate(catId: string) {
    if (!user) { onAuth(); return; }
    setSelectedCat(catId);
    setLoading(true);
    setScript("");
    setPlaying(false);
    setWordIndex(0);
    try {
      const res = await api<{ session: any; error?: string; balance?: number; isFree?: boolean }>("/api/positivity/generate", {
        method: "POST", json: { category: catId, intention: intention || undefined, durationSec: 120 },
      });
      if (res.error) { toast.error(res.error); return; }
      setScript(res.session.script);
      setSession(res.session);
      setTodayCount((c) => c + 1);
      setHistory((prev) => [res.session, ...prev].slice(0, 20));
      toast.success(res.isFree ? "Script generated · 1 free today" : "Script generated");
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  function play() {
    if (!script) return;
    const words = script.split(/\s+/);
    if (wordIndex >= words.length) setWordIndex(0);
    setPlaying(true);
    intervalRef.current = setInterval(() => {
      setWordIndex((prev) => {
        const next = prev + 1;
        if (next >= words.length) {
          if (intervalRef.current) clearInterval(intervalRef.current);
          setPlaying(false);
          return words.length;
        }
        return next;
      });
    }, 450);
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPlaying(false);
  }

  function restart() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setWordIndex(0);
    setPlaying(false);
  }

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!user) return <Gate onAuth={onAuth} />;

  const cat = selectedCat ? POSITIVITY_CATEGORIES.find((c) => c.id === selectedCat) : null;
  const words = script ? script.split(/\s+/) : [];
  const remainingFree = Math.max(0, DAILY_FREE - todayCount);

  // Showing script player
  if (script && cat) {
    const visibleWords = words.slice(Math.max(0, wordIndex - 8), wordIndex + 12);
    const startIdx = Math.max(0, wordIndex - 8);
    const isFinished = wordIndex >= words.length;
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="warm" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <button
            onClick={() => { pause(); setScript(""); setSelectedCat(null); setWordIndex(0); }}
            className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition mb-6 focus-ring rounded-sm inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All categories
          </button>

          {/* Category header */}
          <div className="mb-6 lum-reveal">
            <GlowPill color={cat.color} className="mb-2">
              <Heart className="w-3 h-3" /> {cat.name}
            </GlowPill>
            <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block">
              Affirmation
            </LiquidMetalText>
          </div>

          {/* Word-by-word player */}
          <AuroraGlowCard glowColor={cat.color} glowIntensity={0.18} className="p-8 lg:p-12 mb-6 min-h-[240px] flex items-center justify-center text-center">
            <div>
              {wordIndex > 0 || playing ? (
                <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center max-w-lg">
                  {visibleWords.map((w, i) => {
                    const absIdx = startIdx + i;
                    const isCurrent = absIdx === wordIndex;
                    const dist = Math.abs(absIdx - wordIndex);
                    return (
                      <span
                        key={absIdx}
                        className="serif transition-all duration-500"
                        style={{
                          opacity: isCurrent ? 1 : Math.max(0.15, 1 - dist * 0.15),
                          transform: isCurrent ? "scale(1.2)" : "scale(1)",
                          color: isCurrent ? cat.color : "#9C9489",
                          fontWeight: isCurrent ? 500 : 300,
                          fontSize: isCurrent ? "1.625rem" : "1.125rem",
                          textShadow: isCurrent ? `0 0 20px ${cat.color}40` : "none",
                        }}
                      >
                        {w}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[14px] text-[#6B6358] leading-relaxed max-w-sm">
                  Press play to begin. Read each word as it appears. Let it sink in.
                </div>
              )}
              {isFinished && !playing && (
                <div className="mt-6 text-[13px] text-[#6B6358] serif-italic flex items-center justify-center gap-2">
                  <Sparkles className="w-3.5 h-3.5 text-[#C5A572]" /> Complete
                </div>
              )}
            </div>
          </AuroraGlowCard>

          {/* Progress bar */}
          {words.length > 0 && (
            <div className="w-full h-px bg-[#2A2722] mb-6 relative overflow-hidden">
              <div
                className="absolute top-0 left-0 h-full transition-all duration-300"
                style={{
                  width: `${(wordIndex / words.length) * 100}%`,
                  background: cat.color,
                }}
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center justify-center gap-3 mb-6">
            <button
              onClick={restart}
              className="w-10 h-10 rounded-full border border-[#2A2722] flex items-center justify-center text-[#6B6358] hover:text-[#E8E2D5] transition focus-ring"
              aria-label="Restart"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
            <ShimmerButton
              onClick={playing ? pause : play}
              className="w-14 h-14 rounded-full p-0"
              aria-label={playing ? "Pause" : "Play"}
            >
              {playing ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}
            </ShimmerButton>
            <div className="w-10" />
          </div>

          {/* Full script */}
          <AuroraGlowCard glowColor={cat.color} glowIntensity={0.1} className="p-5">
            <div className="flex items-center gap-2 mb-3">
              <Volume2 className="w-4 h-4 text-[#C5A572]" />
              <span className="text-[12px] text-[#9C9489] font-medium">Full script</span>
            </div>
            <div className="serif text-[14px] text-[#9C9489] leading-[1.8] prose-editorial">
              <ReactMarkdown>{script}</ReactMarkdown>
            </div>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && cat) {
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="warm" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden flex items-center justify-center">
          <AuroraGlowCard glowColor={cat.color} glowIntensity={0.2} className="max-w-md w-full p-10 text-center">
            <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" style={{ color: cat.color }} />
            <LiquidMetalText as="div" className="serif-display text-[1.25rem] block mb-1">
              Writing your {cat.name} affirmation…
            </LiquidMetalText>
            <div className="text-[11px] text-[#9C9489]">Gemini is crafting something just for you</div>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Category grid
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== Hero ===== */}
        <div className="mb-6 lum-reveal">
          <GlowPill className="mb-3" color="#D876A0">
            <Heart className="w-3 h-3" /> Daily practice · 1 free/day
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block mb-2">
            Positivity
          </LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            AI-crafted affirmation scripts. Read along as each word lights up.
            One free script per day; additional scripts cost{" "}
            <span className="inline-flex items-center gap-1 text-[#C5A572]">
              <CloverIcon className="w-3 h-3" filled /> 1 Luck
            </span> each.
          </p>
        </div>

        {/* Free counter */}
        <AuroraGlowCard
          glowColor={remainingFree > 0 ? "#7A8B6F" : "#C5A572"}
          glowIntensity={0.12}
          className="p-4 mb-4 flex items-center gap-4"
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center shrink-0 border"
            style={{
              background: `${remainingFree > 0 ? "#7A8B6F" : "#C5A572"}15`,
              borderColor: `${remainingFree > 0 ? "#7A8B6F" : "#C5A572"}40`,
              color: remainingFree > 0 ? "#7A8B6F" : "#C5A572",
            }}
          >
            <Clock className="w-5 h-5" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[14px] text-[#E8E2D5] font-medium leading-tight">
              {remainingFree > 0 ? "Free script available" : "Free script used today"}
            </div>
            <div className="text-[11px] text-[#9C9489] mt-0.5">
              {remainingFree > 0
                ? "Generate one affirmation free of charge."
                : "Additional scripts cost 1 Luck each."}
            </div>
          </div>
          <div className="text-right shrink-0">
            <div className="flex items-baseline gap-1">
              <NumberTicker value={remainingFree} className="text-[24px] font-light text-[#E8E2D5] tabular-nums" />
              <span className="text-[12px] text-[#6B6358]">/ {DAILY_FREE}</span>
            </div>
            <div className="text-[10px] text-[#6B6358]">free today</div>
          </div>
        </AuroraGlowCard>

        {/* Optional intention */}
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.08} className="p-3 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-[#C5A572] shrink-0" />
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Optional: a specific intention (e.g. 'I release fear about my interview')"
            className="flex-1 bg-transparent outline-none text-[13px] text-[#E8E2D5] placeholder:text-[#9C9489]/60"
          />
        </AuroraGlowCard>

        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {POSITIVITY_CATEGORIES.map((c) => (
            <AuroraGlowCard
              key={c.id}
              glowColor={c.color}
              glowIntensity={0.1}
              className="p-4"
            >
              <button
                onClick={() => generate(c.id)}
                className="w-full text-left group"
              >
                <div
                  className="w-9 h-9 rounded-sm flex items-center justify-center mb-2 transition-transform group-hover:scale-110"
                  style={{ background: `${c.color}15`, border: `1px solid ${c.color}40` }}
                >
                  <Heart className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <div className="text-[13px] text-[#E8E2D5] font-medium leading-tight mb-0.5">{c.name}</div>
                <div className="text-[10px] text-[#9C9489] leading-tight mb-2">{c.description}</div>
                <ShimmerButton className="w-full py-1.5 text-[10px]">
                  <Sparkles className="w-3 h-3" /> Generate
                </ShimmerButton>
              </button>
            </AuroraGlowCard>
          ))}
        </div>

        {/* History */}
        {history.length > 0 && (
          <div className="mt-8">
            <div className="flex items-center gap-2 mb-3">
              <Clock className="w-3.5 h-3.5 text-[#C5A572]" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Recent scripts</span>
            </div>
            <div className="space-y-2.5">
              {history.slice(0, 5).map((h, i) => {
                const hcat = POSITIVITY_CATEGORIES.find((c) => c.id === h.category);
                return (
                  <AuroraGlowCard
                    key={h.id || i}
                    glowColor={hcat?.color || "#C5A572"}
                    glowIntensity={0.08}
                    className="p-3"
                  >
                    <button
                      onClick={() => {
                        setSelectedCat(h.category);
                        setScript(h.script);
                        setSession(h);
                        setWordIndex(0);
                      }}
                      className="w-full text-left flex items-start gap-3"
                    >
                      <div
                        className="w-7 h-7 rounded-sm flex items-center justify-center shrink-0"
                        style={{ background: `${hcat?.color || "#C5A572"}15`, color: hcat?.color || "#C5A572" }}
                      >
                        <Heart className="w-3.5 h-3.5" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-0.5">
                          <span className="text-[12px] text-[#E8E2D5] font-medium">{hcat?.name || h.category}</span>
                          <GlowPill color={hcat?.color || "#C5A572"} className="text-[9px]">
                            <Clock className="w-2.5 h-2.5" />
                            {h.createdAt ? new Date(h.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" }) : "recent"}
                          </GlowPill>
                        </div>
                        <div className="text-[11px] text-[#9C9489] line-clamp-2 leading-relaxed">{h.script?.slice(0, 120)}…</div>
                      </div>
                    </button>
                  </AuroraGlowCard>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function Gate({ onAuth }: { onAuth: () => void }) {
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center py-20">
          <AuroraGlowCard glowColor="#D876A0" glowIntensity={0.15} className="max-w-sm w-full p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 border border-[#D876A0]/30" style={{ background: "#D876A010" }}>
              <Heart className="w-7 h-7 text-[#D876A0]" />
            </div>
            <LiquidMetalText as="h1" className="serif-display text-[1.75rem] block mb-2">Sign in to begin</LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
              AI-crafted affirmations, read word by word as each one lights up.
            </p>
            <ShimmerButton onClick={onAuth} className="w-full">Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    </div>
  );
}
