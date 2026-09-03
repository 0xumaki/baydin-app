"use client";

import * as React from "react";
import { GlassCard, GoldButton, Pill, SectionTitle, ShellCard, GradientButton } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Compass, Sparkles, Star, Wallet, ChevronRight, Loader2, ArrowLeft, Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Compass className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to explore insights</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
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
      <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
          <button onClick={() => { setSelected(null); setResult(null); }} className="flex items-center gap-1.5 text-[12px] text-ink-muted hover:text-gold mb-4 transition">
            <ArrowLeft className="w-3.5 h-3.5" /> All insights
          </button>

          <div className="flex items-center gap-3 mb-5">
            <div className="w-12 h-12 rounded-sm bg-gold/10 border border-gold/20 flex items-center justify-center text-2xl text-gold">
              {skill?.icon || "✦"}
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold">Insight · {skill?.name}</div>
              <div className="text-[18px] font-light text-ink">{skill?.description}</div>
            </div>
            {result && <Pill variant="gold" className="text-[10px]">{result.luckSpent} Luck</Pill>}
          </div>

          {loading ? (
            <GlassCard className="p-8 text-center">
              <Loader2 className="w-6 h-6 text-gold animate-spin mx-auto mb-3" />
              <div className="text-[13px] text-ink-muted">Reading the stars…</div>
              <div className="text-[11px] text-ink-muted/60 mt-1">This usually takes 10-20 seconds</div>
            </GlassCard>
          ) : result ? (
            <GlassCard className="p-6">
              <div className="serif prose-editorial text-[14px] text-ink/90 leading-relaxed">
                <ReactMarkdown>{result.content}</ReactMarkdown>
              </div>
              {result.highlights?.length > 0 && (
                <div className="mt-4 pt-4 border-t border-white/5">
                  <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-2">Highlights</div>
                  <div className="flex flex-wrap gap-1.5">
                    {result.highlights.map((h: string, i: number) => <Pill key={i} variant="gold" className="text-[10px]">{h}</Pill>)}
                  </div>
                </div>
              )}
              {result.guidance && (result.guidance.remedies || result.guidance.recommendations || result.guidance.warnings) && (
                <div className="mt-4 pt-4 border-t border-white/5 grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {result.guidance.remedies?.length > 0 && <GuidanceList title="Remedies" items={result.guidance.remedies} variant="gold" />}
                  {result.guidance.recommendations?.length > 0 && <GuidanceList title="Recommendations" items={result.guidance.recommendations} variant="leaf" />}
                  {result.guidance.warnings?.length > 0 && <GuidanceList title="Cautions" items={result.guidance.warnings} variant="default" />}
                </div>
              )}
              {/* Save bookmark */}
              <div className="mt-4 pt-4 border-t border-white/5 flex items-center gap-2">
                <button
                  onClick={async () => {
                    try {
                      await api("/api/insights/save", { method: "POST", json: { skill: result.skill, skillName: result.skillName, content: result.content, highlights: result.highlights, guidance: result.guidance } });
                      toast.success("Insight bookmarked ✦");
                    } catch (e: any) { toast.error(e.message); }
                  }}
                  className="px-3 py-1.5 rounded-full text-[11px] border border-gold/20 bg-gold/10 text-gold hover:bg-gold/20 active:scale-95 transition flex items-center gap-1.5"
                >
                  <Bookmark className="w-3 h-3" /> Save this insight
                </button>
              </div>
            </GlassCard>
          ) : null}
        </div>
      </div>
    );
  }

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Deep astrology · 3 Luck each" title="Insights" subtitle="Skill-based readings grounded in your natal chart." className="mb-6" />

        <div className="flex items-center gap-2 mb-4">
          <Pill variant="gold" className="text-[10px]"><Wallet className="w-3 h-3" /> {user.luckBalance} Luck</Pill>
          <span className="text-[11px] text-ink-muted">Each insight costs 3 Luck</span>
        </div>

        {/* Optional query */}
        <GlassCard className="p-3 mb-6 flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-gold shrink-0" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && selected && run(selected)}
            placeholder="Optional: focus your question (e.g. 'when will I marry?')"
            className="flex-1 bg-transparent outline-none text-[13px] text-ink placeholder:text-ink-muted/60"
          />
        </GlassCard>

        {/* Skills grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
          {skills.map((s) => (
            <button
              key={s.id}
              onClick={() => run(s.id)}
              className="group text-left p-4 rounded-sm border border-white/8 bg-white/[0.02] hover:border-gold/30 hover:bg-gold/[0.04] transition-all hover:shadow-[0_0_30px_-8px_rgba(197,168,124,0.25)]"
            >
              <div className="text-2xl mb-2 group-hover:scale-110 transition-transform">{s.icon}</div>
              <div className="text-[13px] text-ink font-medium mb-0.5">{s.name}</div>
              <div className="text-[10px] text-ink-muted leading-tight">{s.description}</div>
              <div className="mt-2 flex items-center justify-between">
                <Pill variant="gold" className="text-[9px]">3 Luck</Pill>
                <ChevronRight className="w-3 h-3 text-ink-muted group-hover:text-gold group-hover:translate-x-0.5 transition" />
              </div>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function GuidanceList({ title, items, variant }: { title: string; items: string[]; variant: "default" | "gold" | "leaf" }) {
  return (
    <div className="p-3 rounded-lg bg-white/[0.02] border border-white/5">
      <div className="text-[11px] uppercase tracking-wide text-ink-muted mb-1.5">{title}</div>
      <ul className="space-y-1 text-[12px] text-ink/90">
        {items.map((it, i) => <li key={i} className="flex gap-1.5"><span className="text-gold">•</span> {it}</li>)}
      </ul>
    </div>
  );
}

function NeedsBirthData() {
  return (
    <div className="h-full flex items-center justify-center px-6 text-center">
      <ShellCard className="max-w-md w-full p-8">
        <Star className="w-8 h-8 text-gold mx-auto mb-3" />
        <div className="text-[15px] text-ink mb-1">Birth details needed</div>
        <div className="text-[12px] text-ink-muted mb-4">Insights read your natal chart. Open your profile (top-right settings icon) and add your birth date, time, and place.</div>
      </ShellCard>
    </div>
  );
}
