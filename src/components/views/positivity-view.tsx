"use client";

import * as React from "react";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { POSITIVITY_CATEGORIES } from "@/lib/positivity";
import { Heart, Play, Pause, RefreshCw, Loader2, Sparkles, Wallet } from "lucide-react";
import { toast } from "sonner";

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
  const intervalRef = React.useRef<any>(null);

  React.useEffect(() => {
    fetch("/api/positivity/generate").then((r) => r.json()).then((d) => setTodayCount(d.todayCount ?? 0)).catch(() => {});
  }, []);

  async function generate(catId: string) {
    if (!user) { onAuth(); return; }
    setSelectedCat(catId);
    setLoading(true);
    setScript("");
    setPlaying(false);
    try {
      const res = await api<{ session: any; error?: string; balance?: number }>("/api/positivity/generate", {
        method: "POST", json: { category: catId, intention: intention || undefined, durationSec: 120 },
      });
      if (res.error) { toast.error(res.error); return; }
      setScript(res.session.script);
      setSession(res.session);
      setTodayCount((c) => c + 1);
      toast.success(res.isFree ? "Script generated · 1 free today" : `Script generated · 1 Luck spent`);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  function play() {
    if (!script) return;
    const words = script.split(/\s+/);
    setWordIndex(0);
    setPlaying(true);
    let i = 0;
    intervalRef.current = setInterval(() => {
      i++;
      setWordIndex(i);
      if (i >= words.length) {
        clearInterval(intervalRef.current);
        setPlaying(false);
        setTimeout(() => setWordIndex(0), 2000);
      }
    }, 450); // ~450ms per word
  }

  function pause() {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPlaying(false);
  }

  React.useEffect(() => () => { if (intervalRef.current) clearInterval(intervalRef.current); }, []);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Heart className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to begin</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  const cat = selectedCat ? POSITIVITY_CATEGORIES.find((c) => c.id === selectedCat) : null;
  const words = script ? script.split(/\s+/) : [];

  // Showing script player
  if (script && cat) {
    const visibleWords = words.slice(Math.max(0, wordIndex - 8), wordIndex + 12);
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
        <div className="max-w-2xl mx-auto px-4 py-6 lg:py-8">
          <button onClick={() => { pause(); setScript(""); setSelectedCat(null); }} className="text-[12px] text-ink-muted hover:text-gold mb-4 transition">← All categories</button>
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center text-xl border" style={{ background: `${cat.color}15`, borderColor: `${cat.color}40`, color: cat.color }}>
              <Heart className="w-5 h-5" />
            </div>
            <div>
              <div className="text-[11px] uppercase tracking-[0.2em]" style={{ color: cat.color }}>{cat.name}</div>
              <div className="text-[18px] font-light text-ink">Affirmation Script</div>
            </div>
          </div>

          {/* Word-by-word player */}
          <ShellCard className="p-8 mb-4 min-h-[200px] flex items-center justify-center text-center relative overflow-hidden">
            <div className="lum-glow-gold absolute inset-0 opacity-20" style={{ background: `radial-gradient(80% 60% at 50% 50%, ${cat.color}20 0%, transparent 70%)` }} />
            <div className="relative">
              {playing || wordIndex > 0 ? (
                <div className="flex flex-wrap gap-x-2 gap-y-1 justify-center max-w-md">
                  {visibleWords.map((w, i) => {
                    const absIdx = Math.max(0, wordIndex - 8) + i;
                    const isCurrent = absIdx === wordIndex;
                    const dist = Math.abs(absIdx - wordIndex);
                    return (
                      <span key={i} className="transition-all duration-300" style={{
                        opacity: isCurrent ? 1 : Math.max(0.15, 1 - dist * 0.18),
                        transform: isCurrent ? "scale(1.15)" : "scale(1)",
                        color: isCurrent ? cat.color : "var(--ink)",
                        fontWeight: isCurrent ? 500 : 300,
                        fontSize: isCurrent ? "22px" : "16px",
                      }}>
                        {w}
                      </span>
                    );
                  })}
                </div>
              ) : (
                <div className="text-[14px] text-ink-muted">Press play to begin. Read each word as it lights up. Let it sink in.</div>
              )}
            </div>
          </ShellCard>

          {/* Controls */}
          <div className="flex items-center justify-center gap-3">
            <button
              onClick={playing ? pause : play}
              className="w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95"
              style={{ background: `linear-gradient(135deg, ${cat.color}, ${cat.color}80)`, boxShadow: `0 8px 30px -8px ${cat.color}80` }}
            >
              {playing ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black ml-0.5" />}
            </button>
            <button onClick={() => generate(cat.id)} disabled={loading} className="w-10 h-10 rounded-full border border-white/10 flex items-center justify-center text-ink-muted hover:text-gold transition">
              <RefreshCw className={cn("w-4 h-4", loading && "animate-spin")} />
            </button>
          </div>

          {/* Full script (readable) */}
          <GlassCard className="p-5 mt-5 lum-prose text-[13px] text-ink-muted leading-relaxed">
            <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-2">{session?.source === "llm" ? "AI-generated" : "Template"} · full script</div>
            {script}
          </GlassCard>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading && cat) {
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] flex items-center justify-center px-6 text-center">
        <div>
          <Loader2 className="w-8 h-8 text-gold animate-spin mx-auto mb-3" style={{ color: cat.color }} />
          <div className="text-[14px] text-ink">Writing your {cat.name} affirmation…</div>
          <div className="text-[11px] text-ink-muted mt-1">Gemini is crafting something just for you</div>
        </div>
      </div>
    );
  }

  // Category grid
  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Daily practice · 1 free/day" title="Positivity Generator" subtitle="AI-crafted affirmation scripts. Read along as each word lights up." className="mb-6" />

        <div className="flex items-center gap-2 mb-4">
          <Pill variant="leaf" className="text-[10px]">{todayCount === 0 ? "1 free today" : `${todayCount} used today`}</Pill>
          {todayCount > 0 && <span className="text-[11px] text-ink-muted">Additional scripts: 1 Luck each</span>}
        </div>

        {/* Optional intention */}
        <GlassCard className="p-3 mb-4 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold shrink-0" />
          <input
            value={intention}
            onChange={(e) => setIntention(e.target.value)}
            placeholder="Optional: a specific intention (e.g. 'I release fear about my interview')"
            className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-muted/60"
          />
        </GlassCard>

        {/* Categories */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {POSITIVITY_CATEGORIES.map((c) => (
            <button
              key={c.id}
              onClick={() => generate(c.id)}
              className="group text-left p-4 rounded-2xl border border-white/8 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.04] transition-all"
            >
              <div className="w-9 h-9 rounded-xl flex items-center justify-center mb-2 transition-transform group-hover:scale-110" style={{ background: `${c.color}15`, border: `1px solid ${c.color}40` }}>
                <Heart className="w-4 h-4" style={{ color: c.color }} />
              </div>
              <div className="text-[13px] text-ink font-medium leading-tight mb-0.5">{c.name}</div>
              <div className="text-[10px] text-ink-muted leading-tight">{c.description}</div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
