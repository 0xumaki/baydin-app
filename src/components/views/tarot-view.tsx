"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { TarotCardFace, TarotCardBack } from "@/components/tarot-card-face";
import { CardDetailModal } from "@/components/card-detail-modal";
import { StarField } from "@/components/lumina/primitives";
import {
  AuroraGlowCard,
  GlowPill,
  LiquidMetalText,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, BaydinStar, BaydinShuffle, BaydinShare, BaydinSave, BaydinBookmark, BaydinLoader, BaydinRefresh, BaydinMoon } from "@/components/lumina/baydin-icons";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";

const SPREADS = [
  { id: "yes-no", name: "Yes / No", count: 1, desc: "A single card for a clear answer" },
  { id: "single", name: "Single Card", count: 1, desc: "One card, deep reflection" },
  { id: "three-card", name: "Three Card", count: 3, desc: "Past · Present · Future" },
  { id: "relationship", name: "Relationship", count: 5, desc: "Love & connection" },
  { id: "career", name: "Career", count: 4, desc: "Work & path" },
  { id: "celtic-cross", name: "Celtic Cross", count: 10, desc: "The full spread" },
];

type Phase = "ask" | "shuffling" | "revealing" | "result";

export function TarotView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [phase, setPhase] = React.useState<Phase>("ask");
  const [spread, setSpread] = React.useState("three-card");
  const [question, setQuestion] = React.useState("");
  const [reading, setReading] = React.useState<any>(null);
  const [revealedIdx, setRevealedIdx] = React.useState(0);
  const [saved, setSaved] = React.useState(false);
  const [detailCard, setDetailCard] = React.useState<any>(null);
  const [detailReversed, setDetailReversed] = React.useState(false);
  const [detailOpen, setDetailOpen] = React.useState(false);

  async function performReading() {
    if (!user) { onAuth(); return; }
    if (!question.trim()) { toast.error("Enter a question first"); return; }

    setPhase("shuffling");
    setReading(null);
    setRevealedIdx(0);
    setSaved(false);

    // Track timeout IDs for cleanup if component unmounts mid-reading
    const timeoutIds: ReturnType<typeof setTimeout>[] = [];
    const trackedDelay = (ms: number) => new Promise<void>((r) => {
      const id = setTimeout(() => r(), ms);
      timeoutIds.push(id);
    });

    try {
      const res = await api<{ reading: any; error?: string }>("/api/tarot/read", {
        method: "POST", json: { question, spreadType: spread },
      });
      await trackedDelay(2200);

      if (res.error) {
        setPhase("ask");
        toast.error(res.error);
        return;
      }

      setReading(res.reading);
      qc.invalidateQueries({ queryKey: ["me"] });
      setPhase("revealing");

      // Reveal cards one by one with stagger
      const total = res.reading.cards.length;
      for (let i = 0; i < total; i++) {
        await trackedDelay(650);
        setRevealedIdx(i + 1);
      }
      await trackedDelay(400);
      setPhase("result");
    } catch (e: any) {
      setPhase("ask");
      toast.error(e.message);
    }
  }

  function reset() {
    setPhase("ask");
    setReading(null);
    setRevealedIdx(0);
    setQuestion("");
    setSaved(false);
  }

  async function saveReading() {
    if (!reading) return;
    try {
      await api(`/api/tarot/save?id=${reading.id}`, { method: "PATCH" });
      setSaved(true);
      toast.success("Reading saved to your journal");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function shareReading() {
    if (!reading) return;
    const text = reading.interpretation.replace(/[#*_`]/g, "").slice(0, 280);
    if (navigator.share) {
      try { await navigator.share({ title: "My Baydin Tarot Reading", text, url: window.location.origin }); } catch {}
    } else {
      await navigator.clipboard.writeText(text + "\n\n" + window.location.origin);
      toast.success("Reading copied to clipboard");
    }
  }

  if (!user) {
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-10 lg:py-14 relative z-10 min-w-0 overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full border border-[#C5A572]/30 bg-[#C5A572]/5 flex items-center justify-center">
              <BaydinStar className="w-7 h-7 text-[#C5A572]" />
            </div>
          </div>
          <LiquidMetalText as="h1" className="serif-display text-[1.75rem] text-[#E8E2D5] tracking-tight block mb-2">
            Sign in to begin
          </LiquidMetalText>
          <p className="text-[13px] text-[#B5ADA2] mb-6 max-w-xs">
            The deck speaks in symbols. Sign in to draw your first cards.
          </p>
          <ShimmerButton onClick={onAuth} className="h-9 px-4 py-2">
            Sign in
          </ShimmerButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== PHASE: ASK ===== */}
        {phase === "ask" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lum-reveal"
          >
            {/* Hero */}
            <div className="mb-6">
              <GlowPill className="mb-3">
                <BaydinMoon className="w-3 h-3" /> Rider-Waite-Smith deck
              </GlowPill>
              <LiquidMetalText as="h1" className="serif-display text-[2rem] lg:text-[2.5rem] leading-[1.1] tracking-tight block mb-3">
                Tarot Reading
              </LiquidMetalText>
              <p className="t-body text-[#B5ADA2] leading-[1.7] max-w-[55ch]">
                The deck speaks in symbols. Ask, and the cards answer. 2 free readings daily, then 1 <CloverIcon className="w-3 h-3" /> Luck each.
              </p>
            </div>

            {/* Question */}
            <div className="mb-6 pb-6 border-b border-[#2A2722]">
              <label className="block text-[12px] text-[#8A8278] font-medium mb-2">Your question</label>
              <input
                value={question}
                onChange={(e) => setQuestion(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && performReading()}
                placeholder="What weighs on your heart?"
                maxLength={300}
                className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus:outline-none focus:border-[#C5A572] transition"
              />
            </div>

            {/* Spread selector */}
            <div className="mb-3">
              <div className="flex items-center gap-2 mb-3">
                <BaydinStar className="w-3.5 h-3.5 text-[#C5A572]" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-[#B5ADA2]">Choose a spread</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
                {SPREADS.map((s) => {
                  const active = spread === s.id;
                  return (
                    <AuroraGlowCard
                      key={s.id}
                      glowColor={active ? "#C5A572" : "#9E8AC9"}
                      glowIntensity={active ? 0.22 : 0.1}
                      className={cn(
                        "p-4 text-left transition cursor-pointer",
                        active ? "border-[#C5A572]/60" : "border-[#2A2722] hover:border-[#C5A572]/40"
                      )}
                    >
                      <button
                        type="button"
                        onClick={() => setSpread(s.id)}
                        className="w-full text-left"
                        aria-pressed={active}
                      >
                        <div className="flex items-center justify-between mb-1">
                          <div className={cn("text-[13px] font-medium", active ? "text-[#E8E2D5]" : "text-[#B5ADA2]")}>{s.name}</div>
                          {active && (
                            <GlowPill color="#C5A572" className="text-[11px]">{s.count} card{s.count > 1 ? "s" : ""}</GlowPill>
                          )}
                        </div>
                        <div className="text-[11px] text-[#8A8278]">{s.desc}</div>
                      </button>
                    </AuroraGlowCard>
                  );
                })}
              </div>
            </div>

            {/* Shuffle & Draw button */}
            <ShimmerButton
              onClick={performReading}
              disabled={!question.trim()}
              className="w-full h-12 mb-6"
            >
              <BaydinShuffle className="w-4 h-4" /> Shuffle & Draw {SPREADS.find(s => s.id === spread)?.count} card{SPREADS.find(s => s.id === spread)!.count > 1 ? "s" : ""}
            </ShimmerButton>

            {/* Past readings */}
            <div className="pt-6 border-t border-[#2A2722]">
              <button
                onClick={() => setView("tarot-history")}
                className="inline-flex items-center gap-2 text-[13px] text-[#B5ADA2] hover:text-[#C5A572] transition focus-ring rounded-sm"
              >
                <BaydinBookmark className="w-3.5 h-3.5" /> View past readings
              </button>
            </div>
          </motion.div>
        )}

        {/* ===== PHASE: SHUFFLING ===== */}
        {phase === "shuffling" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="flex flex-col items-center justify-center py-16"
          >
            {/* Shuffling card backs — 5 stacked, each rotating/wobbling */}
            <div className="relative w-[180px] h-[270px]">
              {[0, 1, 2, 3, 4].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0"
                  animate={{
                    rotate: [0, i % 2 === 0 ? 12 : -12, 0],
                    x: [0, i % 2 === 0 ? 8 : -8, 0],
                    y: [0, -4, 0],
                  }}
                  transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.1 }}
                  style={{ zIndex: 5 - i }}
                >
                  <TarotCardBack size="md" className="opacity-90" />
                </motion.div>
              ))}
            </div>
            <div className="mt-8 flex items-center gap-2 text-[#C5A572]">
              <BaydinLoader className="w-4 h-4" />
              <span className="text-[13px] tracking-[0.04em]">Shuffling the deck…</span>
            </div>
            <p className="text-[12px] text-[#8A8278] mt-2 serif-italic">Breathe. Hold your question lightly.</p>
          </motion.div>
        )}

        {/* ===== PHASE: REVEALING / RESULT ===== */}
        {(phase === "revealing" || phase === "result") && reading && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-6"
          >
            {/* Question display */}
            <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.15} className="p-5">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#B5ADA2] mb-1">Your question</div>
              <p className="serif-italic text-[15px] text-[#E8E2D5] leading-[1.6]">"{reading.question}"</p>
            </AuroraGlowCard>

            {/* Cards */}
            <div className="flex flex-wrap items-end justify-center gap-4 lg:gap-6">
              {reading.cards.map((c: any, i: number) => {
                const revealed = i < revealedIdx || phase === "result";
                const isSolo = reading.cards.length === 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    {/* Position label */}
                    {c.position && (
                      <div className="text-[11px] text-[#8A8278] text-center max-w-[120px] font-medium">{c.position}</div>
                    )}

                    {/* Card — flip animation on reveal */}
                    <AnimatePresence mode="wait">
                      {revealed ? (
                        <motion.button
                          key="face"
                          initial={{ rotateY: 180, opacity: 0 }}
                          animate={{ rotateY: 0, opacity: 1 }}
                          transition={{ duration: 0.6, ease: [0.2, 0, 0, 1] }}
                          onClick={() => {
                            setDetailCard(c.card);
                            setDetailReversed(c.reversed);
                            setDetailOpen(true);
                          }}
                          className="relative group cursor-pointer focus-ring rounded-sm"
                          aria-label={`View details for ${c.card.name}`}
                        >
                          <TarotCardFace card={c.card} reversed={c.reversed} size={isSolo ? "lg" : "md"} />
                          <div className="absolute inset-0 rounded-[14px] bg-[#C5A572]/0 group-hover:bg-[#C5A572]/10 transition-colors flex items-end justify-center pb-2 opacity-0 group-hover:opacity-100">
                            <span className="text-[11px] tracking-[0.14em] text-[#C5A572] font-medium">Tap for meaning</span>
                          </div>
                        </motion.button>
                      ) : (
                        <motion.div key="back" exit={{ opacity: 0 }}>
                          <TarotCardBack size={isSolo ? "lg" : "md"} />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    {/* Card name */}
                    {revealed && (
                      <div className="text-[12px] text-[#E8E2D5] text-center max-w-[160px] leading-[15px] font-medium">
                        {c.card.nameShort}
                        {c.reversed && <span className="text-[#C5A572]"> · Reversed</span>}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Interpretation — only show when result phase */}
            {phase === "result" && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="space-y-4"
              >
                <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-5">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <BaydinStar className="w-4 h-4 text-[#C5A572]" />
                      <span className="text-[11px] uppercase tracking-[0.2em] text-[#B5ADA2]">The reading</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={shareReading}
                        className="h-9 px-3 py-2 text-[12px] text-[#B5ADA2] hover:text-[#E8E2D5] transition focus-ring rounded-sm border border-[#2A2722] hover:border-[#C5A572]/40 inline-flex items-center gap-1.5"
                      >
                        <BaydinShare className="w-3 h-3" /> Share
                      </button>
                      <button
                        onClick={saveReading}
                        disabled={saved}
                        className={cn(
                          "h-9 px-3 py-2 text-[12px] transition focus-ring rounded-sm border inline-flex items-center gap-1.5",
                          saved
                            ? "text-[#C5A572] border-[#C5A572]/30 bg-[#C5A572]/5 cursor-default"
                            : "text-[#B5ADA2] hover:text-[#E8E2D5] border-[#2A2722] hover:border-[#C5A572]/40"
                        )}
                      >
                        {saved ? <><BaydinSave className="w-3 h-3" /> Saved</> : <><BaydinSave className="w-3 h-3" /> Save</>}
                      </button>
                    </div>
                  </div>
                  <div className="serif text-[15px] leading-[1.8] text-[#E8E2D5] prose-editorial">
                    <ReactMarkdown>{reading.interpretation}</ReactMarkdown>
                  </div>

                  {/* Luck info */}
                  {reading.luckSpent > 0 && (
                    <div className="mt-6 text-[11px] text-[#8A8278] flex items-center gap-1.5">
                      <CloverIcon className="w-3 h-3" /> {reading.luckSpent} Luck spent · {reading.freeRemaining} free readings remaining today
                    </div>
                  )}
                </AuroraGlowCard>

                {/* New reading button */}
                <ShimmerButton
                  onClick={reset}
                  tone="parchment"
                  className="h-9 px-4 py-2"
                >
                  <BaydinRefresh className="w-3.5 h-3.5" /> Ask another question
                </ShimmerButton>
              </motion.div>
            )}
          </motion.div>
        )}
      </div>

      {/* Card detail modal */}
      <CardDetailModal
        card={detailCard}
        reversed={detailReversed}
        open={detailOpen}
        onOpenChange={setDetailOpen}
      />
    </div>
  );
}
