"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { StarField } from "@/components/lumina/primitives";
import {
  GlowPill,
  IconBgCard,
  LiquidMetalText,
  NumberTicker,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, BaydinFlame, BaydinFrequency, BaydinManifest, BaydinStar, BaydinCheck, BaydinLoader, BaydinChevronRight, BaydinCalendar, BaydinClock } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { useStore, type AppView } from "@/lib/store";
import { cn } from "@/lib/utils";
import { BaydinStar as Crown } from "@/components/lumina/baydin-icons";
import { toast } from "sonner";

const STEPS = [
  { id: "step1Cleanse", num: 1, name: "Cleanse", desc: "Tune to a Solfeggio frequency to clear your field", icon: BaydinFrequency, color: "#9CA8A3", action: "frequency", cta: "Open Frequencies", optional: false },
  { id: "step2Manifest", num: 2, name: "Manifest", desc: "Confirm your daily intention to anchor it", icon: BaydinManifest, color: "#B5CD7E", action: "manifest", cta: "Open Manifest", optional: false },
  { id: "step3Tarot", num: 3, name: "Ask the Cards", desc: "Draw a card for guidance (optional)", icon: BaydinStar, color: "#C5A87C", action: "tarot", cta: "Draw Tarot", optional: true },
  { id: "step4Balance", num: 4, name: "Balance", desc: "A frequency session to close your ritual", icon: BaydinFrequency, color: "#5FA9C7", action: "frequency", cta: "Open Frequencies", optional: false },
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

  async function load() {
    try {
      const res = await api<{ ritual: any; streak: number; today: string }>("/api/ritual");
      setRitual(res.ritual);
      setStreak(res.streak);
    } catch {}
    finally { setLoading(false); }
  }
  React.useEffect(() => { if (user) load(); }, [user]);

  async function markStep(stepId: string) {
    if (!user) { onAuth(); return; }
    if (ritual?.[stepId]) return;
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

  if (!user) return <Gate onAuth={onAuth} />;

  const completedSteps = STEPS.filter((s) => ritual?.[s.id]).length;
  const totalSteps = STEPS.length;
  const isComplete = ritual?.completed;
  const progress = (completedSteps / totalSteps) * 100;

  return (
    <div className="h-full overflow-hidden relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== Hero ===== */}
        <div className="mb-6 lum-reveal">
          <GlowPill className="mb-3" color="#F09A3D">
            <BaydinFlame className="w-3 h-3" /> Daily practice · Free
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block mb-2">
            Daily Ritual
          </LiquidMetalText>
          <p className="text-[13px] text-[#A8A096] leading-[1.7] max-w-[55ch]">
            A 4-step morning practice. Each step earns{" "}
            <span className="inline-flex items-center gap-1 text-[#C5A572]">
              <CloverIcon className="w-3 h-3" filled /> +1 Luck
            </span>
            ; completing the full ritual awards a{" "}
            <span className="inline-flex items-center gap-1 text-[#C5A572]">
              <CloverIcon className="w-3 h-3" filled /> +3 bonus
            </span>.
          </p>
        </div>

        {/* Progress + streak hero */}
        <IconBgCard
          icon={BaydinFlame}
          glowColor={isComplete ? "#B5CD7E" : "#C5A572"}
          glowIntensity={0.22}
          iconSize={200}
          iconOpacity={0.07}
          iconPosition="top-right"
          className="p-6 mb-5"
        >
          <div className="relative flex items-center gap-5">
            {/* Progress ring */}
            <div className="relative w-20 h-20 shrink-0">
              <svg className="w-20 h-20 -rotate-90" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="4" />
                <circle
                  cx="50" cy="50" r="42" fill="none"
                  stroke={isComplete ? "#B5CD7E" : "#C5A87C"}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={`${(progress / 100) * 264} 264`}
                  style={{ transition: "stroke-dasharray 0.6s ease" }}
                />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                {isComplete ? (
                  <BaydinCheck className="w-7 h-7 text-[#7A8B6F]" />
                ) : (
                  <div className="flex items-baseline">
                    <NumberTicker value={completedSteps} className="text-[20px] font-light text-[#C5A572] leading-none" />
                    <span className="text-[12px] text-[#6B6358]">/{totalSteps}</span>
                  </div>
                )}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 text-[11px] uppercase tracking-[0.2em] text-[#A8A096] mb-1">
                <BaydinCalendar className="w-3 h-3" />
                {new Date().toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })}
              </div>
              <div className="text-[20px] font-light text-[#E8E2D5] mb-1.5 serif-display tracking-tight">
                {isComplete ? "Ritual complete ✦" : completedSteps === 0 ? "Begin your ritual" : "Continue your ritual"}
              </div>
              <div className="flex items-center gap-3 text-[12px] flex-wrap">
                <span className="flex items-center gap-1 text-[#F09A3D]">
                  <BaydinFlame className="w-3.5 h-3.5" />
                  <NumberTicker value={streak} suffix="-day streak" className="tabular-nums" />
                </span>
                <span className="text-[#A8A096]">·</span>
                <span className="text-[#C5A572] flex items-center gap-1">
                  <CloverIcon className="w-3 h-3" filled /> +1 Luck per step · +3 bonus
                </span>
              </div>
            </div>
          </div>
        </IconBgCard>

        {/* Complete ritual CTA */}
        {completedSteps === totalSteps - 1 && !isComplete && (
          <div className="mb-5">
            <ShimmerButton
              onClick={() => markStep(STEPS.find((s) => !ritual?.[s.id])!.id)}
              disabled={marking !== null}
              className="w-full py-3"
            >
              {marking ? (
                <><BaydinLoader className="w-4 h-4" /> Marking…</>
              ) : (
                <><Crown className="w-4 h-4" /> Complete ritual · claim +3 Luck bonus</>
              )}
            </ShimmerButton>
          </div>
        )}

        {/* Steps */}
        <div className="space-y-4">
          {STEPS.map((step, i) => {
            const done = ritual?.[step.id];
            const isMarking = marking === step.id;
            return (
              <IconBgCard
                key={step.id}
                icon={step.icon}
                glowColor={done ? step.color : "#2A2722"}
                glowIntensity={done ? 0.2 : 0.05}
                iconSize={180}
                iconOpacity={done ? 0.09 : 0.04}
                iconPosition="top-right"
                className={cn("p-6 transition-all hover:scale-[1.005]", done && "opacity-90")}
              >
                <div className="flex items-start gap-4">
                  {/* Step number / check */}
                  <div className="relative shrink-0 flex flex-col items-center">
                    <div
                      className="w-14 h-14 rounded-full flex items-center justify-center border-2 transition-all relative"
                      style={{
                        borderColor: done ? step.color : "rgba(255,255,255,0.1)",
                        background: done ? `${step.color}20` : "rgba(255,255,255,0.02)",
                      }}
                    >
                      {done ? (
                        <BaydinCheck className="w-6 h-6" style={{ color: step.color }} />
                      ) : isMarking ? (
                        <BaydinLoader className="w-6 h-6 text-[#A8A096]" />
                      ) : (
                        <step.icon className="w-6 h-6" style={{ color: step.color }} />
                      )}
                      {/* Gold glow ring around step circle */}
                      <span aria-hidden className="absolute -inset-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity" style={{ boxShadow: `0 0 16px ${step.color}40` }} />
                    </div>
                    {i < STEPS.length - 1 && (
                      <div
                        className="absolute left-1/2 top-full w-px h-6 -translate-x-1/2"
                        style={{ background: done ? `${step.color}40` : "rgba(255,255,255,0.06)" }}
                      />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="serif-display text-[18px] text-[#E8E2D5] font-medium tracking-tight">{step.name}</span>
                      {step.optional && (
                        <GlowPill color="#8B7355" className="text-[10px]">optional</GlowPill>
                      )}
                      {done && (
                        <GlowPill color={step.color} className="text-[10px]">
                          <BaydinCheck className="w-3 h-3" /> done
                        </GlowPill>
                      )}
                    </div>
                    <div className="text-[12px] text-[#A8A096] leading-relaxed mb-3">{step.desc}</div>
                    <div className="flex items-center gap-2 flex-wrap">
                      {!done && (
                        <ShimmerButton
                          onClick={() => markStep(step.id)}
                          disabled={isMarking}
                          className="px-3 py-1.5 text-[11px]"
                        >
                          {isMarking ? (
                            "Marking…"
                          ) : (
                            <>
                              Mark complete
                              <span className="inline-flex items-center gap-0.5 text-[#C5A572]">
                                · <CloverIcon className="w-3 h-3" filled /> +1
                              </span>
                            </>
                          )}
                        </ShimmerButton>
                      )}
                      <button
                        onClick={() => setView(step.action as AppView)}
                        className="px-3 py-1.5 rounded-full text-[11px] text-[#A8A096] hover:text-[#C5A572] transition flex items-center gap-0.5 focus-ring border border-[#2A2722] hover:border-[#C5A572]/30"
                      >
                        {step.cta} <BaydinChevronRight className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              </IconBgCard>
            );
          })}
        </div>

        {/* Streak info */}
        <IconBgCard icon={BaydinClock} glowColor="#C5A572" glowIntensity={0.14} iconSize={150} iconOpacity={0.06} iconPosition="top-right" className="p-6 mt-5">
          <div className="flex items-center gap-2 mb-2">
            <BaydinClock className="w-4 h-4 text-[#C5A572]" />
            <span className="text-[12px] text-[#A8A096] font-medium">How streaks work</span>
          </div>
          <div className="text-[12px] text-[#A8A096] leading-relaxed">
            Complete all 4 steps (step 3 — Tarot — is optional) to mark today's ritual done.
            Keep your streak alive by completing the ritual each day. One gap per week is allowed (streak freeze).
            Each step awards <span className="inline-flex items-center gap-0.5 text-[#C5A572]"><CloverIcon className="w-3 h-3" filled /> +1 Luck</span>;
            completing the full ritual awards a <span className="inline-flex items-center gap-0.5 text-[#C5A572]"><CloverIcon className="w-3 h-3" filled /> +3 Luck bonus</span>.
          </div>
        </IconBgCard>
      </div>
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
          <IconBgCard icon={BaydinFlame} glowColor="#F09A3D" glowIntensity={0.2} iconSize={220} iconOpacity={0.08} iconPosition="center" className="max-w-sm w-full p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 border border-[#F09A3D]/30" style={{ background: "#F09A3D10" }}>
              <BaydinFlame className="w-7 h-7 text-[#F09A3D]" />
            </div>
            <LiquidMetalText as="h1" className="serif-display text-[1.75rem] block mb-2">Sign in to begin</LiquidMetalText>
            <p className="text-[13px] text-[#A8A096] mb-6 leading-relaxed">
              A 4-step morning ritual to align your day with cosmic rhythm.
            </p>
            <ShimmerButton onClick={onAuth} className="w-full">Sign in</ShimmerButton>
          </IconBgCard>
        </div>
      </div>
    </div>
  );
}
