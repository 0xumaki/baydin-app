"use client";

import * as React from "react";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { BookOpen, Loader2, Star, Wallet, Check, ArrowLeft, Sparkles, ChevronRight } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "core_identity", name: "Core Identity", desc: "Your ascendant, its lord & soul's nature" },
  { id: "chart_blueprint", name: "Chart Blueprint", desc: "The overall pattern of your chart" },
  { id: "strengths", name: "Strengths & Gifts", desc: "Natural talents & supportive combinations" },
  { id: "timeline", name: "Timeline & Dasha", desc: "Current period & key life windows" },
  { id: "yogas", name: "Yogas", desc: "Classical yoga combinations present" },
  { id: "life_areas", name: "Life Areas", desc: "Career, love, wealth, health, spirit" },
  { id: "remedies", name: "Remedies", desc: "Practical remedial measures" },
];

export function LifeReportView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [report, setReport] = React.useState<any>(null);
  const [activeSection, setActiveSection] = React.useState(0);

  async function generate() {
    if (!user) { onAuth(); return; }
    setLoading(true);
    setProgress(0);
    setReport(null);
    // Simulate progress while sections generate
    const interval = setInterval(() => {
      setProgress((p) => Math.min(p + Math.random() * 12, 92));
    }, 1500);
    try {
      const res = await api<{ lifeReport: any; error?: string; balance?: number }>("/api/life-report", { method: "POST" });
      clearInterval(interval);
      setProgress(100);
      if (res.error) { toast.error(res.error); return; }
      setReport(res.lifeReport);
      toast.success("Your Life Report is ready ✦");
    } catch (e: any) { toast.error(e.message); clearInterval(interval); }
    finally { setLoading(false); }
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BookOpen className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in for your Life Report</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  if (!user.birthData) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <ShellCard className="max-w-md w-full p-8">
          <Star className="w-8 h-8 text-gold mx-auto mb-3" />
          <div className="text-[15px] text-ink mb-1">Birth details needed</div>
          <div className="text-[12px] text-ink-muted mb-4">The Life Report reads your full natal chart. Open your profile (top-right settings icon) and add your birth date, time, and place.</div>
        </ShellCard>
      </div>
    );
  }

  // Generating state
  if (loading) {
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="relative w-24 h-24 mx-auto mb-6">
            <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="44" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
              <circle
                cx="50" cy="50" r="44" fill="none" stroke="url(#goldgrad)" strokeWidth="4" strokeLinecap="round"
                strokeDasharray={`${(progress / 100) * 276} 276`}
                style={{ transition: "stroke-dasharray 0.5s ease" }}
              />
              <defs>
                <linearGradient id="goldgrad" x1="0%" y1="0%" x2="100%" y2="100%">
                  <stop offset="0%" stopColor="#E7D2A8" />
                  <stop offset="100%" stopColor="#8A6A2F" />
                </linearGradient>
              </defs>
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <Loader2 className="w-5 h-5 text-gold animate-spin mb-1" />
              <div className="text-[20px] font-light text-gold">{Math.round(progress)}%</div>
            </div>
          </div>
          <div className="text-[15px] text-ink mb-1">Reading your stars…</div>
          <div className="text-[12px] text-ink-muted leading-relaxed max-w-xs mx-auto">
            Generating 7 sections of your personalized Life Report. This takes about a minute — Gemini is writing each section just for you.
          </div>
        </div>
      </div>
    );
  }

  // Result state
  if (report) {
    const section = report.sections[activeSection];
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] flex flex-col">
        {/* Section tabs */}
        <div className="flex items-center gap-2 px-4 lg:px-6 py-2.5 border-b border-white/5 lum-glass overflow-x-auto lum-no-scrollbar">
          <button onClick={() => setReport(null)} className="flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-gold transition shrink-0">
            <ArrowLeft className="w-3.5 h-3.5" /> All sections
          </button>
          <div className="h-5 w-px bg-white/10 shrink-0" />
          <div className="flex gap-1">
            {report.sections.map((s: any, i: number) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "shrink-0 px-2.5 py-1 rounded-full text-[11px] border transition",
                  i === activeSection ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-ink-muted hover:text-ink"
                )}
              >
                {i + 1}. {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto lumina-scroll">
          <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-gold text-[14px] font-medium">
                {activeSection + 1}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Section {activeSection + 1} of {report.sections.length}</div>
                <div className="text-[20px] font-light text-ink">{section.name}</div>
              </div>
            </div>
            <GlassCard className="p-6">
              <div className="lum-prose text-[14px] text-ink/90 leading-relaxed">
                <ReactMarkdown>{section.content}</ReactMarkdown>
              </div>
              {section.highlights?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-2">Key points</div>
                  <div className="flex flex-wrap gap-1.5">
                    {section.highlights.map((h: string, i: number) => <Pill key={i} variant="gold" className="text-[10px]">{h}</Pill>)}
                  </div>
                </div>
              )}
            </GlassCard>

            {/* Next section */}
            {activeSection < report.sections.length - 1 && (
              <button
                onClick={() => setActiveSection(activeSection + 1)}
                className="mt-4 w-full p-3 rounded-xl border border-gold/20 bg-gold/[0.04] hover:bg-gold/[0.08] transition flex items-center justify-between text-left group"
              >
                <div>
                  <div className="text-[11px] text-gold uppercase tracking-wide">Next</div>
                  <div className="text-[13px] text-ink">{report.sections[activeSection + 1].name}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-gold group-hover:translate-x-1 transition" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Initial state
  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Comprehensive · 15 Luck" title="Life Report" subtitle="A 7-section deep reading of your entire natal chart." className="mb-6" />

        <ShellCard className="p-6 mb-5 relative overflow-hidden">
          <div className="lum-glow-gold absolute inset-0 opacity-40 pointer-events-none" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-2">
              <BookOpen className="w-5 h-5 text-gold" />
              <span className="text-[13px] text-gold font-medium">Your full astrological portrait</span>
            </div>
            <div className="text-[26px] font-light text-ink leading-tight mb-2">
              Discover your soul's blueprint.
            </div>
            <div className="text-[12px] text-ink-muted leading-relaxed mb-4 max-w-md">
              Gemini reads your chart 7 times — once for each life dimension — to weave a comprehensive portrait of who you are, what you're here for, and how to live it.
            </div>
            <div className="flex items-center gap-3">
              <GradientButton onClick={generate} className="px-6">
                <Sparkles className="w-4 h-4" /> Generate Life Report
              </GradientButton>
              <Pill variant="gold" className="text-[11px]"><Wallet className="w-3 h-3" /> 15 Luck</Pill>
            </div>
            <div className="text-[11px] text-ink-muted mt-2">Generates a seven-section report drawn from your natal chart.</div>
          </div>
        </ShellCard>

        <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">What's inside</div>
        <div className="space-y-2 mb-6">
          {SECTIONS.map((s, i) => (
            <div key={s.id} className="flex items-center gap-3 p-3 rounded-xl border border-white/5 bg-white/[0.02]">
              <div className="w-7 h-7 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center text-[11px] text-gold font-medium shrink-0">{i + 1}</div>
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-ink">{s.name}</div>
                <div className="text-[11px] text-ink-muted">{s.desc}</div>
              </div>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-2 text-[11px] text-ink-muted">
          <Pill variant="gold" className="text-[10px]"><Wallet className="w-3 h-3" /> {user.luckBalance} Luck available</Pill>
          {user.luckBalance < 15 && (
            <span className="text-amber-400/80">You need {15 - user.luckBalance} more Luck</span>
          )}
        </div>
      </div>
    </div>
  );
}
