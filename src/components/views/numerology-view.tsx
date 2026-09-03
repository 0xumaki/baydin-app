"use client";

import * as React from "react";
import {
  GlassCard, GoldButton, GhostButton, Pill, SectionTitle, ShellCard,
} from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { NumerologyReport, NumberMeaning, NumerologySystem } from "@/lib/numerology";
import {
  Hash, Sparkles, Wallet, Loader2, Calendar, User, RefreshCw, ChevronRight,
  Trash2, Sun, Moon, Star, Flame, Droplet, Wind, Gem, Palette, Clock,
} from "lucide-react";
import { toast } from "sonner";

type HistoryItem = {
  id: string;
  input: { name: string; birthDate: string };
  system: string;
  createdAt: string;
};

const NUMBER_LABELS: { key: keyof NumerologyReport["numbers"]; label: string; sub: string }[] = [
  { key: "lifePath", label: "Life Path", sub: "The road you walk" },
  { key: "destiny", label: "Destiny", sub: "What you must accomplish" },
  { key: "soulUrge", label: "Soul Urge", sub: "Your heart's longing" },
  { key: "personality", label: "Personality", sub: "How others see you" },
  { key: "birthday", label: "Birthday", sub: "Your special talent" },
  { key: "maturity", label: "Maturity", sub: "Who you become" },
  { key: "personalYear", label: "Personal Year", sub: "This year's theme" },
  { key: "personalMonth", label: "Personal Month", sub: "This month's energy" },
];

const ELEMENT_ICON: Record<string, any> = {
  Fire: Flame, Earth: Gem, Air: Wind, Water: Droplet, Spirit: Star,
};

export function NumerologyView({ onAuth }: { onAuth: () => void }) {
  const { data, refetch } = useMe();
  const user = data?.user;

  const [name, setName] = React.useState("");
  const [birthDate, setBirthDate] = React.useState("");
  const [system, setSystem] = React.useState<NumerologySystem>("pythagorean");
  const [loading, setLoading] = React.useState(false);
  const [purchasing, setPurchasing] = React.useState(false);
  const [report, setReport] = React.useState<NumerologyReport | null>(null);
  const [preview, setPreview] = React.useState<{ lifePath: number; meaning: NumberMeaning } | null>(null);
  const [history, setHistory] = React.useState<HistoryItem[]>([]);
  const [activeNumber, setActiveNumber] = React.useState<keyof NumerologyReport["numbers"] | null>(null);

  // Load history on mount
  React.useEffect(() => {
    if (!user) return;
    fetch("/api/numerology")
      .then((r) => r.json())
      .then((d) => setHistory(d.readings || []))
      .catch(() => {});
  }, [user]);

  function validate(): string | null {
    if (!name.trim() || name.trim().length < 2) return "Please enter your full name.";
    if (!birthDate) return "Please enter your birth date.";
    const m = birthDate.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return "Birth date must be YYYY-MM-DD.";
    const y = +m[1], mo = +m[2], d = +m[3];
    if (y < 1800 || y > new Date().getFullYear()) return "Please enter a valid birth year.";
    if (mo < 1 || mo > 12) return "Invalid month.";
    if (d < 1 || d > 31) return "Invalid day.";
    return null;
  }

  // Free preview — just Life Path number
  async function doPreview() {
    if (!user) { onAuth(); return; }
    const err = validate();
    if (err) { toast.error(err); return; }
    setLoading(true);
    setPreview(null);
    setReport(null);
    try {
      const res = await api<{ preview: boolean; numbers: { lifePath: number }; meanings: { lifePath: NumberMeaning }; costLuck: number }>(
        "/api/numerology",
        { method: "POST", json: { name, birthDate, system, preview: true } }
      );
      setPreview({ lifePath: res.numbers.lifePath, meaning: res.meanings.lifePath });
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  // Full report — charges Luck
  async function doFullReport() {
    if (!user) { onAuth(); return; }
    const err = validate();
    if (err) { toast.error(err); return; }
    setPurchasing(true);
    setReport(null);
    try {
      const res = await api<{ report: NumerologyReport; balance: number; cost: number; id: string }>(
        "/api/numerology",
        { method: "POST", json: { name, birthDate, system } }
      );
      setReport(res.report);
      setPreview(null);
      toast.success(`Full report unlocked · ${res.cost} Luck spent · ${res.balance} Luck remaining`);
      refetch();
      // Refresh history
      const h = await api<{ readings: HistoryItem[] }>("/api/numerology");
      setHistory(h.readings || []);
    } catch (e: any) {
      if (e.status === 402) {
        toast.error("Not enough Luck — you need 3 Luck for a full numerology report.");
      } else {
        toast.error(e.message);
      }
    } finally {
      setPurchasing(false);
    }
  }

  // Load a saved report
  async function loadHistory(id: string) {
    try {
      const res = await api<{ report: NumerologyReport }>(`/api/numerology/${id}`);
      setReport(res.report);
      setPreview(null);
      setActiveNumber(null);
      setName(res.report.name);
      setBirthDate(res.report.birthDate);
      setSystem(res.report.system);
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  // Delete a saved report
  async function deleteHistory(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api(`/api/numerology?id=${id}`, { method: "DELETE" });
      setHistory((h) => h.filter((r) => r.id !== id));
      toast.success("Report deleted");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  function reset() {
    setReport(null);
    setPreview(null);
    setActiveNumber(null);
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Hash className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to begin</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  // ---- Showing full report ----
  if (report) {
    const numberCards = NUMBER_LABELS.map(({ key, label, sub }) => {
      const num = report.numbers[key];
      const meaning = report.meanings[key];
      return { key, label, sub, num, meaning };
    });
    const active = activeNumber
      ? numberCards.find((c) => c.key === activeNumber)
      : numberCards[0];

    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
        <div className="max-w-5xl mx-auto px-6 py-8 lg:py-12">
          {/* Header — serif headline, sentence-case */}
          <div className="mb-10 lum-reveal">
            <button onClick={reset} className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition mb-4">← New reading</button>
            <div className="text-[13px] text-[#6B6358] mb-2">
              {report.name} · born {new Date(report.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
            </div>
            <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.15] tracking-tight mb-1">
              Numerology report
            </h1>
            <div className="text-[12px] text-[#9C9489]">
              {report.system === "chaldean" ? "Chaldean" : "Pythagorean"} system
            </div>
          </div>

          {/* 8 Number Cards — hairline grid, no glass */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2A2722] border border-[#2A2722] mb-10">
            {numberCards.map(({ key, label, num, meaning }) => {
              const isActive = active?.key === key;
              return (
                <button
                  key={key}
                  onClick={() => setActiveNumber(key)}
                  className={cn(
                    "relative p-5 text-left transition-colors bg-[#0A0908]",
                    isActive
                      ? "bg-[#1A1714]"
                      : "hover:bg-[#0F0D0B]"
                  )}
                >
                  <div className="text-[11px] text-[#6B6358] mb-2 font-medium">{label}</div>
                  <div className="flex items-baseline gap-2">
                    <span
                      className="serif-display text-[2.5rem] leading-none tabular-nums"
                      style={{ color: isActive ? "#C5A572" : "#E8E2D5" }}
                    >
                      {num}
                    </span>
                    {num > 9 && (
                      <span className="text-[10px] text-[#6B6358] serif-italic">master</span>
                    )}
                  </div>
                  <div className="text-[11px] text-[#9C9489] mt-2 truncate">{meaning?.title}</div>
                </button>
              );
            })}
          </div>

          {/* Active Number Detail */}
          {active && active.meaning && (
            <NumberDetail num={active.num} meaning={active.meaning} label={active.label} sub={active.sub} />
          )}

          {/* Synthesis — editorial prose, no card chrome */}
          <div className="mt-12 pt-8 border-t border-[#2A2722] mb-10">
            <div className="text-[12px] text-[#6B6358] mb-4 font-medium">Synthesis</div>
            <div className="serif text-[15px] leading-[1.8] text-[#E8E2D5] whitespace-pre-line max-w-[65ch] prose-editorial">{report.synthesis}</div>
          </div>

          {/* Lucky Elements — quiet, not colorful cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-px bg-[#2A2722] border border-[#2A2722] mb-10">
            <LuckyCard icon={Clock} title="Lucky days" items={report.lucky.days} accent="#C5A87C" />
            <LuckyCard icon={Palette} title="Lucky colors" items={report.lucky.colors} accent="#D4A0B8" />
            <LuckyCard icon={Gem} title="Lucky gems" items={report.lucky.gems} accent="#7A8B6F" />
          </div>
          <div className="flex items-center justify-center gap-3 mb-10">
            <span className="text-[12px] text-[#6B6358]">Lucky numbers:</span>
            {report.lucky.numbers.map((n) => (
              <span key={n} className="serif-display text-[1.25rem] text-[#C5A572] tabular-nums">
                {n}
              </span>
            ))}
          </div>

          <div className="flex justify-center pb-6">
            <GhostButton onClick={reset} className="px-6 py-2.5 text-[13px]">
              <RefreshCw className="w-3.5 h-3.5" /> New reading
            </GhostButton>
          </div>
        </div>
      </div>
    );
  }

  // ---- Form / Preview ----
  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
        {/* Hero — serif, no icon-in-circle */}
        <div className="mb-10 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-3">Numbers in your name and date</div>
          <h1 className="serif-display text-[2.5rem] lg:text-[3rem] text-[#E8E2D5] leading-[1.05] tracking-tight mb-4">
            Numerology
          </h1>
          <p className="t-body-lg text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Decode the geometry of your name and birth date. Life Path, Destiny, Soul Urge, Personality — eight numbers, each a facet of the same life.
          </p>
        </div>

        {/* Form — editorial, inputs with hairline underlines */}
        <div className="space-y-6 pb-8 border-b border-[#2A2722] mb-8">
          {/* Name */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2">
              Full birth name
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Aung San"
              className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus:outline-none focus:border-[#C5A572] transition"
            />
            <div className="text-[11px] text-[#6B6358] mt-1.5">First, middle, and last — for the most accurate reading.</div>
          </div>

          {/* Birth date */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2">
              Birth date
            </label>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              max={new Date().toISOString().slice(0, 10)}
              min="1800-01-01"
              className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] focus:outline-none focus:border-[#C5A572] transition [color-scheme:dark]"
            />
          </div>

          {/* System toggle */}
          <div>
            <label className="block text-[12px] text-[#6B6358] font-medium mb-2.5">
              Calculation system
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setSystem("pythagorean")}
                className={cn(
                  "p-3 border text-left transition",
                  system === "pythagorean"
                    ? "border-[#C5A572] bg-[#1A1714]"
                    : "border-[#2A2722] bg-transparent hover:border-[#4A4540]"
                )}
              >
                <div className="text-[13px] text-[#E8E2D5] font-medium">Pythagorean</div>
                <div className="text-[11px] text-[#6B6358] mt-0.5">Western · A=1, B=2…</div>
              </button>
              <button
                onClick={() => setSystem("chaldean")}
                className={cn(
                  "p-3 border text-left transition",
                  system === "chaldean"
                    ? "border-[#C5A572] bg-[#1A1714]"
                    : "border-[#2A2722] bg-transparent hover:border-[#4A4540]"
                )}
              >
                <div className="text-[13px] text-[#E8E2D5] font-medium">Chaldean</div>
                <div className="text-[11px] text-[#6B6358] mt-0.5">Vedic · values 1–8</div>
              </button>
            </div>
          </div>
        </div>

        {/* CTAs — quiet, not gold-wash */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <button
            onClick={doPreview}
            disabled={loading}
            className="flex-1 py-3 text-[14px] text-[#9C9489] hover:text-[#E8E2D5] border border-[#2A2722] hover:border-[#4A4540] transition rounded-sm disabled:opacity-50 focus-ring"
          >
            {loading ? "…" : "Reveal Life Path"}
          </button>
          <button
            onClick={doFullReport}
            disabled={purchasing}
            className="flex-1 py-3 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring"
          >
            {purchasing ? "…" : "Full report · 3 Luck"}
          </button>
        </div>

        {/* Free Preview Result */}
        {preview && (
          <ShellCard className="mb-6">
            <div className="p-5 lg:p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <div className="text-[10px] uppercase tracking-[0.2em] text-gold">Life Path Preview</div>
                  <div className="text-[14px] text-ink-muted mt-0.5">Your most important number</div>
                </div>
                <span className="text-[9px] uppercase tracking-wider px-2 py-1 rounded-full bg-leaf/10 text-leaf border border-leaf/20">Free</span>
              </div>
              <div className="flex items-center gap-5 mb-4">
                <div
                  className="w-24 h-24 rounded-sm flex items-center justify-center shrink-0"
                  style={{ background: `${preview.meaning.color}18`, border: `1px solid ${preview.meaning.color}40` }}
                >
                  <span
                    className="text-[52px] font-light leading-none"
                    style={{ color: preview.meaning.color }}
                  >
                    {preview.lifePath}
                  </span>
                </div>
                <div className="min-w-0">
                  <div className="text-[18px] text-ink font-light">{preview.meaning.title}</div>
                  <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                    {preview.meaning.keywords.slice(0, 3).map((k) => (
                      <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ink-muted border border-white/10">{k}</span>
                    ))}
                  </div>
                  <div className="text-[11px] text-ink-muted mt-1.5">{preview.meaning.element} · {preview.meaning.rulingPlanet}</div>
                </div>
              </div>
              <p className="text-[13px] leading-relaxed text-ink/85">{preview.meaning.summary}</p>

              <div className="mt-4 p-3 rounded-sm bg-gold-soft/30 border border-gold/15">
                <div className="text-[12px] text-gold font-medium mb-1">Unlock the full picture</div>
                <div className="text-[11px] text-ink-muted leading-relaxed">
                  Your Life Path is just the beginning. The full report reveals your Destiny, Soul Urge, Personality, Maturity, Birthday and Personal Year numbers — plus a synthesis of how they interact, and your lucky days, colors and gems.
                </div>
                <GoldButton onClick={doFullReport} disabled={purchasing} className="w-full mt-3 py-2.5 text-[13px]">
                  {purchasing ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wallet className="w-3.5 h-3.5" />}
                  Reveal full report · 3 Luck
                </GoldButton>
              </div>
            </div>
          </ShellCard>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <SectionTitle className="mb-3">Past Readings</SectionTitle>
            <div className="space-y-2">
              {history.map((h) => (
                <div
                  key={h.id}
                  role="button"
                  tabIndex={0}
                  onClick={() => loadHistory(h.id)}
                  onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadHistory(h.id); } }}
                  className="w-full flex items-center gap-3 p-3 rounded-sm bg-[#0A0908] border border-[#2A2722] hover:border-[#4A4540] transition group cursor-pointer"
                >
                  <div className="w-9 h-9 rounded-lg bg-gold-soft/40 border border-gold/15 flex items-center justify-center shrink-0">
                    <Hash className="w-4 h-4 text-gold" />
                  </div>
                  <div className="flex-1 min-w-0 text-left">
                    <div className="text-[13px] text-ink truncate">{h.input.name}</div>
                    <div className="text-[10px] text-ink-muted">
                      {new Date(h.input.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {h.system === "chaldean" ? "Chaldean" : "Pythagorean"} · {new Date(h.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                  <button
                    onClick={(e) => deleteHistory(h.id, e)}
                    className="p-2 text-ink-muted hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                    aria-label="Delete reading"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                  <ChevronRight className="w-4 h-4 text-ink-muted" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function NumberDetail({
  num, meaning, label, sub,
}: { num: number; meaning: NumberMeaning; label: string; sub: string }) {
  const ElIcon = ELEMENT_ICON[meaning.element] || Star;
  return (
    <GlassCard className="p-5 lg:p-6 mb-6">
      <div className="flex items-start gap-5 flex-col sm:flex-row">
        {/* Big Number */}
        <div
          className="w-28 h-28 rounded-sm flex flex-col items-center justify-center shrink-0"
          style={{ background: `${meaning.color}15`, border: `1px solid ${meaning.color}40` }}
        >
          <span className="text-[56px] font-light leading-none" style={{ color: meaning.color }}>
            {num}
          </span>
          {num > 9 && (
            <span className="text-[8px] uppercase tracking-[0.2em] text-gold mt-1">Master</span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{label} · {sub}</div>
          <h2 className="text-[22px] lg:text-[26px] font-light text-ink mt-1">{meaning.title}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <span
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border"
              style={{ background: `${meaning.color}15`, borderColor: `${meaning.color}40`, color: meaning.color }}
            >
              <ElIcon className="w-2.5 h-2.5" /> {meaning.element}
            </span>
            <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ink-muted border border-white/10">
              {meaning.rulingPlanet}
            </span>
            {meaning.keywords.map((k) => (
              <span key={k} className="text-[10px] px-2 py-0.5 rounded-full bg-white/5 text-ink-muted border border-white/10">{k}</span>
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-ink/85 mt-3">{meaning.summary}</p>
        </div>
      </div>

      {/* Traits + Challenges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-leaf mb-2">Gifts</div>
          <ul className="space-y-1.5">
            {meaning.traits.map((t) => (
              <li key={t} className="text-[12px] text-ink/80 flex items-start gap-2">
                <span className="text-leaf mt-0.5">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="text-[10px] uppercase tracking-[0.2em] text-amber-400/80 mb-2">Challenges</div>
          <ul className="space-y-1.5">
            {meaning.challenges.map((c) => (
              <li key={c} className="text-[12px] text-ink/80 flex items-start gap-2">
                <span className="text-amber-400/80 mt-0.5">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </GlassCard>
  );
}

function LuckyCard({
  icon: Icon, title, items, accent,
}: { icon: any; title: string; items: string[]; accent: string }) {
  return (
    <div className="p-5 bg-[#0A0908]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <div className="text-[12px] text-[#6B6358] font-medium">{title}</div>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {items.map((it) => (
          <span key={it} className="text-[13px] text-[#E8E2D5]">
            {it}
          </span>
        ))}
      </div>
    </div>
  );
}
