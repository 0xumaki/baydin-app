"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GhostButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { Target, Plus, Flame, Check, X, Sparkles, TrendingUp } from "lucide-react";
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

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center justify-between mb-6">
          <SectionTitle eyebrow="Daily practice · Free" title="Manifest" subtitle="Set intentions. Confirm daily. Watch them grow." />
          {!showForm && (
            <GoldButton onClick={() => setShowForm(true)} className="py-2 px-4 text-[12px]">
              <Plus className="w-4 h-4" /> New intention
            </GoldButton>
          )}
        </div>

        {/* Stats row */}
        <div className="grid grid-cols-3 gap-2.5 mb-5">
          <StatCard icon={Target} label="Active" value={String(goals.length)} />
          <StatCard icon={Flame} label="Best streak" value={String(Math.max(0, ...goals.map((g) => g.streak || 0)))} sub="days" />
          <StatCard icon={Check} label="Done today" value={String(goals.filter((g) => g.confirmedToday).length)} />
        </div>

        {showForm && (
          <ShellCard className="p-5 mb-4 lum-reveal">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[13px] text-[#E8E2D5] flex items-center gap-2"><Sparkles className="w-4 h-4 text-[#C5A572]" /> New intention</div>
              <button onClick={() => setShowForm(false)} className="text-[#9C9489] hover:text-[#E8E2D5]"><X className="w-4 h-4" /></button>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">What do you want to manifest?</Label>
                <Input value={title} onChange={(e) => setTitle(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. A loving, supportive relationship" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Your affirmation (optional)</Label>
                <Textarea value={statement} onChange={(e) => setStatement(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 min-h-[60px]" placeholder="I am worthy of love and it flows to me effortlessly." />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Daily reminder time (optional)</Label>
                <Input type="time" value={reminderTime} onChange={(e) => setReminderTime(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
              </div>
              <div className="text-[11px] text-[#9C9489] leading-relaxed">
                Baydin auto-detects the intention and suggests a Solfeggio frequency ({user.language === "my" ? "မြန်မာ" : "Vedic"} wisdom).
              </div>
              <GradientButton onClick={create} disabled={creating} className="w-full">
                {creating ? "Setting intention…" : "Set intention"}
              </GradientButton>
            </div>
          </ShellCard>
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
    <GlassCard className="p-4">
      <div className="flex items-start gap-3">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center text-lg shrink-0 border"
          style={{ background: `${intention.color}15`, borderColor: `${intention.color}40`, color: intention.color }}
        >
          {intention.icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-0.5">
            <div className="text-[14px] text-[#E8E2D5] font-medium truncate">{goal.title}</div>
            <Pill className="text-[9px]" style={{ borderColor: `${intention.color}30`, color: intention.color }}>{intention.label}</Pill>
          </div>
          {goal.statement && goal.statement !== goal.title && (
            <div className="text-[12px] text-[#9C9489] italic mb-2">"{goal.statement}"</div>
          )}
          <div className="flex items-center gap-3 text-[11px] text-[#9C9489]">
            {goal.streak > 0 && (
              <span className="flex items-center gap-1 text-[#7A8B6F]">
                <Flame className="w-3 h-3" /> {goal.streak}-day streak
              </span>
            )}
            <span className="flex items-center gap-1"><TrendingUp className="w-3 h-3" /> {goal.totalConfirmations} total</span>
            {freq && <span className="flex items-center gap-1 text-[#C5A572]">♪ {freq}Hz</span>}
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <button
            onClick={confirm}
            disabled={confirming || goal.confirmedToday}
            className={cn(
              "px-3 py-1.5 rounded-full text-[11px] transition border whitespace-nowrap",
              goal.confirmedToday
                ? "border-leaf/20 bg-leaf/10 text-[#7A8B6F]"
                : "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572] hover:bg-[#C5A572]/20 active:scale-95"
            )}
          >
            {goal.confirmedToday ? <span className="flex items-center gap-1"><Check className="w-3 h-3" /> Done</span> : confirming ? "…" : "Confirm"}
          </button>
          <button onClick={archive} className="text-[10px] text-[#9C9489] hover:text-[#C26B5C] transition">Archive</button>
        </div>
      </div>
    </GlassCard>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub?: string }) {
  return (
    <GlassCard className="p-3 text-center">
      <Icon className="w-4 h-4 text-[#C5A572] mx-auto mb-1" />
      <div className="text-[18px] font-light text-[#E8E2D5] leading-none">{value}</div>
      <div className="text-[10px] text-[#9C9489] mt-0.5">{label}{sub ? ` ${sub}` : ""}</div>
    </GlassCard>
  );
}

function Gate({ onAuth }: { onAuth: () => void }) {
  return (
    <div className="h-full flex items-center justify-center px-6 text-center">
      <div>
        <Target className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
        <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to manifest</div>
        <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
      </div>
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] flex items-center justify-center px-6">
      <ShellCard className="max-w-md w-full p-8 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-leaf/20 to-gold/10 border border-leaf/20 mb-4">
          <Target className="w-7 h-7 text-[#7A8B6F]" />
        </div>
        <h2 className="text-[20px] font-light text-[#E8E2D5] mb-2">What do you want to call in?</h2>
        <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
          Manifestation works through daily repetition. Set an intention, confirm it each day, and watch the universe conspire with you.
        </p>
        <GoldButton onClick={onCreate} className="w-full"><Plus className="w-4 h-4" /> Set your first intention</GoldButton>
        <div className="mt-3 text-[11px] text-[#7A8B6F]">+1 Luck for every daily confirmation</div>
      </ShellCard>
    </div>
  );
}
