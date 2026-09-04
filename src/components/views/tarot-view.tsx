"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { TarotCardFace, TarotCardBack } from "@/components/tarot-card-face";
import { CardDetailModal } from "@/components/card-detail-modal";
import { Sparkles, Shuffle, Star, Share2, Save, BookOpen, Loader2, RotateCw } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { useStore } from "@/lib/store";
import { useT } from "@/lib/use-t";

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
  const t = useT();
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

    // Minimum shuffle time for ritual feel (2.2s)
    const minDelay = new Promise((r) => setTimeout(r, 2200));

    try {
      const res = await api<{ reading: any; error?: string }>("/api/tarot/read", {
        method: "POST", json: { question, spreadType: spread },
      });
      await minDelay;

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
        await new Promise((r) => setTimeout(r, 650));
        setRevealedIdx(i + 1);
      }
      await new Promise((r) => setTimeout(r, 400));
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
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Sparkles className="w-10 h-10 text-[#6B6358] mx-auto mb-3" />
          <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to begin</div>
          <button onClick={onAuth} className="mt-3 py-2.5 px-5 bg-[#E8E2D5] text-[#0A0908] text-[13px] font-medium hover:bg-white transition rounded-sm focus-ring">Sign in</button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">

        {/* ===== PHASE: ASK ===== */}
        {phase === "ask" && (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="lum-reveal"
          >
            {/* Hero */}
            <div className="mb-8">
              <div className="text-[13px] text-[#6B6358] mb-2">Rider-Waite-Smith deck</div>
              <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight mb-3">
                Tarot
              </h1>
              <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch]">
                The deck speaks in symbols. Ask, and the cards answer. 2 free readings daily, then 1 Luck each.
              </p>
            </div>

            {/* Question */}
            <div className="mb-6 pb-6 border-b border-[#2A2722]">
              <label className="block text-[12px] text-[#6B6358] font-medium mb-2">Your question</label>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-6">
              {SPREADS.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSpread(s.id)}
                  className={cn(
                    "p-3 border text-left transition focus-ring rounded-sm",
                    spread === s.id
                      ? "border-[#C5A572] bg-[#1A1714]"
                      : "border-[#2A2722] bg-transparent hover:border-[#4A4540]"
                  )}
                >
                  <div className={cn("text-[13px] font-medium mb-0.5", spread === s.id ? "text-[#E8E2D5]" : "text-[#9C9489]")}>{s.name}</div>
                  <div className="text-[11px] text-[#6B6358]">{s.desc}</div>
                </button>
              ))}
            </div>

            {/* Shuffle & Draw button */}
            <button
              onClick={performReading}
              disabled={!question.trim()}
              className="w-full py-3.5 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring mb-8 flex items-center justify-center gap-2"
            >
              <Shuffle className="w-4 h-4" /> Shuffle & Draw {SPREADS.find(s => s.id === spread)?.count} card{SPREADS.find(s => s.id === spread)!.count > 1 ? "s" : ""}
            </button>

            {/* Past readings */}
            <div className="pt-8 border-t border-[#2A2722]">
              <button
                onClick={() => setView("tarot-history")}
                className="inline-flex items-center gap-2 text-[13px] text-[#9C9489] hover:text-[#C5A572] transition focus-ring rounded-sm"
              >
                <BookOpen className="w-3.5 h-3.5" /> View past readings
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
              <Loader2 className="w-4 h-4 animate-spin" />
              <span className="text-[13px] tracking-[0.04em]">Shuffling the deck…</span>
            </div>
            <p className="text-[12px] text-[#6B6358] mt-2 serif-italic">Breathe. Hold your question lightly.</p>
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
            <div className="pb-4 border-b border-[#2A2722]">
              <div className="text-[12px] text-[#6B6358] font-medium mb-1">Your question</div>
              <p className="serif-italic text-[15px] text-[#9C9489] leading-[1.6]">"{reading.question}"</p>
            </div>

            {/* Cards */}
            <div className="flex flex-wrap items-end justify-center gap-4 lg:gap-6">
              {reading.cards.map((c: any, i: number) => {
                const revealed = i < revealedIdx || phase === "result";
                const isSolo = reading.cards.length === 1;
                return (
                  <div key={i} className="flex flex-col items-center gap-2">
                    {/* Position label */}
                    {c.position && (
                      <div className="text-[11px] text-[#6B6358] text-center max-w-[120px] font-medium">{c.position}</div>
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
                            <span className="text-[9px] tracking-[0.14em] text-[#C5A572] font-medium">Tap for meaning</span>
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
                <div className="pt-6 border-t border-[#2A2722]">
                  <div className="flex items-center justify-between mb-4">
                    <div className="text-[12px] text-[#6B6358] font-medium">The reading</div>
                    <div className="flex items-center gap-2">
                      <button
                        onClick={shareReading}
                        className="text-[12px] text-[#9C9489] hover:text-[#E8E2D5] transition focus-ring rounded-sm px-3 py-1.5 border border-[#2A2722] hover:border-[#4A4540]"
                      >
                        <Share2 className="w-3 h-3 inline mr-1" /> Share
                      </button>
                      <button
                        onClick={saveReading}
                        disabled={saved}
                        className={cn(
                          "text-[12px] transition focus-ring rounded-sm px-3 py-1.5 border",
                          saved
                            ? "text-[#C5A572] border-[#C5A572]/30 bg-[#C5A572]/5 cursor-default"
                            : "text-[#9C9489] hover:text-[#E8E2D5] border-[#2A2722] hover:border-[#4A4540]"
                        )}
                      >
                        {saved ? <><Save className="w-3 h-3 inline mr-1" /> Saved</> : <><Save className="w-3 h-3 inline mr-1" /> Save</>}
                      </button>
                    </div>
                  </div>
                  <div className="serif text-[15px] leading-[1.8] text-[#E8E2D5] prose-editorial">
                    <ReactMarkdown>{reading.interpretation}</ReactMarkdown>
                  </div>

                  {/* Luck info */}
                  {reading.luckSpent > 0 && (
                    <div className="mt-6 text-[11px] text-[#6B6358]">
                      {reading.luckSpent} Luck spent · {reading.freeRemaining} free readings remaining today
                    </div>
                  )}
                </div>

                {/* New reading button */}
                <button
                  onClick={reset}
                  className="inline-flex items-center gap-2 py-3 px-6 text-[14px] text-[#9C9489] hover:text-[#E8E2D5] border border-[#2A2722] hover:border-[#4A4540] transition rounded-sm focus-ring"
                >
                  <RotateCw className="w-3.5 h-3.5" /> Ask another question
                </button>
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
