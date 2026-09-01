"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import { Flame, Waves, Target, Sparkles, Check, Loader2, ChevronRight, Calendar } from "lucide-react";
import { toast } from "sonner";

const STEPS = [
  { id: "step1Cleanse", num: 1, name: "Cleanse", desc: "Tune to a Solfeggio frequency to clear your field", icon: Waves, color: "#9CA8A3", action: "frequency", cta: "Open Frequencies" },
  { id: "step2Manifest", num: 2, name: "Manifest", desc: "Confirm your daily intention to anchor it", icon: Target, color: "#B5CD7E", action: "manifest", cta: "Open Manifest" },
  { id: "step3Tarot", num: 3, name: "Ask the Cards", desc: "Draw a card for guidance (optional)", icon: Sparkles, color: "#C5A87C", action: "tarot", cta: "Draw Tarot", optional: true },
  { id: "step4Balance", num: 4, name: "Balance", desc: "A frequency session to close your ritual", icon: Waves, color: "#5FA9C7", action: "frequency", cta: "Open Frequencies" },
] as const;

export function RitualView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [ritual, setRitual] = React.useState<any>(null);
  const [streak, setStreak] = React.useState(0);
  const [loading, setLoading] = React.useState(true);
  const [marking, setMarking] = React.useState<string | null>(null);
  const [history, setHistory] = React.useState<any[]>([]);

  async function load() {
    try {
      const res = await api<{ ritual: any; streak: number; today: string }>("/api/ritual");
      setRitual(res.ritual);
      setStreak(res.streak);
      // Load last 30 days of ritual logs for the heatmap
      // (simplified — just use streak for now)
    } catch {}
    finally { setLoading(false); }
  }
  React.useEffect(() => { if (user) load(); }, [user]);

  async function markStep(stepId: string) {
    if (!user) { onAuth(); return; }
    if (ritual?.[stepId]) return; // already done
    setMarking(stepId);
    try {
      const res = await api<{ ritual: any; bonusLuck: number; justCompleted?: boolean }>("/api/ritual", {
        method: "POST", json: { step: stepId },
      });
      setRitual(res.ritual);
      if (res.justCompleted) {
        toast.success(`Daily ritual complete ✦ +${res.bonusLuck} Luck bonus!`);
      } else {
        toast.success(`Step complete · +${res.bonusLuck} Luck`);
      }
      qc.invalidateQueries({ queryKey: ["me"] });
      load();
    } catch (e: any) { toast.error(e.message); }
    finally { setMarking(null); }
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Flame className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to begin your ritual</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  const completedSteps = STEPS.filter((s) => ritual?.[s.id]).length;
  const totalSteps = STEPS.length;
  const isComplete = ritual?.completed;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Daily practice · Free" title="Daily Ritual" subtitle="A 4-step morning practice. Complete it for a Luck bonus." className="mb-6" />

        {/* Progress + streak hero */}
        <ShellCard className="p-5 mb-5 relative overflow-hidden">
          <div className="lum-glow-gold absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-5">
            {/* Progress ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle cx="50" cy="50" r="42" fill="none" stroke={isComplete ? "#B5CD7E" : "#C5A87C"} strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 264} 264`} style={{ transition: "stroke-dasharray 0.6s ease" }} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? <Check className="w-7 h-7 text-leaf" /> : <span className="text-[18px] font-light text-gold">{completedSteps}/{totalSteps}</span>}
              </div>
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-1">{new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}</div>
              <div className="text-[20px] font-light text-ink mb-1">
                {isComplete ? "Ritual complete ✦" : completedSteps === 0 ? "Begin your ritual" : "Continue your ritual"}
              </div>
              <div className="flex items-center gap-3 text-[12px]">
                <span className="flex items-center gap-1 text-leaf">
                  <Flame className="w-3.5 h-3.5" /> {streak}-day streak
                </span>
                <span className="text-ink-muted">·</span>
                <span className="text-gold">+1 Luck per step · +3 completion bonus</span>
              </div>
            </div>
          </div>
        </ShellCard>

        {/* Steps */}
        <div className="space-y-3">
          {STEPS.map((step, i) => {
            const done = ritual?.[step.id];
            const isMarking = marking === step.id;
            return (
              <GlassCard key={step.id} className={cn("p-4 transition-all", done && "opacity-70")}>
                <div className="flex items-start gap-4">
                  {/* Step number / check */}
                  <div className="relative shrink-0">
                    <div
                      className={cn("w-11 h-11 rounded-full flex items-center justify-center border-2 transition-all")}
                      style={{
                        borderColor: done ? step.color : "rgba(255,255,255,0.1)",
                        background: done ? `${step.color}20` : "rgba(255,255,255,0.02)",
                      }}
                    >
                      {done ? (
                        <Check className="w-5 h-5" style={{ color: step.color }} />
                      ) : isMarking ? (
                        <Loader2 className="w-5 h-5 text-ink-muted animate-spin" />
                      ) : (
                        <step.icon className="w-5 h-5" style={{ color: step.color }} />
                      )}
                    </div>
                    {/* Connector line to next step */}
                    {i < STEPS.length - 1 && (
                      <div className="absolute left-1/2 top-full w-px h-3 -translate-x-1/2" style={{ background: done ? `${step.color}40` : "rgba(255,255,255,0.06)" }} />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="text-[14px] text-ink font-medium">{step.name}</span>
                      {step.optional && <Pill className="text-[9px]">optional</Pill>}
                      {done && <Pill variant="leaf" className="text-[9px]">done</Pill>}
                    </div>
                    <div className="text-[12px] text-ink-muted leading-relaxed mb-2">{step.desc}</div>
                    <div className="flex items-center gap-2">
                      {!done && (
                        <button
                          onClick={() => markStep(step.id)}
                          disabled={isMarking}
                          className="px-3 py-1.5 rounded-full text-[11px] border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 active:scale-95 transition disabled:opacity-50"
                        >
                          {isMarking ? "Marking…" : "Mark complete"}
                        </button>
                      )}
                      <button
                        onClick={() => setView(step.action as any)}
                        className="px-3 py-1.5 rounded-full text-[11px] text-ink-muted hover:text-gold transition flex items-center gap-0.5"
                      >
                        {step.cta} <ChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </GlassCard>
            );
          })}
        </div>

        {/* Streak info */}
        <GlassCard className="p-4 mt-5">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="w-4 h-4 text-gold" />
            <span className="text-[12px] text-ink-muted">How streaks work</span>
          </div>
          <div className="text-[12px] text-ink-muted leading-relaxed">
            Complete all 4 steps (step 3 — Tarot — is optional) to mark today's ritual done.
            Keep your streak alive by completing the ritual each day. One gap per week is allowed (streak freeze).
            Each step awards +1 Luck; completing the full ritual awards a +3 Luck bonus.
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
