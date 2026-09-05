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
import { BookOpen, Loader2, Star, ChevronRight, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";

const SECTIONS = [
  { id: "core_identity", name: "Core Identity", desc: "Your ascendant, its lord, and the soul's nature", accent: "#C5A572" },
  { id: "chart_blueprint", name: "Chart Blueprint", desc: "The overall pattern and structure of your chart", accent: "#9E8AC9" },
  { id: "strengths", name: "Strengths & Gifts", desc: "Natural talents and supportive combinations", accent: "#B5CD7E" },
  { id: "timeline", name: "Timeline & Dasha", desc: "Current period and key life windows", accent: "#5FA9C7" },
  { id: "yogas", name: "Yogas", desc: "Classical yoga combinations present in your chart", accent: "#D876A0" },
  { id: "life_areas", name: "Life Areas", desc: "Career, love, wealth, health, and spiritual path", accent: "#F09A3D" },
  { id: "remedies", name: "Remedies", desc: "Practical remedial measures for alignment", accent: "#7A8B6F" },
];

const LIFE_REPORT_COST = 15;

export function LifeReportView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [loading, setLoading] = React.useState(false);
  const [progressStep, setProgressStep] = React.useState(0);
  const [report, setReport] = React.useState<any>(null);
  const [activeSection, setActiveSection] = React.useState(0);
  const [pastReports, setPastReports] = React.useState<any[]>([]);
  const intervalRef = React.useRef<any>(null);

  // Fetch past reports on mount
  React.useEffect(() => {
    if (!user) return;
    api<{ reports: any[] }>("/api/life-report").then((d) => {
      setPastReports(d.reports || []);
    }).catch(() => {});
  }, [user]);

  // Cleanup interval on unmount
  React.useEffect(() => () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  async function generate() {
    if (!user) { onAuth(); return; }
    setLoading(true);
    setProgressStep(0);
    setReport(null);

    // Show which section is being generated (cycling through names)
    let step = 0;
    intervalRef.current = setInterval(() => {
      step = (step + 1) % SECTIONS.length;
      setProgressStep(step);
    }, 2000);

    try {
      const res = await api<{ lifeReport: any; error?: string }>("/api/life-report", { method: "POST" });
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (res.error) { toast.error(res.error); return; }
      setReport(res.lifeReport);
      toast.success("Your Life Report is ready");
      // Refresh past reports
      const past = await api<{ reports: any[] }>("/api/life-report");
      setPastReports(past.reports || []);
    } catch (e: any) {
      toast.error(e.message);
      if (intervalRef.current) clearInterval(intervalRef.current);
    } finally {
      setLoading(false);
    }
  }

  if (!user) {
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/30 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-[#C5A572]" />
            </div>
            <LiquidMetalText as="h1" className="text-[20px] mb-1">Sign in for your Life Report</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] mb-4 max-w-sm mx-auto">
              Seven sections drawn from your natal chart, woven into a single portrait.
            </p>
            <ShimmerButton onClick={onAuth}>Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  if (!user.birthData) {
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden flex items-center justify-center">
          <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.15} className="p-8 max-w-md w-full text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/30 flex items-center justify-center">
              <Star className="w-6 h-6 text-[#C5A572]" />
            </div>
            <LiquidMetalText as="h1" className="text-[20px] mb-2">Birth details needed</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] leading-relaxed">
              The Life Report reads your full natal chart. Open your profile settings and add your birth date, time, and place first.
            </p>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Generating state — show which section is being written
  if (loading) {
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.2} className="p-8">
            <div className="mb-8 text-center">
              <Loader2 className="w-6 h-6 text-[#C5A572] animate-spin mx-auto mb-4" />
              <GlowPill color="#9E8AC9" className="text-[10px] mb-3">Generating</GlowPill>
              <AnimatePresence mode="wait">
                <motion.div
                  key={progressStep}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.3 }}
                >
                  <LiquidMetalText as="div" className="text-[24px]">
                    {SECTIONS[progressStep].name}
                  </LiquidMetalText>
                </motion.div>
              </AnimatePresence>
            </div>

            <div className="space-y-1 text-left max-w-xs mx-auto">
              {SECTIONS.map((s, i) => (
                <div
                  key={s.id}
                  className={cn(
                    "flex items-center gap-2 py-1.5 text-[12px] transition-colors",
                    i < progressStep ? "text-[#6B6358]" : i === progressStep ? "text-[#C5A572]" : "text-[#4A4540]"
                  )}
                >
                  <span className="w-4 text-center">
                    {i < progressStep ? "✓" : i === progressStep ? "•" : "○"}
                  </span>
                  <span className={i === progressStep ? "font-medium" : ""}>{s.name}</span>
                </div>
              ))}
            </div>

            <div className="mt-8 text-[12px] text-[#9C9489] leading-relaxed max-w-xs mx-auto text-center">
              <NumberTicker value={SECTIONS.length} /> sections are being written from your natal chart. This takes about a minute.
            </div>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Result state
  if (report) {
    const section = report.sections[activeSection];
    const accent = SECTIONS[activeSection]?.accent || "#C5A572";
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          {/* Section navigation */}
          <button
            onClick={() => setReport(null)}
            className="flex items-center gap-1.5 text-[12px] text-[#9C9489] hover:text-[#C5A572] transition mb-4 focus-ring rounded-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All sections
          </button>

          <AuroraGlowCard glowColor={accent} glowIntensity={0.18} className="p-6 lg:p-8">
            <div className="mb-8 lum-reveal">
              <GlowPill color={accent} className="text-[10px] mb-3">
                Section <NumberTicker value={activeSection + 1} /> of <NumberTicker value={report.sections.length} />
              </GlowPill>
              <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] leading-[1.1]">
                {section.name}
              </LiquidMetalText>
            </div>

            <div className="serif text-[15px] leading-[1.8] text-[#E8E2D5] prose-editorial">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>

            {section.highlights?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#2A2722]">
                <div className="text-[12px] text-[#9C9489] font-medium mb-3">Key points</div>
                <div className="flex flex-wrap gap-2">
                  {section.highlights.map((h: string, i: number) => (
                    <GlowPill key={i} color={accent} className="text-[11px] serif-italic">{h}</GlowPill>
                  ))}
                </div>
              </div>
            )}

            {/* Next section */}
            {activeSection < report.sections.length - 1 && (
              <button
                onClick={() => setActiveSection(activeSection + 1)}
                className="mt-10 w-full p-4 border border-[#2A2722] hover:border-[#4A4540] transition flex items-center justify-between text-left focus-ring rounded-sm"
              >
                <div>
                  <div className="text-[12px] text-[#9C9489]">Next</div>
                  <div className="serif text-[15px] text-[#E8E2D5] mt-0.5">{report.sections[activeSection + 1].name}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#9C9489]" />
              </button>
            )}
          </AuroraGlowCard>

          {/* Section navigation pills */}
          <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.08} className="p-3 mt-4">
            <div className="flex gap-1 overflow-x-auto lum-no-scrollbar">
              {report.sections.map((s: any, i: number) => (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(i)}
                  className={cn(
                    "shrink-0 px-3 py-1.5 text-[12px] border-b-2 transition focus-ring rounded-sm",
                    i === activeSection
                      ? "border-[#C5A572] text-[#E8E2D5] font-medium"
                      : "border-transparent text-[#9C9489] hover:text-[#E8E2D5]"
                  )}
                >
                  <NumberTicker value={i + 1} />. {s.name}
                </button>
              ))}
            </div>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Initial state
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        {/* Hero */}
        <div className="mb-8">
          <GlowPill color="#9E8AC9" className="text-[10px] mb-3">
            <BookOpen className="w-2.5 h-2.5" /> Comprehensive reading · {LIFE_REPORT_COST} Luck
          </GlowPill>
          <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] mb-3 leading-[1.1]">
            Life Report
          </LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Seven sections drawn from your natal chart — each a different dimension of your life, read independently and woven into a single portrait.
          </p>
        </div>

        {/* Generate CTA */}
        <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.18} className="p-6 mb-8">
          <ShimmerButton onClick={generate} disabled={user.luckBalance < LIFE_REPORT_COST} className="w-full sm:w-auto">
            <BookOpen className="w-4 h-4" /> Generate full report
            <span className="inline-flex items-center gap-1 opacity-80">
              <CloverIcon className="w-3 h-3" /> <NumberTicker value={LIFE_REPORT_COST} />
            </span>
          </ShimmerButton>
          <div className="mt-3 text-[12px] text-[#9C9489] flex items-center gap-2 flex-wrap">
            <CloverIcon className="w-3 h-3" />
            <span className="tabular-nums">
              <NumberTicker value={user.luckBalance} /> Luck available
            </span>
            {user.luckBalance < LIFE_REPORT_COST && (
              <span className="text-[#C26B5C]">You need <NumberTicker value={LIFE_REPORT_COST - user.luckBalance} /> more</span>
            )}
          </div>
        </AuroraGlowCard>

        {/* What's inside — 7-section preview as AuroraGlowCards */}
        <div className="mb-10">
          <GlowPill color="#C5A572" className="text-[10px] mb-5">What's inside</GlowPill>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {SECTIONS.map((s, i) => (
              <AuroraGlowCard key={s.id} glowColor={s.accent} glowIntensity={0.1} className="p-4">
                <div className="flex items-start gap-3">
                  <div
                    className="serif-italic text-[1.25rem] leading-none mt-0.5 select-none tabular-nums"
                    style={{ color: s.accent }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[14px] text-[#E8E2D5] font-medium mb-0.5">{s.name}</div>
                    <div className="text-[11px] text-[#9C9489] leading-relaxed">{s.desc}</div>
                  </div>
                </div>
              </AuroraGlowCard>
            ))}
          </div>
        </div>

        {/* Past reports */}
        {pastReports.length > 0 && (
          <div>
            <GlowPill color="#9E8AC9" className="text-[10px] mb-4">Past reports</GlowPill>
            <div className="space-y-2">
              {pastReports.map((r) => (
                <AuroraGlowCard key={r.id} glowColor="#C5A572" glowIntensity={0.08} className="p-0">
                  <button
                    onClick={() => {
                      api<{ conversation: any; messages: any[] }>(`/api/conversations/${r.id}/messages`).then((d) => {
                        try {
                          const sections = JSON.parse(d.messages[0]?.content || "[]");
                          if (sections.length > 0) {
                            setReport({ id: r.id, sections });
                            setActiveSection(0);
                          }
                        } catch {}
                      }).catch(() => {});
                    }}
                    className="w-full flex items-center justify-between py-3 px-4 hover:bg-[#0F0D0B]/50 transition rounded-sm text-left"
                  >
                    <div>
                      <div className="text-[13px] text-[#E8E2D5]">{r.title}</div>
                      <div className="text-[11px] text-[#9C9489]">
                        {new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                      </div>
                    </div>
                    <ChevronRight className="w-4 h-4 text-[#9C9489]" />
                  </button>
                </AuroraGlowCard>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
