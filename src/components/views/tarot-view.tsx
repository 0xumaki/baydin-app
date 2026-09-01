"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, Pill, SectionTitle } from "@/components/lumina/primitives";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { Sparkles, RefreshCw, Shuffle, Eye, Wallet, Star } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

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
  const [spread, setSpread] = React.useState("three-card");
  const [question, setQuestion] = React.useState("");
  const [reading, setReading] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [revealed, setRevealed] = React.useState(false);

  async function draw() {
    if (!user) { onAuth(); return; }
    if (!question.trim()) { toast.error("Enter a question first"); return; }
    setLoading(true);
    setRevealed(false);
    try {
      const res = await api<{ reading: any; error?: string }>("/api/tarot/read", {
        method: "POST", json: { question, spreadType: spread },
      });
      if (res.error) { toast.error(res.error); return; }
      setReading(res.reading);
      qc.invalidateQueries({ queryKey: ["me"] });
      setTimeout(() => setRevealed(true), 400);
    } catch (e: any) {
      toast.error(e.message);
    } finally { setLoading(false); }
  }

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Free daily ritual" title="Ask the Tarot" subtitle="The Rider-Waite-Smith deck speaks in symbols. Ask, and the cards answer." className="mb-6" />

        {/* Free tier indicator */}
        {user && (
          <div className="mb-4 flex items-center gap-2 text-[11px] text-ink-muted">
            <Pill variant="leaf">2 free readings/day</Pill>
            {reading?.freeRemaining !== undefined && <span>· {reading.freeRemaining} free left today</span>}
            {reading?.luckSpent > 0 && <Pill variant="gold">{reading.luckSpent} Luck spent</Pill>}
          </div>
        )}

        {/* Question */}
        <GlassCard className="p-4 mb-4">
          <input
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && draw()}
            placeholder="What weighs on your heart?"
            className="w-full bg-transparent outline-none text-[15px] text-ink placeholder:text-ink-muted/60 py-2"
          />
        </GlassCard>

        {/* Spread selector */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 mb-5">
          {SPREADS.map((s) => (
            <button
              key={s.id}
              onClick={() => setSpread(s.id)}
              className={cn(
                "text-left p-3 rounded-xl border transition",
                spread === s.id ? "border-gold/30 bg-gold/[0.06]" : "border-white/5 bg-white/[0.02] hover:border-white/10"
              )}
            >
              <div className={cn("text-[13px] font-medium mb-0.5", spread === s.id ? "text-gold" : "text-ink")}>{s.name}</div>
              <div className="text-[10px] text-ink-muted">{s.desc}</div>
            </button>
          ))}
        </div>

        <GoldButton onClick={draw} disabled={loading || !question.trim()} className="w-full mb-6">
          {loading ? <><Shuffle className="w-4 h-4 animate-spin" /> Drawing cards…</> : <><Sparkles className="w-4 h-4" /> Draw {SPREADS.find(s => s.id === spread)?.count} card{SPREADS.find(s => s.id === spread)!.count > 1 ? "s" : ""}</>}
        </GoldButton>

        {/* Reading */}
        {reading && (
          <div className="space-y-4">
            <div className="flex flex-wrap justify-center gap-3 mb-2">
              {reading.cards.map((c: any, i: number) => (
                <CardFace key={i} card={c.card} reversed={c.reversed} position={c.position} revealed={revealed} index={i} />
              ))}
            </div>
            <GlassCard className="p-5 lum-prose">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-gold" />
                <span className="text-[12px] text-gold uppercase tracking-wide">The Reading</span>
              </div>
              <ReactMarkdown>{reading.interpretation}</ReactMarkdown>
            </GlassCard>
          </div>
        )}

        {!reading && !loading && (
          <div className="text-center py-12 text-ink-muted text-[13px]">
            The deck waits. Ask, and the cards will speak.
          </div>
        )}
      </div>
    </div>
  );
}

function CardFace({ card, reversed, position, revealed, index }: { card: any; reversed: boolean; position?: string; revealed: boolean; index: number }) {
  return (
    <div className="flex flex-col items-center" style={{ animationDelay: `${index * 100}ms` }}>
      {position && <div className="text-[10px] text-ink-muted mb-1.5 uppercase tracking-wide">{position}</div>}
      <div
        className={cn(
          "w-20 h-32 sm:w-24 sm:h-36 rounded-xl border flex items-center justify-center transition-all duration-700 lum-anim-float-up",
          revealed ? "border-gold/30 bg-gradient-to-br from-surface to-surface-2" : "border-white/10 bg-white/[0.03]",
          reversed && revealed && "rotate-180"
        )}
        style={{ transform: revealed ? (reversed ? "rotate(180deg)" : "none") : "scale(0.95)" }}
      >
        {revealed ? (
          <div className="rotate-0 text-center px-1">
            <div className="text-2xl mb-1">{card.symbol}</div>
            <div className="text-[9px] text-ink leading-tight">{card.nameShort}</div>
            <div className="text-[8px] text-gold/70 mt-0.5">{card.element}</div>
          </div>
        ) : (
          <div className="text-gold/40 text-2xl">✦</div>
        )}
      </div>
      {revealed && <div className="text-[9px] text-ink-muted mt-1 max-w-[90px] text-center leading-tight">{reversed ? "Reversed" : "Upright"}</div>}
    </div>
  );
}
