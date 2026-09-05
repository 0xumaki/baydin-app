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
import { CloverIcon, BaydinNumerology, BaydinStar, BaydinLoader, BaydinRefresh, BaydinChevronRight, BaydinTrash, BaydinFlame, BaydinClock } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { NumerologyReport, NumberMeaning, NumerologySystem } from "@/lib/numerology";
import { BaydinStar as Droplet, BaydinBreath as Wind, BaydinStar as Gem, BaydinStar as Palette } from "@/components/lumina/baydin-icons";
import { toast } from "sonner";

type HistoryItem = {
  id: string;
  input: { name: string; birthDate: string };
  system: string;
  createdAt: string;
};

const NUMEROLOGY_COST = 3;

const NUMBER_LABELS: { key: keyof NumerologyReport["numbers"]; label: string; sub: string; accent: string }[] = [
  { key: "lifePath", label: "Life Path", sub: "The road you walk", accent: "#C5A572" },
  { key: "destiny", label: "Destiny", sub: "What you must accomplish", accent: "#9E8AC9" },
  { key: "soulUrge", label: "Soul Urge", sub: "Your heart's longing", accent: "#D876A0" },
  { key: "personality", label: "Personality", sub: "How others see you", accent: "#5FA9C7" },
  { key: "birthday", label: "Birthday", sub: "Your special talent", accent: "#F09A3D" },
  { key: "maturity", label: "Maturity", sub: "Who you become", accent: "#7A8B6F" },
  { key: "personalYear", label: "Personal Year", sub: "This year's theme", accent: "#B5CD7E" },
  { key: "personalMonth", label: "Personal Month", sub: "This month's energy", accent: "#C5A87C" },
];

const ELEMENT_ICON: Record<string, any> = {
  Fire: BaydinFlame, Earth: Gem, Air: Wind, Water: Droplet, Spirit: BaydinStar,
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
        toast.error(`Not enough Luck — you need ${NUMEROLOGY_COST} Luck for a full numerology report.`);
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
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.18} className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#9E8AC9]/15 border border-[#9E8AC9]/30 flex items-center justify-center">
              <BaydinNumerology className="w-6 h-6 text-[#9E8AC9]" />
            </div>
            <LiquidMetalText as="h1" className="text-[20px] mb-1">Sign in to begin</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] mb-4 max-w-sm mx-auto">
              Decode the geometry of your name and birth date.
            </p>
            <ShimmerButton onClick={onAuth}>Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // ---- Showing full report ----
  if (report) {
    const numberCards = NUMBER_LABELS.map(({ key, label, sub, accent }) => {
      const num = report.numbers[key];
      const meaning = report.meanings[key];
      return { key, label, sub, num, meaning, accent };
    });
    const active = activeNumber
      ? numberCards.find((c) => c.key === activeNumber)
      : numberCards[0];

    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          {/* Header */}
          <button onClick={reset} className="flex items-center gap-1.5 text-[12px] text-[#9C9489] hover:text-[#C5A572] transition mb-4">
            <BaydinRefresh className="w-3.5 h-3.5" /> New reading
          </button>
          <div className="mb-8">
            <GlowPill color="#9E8AC9" className="text-[10px] mb-3">
              <BaydinNumerology className="w-2.5 h-2.5" /> Numerology report
            </GlowPill>
            <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] mb-1">
              {report.name}
            </LiquidMetalText>
            <div className="text-[12px] text-[#9C9489]">
              Born {new Date(report.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })} · {report.system === "chaldean" ? "Chaldean" : "Pythagorean"} system
            </div>
          </div>

          {/* 8 Number Cards — premium AuroraGlowCard grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-8">
            {numberCards.map(({ key, label, num, meaning, accent }) => {
              const isActive = active?.key === key;
              return (
                <AuroraGlowCard
                  key={key}
                  glowColor={isActive ? accent : "#2A2722"}
                  glowIntensity={isActive ? 0.22 : 0.06}
                  className="p-0"
                >
                  <button
                    onClick={() => setActiveNumber(key)}
                    className="w-full text-left p-5 transition-colors rounded-sm"
                  >
                    <div className="text-[11px] text-[#9C9489] mb-2 font-medium">{label}</div>
                    <div className="flex items-baseline gap-2">
                      <NumberTicker
                        value={num}
                        className="text-[2.5rem] leading-none tabular-nums font-light"
                      />
                      {num > 9 && (
                        <GlowPill color="#C5A572" className="text-[8px]">master</GlowPill>
                      )}
                    </div>
                    <div className="text-[11px] text-[#9C9489] mt-2 truncate">{meaning?.title}</div>
                  </button>
                </AuroraGlowCard>
              );
            })}
          </div>

          {/* Active Number Detail */}
          {active && active.meaning && (
            <NumberDetail num={active.num} meaning={active.meaning} label={active.label} sub={active.sub} accent={active.accent} />
          )}

          {/* Synthesis */}
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.14} className="p-6 lg:p-8 mt-8 mb-8">
            <GlowPill color="#C5A572" className="text-[10px] mb-4">Synthesis</GlowPill>
            <div className="serif text-[15px] leading-[1.8] text-[#E8E2D5] whitespace-pre-line max-w-[65ch] prose-editorial">{report.synthesis}</div>
          </AuroraGlowCard>

          {/* Lucky Elements — premium cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-8">
            <LuckyCard icon={BaydinClock} title="Lucky days" items={report.lucky.days} accent="#C5A87C" />
            <LuckyCard icon={Palette} title="Lucky colors" items={report.lucky.colors} accent="#D4A0B8" />
            <LuckyCard icon={Gem} title="Lucky gems" items={report.lucky.gems} accent="#7A8B6F" />
          </div>

          {/* Lucky numbers */}
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-6 mb-8">
            <div className="flex items-center justify-center gap-4 flex-wrap">
              <span className="text-[12px] text-[#9C9489] flex items-center gap-1.5">
                <CloverIcon className="w-3.5 h-3.5" /> Lucky numbers:
              </span>
              <div className="flex items-center gap-3">
                {report.lucky.numbers.map((n) => (
                  <NumberTicker
                    key={n}
                    value={n}
                    className="text-[1.5rem] text-[#C5A572] tabular-nums font-light"
                  />
                ))}
              </div>
            </div>
          </AuroraGlowCard>

          <div className="flex justify-center pb-6">
            <ShimmerButton tone="parchment" onClick={reset} className="px-6 py-2.5 text-[13px]">
              <BaydinRefresh className="w-3.5 h-3.5" /> New reading
            </ShimmerButton>
          </div>
        </div>
      </div>
    );
  }

  // ---- Form / Preview ----
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        {/* Hero */}
        <div className="mb-8">
          <GlowPill color="#9E8AC9" className="text-[10px] mb-3">
            <BaydinNumerology className="w-2.5 h-2.5" /> Numbers in your name and date
          </GlowPill>
          <LiquidMetalText as="h1" className="text-[32px] lg:text-[40px] mb-3 leading-[1.05]">
            Numerology
          </LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Decode the geometry of your name and birth date. Life Path, Destiny, Soul Urge, Personality — eight numbers, each a facet of the same life.
          </p>
        </div>

        {/* Form — AuroraGlowCard wrapper */}
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} className="p-6 mb-6">
          <div className="space-y-6">
            {/* Name */}
            <div>
              <label className="block text-[12px] text-[#9C9489] font-medium mb-2">
                Full birth name
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Aung San"
                className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus:outline-none focus:border-[#C5A572] transition"
              />
              <div className="text-[11px] text-[#9C9489] mt-1.5">First, middle, and last — for the most accurate reading.</div>
            </div>

            {/* Birth date */}
            <div>
              <label className="block text-[12px] text-[#9C9489] font-medium mb-2">
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
              <label className="block text-[12px] text-[#9C9489] font-medium mb-2.5">
                Calculation system
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setSystem("pythagorean")}
                  className={cn(
                    "p-3 border text-left transition rounded-sm",
                    system === "pythagorean"
                      ? "border-[#C5A572] bg-[#1A1714]"
                      : "border-[#2A2722] bg-transparent hover:border-[#4A4540]"
                  )}
                >
                  <div className="text-[13px] text-[#E8E2D5] font-medium">Pythagorean</div>
                  <div className="text-[11px] text-[#9C9489] mt-0.5">Western · A=1, B=2…</div>
                </button>
                <button
                  onClick={() => setSystem("chaldean")}
                  className={cn(
                    "p-3 border text-left transition rounded-sm",
                    system === "chaldean"
                      ? "border-[#C5A572] bg-[#1A1714]"
                      : "border-[#2A2722] bg-transparent hover:border-[#4A4540]"
                  )}
                >
                  <div className="text-[13px] text-[#E8E2D5] font-medium">Chaldean</div>
                  <div className="text-[11px] text-[#9C9489] mt-0.5">Vedic · values 1–8</div>
                </button>
              </div>
            </div>
          </div>
        </AuroraGlowCard>

        {/* CTAs — premium */}
        <div className="flex flex-col sm:flex-row gap-3 mb-6">
          <ShimmerButton tone="parchment" onClick={doPreview} disabled={loading} className="flex-1">
            {loading ? <BaydinLoader className="w-4 h-4" /> : <BaydinStar className="w-3.5 h-3.5" />}
            {loading ? "Calculating…" : "Reveal Life Path"}
          </ShimmerButton>
          <ShimmerButton onClick={doFullReport} disabled={purchasing} className="flex-1">
            {purchasing ? <BaydinLoader className="w-4 h-4" /> : <CloverIcon className="w-3.5 h-3.5" />}
            {purchasing ? "Generating…" : "Generate report"}
            <span className="inline-flex items-center gap-1 opacity-80">
              <CloverIcon className="w-3 h-3" /> <NumberTicker value={NUMEROLOGY_COST} />
            </span>
          </ShimmerButton>
        </div>

        {/* Free Preview Result */}
        {preview && (
          <AuroraGlowCard glowColor={preview.meaning.color} glowIntensity={0.18} className="p-5 lg:p-6 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <GlowPill color={preview.meaning.color} className="text-[10px] mb-2">
                  <BaydinStar className="w-2.5 h-2.5" /> Life Path Preview
                </GlowPill>
                <div className="text-[14px] text-[#9C9489]">Your most important number</div>
              </div>
              <GlowPill color="#7A8B6F" className="text-[9px]">Free</GlowPill>
            </div>
            <div className="flex items-center gap-5 mb-4">
              <div
                className="w-24 h-24 rounded-sm flex items-center justify-center shrink-0"
                style={{ background: `${preview.meaning.color}18`, border: `1px solid ${preview.meaning.color}40` }}
              >
                <NumberTicker
                  value={preview.lifePath}
                  className="text-[52px] font-light leading-none tabular-nums"
                />
              </div>
              <div className="min-w-0">
                <div className="text-[18px] text-[#E8E2D5] font-light">{preview.meaning.title}</div>
                <div className="flex items-center gap-1.5 mt-1 flex-wrap">
                  {preview.meaning.keywords.slice(0, 3).map((k) => (
                    <GlowPill key={k} color={preview.meaning.color} className="text-[10px]">{k}</GlowPill>
                  ))}
                </div>
                <div className="text-[11px] text-[#9C9489] mt-1.5">{preview.meaning.element} · {preview.meaning.rulingPlanet}</div>
              </div>
            </div>
            <p className="text-[13px] leading-relaxed text-[#E8E2D5]/85">{preview.meaning.summary}</p>

            <div className="mt-4 p-4 rounded-sm border border-[#C5A572]/15 bg-[#C5A572]/[0.04]">
              <div className="text-[12px] text-[#C5A572] font-medium mb-1">Unlock the full picture</div>
              <div className="text-[11px] text-[#9C9489] leading-relaxed mb-3">
                Your Life Path is just the beginning. The full report reveals your Destiny, Soul Urge, Personality, Maturity, Birthday and Personal Year numbers — plus a synthesis of how they interact, and your lucky days, colors and gems.
              </div>
              <ShimmerButton onClick={doFullReport} disabled={purchasing} className="w-full">
                {purchasing ? <BaydinLoader className="w-4 h-4" /> : <CloverIcon className="w-3.5 h-3.5" />}
                {purchasing ? "Generating…" : "Reveal full report"}
                <span className="inline-flex items-center gap-1 opacity-80">
                  <CloverIcon className="w-3 h-3" /> <NumberTicker value={NUMEROLOGY_COST} />
                </span>
              </ShimmerButton>
            </div>
          </AuroraGlowCard>
        )}

        {/* History */}
        {history.length > 0 && (
          <div>
            <GlowPill color="#9E8AC9" className="text-[10px] mb-3">Past Readings</GlowPill>
            <div className="space-y-2">
              {history.map((h) => (
                <AuroraGlowCard key={h.id} glowColor="#9E8AC9" glowIntensity={0.08} className="p-0">
                  <div
                    role="button"
                    tabIndex={0}
                    onClick={() => loadHistory(h.id)}
                    onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); loadHistory(h.id); } }}
                    className="w-full flex items-center gap-3 p-3 rounded-sm transition group cursor-pointer hover:bg-[#0F0D0B]/50"
                  >
                    <div className="w-9 h-9 rounded-lg bg-[#9E8AC9]/15 border border-[#9E8AC9]/30 flex items-center justify-center shrink-0">
                      <BaydinNumerology className="w-4 h-4 text-[#9E8AC9]" />
                    </div>
                    <div className="flex-1 min-w-0 text-left">
                      <div className="text-[13px] text-[#E8E2D5] truncate">{h.input.name}</div>
                      <div className="text-[10px] text-[#9C9489]">
                        {new Date(h.input.birthDate).toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })} · {h.system === "chaldean" ? "Chaldean" : "Pythagorean"} · {new Date(h.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={(e) => deleteHistory(h.id, e)}
                      className="p-2 text-[#9C9489] hover:text-red-400 transition opacity-0 group-hover:opacity-100"
                      aria-label="Delete reading"
                    >
                      <BaydinTrash className="w-3.5 h-3.5" />
                    </button>
                    <BaydinChevronRight className="w-4 h-4 text-[#9C9489]" />
                  </div>
                </AuroraGlowCard>
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
  num, meaning, label, sub, accent,
}: { num: number; meaning: NumberMeaning; label: string; sub: string; accent: string }) {
  const ElIcon = ELEMENT_ICON[meaning.element] || BaydinStar;
  return (
    <AuroraGlowCard glowColor={accent} glowIntensity={0.2} className="p-5 lg:p-6 mb-6">
      <div className="flex items-start gap-5 flex-col sm:flex-row">
        {/* Big Number */}
        <div
          className="w-28 h-28 rounded-sm flex flex-col items-center justify-center shrink-0"
          style={{ background: `${meaning.color}15`, border: `1px solid ${meaning.color}40` }}
        >
          <NumberTicker
            value={num}
            className="text-[56px] font-light leading-none tabular-nums"
          />
          {num > 9 && (
            <span className="text-[8px] uppercase tracking-[0.2em] text-[#C5A572] mt-1">Master</span>
          )}
        </div>

        {/* Title + meta */}
        <div className="flex-1 min-w-0">
          <GlowPill color={accent} className="text-[10px] mb-2">{label} · {sub}</GlowPill>
          <h2 className="text-[22px] lg:text-[26px] font-light text-[#E8E2D5] mt-1">{meaning.title}</h2>
          <div className="flex items-center gap-2 mt-2 flex-wrap">
            <GlowPill color={meaning.color} className="text-[10px]">
              <ElIcon className="w-2.5 h-2.5" /> {meaning.element}
            </GlowPill>
            <GlowPill color="#9E8AC9" className="text-[10px]">{meaning.rulingPlanet}</GlowPill>
            {meaning.keywords.map((k) => (
              <GlowPill key={k} color="#C5A572" className="text-[10px]">{k}</GlowPill>
            ))}
          </div>
          <p className="text-[13px] leading-relaxed text-[#E8E2D5]/85 mt-3">{meaning.summary}</p>
        </div>
      </div>

      {/* Traits + Challenges */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
        <div>
          <GlowPill color="#7A8B6F" className="text-[10px] mb-2">Gifts</GlowPill>
          <ul className="space-y-1.5 mt-2">
            {meaning.traits.map((t) => (
              <li key={t} className="text-[12px] text-[#E8E2D5]/80 flex items-start gap-2">
                <span className="text-[#7A8B6F] mt-0.5">·</span>
                <span>{t}</span>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <GlowPill color="#D4A0B8" className="text-[10px] mb-2">Challenges</GlowPill>
          <ul className="space-y-1.5 mt-2">
            {meaning.challenges.map((c) => (
              <li key={c} className="text-[12px] text-[#E8E2D5]/80 flex items-start gap-2">
                <span className="text-[#D4A0B8]/80 mt-0.5">·</span>
                <span>{c}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </AuroraGlowCard>
  );
}

function LuckyCard({
  icon: Icon, title, items, accent,
}: { icon: any; title: string; items: string[]; accent: string }) {
  return (
    <AuroraGlowCard glowColor={accent} glowIntensity={0.1} className="p-5">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <GlowPill color={accent} className="text-[10px]">{title}</GlowPill>
      </div>
      <div className="flex flex-wrap gap-x-3 gap-y-1.5">
        {items.map((it) => (
          <span key={it} className="text-[13px] text-[#E8E2D5]">
            {it}
          </span>
        ))}
      </div>
    </AuroraGlowCard>
  );
}
