"use client";

import * as React from "react";
import { GlassCard, GoldButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { BookOpen, Bookmark, BookmarkCheck, ChevronDown, ChevronRight, Share2, Sparkles, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { TAROT_DECK } from "@/lib/tarot-data";

export function TarotHistoryView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
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
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BookOpen className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
          <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to view your history</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle eyebrow="Your past readings" title="Tarot History" subtitle="Browse, bookmark & share your past tarot readings." />
          <button
            onClick={() => setSavedOnly(!savedOnly)}
            className={cn("px-3 py-1.5 rounded-full text-[11px] border transition flex items-center gap-1.5 shrink-0", savedOnly ? "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572]" : "border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5]")}
          >
            {savedOnly ? <BookmarkCheck className="w-3.5 h-3.5" /> : <Bookmark className="w-3.5 h-3.5" />}
            {savedOnly ? "Saved only" : "All"}
          </button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <Loader2 className="w-6 h-6 text-[#C5A572] animate-spin mx-auto mb-2" />
            <div className="text-[13px] text-[#9C9489]">Loading readings…</div>
          </div>
        ) : readings.length === 0 ? (
          <ShellCard className="p-8 text-center">
            <Sparkles className="w-8 h-8 text-[#9C9489] mx-auto mb-3" />
            <div className="text-[14px] text-[#E8E2D5] mb-1">{savedOnly ? "No saved readings yet" : "No readings yet"}</div>
            <div className="text-[12px] text-[#9C9489]">{savedOnly ? "Bookmark readings you want to keep." : "Draw your first cards from the Tarot tab."}</div>
          </ShellCard>
        ) : (
          <div className="space-y-2.5">
            {readings.map((r) => {
              const isExpanded = expanded === r.id;
              let cards: any[] = [];
              try { cards = JSON.parse(r.cardsJson); } catch {}
              return (
                <GlassCard key={r.id} className="overflow-hidden">
                  {/* Header row */}
                  <button
                    onClick={() => setExpanded(isExpanded ? null : r.id)}
                    className="w-full flex items-center gap-3 p-4 text-left hover:bg-white/[0.02] transition"
                  >
                    {/* Card thumbnails */}
                    <div className="flex -space-x-2 shrink-0">
                      {cards.slice(0, 3).map((c: any, i: number) => {
                        const card = TAROT_DECK.find((t) => t.id === c.id);
                        return (
                          <div
                            key={i}
                            className={cn("w-8 h-12 rounded border border-[#2A2722] bg-gradient-to-br from-[#121815] to-[#0C100E]-2 flex items-center justify-center text-sm", c.reversed && "rotate-180")}
                            style={{ zIndex: 3 - i }}
                          >
                            {card?.symbol || "✦"}
                          </div>
                        );
                      })}
                      {cards.length > 3 && (
                        <div className="w-8 h-12 rounded border border-[#2A2722] bg-[#121815] flex items-center justify-center text-[9px] text-[#9C9489]">
                          +{cards.length - 3}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="text-[13px] text-[#E8E2D5] truncate">{r.question}</div>
                      <div className="flex items-center gap-2 mt-0.5">
                        <Pill className="text-[9px]">{r.spreadType}</Pill>
                        <span className="text-[10px] text-[#9C9489]">{new Date(r.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Save + expand */}
                    <div className="flex items-center gap-1 shrink-0">
                      <button
                        onClick={(e) => { e.stopPropagation(); toggleSave(r.id); }}
                        className={cn("p-1.5 rounded-full transition", r.saved ? "text-[#C5A572]" : "text-[#9C9489]/40 hover:text-[#9C9489]")}
                      >
                        {r.saved ? <BookmarkCheck className="w-4 h-4" /> : <Bookmark className="w-4 h-4" />}
                      </button>
                      {isExpanded ? <ChevronDown className="w-4 h-4 text-[#9C9489]" /> : <ChevronRight className="w-4 h-4 text-[#9C9489]" />}
                    </div>
                  </button>

                  {/* Expanded content */}
                  {isExpanded && (
                    <div className="px-4 pb-4 border-t border-[#2A2722] pt-3 lum-reveal">
                      {/* Full cards */}
                      <div className="flex flex-wrap gap-2 mb-3">
                        {cards.map((c: any, i: number) => {
                          const card = TAROT_DECK.find((t) => t.id === c.id);
                          return (
                            <div key={i} className="flex flex-col items-center">
                              <div className={cn("w-12 h-18 rounded border border-[#C5A572]/20 bg-gradient-to-br from-[#121815] to-[#0C100E]-2 flex items-center justify-center text-lg p-1", c.reversed && "rotate-180")} style={{ height: "72px" }}>
                                {card?.symbol || "✦"}
                              </div>
                              <div className="text-[9px] text-[#E8E2D5] mt-1 text-center max-w-[60px] truncate">{card?.nameShort}</div>
                              {c.reversed && <div className="text-[8px] text-[#D4A0B8]">℞</div>}
                            </div>
                          );
                        })}
                      </div>
                      {/* Interpretation */}
                      <div className="serif prose-editorial text-[13px] text-[#E8E2D5]/85 leading-relaxed">
                        <ReactMarkdown>{r.interpretation}</ReactMarkdown>
                      </div>
                      {/* Share */}
                      <button
                        onClick={() => shareReading(r)}
                        className="mt-3 px-3 py-1.5 rounded-full text-[11px] text-[#9C9489] hover:text-[#C5A572] border border-[#2A2722] hover:border-[#C5A572]/30 transition flex items-center gap-1"
                      >
                        <Share2 className="w-3 h-3" /> Share this reading
                      </button>
                    </div>
                  )}
                </GlassCard>
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
        <BookOpen className="w-4 h-4 text-[#C5A572]" />
        <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Reflection Journal</span>
        <span className="text-[10px] text-[#9C9489]/50">· {reflections.length} entries</span>
      </div>
      <div className="space-y-2">
        {reflections.map((r) => {
          const card = r.card ? TAROT_DECK.find((t) => t.id === r.card.id) : null;
          return (
            <GlassCard key={r.id} className="p-3 flex items-start gap-3">
              <div className={cn("w-8 h-12 rounded border border-[#C5A572]/20 bg-gradient-to-br from-[#121815] to-[#0C100E]-2 flex items-center justify-center text-sm shrink-0", r.card?.reversed && "rotate-180")}>
                {card?.symbol || "✦"}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-0.5">
                  <span className="text-[11px] text-[#E8E2D5]">{card?.name || "Card of the Day"}</span>
                  <span className="text-[9px] text-[#9C9489]">{new Date(r.date).toLocaleDateString()}</span>
                </div>
                <div className="text-[11px] text-[#9C9489] leading-relaxed line-clamp-2 italic">"{r.reflection}"</div>
              </div>
            </GlassCard>
          );
        })}
      </div>
    </div>
  );
}
