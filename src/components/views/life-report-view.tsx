"use client";

import * as React from "react";
import { useMe, api } from "@/lib/api-client";
import { BookOpen, Loader2, Star, ChevronRight, ChevronLeft } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

const SECTIONS = [
  { id: "core_identity", name: "Core Identity", desc: "Your ascendant, its lord, and the soul's nature" },
  { id: "chart_blueprint", name: "Chart Blueprint", desc: "The overall pattern and structure of your chart" },
  { id: "strengths", name: "Strengths & Gifts", desc: "Natural talents and supportive combinations" },
  { id: "timeline", name: "Timeline & Dasha", desc: "Current period and key life windows" },
  { id: "yogas", name: "Yogas", desc: "Classical yoga combinations present in your chart" },
  { id: "life_areas", name: "Life Areas", desc: "Career, love, wealth, health, and spiritual path" },
  { id: "remedies", name: "Remedies", desc: "Practical remedial measures for alignment" },
];

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
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BookOpen className="w-10 h-10 text-[#6B6358] mx-auto mb-3" />
          <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in for your Life Report</div>
          <button onClick={onAuth} className="mt-3 py-2.5 px-5 bg-[#E8E2D5] text-[#0A0908] text-[13px] font-medium hover:bg-white transition rounded-sm focus-ring">Sign in</button>
        </div>
      </div>
    );
  }

  if (!user.birthData) {
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] flex items-center justify-center px-6">
        <div className="max-w-md text-center">
          <Star className="w-8 h-8 text-[#C5A572] mx-auto mb-4" />
          <h1 className="serif-display text-[1.5rem] text-[#E8E2D5] mb-3">Birth details needed</h1>
          <p className="t-body text-[#9C9489] leading-[1.7] mb-6">
            The Life Report reads your full natal chart. Open your profile settings and add your birth date, time, and place first.
          </p>
        </div>
      </div>
    );
  }

  // Generating state — show which section is being written
  if (loading) {
    return (
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] flex items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          {/* Progress indicator — section names cycling */}
          <div className="mb-8">
            <Loader2 className="w-6 h-6 text-[#C5A572] animate-spin mx-auto mb-4" />
            <div className="text-[13px] text-[#6B6358] mb-2">Generating</div>
            <AnimatePresence mode="wait">
              <motion.div
                key={progressStep}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.3 }}
                className="serif-display text-[1.5rem] text-[#E8E2D5]"
              >
                {SECTIONS[progressStep].name}
              </motion.div>
            </AnimatePresence>
          </div>

          {/* Section list with completed indicator */}
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

          <div className="mt-8 text-[12px] text-[#6B6358] leading-relaxed max-w-xs mx-auto">
            Seven sections are being written from your natal chart. This takes about a minute.
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
        {/* Section navigation */}
        <div className="flex items-center gap-2 px-6 py-3 border-b border-[#2A2722] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
          <button
            onClick={() => setReport(null)}
            className="flex items-center gap-1.5 text-[12px] text-[#6B6358] hover:text-[#C5A572] transition shrink-0 focus-ring rounded-sm"
          >
            <ChevronLeft className="w-3.5 h-3.5" /> All sections
          </button>
          <div className="w-px h-4 bg-[#2A2722] shrink-0" />
          <div className="flex gap-1">
            {report.sections.map((s: any, i: number) => (
              <button
                key={s.id}
                onClick={() => setActiveSection(i)}
                className={cn(
                  "shrink-0 px-3 py-1.5 text-[12px] border-b-2 transition focus-ring rounded-sm",
                  i === activeSection
                    ? "border-[#C5A572] text-[#E8E2D5] font-medium"
                    : "border-transparent text-[#6B6358] hover:text-[#9C9489]"
                )}
              >
                {i + 1}. {s.name}
              </button>
            ))}
          </div>
        </div>

        {/* Section content */}
        <div className="flex-1 overflow-y-auto lumina-scroll">
          <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
            <div className="mb-8 lum-reveal">
              <div className="text-[13px] text-[#6B6358] mb-2">
                Section {activeSection + 1} of {report.sections.length}
              </div>
              <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight">
                {section.name}
              </h1>
            </div>

            <div className="serif text-[15px] leading-[1.8] text-[#E8E2D5] prose-editorial">
              <ReactMarkdown>{section.content}</ReactMarkdown>
            </div>

            {section.highlights?.length > 0 && (
              <div className="mt-8 pt-6 border-t border-[#2A2722]">
                <div className="text-[12px] text-[#6B6358] font-medium mb-3">Key points</div>
                <div className="flex flex-wrap gap-2">
                  {section.highlights.map((h: string, i: number) => (
                    <span
                      key={i}
                      className="text-[12px] px-3 py-1 border border-[#C5A572]/20 text-[#C5A572] serif-italic"
                    >
                      {h}
                    </span>
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
                  <div className="text-[12px] text-[#6B6358]">Next</div>
                  <div className="serif text-[15px] text-[#E8E2D5] mt-0.5">{report.sections[activeSection + 1].name}</div>
                </div>
                <ChevronRight className="w-4 h-4 text-[#6B6358]" />
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
      <div className="max-w-3xl mx-auto px-6 py-10 lg:py-14">
        {/* Hero */}
        <div className="mb-10 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">Comprehensive reading · 15 Luck</div>
          <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight mb-3">
            Life Report
          </h1>
          <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Seven sections drawn from your natal chart — each a different dimension of your life, read independently and woven into a single portrait.
          </p>
        </div>

        {/* Generate CTA */}
        <div className="pb-8 border-b border-[#2A2722] mb-8">
          <button
            onClick={generate}
            disabled={user.luckBalance < 15}
            className="inline-flex items-center gap-2 py-3 px-6 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring"
          >
            Generate Life Report · 15 Luck
          </button>
          <div className="mt-3 text-[12px] text-[#6B6358]">
            {user.luckBalance} Luck available
            {user.luckBalance < 15 && (
              <span className="text-[#C26B5C] ml-2">You need {15 - user.luckBalance} more</span>
            )}
          </div>
        </div>

        {/* What's inside */}
        <div className="mb-10">
          <div className="text-[12px] text-[#6B6358] font-medium mb-5">What's inside</div>
          <div className="space-y-4">
            {SECTIONS.map((s, i) => (
              <div key={s.id} className="grid grid-cols-[auto_1fr] gap-5">
                <div className="serif-italic text-[#C5A572] text-[1.25rem] leading-none mt-0.5 select-none tabular-nums">
                  {String(i + 1).padStart(2, "0")}
                </div>
                <div>
                  <div className="t-title text-[#E8E2D5] mb-0.5">{s.name}</div>
                  <div className="t-body text-[#9C9489]">{s.desc}</div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Past reports */}
        {pastReports.length > 0 && (
          <div className="pt-8 border-t border-[#2A2722]">
            <div className="text-[12px] text-[#6B6358] font-medium mb-4">Past reports</div>
            <div className="space-y-2">
              {pastReports.map((r) => (
                <div
                  key={r.id}
                  className="flex items-center justify-between py-3 border-b border-[#1A1714] cursor-pointer hover:bg-[#0F0D0B] transition px-2 -mx-2"
                  onClick={() => {
                    // Load past report — fetch messages from conversation
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
                >
                  <div>
                    <div className="text-[13px] text-[#E8E2D5]">{r.title}</div>
                    <div className="text-[11px] text-[#6B6358]">{new Date(r.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
                  </div>
                  <ChevronRight className="w-4 h-4 text-[#6B6358]" />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function cn(...args: any[]) {
  return args.filter(Boolean).join(" ");
}
