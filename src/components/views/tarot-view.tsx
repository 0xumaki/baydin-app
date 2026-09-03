"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { TarotCardFace, TarotCardBack } from "@/components/tarot-card-face";
import { Sparkles, Shuffle, Star, Share2, Save, BookOpen, Loader2 } from "lucide-react";
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

export function TarotView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const t = useT();
  const { setView } = useStore();
  const [spread, setSpread] = React.useState("three-card");
  const [question, setQuestion] = React.useState("");
  const [reading, setReading] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);
  const [saved, setSaved] = React.useState(false);

  async function draw() {
    if (!user) { onAuth(); return; }
    if (!question.trim()) { toast.error("Enter a question first"); return; }
    setLoading(true);
    setRevealed(false);
    setSaved(false);
    try {
      const res = await api<{ reading: any; error?: string }>("/api/tarot/read", {
        method: "POST", json: { question, spreadType: spread },
      });
      if (res.error) { toast.error(res.error); return; }
      setReading(res.reading);
      qc.invalidateQueries({ queryKey: ["me"] });
      // Reveal cards one by one with stagger
      setTimeout(() => setRevealed(true), 600);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
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

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
        {/* Hero */}
        <div className="mb-8 lum-reveal">
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
            onKeyDown={(e) => e.key === "Enter" && draw()}
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

        {/* Draw button */}
        <button
          onClick={draw}
          disabled={loading || !question.trim()}
          className="w-full py-3.5 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring mb-8 flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-4 h-4 animate-spin" /> Drawing cards…</>
          ) : (
            <><Sparkles className="w-4 h-4" /> Draw {SPREADS.find(s => s.id === spread)?.count} card{SPREADS.find(s => s.id === spread)!.count > 1 ? "s" : ""}</>
          )}
        </button>

        {/* Loading state — show card backs shuffling */}
        {loading && (
          <div className="flex flex-wrap justify-center gap-4 mb-8">
            {Array.from({ length: SPREADS.find(s => s.id === spread)?.count || 3 }).map((_, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.1 }}
              >
                <TarotCardBack size="md" className="animate-pulse" />
              </motion.div>
            ))}
          </div>
        )}

        {/* Reading result */}
        {reading && !loading && (
          <AnimatePresence>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-6"
            >
              {/* Cards */}
              <div className="flex flex-wrap justify-center gap-4 lg:gap-6">
                {reading.cards.map((c: any, i: number) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, y: 30, rotateY: 180 }}
                    animate={revealed ? { opacity: 1, y: 0, rotateY: 0 } : {}}
                    transition={{ delay: i * 0.15, duration: 0.6, ease: [0.2, 0, 0, 1] }}
                    className="flex flex-col items-center"
                  >
                    {c.position && (
                      <div className="text-[11px] text-[#6B6358] mb-2 font-medium">{c.position}</div>
                    )}
                    {revealed ? (
                      <TarotCardFace
                        card={c.card}
                        reversed={c.reversed}
                        size="md"
                      />
                    ) : (
                      <TarotCardBack size="md" />
                    )}
                    {revealed && (
                      <div className="text-[11px] text-[#9C9489] mt-2 serif-italic">
                        {c.reversed ? "Reversed" : "Upright"}
                      </div>
                    )}
                  </motion.div>
                ))}
              </div>

              {/* Interpretation */}
              {revealed && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="pt-8 border-t border-[#2A2722]"
                >
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
                </motion.div>
              )}
            </motion.div>
          </AnimatePresence>
        )}

        {/* Empty state */}
        {!reading && !loading && (
          <div className="pt-12 border-t border-[#2A2722]">
            <div className="serif text-[1.25rem] text-[#E8E2D5] mb-3">The deck waits.</div>
            <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch] mb-6">
              Ask a question, choose a spread, and draw. Each card carries symbols drawn from centuries of esoteric tradition — the images will speak to whatever you bring to them.
            </p>
            <button
              onClick={() => setView("tarot-history")}
              className="inline-flex items-center gap-2 text-[13px] text-[#9C9489] hover:text-[#C5A572] transition focus-ring rounded-sm"
            >
              <BookOpen className="w-3.5 h-3.5" /> View past readings
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
