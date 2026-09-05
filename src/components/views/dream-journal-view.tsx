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
import {
  Moon, Star, Sparkles, Loader2, Plus, ChevronLeft, Trash2, BookOpen,
  Heart, RefreshCw, X, Sun, Zap, Droplet, Flame, Wind, Gem,
} from "lucide-react";
import { toast } from "sonner";

type LunarCtx = {
  moonPhase: string;
  moonPhaseFrac: number;
  illumination: number;
  emoji: string;
  nakshatra: string;
  nakshatraPada: number;
  tithi: string;
  yoga?: string;
  isPurnima: boolean;
  isAmavasya: boolean;
  isEkadashi: boolean;
};

type DetectedSymbol = {
  keyword: string;
  vedic: string;
  jungian: string;
  polarity: "auspicious" | "warning" | "neutral" | "transformative";
  category: string;
};

type DreamEntry = {
  id: string;
  dreamDate: string;
  title: string;
  content: string;
  mood: string;
  isRecurring: boolean;
  isFavorite: boolean;
  symbols: string[];
  lunarContext: LunarCtx | null;
  interpretation: string | null;
  createdAt: string;
};

const MOODS = [
  { id: "peaceful", label: "Peaceful", emoji: "🌙", color: "#9CB4D1" },
  { id: "vivid", label: "Vivid", emoji: "✨", color: "#C5A87C" },
  { id: "nightmare", label: "Nightmare", emoji: "🔥", color: "#B8553F" },
  { id: "lucid", label: "Lucid", emoji: "👁", color: "#7A8B6F" },
  { id: "prophetic", label: "Prophetic", emoji: "⭐", color: "#D4A0B8" },
  { id: "neutral", label: "Neutral", emoji: "○", color: "#8B7355" },
];

const POLARITY_COLOR: Record<string, string> = {
  auspicious: "#7A8B6F",
  warning: "#B8553F",
  neutral: "#8B7355",
  transformative: "#C5A87C",
};

const CATEGORY_ICON: Record<string, any> = {
  animal: Flame, nature: Droplet, object: Gem, person: Star, action: Zap, emotion: Heart, setting: Moon,
};

const DREAM_INTERPRET_COST = 2;

export function DreamJournalView({ onAuth }: { onAuth: () => void }) {
  const { data, refetch } = useMe();
  const user = data?.user;

  const [entries, setEntries] = React.useState<DreamEntry[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [showForm, setShowForm] = React.useState(false);
  const [activeEntry, setActiveEntry] = React.useState<DreamEntry | null>(null);
  const [filterFav, setFilterFav] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    loadEntries();
  }, [user, filterFav]);

  async function loadEntries() {
    setLoading(true);
    try {
      const url = filterFav ? "/api/dream-journal?favorites=true" : "/api/dream-journal";
      const res = await api<{ entries: DreamEntry[] }>(url);
      setEntries(res.entries || []);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  async function onCreated(entry: DreamEntry) {
    setEntries((prev) => [entry, ...prev]);
    setShowForm(false);
    setActiveEntry(entry);
    toast.success("Dream recorded ✦");
  }

  async function toggleFavorite(entry: DreamEntry) {
    try {
      const res = await api<{ entry: DreamEntry }>(`/api/dream-journal/${entry.id}`, {
        method: "PATCH",
        json: { isFavorite: !entry.isFavorite },
      });
      setEntries((prev) => prev.map((e) => (e.id === entry.id ? res.entry : e)));
      if (activeEntry?.id === entry.id) setActiveEntry(res.entry);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  async function deleteEntry(entry: DreamEntry, e?: React.MouseEvent) {
    e?.stopPropagation();
    if (!confirm(`Delete "${entry.title}"?`)) return;
    try {
      await api(`/api/dream-journal/${entry.id}`, { method: "DELETE" });
      setEntries((prev) => prev.filter((x) => x.id !== entry.id));
      if (activeEntry?.id === entry.id) setActiveEntry(null);
      toast.success("Dream deleted");
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  if (!user) return <Gate onAuth={onAuth} />;

  // Active entry detail
  if (activeEntry) {
    return (
      <EntryDetail
        entry={activeEntry}
        onClose={() => setActiveEntry(null)}
        onToggleFavorite={() => toggleFavorite(activeEntry)}
        onDelete={(e) => deleteEntry(activeEntry, e)}
        onUpdate={(updated) => {
          setEntries((prev) => prev.map((e) => (e.id === updated.id ? updated : e)));
          setActiveEntry(updated);
        }}
      />
    );
  }

  // New entry form
  if (showForm) {
    return (
      <EntryForm
        onCancel={() => setShowForm(false)}
        onCreated={onCreated}
      />
    );
  }

  const favoritesCount = entries.filter((e) => e.isFavorite).length;
  const recurringCount = entries.filter((e) => e.isRecurring).length;
  const interpretedCount = entries.filter((e) => e.interpretation).length;

  return (
    <div className="h-full overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== Hero ===== */}
        <div className="flex items-end justify-between mb-7 flex-wrap gap-4 lum-reveal">
          <div className="min-w-0">
            <GlowPill className="mb-3" color="#9CB4D1">
              <Moon className="w-3 h-3" /> Dreams and their patterns
            </GlowPill>
            <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block">
              Dream Journal
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch] mt-2">
              Record dreams upon waking. Baydin detects archetypal symbols, computes the lunar context, and offers interpretations grounded in Vedic and Jungian tradition.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFilterFav((v) => !v)}
              className={cn(
                "p-2 border transition focus-ring rounded-sm",
                filterFav
                  ? "border-[#C5A572] text-[#C5A572]"
                  : "border-[#2A2722] text-[#6B6358] hover:text-[#E8E2D5] hover:border-[#4A4540]"
              )}
              aria-label="Filter favorites"
            >
              <Heart className={cn("w-4 h-4", filterFav && "fill-current")} />
            </button>
            <ShimmerButton onClick={() => setShowForm(true)} className="py-2 px-4 text-[12px]">
              <Plus className="w-3.5 h-3.5" /> New dream
            </ShimmerButton>
          </div>
        </div>

        {/* Stats */}
        {entries.length > 0 && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
            <StatPill glow="#9CB4D1" icon={<BookOpen className="w-3.5 h-3.5" />} label="Dreams" value={entries.length} />
            <StatPill glow="#C5A572" icon={<Heart className="w-3.5 h-3.5" />} label="Favorites" value={favoritesCount} />
            <StatPill glow="#D4A0B8" icon={<RefreshCw className="w-3.5 h-3.5" />} label="Recurring" value={recurringCount} />
            <StatPill glow="#7A8B6F" icon={<Sparkles className="w-3.5 h-3.5" />} label="Interpreted" value={interpretedCount} />
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-[#9C9489]">
            <Loader2 className="w-5 h-5 animate-spin" />
          </div>
        ) : entries.length === 0 ? (
          <EmptyState onCreate={() => setShowForm(true)} />
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => (
              <EntryCard
                key={entry.id}
                entry={entry}
                onClick={() => setActiveEntry(entry)}
                onToggleFavorite={() => toggleFavorite(entry)}
                onDelete={(e) => deleteEntry(entry, e)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function StatPill({
  glow, icon, label, value,
}: {
  glow: string;
  icon: React.ReactNode;
  label: string;
  value: number;
}) {
  return (
    <AuroraGlowCard glowColor={glow} glowIntensity={0.1} className="p-3">
      <div className="flex items-center gap-2.5">
        <span style={{ color: glow }}>{icon}</span>
        <div>
          <div className="text-[18px] font-light text-[#E8E2D5] leading-none tabular-nums">
            <NumberTicker value={value} />
          </div>
          <div className="text-[10px] text-[#9C9489] mt-0.5">{label}</div>
        </div>
      </div>
    </AuroraGlowCard>
  );
}

// ============================================================
// ENTRY CARD
// ============================================================
function EntryCard({
  entry, onClick, onToggleFavorite, onDelete,
}: {
  entry: DreamEntry;
  onClick: () => void;
  onToggleFavorite: () => void;
  onDelete: (e: React.MouseEvent) => void;
}) {
  const mood = MOODS.find((m) => m.id === entry.mood) || MOODS[5];
  return (
    <AuroraGlowCard glowColor={mood.color} glowIntensity={0.1} className="p-5">
      <div
        role="button"
        tabIndex={0}
        onClick={onClick}
        onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
        className="flex items-start gap-4 cursor-pointer text-left focus-ring rounded-sm"
      >
        {/* Mood emoji */}
        <div
          className="w-11 h-11 rounded-sm flex items-center justify-center shrink-0 text-xl border"
          style={{ background: `${mood.color}15`, borderColor: `${mood.color}40` }}
          title={mood.label}
        >
          {mood.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1 flex-wrap">
            <div className="serif text-[1.125rem] text-[#E8E2D5] truncate">{entry.title}</div>
            {entry.isRecurring && (
              <GlowPill color="#D4A0B8" className="text-[9px]">recurring</GlowPill>
            )}
            {entry.interpretation && (
              <GlowPill color="#C5A572" className="text-[9px]">
                <Sparkles className="w-2.5 h-2.5" /> interpreted
              </GlowPill>
            )}
          </div>
          <div className="text-[13px] text-[#9C9489] line-clamp-2 mb-2 leading-[1.6]">{entry.content}</div>

          {/* Date + mood GlowPill + symbols */}
          <div className="flex items-center gap-2 flex-wrap text-[11px] text-[#6B6358]">
            <GlowPill color={mood.color} className="text-[10px]">
              {new Date(entry.dreamDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </GlowPill>
            <GlowPill color={mood.color} className="text-[10px]">{mood.label}</GlowPill>
            {entry.lunarContext && (
              <GlowPill color="#9CB4D1" className="text-[10px]" >
                <Moon className="w-2.5 h-2.5" />
                {entry.lunarContext.emoji} {entry.lunarContext.nakshatra}
              </GlowPill>
            )}
            {entry.symbols.slice(0, 4).map((s) => (
              <span key={s} className="text-[#9C9489]">#{s}</span>
            ))}
            {entry.symbols.length > 4 && (
              <span className="text-[#6B6358]">+{entry.symbols.length - 4}</span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1 shrink-0">
          <button
            onClick={(e) => { e.stopPropagation(); onToggleFavorite(); }}
            className="p-1.5 text-[#6B6358] hover:text-[#C5A572] transition focus-ring rounded-sm"
            aria-label={entry.isFavorite ? "Remove favorite" : "Add to favorites"}
          >
            <Heart className={cn("w-3.5 h-3.5", entry.isFavorite && "fill-[#C5A572] text-[#C5A572]")} />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 text-[#6B6358] hover:text-[#C26B5C] transition focus-ring rounded-sm"
            aria-label="Delete dream"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </AuroraGlowCard>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.15} className="p-8 lg:p-12 text-center">
      <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 border border-[#9CB4D1]/30" style={{ background: "#9CB4D115" }}>
        <Moon className="w-7 h-7 text-[#9CB4D1]" />
      </div>
      <LiquidMetalText as="h2" className="serif-display text-[1.5rem] block mb-3">Your dream journal is empty.</LiquidMetalText>
      <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch] mb-6 mx-auto">
        Record your dreams upon waking. Baydin detects archetypal symbols, computes the lunar context, and offers an interpretation grounded in Vedic and Jungian tradition.
      </p>
      <ShimmerButton onClick={onCreate} className="py-3 px-6">
        <Plus className="w-4 h-4" /> Record your first dream
      </ShimmerButton>
    </AuroraGlowCard>
  );
}

// ============================================================
// ENTRY FORM
// ============================================================
function EntryForm({
  onCancel, onCreated,
}: {
  onCancel: () => void;
  onCreated: (entry: DreamEntry) => void;
}) {
  const [title, setTitle] = React.useState("");
  const [content, setContent] = React.useState("");
  const [mood, setMood] = React.useState("neutral");
  const [isRecurring, setIsRecurring] = React.useState(false);
  const [dreamDate, setDreamDate] = React.useState(new Date().toISOString().slice(0, 10));
  const [saving, setSaving] = React.useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (title.trim().length < 3) { toast.error("Title needs at least 3 characters"); return; }
    if (content.trim().length < 10) { toast.error("Describe your dream in at least 10 characters"); return; }
    setSaving(true);
    try {
      const res = await api<{ entry: DreamEntry; detectedSymbols: DetectedSymbol[] }>(
        "/api/dream-journal",
        { method: "POST", json: { title, content, mood, isRecurring, dreamDate } }
      );
      onCreated(res.entry);
      if (res.detectedSymbols.length > 0) {
        toast.success(`Detected ${res.detectedSymbols.length} symbol${res.detectedSymbols.length > 1 ? "s" : ""}`);
      }
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        <button
          type="button"
          onClick={onCancel}
          className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition mb-4 focus-ring rounded-sm inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Cancel
        </button>

        <div className="mb-8 lum-reveal">
          <GlowPill className="mb-3" color="#9CB4D1">
            <Moon className="w-3 h-3" /> A new entry
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block">
            Record a dream
          </LiquidMetalText>
        </div>

        <form onSubmit={submit} className="space-y-6 pb-8">
          {/* Dream date */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2">Dream date</label>
            <input
              type="date"
              value={dreamDate}
              onChange={(e) => setDreamDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              min="1900-01-01"
              className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] focus:outline-none focus:border-[#C5A572] transition [color-scheme:dark]"
            />
            <div className="text-[11px] text-[#6B6358] mt-1.5">The lunar context will be computed for this date.</div>
          </div>

          {/* Title */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. The serpent at the river"
              maxLength={100}
              className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus:outline-none focus:border-[#C5A572] transition"
            />
          </div>

          {/* Mood */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2.5">Mood</label>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
              {MOODS.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => setMood(m.id)}
                  className={cn(
                    "p-3 border text-center transition focus-ring rounded-sm",
                    mood === m.id
                      ? "border-[#C5A572] bg-[#1A1714]"
                      : "border-[#2A2722] bg-transparent hover:border-[#4A4540]"
                  )}
                  style={mood === m.id ? { borderColor: `${m.color}66`, background: `${m.color}10` } : {}}
                >
                  <div className="text-lg leading-none">{m.emoji}</div>
                  <div className="text-[10px] text-[#6B6358] mt-1">{m.label}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2">Dream narrative</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Describe your dream in as much detail as you remember — places, characters, emotions, colors, actions…"
              rows={8}
              className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus:outline-none focus:border-[#C5A572] transition resize-y min-h-[160px] leading-[1.7]"
            />
            <div className="text-[11px] text-[#6B6358] mt-1.5">
              <NumberTicker value={content.length} /> characters · symbols auto-detected
            </div>
          </div>

          {/* Recurring */}
          <label className="flex items-center gap-2.5 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={isRecurring}
              onChange={(e) => setIsRecurring(e.target.checked)}
              className="w-4 h-4 accent-[#C5A572]"
            />
            <span className="text-[13px] text-[#9C9489]">This is a recurring dream theme</span>
          </label>

          <div className="flex gap-3 pt-2">
            <ShimmerButton
              type="button"
              onClick={onCancel}
              tone="parchment"
              className="flex-1 py-3"
            >
              Cancel
            </ShimmerButton>
            <ShimmerButton
              type="submit"
              disabled={saving}
              className="flex-1 py-3"
            >
              {saving ? "Saving…" : "Save dream"}
            </ShimmerButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// ============================================================
// ENTRY DETAIL
// ============================================================
function EntryDetail({
  entry, onClose, onToggleFavorite, onDelete, onUpdate,
}: {
  entry: DreamEntry;
  onClose: () => void;
  onToggleFavorite: () => void;
  onDelete: (e: React.MouseEvent) => void;
  onUpdate: (entry: DreamEntry) => void;
}) {
  const [interpretation, setInterpretation] = React.useState(entry.interpretation || "");
  const [detectedSymbols, setDetectedSymbols] = React.useState<DetectedSymbol[]>([]);
  const [loadingInterp, setLoadingInterp] = React.useState(false);

  const mood = MOODS.find((m) => m.id === entry.mood) || MOODS[5];
  const dateObj = new Date(entry.dreamDate + "T12:00:00");

  async function interpret() {
    setLoadingInterp(true);
    try {
      const res = await api<{ interpretation: string; symbols: DetectedSymbol[]; balance: number; cost: number }>(
        `/api/dream-journal/${entry.id}/interpret`,
        { method: "POST" }
      );
      setInterpretation(res.interpretation);
      setDetectedSymbols(res.symbols);
      onUpdate({ ...entry, interpretation: res.interpretation });
      toast.success(`Interpretation ready · ${res.cost} Luck spent`);
    } catch (e: any) {
      if (e.status === 402) {
        toast.error("Insufficient Luck — you need 2 Luck for AI dream interpretation.");
      } else {
        toast.error(e.message);
      }
    } finally {
      setLoadingInterp(false);
    }
  }

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        <button
          onClick={onClose}
          className="text-[12px] text-[#9C9489] hover:text-[#C5A572] transition mb-4 focus-ring rounded-sm inline-flex items-center gap-1"
        >
          <ChevronLeft className="w-3.5 h-3.5" /> Back to journal
        </button>

        {/* Header */}
        <AuroraGlowCard glowColor={mood.color} glowIntensity={0.15} className="p-5 mb-4">
          <div className="flex items-start gap-4">
            <div
              className="w-14 h-14 rounded-sm flex items-center justify-center shrink-0 text-2xl border"
              style={{ background: `${mood.color}15`, borderColor: `${mood.color}40` }}
              title={mood.label}
            >
              {mood.emoji}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[12px] text-[#6B6358] font-medium">
                {dateObj.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" })}
              </div>
              <LiquidMetalText as="h1" className="serif-display text-[1.5rem] lg:text-[1.75rem] block mt-1 leading-tight">
                {entry.title}
              </LiquidMetalText>
              <div className="flex items-center gap-2 mt-3 flex-wrap">
                <GlowPill color={mood.color} className="text-[11px]">{mood.label}</GlowPill>
                {entry.isRecurring && (
                  <GlowPill color="#D4A0B8" className="text-[11px]">
                    <RefreshCw className="w-3 h-3" /> Recurring
                  </GlowPill>
                )}
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <button
                onClick={onToggleFavorite}
                className="p-2 rounded-sm text-[#9C9489] hover:text-[#C5A572] transition focus-ring"
                title={entry.isFavorite ? "Remove favorite" : "Add to favorites"}
                aria-label={entry.isFavorite ? "Remove favorite" : "Add to favorites"}
              >
                <Heart className={cn("w-4 h-4", entry.isFavorite && "fill-[#C5A572] text-[#C5A572]")} />
              </button>
              <button
                onClick={onDelete}
                className="p-2 rounded-sm text-[#9C9489] hover:text-[#C26B5C] transition focus-ring"
                title="Delete"
                aria-label="Delete dream"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>
        </AuroraGlowCard>

        {/* Dream narrative */}
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-5 lg:p-6 mb-4">
          <div className="flex items-center gap-2 mb-3">
            <BookOpen className="w-4 h-4 text-[#C5A572]" />
            <span className="text-[12px] text-[#6B6358] font-medium uppercase tracking-[0.15em]">The Dream</span>
          </div>
          <div className="text-[14px] text-[#E8E2D5]/90 leading-relaxed whitespace-pre-wrap">{entry.content}</div>
        </AuroraGlowCard>

        {/* Lunar context */}
        {entry.lunarContext && (
          <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.12} className="p-5 lg:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-[#9CB4D1]" />
              <span className="text-[12px] text-[#6B6358] font-medium uppercase tracking-[0.15em]">Lunar Context</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <LunarMini label="Moon phase" value={`${entry.lunarContext.emoji} ${entry.lunarContext.moonPhase}`} sub={`${(entry.lunarContext.illumination * 100).toFixed(0)}% lit`} />
              <LunarMini label="Nakshatra" value={entry.lunarContext.nakshatra} sub={`Pada ${entry.lunarContext.nakshatraPada}`} />
              <LunarMini label="Tithi" value={entry.lunarContext.tithi} />
              <LunarMini label="Yoga" value={entry.lunarContext.yoga || "—"} />
            </div>
            {(entry.lunarContext.isPurnima || entry.lunarContext.isAmavasya || entry.lunarContext.isEkadashi) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {entry.lunarContext.isPurnima && (
                  <GlowPill color="#C5A572" className="text-[10px]">Purnima — vivid dreams</GlowPill>
                )}
                {entry.lunarContext.isAmavasya && (
                  <GlowPill color="#9CB4D1" className="text-[10px]">Amavasya — ancestral messages</GlowPill>
                )}
                {entry.lunarContext.isEkadashi && (
                  <GlowPill color="#7A8B6F" className="text-[10px]">Ekadashi — spiritual charge</GlowPill>
                )}
              </div>
            )}
          </AuroraGlowCard>
        )}

        {/* Detected symbols */}
        {entry.symbols.length > 0 && (
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-5 lg:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-[#C5A572]" />
              <span className="text-[12px] text-[#6B6358] font-medium uppercase tracking-[0.15em]">Symbols Detected</span>
            </div>
            <div className="space-y-2.5">
              {entry.symbols.map((kw) => {
                const sym = detectedSymbols.find((s) => s.keyword === kw);
                const Icon = sym ? (CATEGORY_ICON[sym.category] || Star) : Star;
                const color = sym ? POLARITY_COLOR[sym.polarity] : "#8B7355";
                return (
                  <div key={kw} className="p-3 rounded-sm bg-black/20 border border-[#2A2722]">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-[13px] text-[#E8E2D5] font-medium">#{kw}</span>
                      {sym && (
                        <GlowPill color={color} className="text-[9px]">{sym.polarity}</GlowPill>
                      )}
                    </div>
                    {sym ? (
                      <div className="text-[11px] text-[#9C9489] leading-relaxed">
                        <span className="text-[#C5A572]">Vedic:</span> {sym.vedic}<br />
                        <span className="text-[#C5A572]">Jungian:</span> {sym.jungian}
                      </div>
                    ) : (
                      <div className="text-[11px] text-[#9C9489]">Tap "Interpret with AI" for the meaning.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </AuroraGlowCard>
        )}

        {/* Interpretation */}
        {interpretation ? (
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-5 lg:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-[#C5A572]" />
              <span className="text-[12px] text-[#6B6358] font-medium uppercase tracking-[0.15em]">AI Interpretation</span>
            </div>
            <div className="text-[13px] text-[#E8E2D5]/90 leading-relaxed whitespace-pre-wrap">{interpretation}</div>
            <div className="mt-4 pt-3 border-t border-[#2A2722] flex items-center justify-between gap-2 flex-wrap">
              <div className="text-[10px] text-[#9C9489]">Drawn from Vedic symbolism, Jungian psychology, and the lunar context above.</div>
              <ShimmerButton
                onClick={interpret}
                disabled={loadingInterp}
                tone="parchment"
                className="text-[11px] py-1.5 px-3"
              >
                {loadingInterp ? (
                  <Loader2 className="w-3 h-3 animate-spin" />
                ) : (
                  <RefreshCw className="w-3 h-3" />
                )}
                Re-interpret
              </ShimmerButton>
            </div>
          </AuroraGlowCard>
        ) : (
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.15} className="p-6 text-center">
            <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm mb-3 border border-[#C5A572]/30" style={{ background: "#C5A57210" }}>
              {loadingInterp ? (
                <Loader2 className="w-5 h-5 text-[#C5A572] animate-spin" />
              ) : (
                <Sparkles className="w-5 h-5 text-[#C5A572]" />
              )}
            </div>
            <div className="text-[14px] text-[#E8E2D5] font-medium mb-1">No interpretation yet</div>
            <div className="text-[12px] text-[#9C9489] mb-4 max-w-md mx-auto">
              Get an AI interpretation that draws on the symbols, the lunar context, and your natal chart. Costs{" "}
              <span className="inline-flex items-center gap-1 text-[#C5A572]">
                <CloverIcon className="w-3 h-3" filled /> {DREAM_INTERPRET_COST} Luck
              </span>.
            </div>
            <ShimmerButton
              onClick={interpret}
              disabled={loadingInterp}
              className="py-2.5 px-5 text-[13px]"
            >
              {loadingInterp ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Interpreting…</>
              ) : (
                <><Sparkles className="w-3.5 h-3.5" /> Interpret with AI · <span className="inline-flex items-center gap-0.5"><CloverIcon className="w-3 h-3" filled /> {DREAM_INTERPRET_COST}</span></>
              )}
            </ShimmerButton>
          </AuroraGlowCard>
        )}
      </div>
    </div>
  );
}

function LunarMini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-black/20 border border-[#2A2722]">
      <div className="text-[11px] text-[#6B6358]">{label}</div>
      <div className="text-[12px] text-[#E8E2D5] mt-0.5 font-medium truncate" title={value}>{value}</div>
      {sub && <div className="text-[10px] text-[#9C9489]">{sub}</div>}
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
          <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.15} className="max-w-sm w-full p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 border border-[#9CB4D1]/30" style={{ background: "#9CB4D110" }}>
              <Moon className="w-7 h-7 text-[#9CB4D1]" />
            </div>
            <LiquidMetalText as="h1" className="serif-display text-[1.75rem] block mb-2">Sign in to begin</LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
              Record your dreams and reveal their archetypal meaning.
            </p>
            <ShimmerButton onClick={onAuth} className="w-full">Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    </div>
  );
}
