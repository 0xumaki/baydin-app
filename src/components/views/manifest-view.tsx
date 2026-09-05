"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
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
import { cn } from "@/lib/utils";
import { Target, Plus, Flame, Check, X, Sparkles, TrendingUp, Music2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";

const INTENTIONS = [
  { id: "love", label: "Love", icon: "♡", color: "#D876A0" },
  { id: "abundance", label: "Abundance", icon: "✦", color: "#C5A87C" },
  { id: "healing", label: "Healing", icon: "❤", color: "#B5463A" },
  { id: "career", label: "Career", icon: "⛨", color: "#5FA9C7" },
  { id: "peace", label: "Peace", icon: "❀", color: "#9CA8A3" },
  { id: "protection", label: "Protection", icon: "🛡", color: "#9E8AC9" },
  { id: "creativity", label: "Creativity", icon: "✎", color: "#B5CD7E" },
  { id: "intuition", label: "Intuition", icon: "◉", color: "#F09A3D" },
];

const INTENTION_FREQ: Record<string, number> = {
  love: 639, abundance: 888, healing: 528, career: 432, peace: 396,
  protection: 741, creativity: 417, intuition: 852,
};

export function ManifestView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const [goals, setGoals] = React.useState<any[]>([]);
  const [showForm, setShowForm] = React.useState(false);
  const [title, setTitle] = React.useState("");
  const [statement, setStatement] = React.useState("");
  const [reminderTime, setReminderTime] = React.useState("");
  const [creating, setCreating] = React.useState(false);

  async function load() {
    try { const d = await api<{ goals: any[] }>("/api/manifest/goals"); setGoals(d.goals); } catch {}
  }
  React.useEffect(() => { if (user) load(); }, [user]);

  if (!user) return <Gate onAuth={onAuth} />;
  if (!showForm && goals.length === 0) {
    return <EmptyState onCreate={() => setShowForm(true)} />;
  }

  async function create() {
    if (!title.trim()) { toast.error("Give your intention a title"); return; }
    setCreating(true);
    try {
      await api("/api/manifest/goals", {
        method: "POST", json: { title, statement, reminderTime: reminderTime || undefined },
      });
      toast.success("Intention set ✦ The universe is listening.");
      setTitle(""); setStatement(""); setReminderTime(""); setShowForm(false);
      load(); qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setCreating(false); }
  }

  const bestStreak = Math.max(0, ...goals.map((g) => g.streak || 0));
  const doneToday = goals.filter((g) => g.confirmedToday).length;

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== Hero ===== */}
        <div className="flex items-start justify-between gap-4 mb-7 lum-reveal">
          <div className="min-w-0">
            <GlowPill className="mb-3" color="#B5CD7E">
              <Target className="w-3 h-3" /> Daily practice · Free
            </GlowPill>
            <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block mb-2">
              Manifest
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
              Set intentions. Confirm daily. Watch them grow. Each confirmation earns{" "}
              <span className="inline-flex items-center gap-1 text-[#C5A572]">
                <CloverIcon className="w-3 h-3" filled /> +1 Luck
              </span>.
            </p>
          </div>
          {!showForm && (
            <ShimmerButton onClick={() => setShowForm(true)} className="shrink-0 py-2 px-4 text-[12px]">
              <Plus className="w-4 h-4" /> New intention
            </ShimmerButton>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <StatCard
            icon={<Target className="w-4 h-4" />}
            glow="#C5A572"
            label="Active"
            value={<NumberTicker value={goals.length} className="text-[18px] font-light text-[#E8E2D5] leading-none" />}
          />
          <StatCard
            icon={<Flame className="w-4 h-4" />}
            glow="#F09A3D"
            label="Best streak"
            value={<NumberTicker value={bestStreak} suffix="-day" className="text-[18px] font-light text-[#E8E2D5] leading-none" />}
          />
          <StatCard
            icon={<Check className="w-4 h-4" />}
            glow="#7A8B6F"
            label="Done today"
            value={<NumberTicker value={doneToday} className="text-[18px] font-light text-[#E8E2D5] leading-none" />}
          />
        </div>

        {showForm && (
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} className="p-5 mb-4 lum-reveal">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] text-[#E8E2D5] flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-[#C5A572]" /> New intention
              </div>
              <button
                onClick={() => setShowForm(false)}
                className="text-[#9C9489] hover:text-[#E8E2D5] transition focus-ring rounded-sm p-1"
                aria-label="Close form"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">What do you want to manifest?</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]/60"
                  placeholder="e.g. A loving, supportive relationship"
                />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Your affirmation (optional)</Label>
                <Textarea
                  value={statement}
                  onChange={(e) => setStatement(e.target.value)}
                  className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 min-h-[60px] focus-visible:border-[#C5A572]/60"
                  placeholder="I am worthy of love and it flows to me effortlessly."
                />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Daily reminder time (optional)</Label>
                <Input
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                  className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]/60"
                />
              </div>
              <div className="flex items-start gap-1.5 text-[11px] text-[#9C9489] leading-relaxed">
                <Sparkles className="w-3 h-3 text-[#C5A572] mt-0.5 shrink-0" />
                <span>
                  Baydin auto-detects the intention and suggests a Solfeggio frequency ({user.language === "my" ? "မြန်မာ" : "Vedic"} wisdom).
                </span>
              </div>
              <ShimmerButton onClick={create} disabled={creating} className="w-full">
                {creating ? "Setting intention…" : "Set intention"}
              </ShimmerButton>
            </div>
          </AuroraGlowCard>
        )}

        {/* Goals list */}
        <div className="space-y-3">
          {goals.map((g) => <GoalCard key={g.id} goal={g} onChange={load} />)}
        </div>
      </div>
    </div>
  );
}

function GoalCard({ goal, onChange }: { goal: any; onChange: () => void }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = React.useState(false);
  const intention = INTENTIONS.find((i) => i.id === goal.intention) || INTENTIONS[1];
  const freq = INTENTION_FREQ[goal.intention] || 528;

  async function confirm() {
    setConfirming(true);
    try {
      const res = await api<{ ok: boolean; bonusLuck?: number; error?: string }>("/api/manifest/confirm", {
        method: "POST", json: { goalId: goal.id },
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`Confirmed${res.bonusLuck ? ` · +${res.bonusLuck} Luck` : ""} ✦`);
      onChange();
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirming(false); }
  }

  async function archive() {
    try {
      await api(`/api/manifest/goals?${new URLSearchParams({ id: goal.id })}`, { method: "DELETE" });
      toast.success("Intention archived");
      onChange();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <AuroraGlowCard glowColor={intention.color} glowIntensity={0.12} className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border"
          style={{ background: `${intention.color}15`, borderColor: `${intention.color}40`, color: intention.color }}
        >
          {intention.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5 flex-wrap">
            <div className="text-[14px] text-[#E8E2D5] font-medium truncate">{goal.title}</div>
            <GlowPill color={intention.color} className="text-[10px]">{intention.label}</GlowPill>
          </div>
          {goal.statement && goal.statement !== goal.title && (
            <div className="text-[12px] text-[#9C9489] italic mb-2">"{goal.statement}"</div>
          )}
          <div className="flex items-center gap-3 text-[11px] text-[#9C9489] flex-wrap">
            {goal.streak > 0 && (
              <span className="flex items-center gap-1 text-[#F09A3D]">
                <Flame className="w-3 h-3" />
                <NumberTicker value={goal.streak} suffix="-day streak" className="tabular-nums" />
              </span>
            )}
            <span className="flex items-center gap-1">
              <TrendingUp className="w-3 h-3" />
              <NumberTicker value={goal.totalConfirmations || 0} suffix=" total" className="tabular-nums" />
            </span>
            {freq > 0 && (
              <span className="flex items-center gap-1 text-[#C5A572]">
                <Music2 className="w-3 h-3" /> {freq}Hz
              </span>
            )}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <ShimmerButton
            onClick={confirm}
            disabled={confirming || goal.confirmedToday}
            tone={goal.confirmedToday ? "parchment" : "gold"}
            className="px-3 py-1.5 text-[11px] whitespace-nowrap"
          >
            {goal.confirmedToday ? (
              <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Done</span>
            ) : confirming ? (
              "…"
            ) : (
              <>Confirm <span className="inline-flex items-center gap-0.5">· <CloverIcon className="w-3 h-3" filled /> +1</span></>
            )}
          </ShimmerButton>
          <button
            onClick={archive}
            className="text-[10px] text-[#9C9489] hover:text-[#C26B5C] transition focus-ring rounded-sm px-1 py-0.5"
          >
            Archive
          </button>
        </div>
      </div>
    </AuroraGlowCard>
  );
}

function StatCard({
  icon, label, value, glow,
}: {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
  glow: string;
}) {
  return (
    <AuroraGlowCard glowColor={glow} glowIntensity={0.1} className="p-3 text-center">
      <div className="flex justify-center mb-1" style={{ color: glow }}>{icon}</div>
      <div className="flex items-center justify-center">{value}</div>
      <div className="text-[10px] text-[#9C9489] mt-0.5">{label}</div>
    </AuroraGlowCard>
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
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.15} className="max-w-sm w-full p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 border border-[#C5A572]/30" style={{ background: "#C5A57210" }}>
              <Target className="w-7 h-7 text-[#C5A572]" />
            </div>
            <LiquidMetalText as="h1" className="serif-display text-[1.75rem] block mb-2">Sign in to manifest</LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
              Set daily intentions, confirm them, and watch the universe conspire with you.
            </p>
            <ShimmerButton onClick={onAuth} className="w-full">Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        <div className="flex items-center justify-center py-10">
          <AuroraGlowCard glowColor="#7A8B6F" glowIntensity={0.15} className="max-w-md w-full p-8 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full mb-4 border border-[#7A8B6F]/30" style={{ background: "#7A8B6F15" }}>
              <Target className="w-7 h-7 text-[#7A8B6F]" />
            </div>
            <LiquidMetalText as="h2" className="serif-display text-[1.5rem] block mb-2">What do you want to call in?</LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
              Manifestation works through daily repetition. Set an intention, confirm it each day, and watch the universe conspire with you.
            </p>
            <ShimmerButton onClick={onCreate} className="w-full">
              <Plus className="w-4 h-4" /> Set your first intention
            </ShimmerButton>
            <div className="mt-3 text-[11px] text-[#7A8B6F] flex items-center justify-center gap-1">
              <CloverIcon className="w-3 h-3" filled /> +1 Luck for every daily confirmation
            </div>
          </AuroraGlowCard>
        </div>
      </div>
    </div>
  );
}
