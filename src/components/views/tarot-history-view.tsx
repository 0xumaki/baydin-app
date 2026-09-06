"use client";

import * as React from "react";
import { GoldButton, StarField } from "@/components/lumina/primitives";
import {
  GlowPill,
  IconBgCard,
  LiquidMetalText,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BaydinLifeReport, BaydinBookmark, BaydinChevronDown, BaydinChevronRight, BaydinShare, BaydinStar, BaydinLoader, BaydinTarot } from "@/components/lumina/baydin-icons";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { TAROT_DECK } from "@/lib/tarot-data";

export function TarotHistoryView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const { setView } = useStore();
  const [readings, setReadings] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [savedOnly, setSavedOnly] = React.useState(false);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  async function load() {
    setLoading(true);
    try {
      const res = await api<{ readings: any[] }>(`/api/tarot/history${savedOnly ? "?saved=true" : ""}`);
      setReadings(res.readings);
    } catch {}
    finally { setLoading(false); }
  }
  React.useEffect(() => { if (user) load(); }, [user, savedOnly]);

  async function toggleSave(id: string) {
    try {
      const res = await api<{ saved: boolean }>(`/api/tarot/save?id=${id}`, { method: "PATCH" });
      setReadings((rs) => rs.map((r) => r.id === id ? { ...r, saved: res.saved } : r));
      toast.success(res.saved ? "Reading bookmarked" : "Bookmark removed");
    } catch (e: any) { toast.error(e.message); }
  }

  async function shareReading(reading: any) {
    const text = reading.interpretation?.replace(/[#*_`]/g, "").slice(0, 280) || "";
    if (navigator.share) {
      try { await navigator.share({ title: "My Baydin Tarot Reading", text, url: window.location.origin }); } catch {}
    } else {
      await navigator.clipboard.writeText(text + "\n\n" + window.location.origin);
      toast.success("Reading copied to clipboard ✦");
    }
  }

  if (!user) {
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-6 py-12 relative z-10 min-w-0 overflow-hidden flex flex-col items-center justify-center text-center">
          <div className="flex justify-center mb-4">
            <div className="w-14 h-14 rounded-full border border-[#C5A572]/30 bg-[#C5A572]/5 flex items-center justify-center">
              <BaydinLifeReport className="w-7 h-7 text-[#C5A572]" />
            </div>
          </div>
          <LiquidMetalText as="h1" className="serif-display text-[1.75rem] text-[#E8E2D5] tracking-tight block mb-2">
            Sign in to view your history
          </LiquidMetalText>
          <p className="text-[13px] text-[#B5ADA2] mb-6 max-w-xs">
            Your tarot readings and reflections will appear here.
          </p>
          <GoldButton onClick={onAuth} className="mt-1">Sign in</GoldButton>
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
        {/* Hero */}
        <div className="mb-6 lum-reveal">
          <GlowPill className="mb-3">
            <BaydinLifeReport className="w-3 h-3" /> Your past readings
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.25rem] leading-[1.1] tracking-tight block mb-3">
            Tarot History
          </LiquidMetalText>
          <p className="t-body text-[#B5ADA2] leading-[1.6]">
            Browse, bookmark & share your past tarot readings.
          </p>
        </div>

        {/* Filter control */}
        <div className="flex items-center justify-end mb-6">
          <button
            onClick={() => setSavedOnly(!savedOnly)}
            className={cn("h-9 px-4 py-2 rounded-full text-[11px] border transition flex items-center gap-1.5 shrink-0", savedOnly ? "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572]" : "border-[#2A2722] text-[#B5ADA2] hover:text-[#E8E2D5] hover:border-[#C5A572]/40")}
          >
            {savedOnly ? <BaydinBookmark className="w-3.5 h-3.5" /> : <BaydinBookmark className="w-3.5 h-3.5" />}
            {savedOnly ? "Saved only" : "All"}
          </button>
        </div>

        {loading ? (
          <IconBgCard icon={BaydinLoader} glowColor="#C5A572" glowIntensity={0.16} iconSize={170} iconOpacity={0.07} iconPosition="top-right" className="p-8 text-center">
            <BaydinLoader className="w-6 h-6 text-[#C5A572] mx-auto mb-2" />
            <div className="text-[13px] text-[#B5ADA2]">Loading readings…</div>
          </IconBgCard>
        ) : readings.length === 0 ? (
          <IconBgCard icon={BaydinStar} glowColor="#9E8AC9" glowIntensity={0.16} iconSize={200} iconOpacity={0.07} iconPosition="center" className="p-8 text-center">
            <BaydinStar className="w-8 h-8 text-[#8A8278] mx-auto mb-3" />
            <div className="text-[14px] text-[#E8E2D5] mb-2">{savedOnly ? "No saved readings yet" : "No readings yet"}</div>
            <div className="text-[12px] text-[#B5ADA2] mb-5">{savedOnly ? "Bookmark readings you want to keep." : "Draw your first cards from the Tarot tab."}</div>
            <ShimmerButton onClick={() => setView("tarot")}>
              <BaydinStar className="w-3.5 h-3.5" /> Draw your first card
            </ShimmerButton>
          </IconBgCard>
        ) : (
          <div className="space-y-4">
            {readings.map((r) => {
              const isExpanded = expanded === r.id;
              let cards: any[] = [];
              try { cards = JSON.parse(r.cardsJson); } catch {}
              return (
                <IconBgCard key={r.id} icon={BaydinTarot} glowColor={isExpanded ? "#C5A572" : "#9E8AC9"} glowIntensity={isExpanded ? 0.22 : 0.1} iconSize={160} iconOpacity={0.07} iconPosition="top-right" className="overflow-hidden hover:scale-[1.005] transition-all duration-300">
                  {/* Header row */}
                  <div
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                    className="w-full flex items-center gap-3 p-5 text-left hover:bg-white/[0.02] transition cursor-pointer"
                  >
                    {/* Card thumbnails with gold borders */}
                    <div className="flex -space-x-2 shrink-0">
                      {cards.slice(0, 3).map((c: any, i: number) => {
                        const card = TAROT_DECK.find((t) => t.id === c.id);
                        return (
                          <div
                            key={i}
                            className={cn("w-9 h-13 rounded border border-[#C5A572]/30 bg-gradient-to-br from-[#121815] to-[#0C100E] flex items-center justify-center text-base", c.reversed && "rotate-180")}
                            style={{ zIndex: 3 - i, padding: "2px" }}
                          >
                            {card?.symbol || "✦"}
                          </div>
                        );
                      })}
                      {cards.length > 3 && (
                        <div className="w-9 h-13 rounded border border-[#2A2722] bg-[#121815] flex items-center justify-center text-[11px] text-[#8A8278]">
                          +{cards.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="serif-italic text-[14px] text-[#E8E2D5] truncate">{r.question}</div>
                      <div className="flex items-center gap-2 mt-1">
                        <GlowPill color="#9E8AC9" className="text-[10px]">{r.spreadType}</GlowPill>
                        <span className="text-[11px] text-[#C5A572] font-medium">{new Date(r.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</span>
                      </div>
                    </div>

                    {/* Save + expand */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(r.id); }}
                        className={cn("p-1.5 rounded-full transition", r.saved ? "text-[#C5A572]" : "text-[#8A8278] hover:text-[#B5ADA2]")}
                        aria-label={r.saved ? "Remove bookmark" : "Save reading"}
                      >
                        {r.saved ? <BaydinBookmark className="w-4 h-4" /> : <BaydinBookmark className="w-4 h-4" />}
                      </button>
                      {isExpanded ? <BaydinChevronDown className="w-4 h-4 text-[#B5ADA2]" /> : <BaydinChevronRight className="w-4 h-4 text-[#B5ADA2]" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-5 pb-5 border-t border-[#2A2722] pt-4 lum-reveal">
                      {/* Full cards with gold borders */}
                      <div className="flex flex-wrap gap-2 mb-4">
                        {cards.map((c: any, i: number) => {
                          const card = TAROT_DECK.find((t) => t.id === c.id);
                          return (
                            <div key={i} className="flex flex-col items-center">
                              <div className={cn("w-14 rounded border border-[#C5A572]/30 bg-gradient-to-br from-[#121815] to-[#0C100E] flex items-center justify-center text-lg p-1", c.reversed && "rotate-180")} style={{ height: "80px" }}>
                                {card?.symbol || "✦"}
                              </div>
                              <div className="text-[11px] text-[#E8E2D5] mt-1 text-center max-w-[60px] truncate">{card?.nameShort}</div>
                              {c.reversed && <div className="text-[11px] text-[#D4A0B8]">℞</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Interpretation */}
                      <div className="serif prose-editorial text-[13px] text-[#E8E2D5]/85 leading-relaxed">
                        <ReactMarkdown>{r.interpretation}</ReactMarkdown>
                      </div>
                      {/* Save/Share buttons */}
                      <div className="mt-4 flex items-center gap-2">
                        {r.saved ? (
                          <GlowPill color="#7A8B6F" className="text-[11px]">
                            <BaydinBookmark className="w-3 h-3" /> Saved
                          </GlowPill>
                        ) : (
                          <GlowPill color="#8A8278" className="text-[11px]">
                            <BaydinBookmark className="w-3 h-3" /> Unsaved
                          </GlowPill>
                        )}
                        <ShimmerButton
                          onClick={() => shareReading(r)}
                          className="h-9 px-4 py-2 text-[11px]"
                        >
                          <BaydinShare className="w-3 h-3" /> Share this reading
                        </ShimmerButton>
                      </div>
                    </div>
                  )}
                </IconBgCard>
              );
            })}
          </div>
        )}

        {/* Reflection journal history */}
        <ReflectionsHistory />
      </div>
    </div>
  );
}

function ReflectionsHistory() {
  const [reflections, setReflections] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    fetch("/api/tarot/reflections", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setReflections(d.reflections || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return null;
  if (reflections.length === 0) return null;

  return (
    <div className="mt-6">
      <div className="flex items-center gap-2 mb-3">
        <BaydinLifeReport className="w-4 h-4 text-[#C5A572]" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#B5ADA2]">Reflection Journal</span>
        <span className="text-[11px] text-[#8A8278]">· {reflections.length} entries</span>
      </div>
      <div className="space-y-3">
        {reflections.map((r) => {
          const card = r.card ? TAROT_DECK.find((t) => t.id === r.card.id) : null;
          return (
            <IconBgCard key={r.id} icon={BaydinStar} glowColor="#9E8AC9" glowIntensity={0.14} iconSize={130} iconOpacity={0.06} iconPosition="top-right" className="p-5 flex items-start gap-3 hover:scale-[1.005] transition-all duration-300">
              <div className={cn("w-9 h-13 rounded border border-[#C5A572]/30 bg-gradient-to-br from-[#121815] to-[#0C100E] flex items-center justify-center text-base shrink-0 p-1", r.card?.reversed && "rotate-180")} style={{ height: "52px" }}>
                {card?.symbol || "✦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[12px] text-[#E8E2D5] serif-italic">{card?.name || "Card of the Day"}</span>
                  <span className="text-[11px] text-[#C5A572]">{new Date(r.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })}</span>
                </div>
                <div className="text-[11px] text-[#B5ADA2] leading-relaxed line-clamp-2 italic">"{r.reflection}"</div>
              </div>
            </IconBgCard>
          );
        })}
      </div>
    </div>
  );
}
