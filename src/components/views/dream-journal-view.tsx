"use client";

import * as React from "react";
import {
  GlassCard, GoldButton, GhostButton, Pill, SectionTitle, ShellCard,
} from "@/components/lumina/primitives";
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

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Moon className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to begin</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

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

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
        {/* Header — serif headline */}
        <div className="flex items-end justify-between mb-8 flex-wrap gap-4 lum-reveal">
          <div>
            <div className="text-[13px] text-[#6B6358] mb-2">Dreams and their patterns</div>
            <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight">
              Dream journal
            </h1>
          </div>
          <div className="flex items-center gap-3">
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
            <button
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 py-2 px-4 bg-[#E8E2D5] text-[#0A0908] text-[13px] font-medium hover:bg-white transition rounded-sm focus-ring"
            >
              <Plus className="w-3.5 h-3.5" /> Record dream
            </button>
          </div>
        </div>

        {/* Stats — text, not pills */}
        {entries.length > 0 && (
          <div className="flex flex-wrap gap-x-6 gap-y-2 mb-8 text-[12px] text-[#6B6358]">
            <span>{entries.length} dream{entries.length > 1 ? "s" : ""}</span>
            {entries.filter((e) => e.isFavorite).length > 0 && (
              <span>{entries.filter((e) => e.isFavorite).length} favorite{entries.filter((e) => e.isFavorite).length > 1 ? "s" : ""}</span>
            )}
            {entries.filter((e) => e.isRecurring).length > 0 && (
              <span>{entries.filter((e) => e.isRecurring).length} recurring</span>
            )}
            {entries.filter((e) => e.interpretation).length > 0 && (
              <span>{entries.filter((e) => e.interpretation).length} interpreted</span>
            )}
          </div>
        )}

        {/* Entries */}
        {loading ? (
          <div className="flex items-center justify-center py-16 text-ink-muted">
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
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } }}
      className="w-full p-5 border-b border-[#2A2722] hover:bg-[#0F0D0B] transition group cursor-pointer text-left focus-ring"
    >
      <div className="flex items-start gap-4">
        {/* Mood — just the emoji, no badge chrome */}
        <div className="text-[1.5rem] leading-none mt-1 shrink-0" title={mood.label}>
          {mood.emoji}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2 mb-1">
            <div className="serif text-[1.125rem] text-[#E8E2D5] truncate">{entry.title}</div>
            {entry.isRecurring && (
              <span className="text-[10px] text-[#6B6358] serif-italic">recurring</span>
            )}
            {entry.interpretation && (
              <span className="text-[10px] text-[#C5A572] serif-italic">interpreted</span>
            )}
          </div>
          <div className="text-[13px] text-[#9C9489] line-clamp-2 mb-2 leading-[1.6]">{entry.content}</div>

          {/* Symbols + lunar — text, not pills */}
          <div className="flex items-center gap-3 flex-wrap text-[11px] text-[#6B6358]">
            <span>
              {new Date(entry.dreamDate + "T12:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
            </span>
            {entry.lunarContext && (
              <span title={`${entry.lunarContext.moonPhase} · ${entry.lunarContext.nakshatra}`}>
                {entry.lunarContext.emoji} {entry.lunarContext.nakshatra}
              </span>
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
    </div>
  );
}

// ============================================================
// EMPTY STATE
// ============================================================
function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="pt-12 border-t border-[#2A2722]">
      <div className="serif text-[1.5rem] text-[#E8E2D5] mb-3">Your dream journal is empty.</div>
      <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch] mb-6">
        Record your dreams upon waking. Baydin detects archetypal symbols, computes the lunar context, and offers an interpretation grounded in Vedic and Jungian tradition.
      </p>
      <button
        onClick={onCreate}
        className="inline-flex items-center gap-2 py-3 px-6 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm focus-ring"
      >
        <Plus className="w-4 h-4" /> Record your first dream
      </button>
    </div>
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
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <form onSubmit={submit} className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
        <button type="button" onClick={onCancel} className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition mb-4 focus-ring rounded-sm">
          ← Cancel
        </button>

        <div className="mb-10 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">A new entry</div>
          <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight">
            Record a dream
          </h1>
        </div>

        <div className="space-y-6 pb-8 border-b border-[#2A2722] mb-8">
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
            <div className="text-[11px] text-[#6B6358] mt-1.5">{content.length} characters · symbols auto-detected</div>
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
        </div>

        <div className="flex gap-3">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 py-3 text-[14px] text-[#9C9489] hover:text-[#E8E2D5] border border-[#2A2722] hover:border-[#4A4540] transition rounded-sm focus-ring"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving}
            className="flex-1 py-3 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring"
          >
            {saving ? "Saving…" : "Save dream"}
          </button>
        </div>
      </form>
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
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <button onClick={onClose} className="text-[12px] text-ink-muted hover:text-gold transition mb-4">
          ← Back to journal
        </button>

        {/* Header */}
        <div className="flex items-start gap-4 mb-6">
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
            <h1 className="text-[22px] lg:text-[26px] font-light text-ink mt-1 leading-tight">{entry.title}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-[11px] px-2 py-0.5 rounded-full border" style={{ background: `${mood.color}15`, borderColor: `${mood.color}40`, color: mood.color }}>
                {mood.label}
              </span>
              {entry.isRecurring && (
                <span className="text-[11px] px-2 py-0.5 rounded-full bg-white/5 text-ink-muted border border-white/10">
                  <RefreshCw className="w-3 h-3 inline mr-1" /> Recurring
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-1">
            <button onClick={onToggleFavorite} className="p-2 rounded-lg text-ink-muted hover:text-gold transition" title={entry.isFavorite ? "Remove favorite" : "Add to favorites"}>
              <Heart className={cn("w-4 h-4", entry.isFavorite && "fill-gold text-gold")} />
            </button>
            <button onClick={onDelete} className="p-2 rounded-lg text-ink-muted hover:text-red-400 transition" title="Delete">
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Dream narrative */}
        <GlassCard className="p-5 lg:p-6 mb-4">
          <div className="text-[12px] text-[#6B6358] font-medium mb-3">The Dream</div>
          <div className="text-[14px] text-ink/90 leading-relaxed whitespace-pre-wrap">{entry.content}</div>
        </GlassCard>

        {/* Lunar context */}
        {entry.lunarContext && (
          <GlassCard className="p-5 lg:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Moon className="w-4 h-4 text-gold" />
              <div className="text-[12px] text-[#6B6358] font-medium">Lunar Context</div>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <LunarMini label="Moon phase" value={`${entry.lunarContext.emoji} ${entry.lunarContext.moonPhase}`} sub={`${(entry.lunarContext.illumination * 100).toFixed(0)}% lit`} />
              <LunarMini label="Nakshatra" value={entry.lunarContext.nakshatra} sub={`Pada ${entry.lunarContext.nakshatraPada}`} />
              <LunarMini label="Tithi" value={entry.lunarContext.tithi} />
              <LunarMini label="Yoga" value={entry.lunarContext.yoga || "—"} />
            </div>
            {(entry.lunarContext.isPurnima || entry.lunarContext.isAmavasya || entry.lunarContext.isEkadashi) && (
              <div className="mt-3 flex items-center gap-2 flex-wrap">
                {entry.lunarContext.isPurnima && <Pill variant="gold" className="text-[10px]">Purnima — vivid dreams</Pill>}
                {entry.lunarContext.isAmavasya && <Pill className="text-[10px] bg-white/5 text-ink-muted border border-white/10">Amavasya — ancestral messages</Pill>}
                {entry.lunarContext.isEkadashi && <Pill variant="leaf" className="text-[10px]">Ekadashi — spiritual charge</Pill>}
              </div>
            )}
          </GlassCard>
        )}

        {/* Detected symbols */}
        {entry.symbols.length > 0 && (
          <GlassCard className="p-5 lg:p-6 mb-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="w-4 h-4 text-gold" />
              <div className="text-[12px] text-[#6B6358] font-medium">Symbols Detected</div>
            </div>
            <div className="space-y-2.5">
              {entry.symbols.map((kw) => {
                const sym = detectedSymbols.find((s) => s.keyword === kw);
                const Icon = sym ? (CATEGORY_ICON[sym.category] || Star) : Star;
                const color = sym ? POLARITY_COLOR[sym.polarity] : "#8B7355";
                return (
                  <div key={kw} className="p-3 rounded-sm bg-black/20 border border-white/5">
                    <div className="flex items-center gap-2 mb-1">
                      <Icon className="w-3.5 h-3.5" style={{ color }} />
                      <span className="text-[13px] text-ink font-medium">#{kw}</span>
                      {sym && (
                        <span className="text-[9px] px-1.5 py-0.5 rounded-full border" style={{ background: `${color}15`, borderColor: `${color}40`, color }}>
                          {sym.polarity}
                        </span>
                      )}
                    </div>
                    {sym ? (
                      <div className="text-[11px] text-ink-muted leading-relaxed">
                        <span className="text-gold">Vedic:</span> {sym.vedic}<br />
                        <span className="text-gold">Jungian:</span> {sym.jungian}
                      </div>
                    ) : (
                      <div className="text-[11px] text-ink-muted">Tap "Interpret with AI" for the meaning.</div>
                    )}
                  </div>
                );
              })}
            </div>
          </GlassCard>
        )}

        {/* Interpretation */}
        {interpretation ? (
          <ShellCard>
            <div className="p-5 lg:p-6">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles className="w-4 h-4 text-gold" />
                <div className="text-[12px] text-[#6B6358] font-medium">AI Interpretation</div>
              </div>
              <div className="text-[13px] text-ink/90 leading-relaxed whitespace-pre-wrap">{interpretation}</div>
              <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between">
                <div className="text-[10px] text-ink-muted">Drawn from Vedic symbolism, Jungian psychology, and the lunar context above.</div>
                <GhostButton onClick={interpret} disabled={loadingInterp} className="text-[11px] py-1.5 px-3">
                  <RefreshCw className="w-3 h-3" /> Re-interpret
                </GhostButton>
              </div>
            </div>
          </ShellCard>
        ) : (
          <ShellCard>
            <div className="p-6 text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-sm bg-gold-soft/30 border border-gold/15 mb-3">
                <Sparkles className="w-5 h-5 text-gold" />
              </div>
              <div className="text-[14px] text-ink font-medium mb-1">No interpretation yet</div>
              <div className="text-[12px] text-ink-muted mb-4 max-w-md mx-auto">
                Get an AI interpretation that draws on the symbols, the lunar context, and your natal chart. Costs 2 Luck.
              </div>
              <GoldButton onClick={interpret} disabled={loadingInterp} className="py-2.5 px-5 text-[13px]">
                {loadingInterp ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                Interpret with AI · 2 Luck
              </GoldButton>
            </div>
          </ShellCard>
        )}
      </div>
    </div>
  );
}

function LunarMini({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="p-2.5 rounded-lg bg-black/20 border border-white/5">
      <div className="text-[11px] text-[#6B6358]">{label}</div>
      <div className="text-[12px] text-ink mt-0.5 font-medium truncate" title={value}>{value}</div>
      {sub && <div className="text-[10px] text-ink-muted">{sub}</div>}
    </div>
  );
}
