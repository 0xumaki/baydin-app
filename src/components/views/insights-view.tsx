"use client";

import * as React from "react";
import { StarField } from "@/components/lumina/primitives";
import {
  GlowPill,
  IconBgCard,
  LiquidMetalText,
  NumberTicker,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, BaydinInsights, BaydinStar, BaydinChevronRight, BaydinLoader, BaydinArrowLeft, BaydinBookmark } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const SKILL_COST = 3;

export function InsightsView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [skills, setSkills] = React.useState<any[]>([]);
  const [selected, setSelected] = React.useState<string | null>(null);
  const [query, setQuery] = React.useState("");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/insights").then((r) => r.json()).then((d) => setSkills(d.skills || [])).catch(() => {});
  }, []);

  async function run(skillId: string) {
    if (!user) { onAuth(); return; }
    setSelected(skillId);
    setLoading(true);
    setResult(null);
    try {
      const res = await api<{ insight: any; error?: string; balance?: number }>("/api/insights", {
        method: "POST", json: { skill: skillId, query: query || undefined },
      });
      if (res.error) { toast.error(res.error); setSelected(null); return; }
      setResult(res.insight);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  if (!user) {
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <IconBgCard icon={BaydinInsights} glowColor="#9E8AC9" glowIntensity={0.22} iconSize={220} iconOpacity={0.08} iconPosition="center" className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#9E8AC9]/15 border border-[#9E8AC9]/30 flex items-center justify-center">
              <BaydinInsights className="w-6 h-6 text-[#9E8AC9]" />
            </div>
            <LiquidMetalText as="h1" className="text-[20px] mb-1">Sign in to explore insights</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] mb-4 max-w-sm mx-auto">
              Skill-based readings grounded in your natal chart — Yogas, Transits, Dasha, Career, Gemstones and more.
            </p>
            <ShimmerButton onClick={onAuth}>Sign in</ShimmerButton>
          </IconBgCard>
        </div>
      </div>
    );
  }

  if (!user.birthData) {
    return <NeedsBirthData />;
  }

  // Showing result
  if (selected && (result || loading)) {
    const skill = skills.find((s) => s.id === selected);
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <button
            onClick={() => { setSelected(null); setResult(null); }}
            className="flex items-center gap-1.5 text-[12px] text-[#9C9489] hover:text-[#C5A572] mb-4 transition"
          >
            <BaydinArrowLeft className="w-3.5 h-3.5" /> All insights
          </button>

          <IconBgCard icon={BaydinStar} glowColor="#C5A572" glowIntensity={0.2} iconSize={140} iconOpacity={0.07} iconPosition="top-right" className="p-5 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-sm bg-[#C5A572]/10 border border-[#C5A572]/20 flex items-center justify-center text-2xl text-[#C5A572]">
                {skill?.icon || "✦"}
              </div>
              <div className="flex-1 min-w-0">
                <GlowPill color="#9E8AC9" className="text-[10px] mb-1">Insight</GlowPill>
                <div className="text-[16px] font-light text-[#E8E2D5] truncate">{skill?.name}</div>
                <div className="text-[11px] text-[#9C9489] truncate">{skill?.description}</div>
              </div>
              {result && (
                <GlowPill color="#C5A572" className="text-[10px]">
                  <CloverIcon className="w-2.5 h-2.5" /> <NumberTicker value={result.luckSpent} /> Luck
                </GlowPill>
              )}
            </div>
          </IconBgCard>

          {loading ? (
            <IconBgCard icon={BaydinLoader} glowColor="#9E8AC9" glowIntensity={0.22} iconSize={180} iconOpacity={0.07} iconPosition="center" className="p-8 text-center">
              <BaydinLoader className="w-6 h-6 text-[#C5A572] mx-auto mb-3" />
              <div className="text-[13px] text-[#E8E2D5]">Reading the stars…</div>
              <div className="text-[11px] text-[#9C9489]/60 mt-1">This usually takes 10-20 seconds</div>
            </IconBgCard>
          ) : result ? (
            <IconBgCard icon={BaydinInsights} glowColor="#C5A572" glowIntensity={0.22} iconSize={220} iconOpacity={0.07} iconPosition="top-right" className="p-6">
              <div className="serif prose-editorial text-[14px] text-[#E8E2D5]/90 leading-relaxed">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>
              {result.highlights?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-[#2A2722]">
                  <div className="text-[11px] uppercase tracking-wide text-[#9C9489] mb-2">Highlights</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.highlights.map((h: string, i: number) => (
                      <GlowPill key={i} color="#C5A572" className="text-[10px]">{h}</GlowPill>
                    ))}
                  </div>
                </div>
              )}
              {result.guidance && (result.guidance.remedies || result.guidance.recommendations || result.guidance.warnings) && (
                <div className="mt-4 pt-4 border-t border-[#2A2722] grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.guidance.remedies?.length > 0 && <GuidanceList title="Remedies" items={result.guidance.remedies} accent="#C5A572" />}
                  {result.guidance.recommendations?.length > 0 && <GuidanceList title="Recommendations" items={result.guidance.recommendations} accent="#7A8B6F" />}
                  {result.guidance.warnings?.length > 0 && <GuidanceList title="Cautions" items={result.guidance.warnings} accent="#9E8AC9" />}
                </div>
              )}
              {/* Save bookmark */}
              <div className="mt-4 pt-4 border-t border-[#2A2722] flex items-center gap-2">
                <ShimmerButton
                  tone="parchment"
                  onClick={async () => {
                    try {
                      await api("/api/insights/save", {
                        method: "POST",
                        json: {
                          skill: result.skill,
                          skillName: result.skillName,
                          content: result.content,
                          highlights: result.highlights,
                          guidance: result.guidance,
                        },
                      });
                      toast.success("Insight bookmarked ✦");
                    } catch (e: any) { toast.error(e.message); }
                  }}
                  className="text-[11px] px-3 py-1.5"
                >
                  <BaydinBookmark className="w-3 h-3" /> Save this insight
                </ShimmerButton>
              </div>
            </IconBgCard>
          ) : null}
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
        <div className="mb-6">
          <GlowPill color="#9E8AC9" className="text-[10px] mb-3">
            <BaydinStar className="w-2.5 h-2.5" /> Deep astrology · {SKILL_COST} Luck each
          </GlowPill>
          <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] mb-2">Deep Insights</LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Skill-based readings grounded in your natal chart — each costs {SKILL_COST} Luck and unlocks a focused lens on a single dimension of your life.
          </p>
        </div>

        {/* Luck balance row */}
        <div className="flex items-center gap-2 mb-5">
          <IconBgCard icon={CloverIcon} glowColor="#C5A572" glowIntensity={0.16} iconSize={100} iconOpacity={0.07} iconPosition="top-right" className="p-3 px-4 inline-flex items-center gap-2">
            <CloverIcon className="w-3.5 h-3.5" />
            <span className="text-[12px] text-[#9C9489]">Balance:</span>
            <NumberTicker value={user.luckBalance} className="text-[14px] text-[#C5A572] font-medium" />
            <span className="text-[12px] text-[#9C9489]">Luck</span>
          </IconBgCard>
        </div>

        {/* Optional query */}
        <IconBgCard icon={BaydinStar} glowColor="#9E8AC9" glowIntensity={0.16} iconSize={140} iconOpacity={0.06} iconPosition="top-right" className="p-3 mb-6">
          <div className="flex items-center gap-2">
            <BaydinStar className="w-4 h-4 text-[#C5A572] shrink-0" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && selected && run(selected)}
              placeholder="Optional: focus your question (e.g. 'when will I marry?')"
              className="flex-1 bg-transparent outline-none text-[13px] text-[#E8E2D5] placeholder:text-[#9C9489]/60"
            />
          </div>
        </IconBgCard>

        {/* Skills grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {skills.map((s) => (
            <IconBgCard
              key={s.id}
              icon={BaydinInsights}
              glowColor="#9E8AC9"
              glowIntensity={0.1}
              iconSize={130}
              iconOpacity={0.07}
              iconPosition="top-right"
              className="p-5"
            >
              <button
                onClick={() => run(s.id)}
                className="group w-full text-left transition-all"
              >
                <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{s.icon}</div>
                <div className="text-[13px] text-[#E8E2D5] font-medium mb-0.5">{s.name}</div>
                <div className="text-[10px] text-[#9C9489] leading-tight line-clamp-2 min-h-[28px]">{s.description}</div>
                <div className="mt-3 flex items-center justify-between">
                  <GlowPill color="#C5A572" className="text-[9px]">
                    <CloverIcon className="w-2 h-2" /> <NumberTicker value={SKILL_COST} />
                  </GlowPill>
                  <span className="text-[10px] text-[#C5A572] opacity-0 group-hover:opacity-100 transition-opacity inline-flex items-center gap-0.5">
                    Explore <BaydinChevronRight className="w-3 h-3" />
                  </span>
                </div>
              </button>
            </IconBgCard>
          ))}
        </div>

        {/* Empty skills state */}
        {skills.length === 0 && (
          <IconBgCard icon={BaydinLoader} glowColor="#9E8AC9" glowIntensity={0.16} iconSize={140} iconOpacity={0.07} iconPosition="center" className="p-8 text-center">
            <BaydinLoader className="w-5 h-5 text-[#9E8AC9] mx-auto mb-3" />
            <div className="text-[12px] text-[#9C9489]">Loading insight skills…</div>
          </IconBgCard>
        )}
      </div>
    </div>
  );
}

function GuidanceList({ title, items, accent }: { title: string; items: string[]; accent: string }) {
  return (
    <div className="p-3 rounded-sm bg-white/[0.02] border border-[#2A2722]">
      <div className="text-[11px] uppercase tracking-wide mb-1.5" style={{ color: accent }}>{title}</div>
      <ul className="space-y-1 text-[12px] text-[#E8E2D5]/90">
        {items.map((it, i) => (
          <li key={i} className="flex gap-1.5">
            <span style={{ color: accent }}>•</span> {it}
          </li>
        ))}
      </ul>
    </div>
  );
}

function NeedsBirthData() {
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden flex items-center justify-center">
        <IconBgCard icon={BaydinStar} glowColor="#9E8AC9" glowIntensity={0.2} iconSize={200} iconOpacity={0.08} iconPosition="center" className="p-8 max-w-md w-full text-center">
          <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/30 flex items-center justify-center">
            <BaydinStar className="w-6 h-6 text-[#C5A572]" />
          </div>
          <LiquidMetalText as="h2" className="text-[18px] mb-2">Birth details needed</LiquidMetalText>
          <p className="text-[12px] text-[#9C9489] leading-relaxed mb-4">
            Insights read your natal chart. Open your profile (top-right settings icon) and add your birth date, time, and place.
          </p>
          <GlowPill color="#9E8AC9" className="text-[10px]">Profile → Birth data</GlowPill>
        </IconBgCard>
      </div>
    </div>
  );
}
