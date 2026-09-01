"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Sparkles, Moon, Star, Sun, Flame, Gift, ChevronRight, Heart, Calendar,
  TrendingUp, Wallet, Target, Compass, BookOpen,
} from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ZODIAC_SYMBOLS, ZODIAC_MY } from "@/lib/astrology";

export function TodayView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [cardOfDay, setCardOfDay] = React.useState<any>(null);
  const [mood, setMood] = React.useState<any>(null);
  const [goals, setGoals] = React.useState<any[]>([]);
  const [loadingCard, setLoadingCard] = React.useState(false);
  const [activity, setActivity] = React.useState<boolean[]>(Array(7).fill(false));

  // Load card of day
  React.useEffect(() => {
    if (!user) return;
    setLoadingCard(true);
    fetch("/api/tarot/card-of-day").then((r) => r.json()).then((d) => setCardOfDay(d.reading)).catch(() => {}).finally(() => setLoadingCard(false));
    fetch("/api/mood").then((r) => r.json()).then((d) => { setMood(d.today); setGoals(d.goals || []); }).catch(() => {});
    fetch("/api/manifest/goals").then((r) => r.json()).then((d) => setGoals(d.goals || [])).catch(() => {});
    // Load 7-day activity (ritual completions)
    fetch("/api/ritual").then((r) => r.json()).then((d) => {
      // We only have today's ritual from the API; build a simple 7-day visualization
      // where today reflects ritual.completed and we show the streak as consecutive days
      const today = d.ritual?.completed ?? false;
      const streak = d.streak ?? 0;
      const days = Array(7).fill(false);
      // Mark the last `streak` days as active (ending today if completed)
      for (let i = 0; i < Math.min(streak, 7); i++) {
        days[6 - i] = true;
      }
      if (!today && streak === 0) days[6] = false;
      setActivity(days);
    }).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <ShellCard className="max-w-md w-full p-8">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 mb-4">
            <Sparkles className="w-7 h-7 text-gold" />
          </div>
          <h1 className="text-[24px] font-light tracking-tight text-ink mb-2">
            Welcome to <span className="lum-text-gold">Baydin</span>
          </h1>
          <p className="text-[13px] text-ink-muted mb-6 leading-relaxed">
            Your daily astrologer, tarot reader & ritual companion.
            Vedic, Western & Myanmar Mahabote traditions — 99% cheaper than real-life fortune telling.
          </p>
          <GoldButton onClick={onAuth} className="w-full">Begin your journey · 5 Luck free</GoldButton>
          <div className="mt-3 text-[11px] text-ink-muted">No card required</div>
        </ShellCard>
      </div>
    );
  }

  const today = new Date();
  const dateStr = today.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        {/* Hero greeting */}
        <div className="mb-6 lum-anim-float-up">
          <div className="flex items-center gap-2 text-[11px] text-gold uppercase tracking-[0.2em] mb-1">
            <Calendar className="w-3 h-3" /> {dateStr}
          </div>
          <h1 className="text-[28px] font-light tracking-tight text-ink mb-1">
            {greeting()}, {user.name?.split(" ")[0] || user.email.split("@")[0]} <span className="lum-text-gold">✦</span>
          </h1>
          <p className="text-[13px] text-ink-muted">
            {user.streak > 0 ? `${user.streak}-day streak — keep it alive ✦` : "Begin your daily practice — claim your free Luck below."}
          </p>
        </div>

        {/* Quick actions grid */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mb-6">
          <QuickAction icon={Sparkles} label="Ask Astrologer" desc="Chat" onClick={() => setView("chat")} />
          <QuickAction icon={Star} label="Draw Tarot" desc="Free daily" onClick={() => setView("tarot")} />
          <QuickAction icon={Moon} label="Horoscope" desc="Daily stars" onClick={() => setView("horoscope")} />
          <QuickAction icon={Target} label="Manifest" desc="Confirm goals" onClick={() => setView("manifest")} badge={goals.filter((g) => !g.confirmedToday).length} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
          {/* Card of the Day — large left */}
          <div className="lg:col-span-2 space-y-4">
            {/* Card of the day */}
            <GlassCard className="p-5 relative overflow-hidden">
              <div className="lum-glow-gold absolute inset-0 opacity-30 pointer-events-none" />
              <div className="relative">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <Sparkles className="w-4 h-4 text-gold" />
                    <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Card of the Day</span>
                  </div>
                  <Pill variant="leaf" className="text-[10px]">Free</Pill>
                </div>
                {loadingCard ? (
                  <div className="animate-pulse space-y-2">
                    <div className="h-4 w-24 bg-white/5 rounded" />
                    <div className="h-3 w-full bg-white/5 rounded" />
                    <div className="h-3 w-3/4 bg-white/5 rounded" />
                  </div>
                ) : cardOfDay ? (
                  <CardOfDayCard reading={cardOfDay} />
                ) : (
                  <div className="text-[13px] text-ink-muted">Could not load card of the day.</div>
                )}
              </div>
            </GlassCard>

            {/* Manifest confirmations */}
            <GlassCard className="p-5">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-leaf" />
                  <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Today's intentions</span>
                </div>
                <button onClick={() => setView("manifest")} className="text-[11px] text-gold hover:underline flex items-center gap-0.5">
                  All <ChevronRight className="w-3 h-3" />
                </button>
              </div>
              {goals.length === 0 ? (
                <button onClick={() => setView("manifest")} className="w-full p-3 rounded-xl border border-dashed border-white/10 text-[12px] text-ink-muted hover:border-gold/20 hover:text-gold transition text-left">
                  + Set your first intention
                </button>
              ) : (
                <div className="space-y-1.5">
                  {goals.slice(0, 3).map((g) => <GoalRow key={g.id} goal={g} />)}
                </div>
              )}
            </GlassCard>
          </div>

          {/* Right column: mood + streak + upsell */}
          <div className="space-y-4">
            {/* Mood check-in */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Heart className="w-4 h-4 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Mood</span>
              </div>
              <MoodPicker current={mood?.mood} onPick={async (m) => {
                try {
                  await api("/api/mood", { method: "POST", json: { mood: m } });
                  setMood({ ...mood, mood: m });
                  toast.success("Mood saved");
                  qc.invalidateQueries({ queryKey: ["mood"] });
                } catch (e: any) { toast.error(e.message); }
              }} />
            </GlassCard>

            {/* Luck balance + streak */}
            <GlassCard className="p-5">
              <div className="flex items-center gap-2 mb-3">
                <Wallet className="w-4 h-4 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Your Luck</span>
              </div>
              <div className="text-[32px] font-light text-gold leading-none mb-1">{user.luckBalance}</div>
              <div className="text-[11px] text-ink-muted mb-3">{user.streak}-day streak · {user.totalLuckEarned} earned lifetime</div>
              <GradientButton onClick={() => setView("luck-store")} className="w-full py-2 text-[12px]">
                Top up Luck
              </GradientButton>
            </GlassCard>

            {/* 7-day activity heatmap */}
            <GlassCard className="p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">7-day practice</span>
                <Flame className="w-3.5 h-3.5 text-leaf" />
              </div>
              <div className="flex items-end justify-between gap-1.5 h-16">
                {activity.map((active, i) => {
                  const dayLabel = ["M", "T", "W", "T", "F", "S", "S"][i];
                  const isToday = i === 6;
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${active ? "bg-gradient-to-t from-leaf/40 to-leaf/80" : "bg-white/[0.04]"}`}
                        style={{ height: active ? `${40 + (i / 6) * 20}%` : "20%" }}
                      />
                      <span className={`text-[9px] ${isToday ? "text-gold font-medium" : "text-ink-muted/60"}`}>{dayLabel}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-ink-muted mt-2 text-center">
                {activity.filter(Boolean).length}/7 days active
              </div>
            </GlassCard>

            {/* Deep dive upsell */}
            <ShellCard className="p-4">
              <div className="flex items-center gap-2 mb-2">
                <Compass className="w-4 h-4 text-gold" />
                <span className="text-[11px] uppercase tracking-[0.2em] text-gold">Deep readings</span>
              </div>
              <div className="text-[13px] text-ink mb-3">Unlock your full chart with deep astrological insights.</div>
              <div className="space-y-1.5">
                <UpsellRow icon={BookOpen} label="Life Report" cost={15} desc="7-section comprehensive" onClick={() => setView("life-report")} />
                <UpsellRow icon={Compass} label="Insights" cost={3} desc="Yogas, transits, dasha…" onClick={() => setView("insights")} />
              </div>
            </ShellCard>
          </div>
        </div>
      </div>
    </div>
  );
}

function greeting(): string {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function QuickAction({ icon: Icon, label, desc, onClick, badge }: { icon: any; label: string; desc: string; onClick: () => void; badge?: number }) {
  return (
    <button onClick={onClick} className="group relative p-3 rounded-xl lum-glass border border-white/5 hover:border-gold/20 hover:bg-gold/[0.03] transition text-left">
      <div className="flex items-center justify-between mb-1.5">
        <Icon className="w-4 h-4 text-gold group-hover:scale-110 transition-transform" />
        {badge ? <Pill variant="gold" className="text-[9px] py-0">{badge}</Pill> : null}
      </div>
      <div className="text-[12px] text-ink leading-tight">{label}</div>
      <div className="text-[10px] text-ink-muted">{desc}</div>
    </button>
  );
}

function CardOfDayCard({ reading }: { reading: any }) {
  let cards: any[] = [];
  try { cards = JSON.parse(reading.cardsJson); } catch {}
  const card = cards[0];
  if (!card) return <div className="text-[13px] text-ink-muted">{reading.interpretation?.slice(0, 200)}…</div>;
  return (
    <div className="flex gap-4">
      <div className={cn("w-20 h-32 rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 flex flex-col items-center justify-center shrink-0", card.reversed && "rotate-180")}>
        <div className="text-2xl mb-1">{card.symbol || "✦"}</div>
        <div className="text-[9px] text-ink px-1 text-center">{card.nameShort || card.id}</div>
      </div>
      <div className="flex-1 min-w-0">
        <div className="text-[13px] text-ink font-medium mb-0.5">{card.name || "Card of the Day"}</div>
        <div className="text-[11px] text-gold mb-1.5">{card.reversed ? "Reversed" : "Upright"}</div>
        <div className="text-[12px] text-ink-muted line-clamp-3 leading-relaxed">{reading.interpretation?.replace(/\*\*/g, "").slice(0, 180)}…</div>
      </div>
    </div>
  );
}

function GoalRow({ goal }: { goal: any }) {
  const qc = useQueryClient();
  const [confirming, setConfirming] = React.useState(false);
  async function confirm() {
    setConfirming(true);
    try {
      const res = await api<{ ok: boolean; bonusLuck?: number; error?: string }>("/api/manifest/confirm", {
        method: "POST", json: { goalId: goal.id },
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`Intention confirmed${res.bonusLuck ? ` · +${res.bonusLuck} Luck` : ""} ✦`);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["manifest-goals"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setConfirming(false); }
  }
  return (
    <div className="flex items-center gap-2 p-2 rounded-lg bg-white/[0.02]">
      <Flame className={cn("w-3.5 h-3.5 shrink-0", goal.streak > 0 ? "text-leaf" : "text-ink-muted/40")} />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-ink truncate">{goal.title}</div>
        {goal.streak > 0 && <div className="text-[10px] text-leaf">{goal.streak}-day streak</div>}
      </div>
      <button
        onClick={confirm}
        disabled={confirming || goal.confirmedToday}
        className={cn(
          "px-2.5 py-1 rounded-full text-[10px] transition border",
          goal.confirmedToday
            ? "border-leaf/20 bg-leaf/10 text-leaf"
            : "border-gold/20 bg-gold/10 text-gold hover:bg-gold/20"
        )}
      >
        {goal.confirmedToday ? "✓ Done" : confirming ? "…" : "Confirm"}
      </button>
    </div>
  );
}

function MoodPicker({ current, onPick }: { current?: number; onPick: (m: number) => void }) {
  const [val, setVal] = React.useState(current);
  React.useEffect(() => setVal(current), [current]);
  const moods = [
    { v: 1, e: "😞", l: "Low" },
    { v: 2, e: "😕", l: "Off" },
    { v: 3, e: "😐", l: "OK" },
    { v: 4, e: "🙂", l: "Good" },
    { v: 5, e: "😊", l: "Great" },
  ];
  return (
    <div className="grid grid-cols-5 gap-1">
      {moods.map((m) => (
        <button
          key={m.v}
          onClick={() => { setVal(m.v); onPick(m.v); }}
          className={cn(
            "flex flex-col items-center gap-1 py-2 rounded-lg border transition",
            val === m.v ? "border-gold/30 bg-gold/10" : "border-transparent hover:bg-white/[0.03]"
          )}
        >
          <span className="text-lg">{m.e}</span>
          <span className={cn("text-[9px]", val === m.v ? "text-gold" : "text-ink-muted")}>{m.l}</span>
        </button>
      ))}
    </div>
  );
}

function UpsellRow({ icon: Icon, label, cost, desc, onClick }: { icon: any; label: string; cost: number; desc: string; onClick: () => void }) {
  return (
    <button onClick={onClick} className="w-full flex items-center gap-2 p-2 rounded-lg hover:bg-white/[0.03] transition text-left">
      <Icon className="w-3.5 h-3.5 text-gold shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="text-[12px] text-ink">{label}</div>
        <div className="text-[10px] text-ink-muted">{desc}</div>
      </div>
      <Pill variant="gold" className="text-[9px]">{cost} Luck</Pill>
    </button>
  );
}
