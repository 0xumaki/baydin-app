"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { cn } from "@/lib/utils";
import {
  Sparkles, Moon, Star, Sun, Flame, Gift, ChevronRight, Heart, Calendar,
  TrendingUp, Wallet, Target, Compass, BookOpen, Share2, Snowflake,
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
  const [activity, setActivity] = React.useState<any[]>([]);

  // Load card of day
  React.useEffect(() => {
    if (!user) return;
    setLoadingCard(true);
    fetch("/api/tarot/card-of-day").then((r) => r.json()).then((d) => setCardOfDay(d.reading)).catch(() => {}).finally(() => setLoadingCard(false));
    fetch("/api/mood").then((r) => r.json()).then((d) => { setMood(d.today); setGoals(d.goals || []); }).catch(() => {});
    fetch("/api/manifest/goals").then((r) => r.json()).then((d) => setGoals(d.goals || [])).catch(() => {});
    // Load 7-day activity from multi-source activity API
    fetch("/api/activity").then((r) => r.json()).then((d) => { setActivity(d.days || []); }).catch(() => {});
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

        {/* Recommended practice (personalized) */}
        <RecommendedPractice
          ritualDone={activity[6]?.activities?.ritual ?? false}
          moodDone={activity[6]?.activities?.mood ?? false}
          manifestDone={goals.every((g) => g.confirmedToday) && goals.length > 0}
          tarotDone={(activity[6]?.activities?.tarot ?? 0) > 0}
          streak={user.streak}
          onNavigate={setView}
        />

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
              <div className="text-[11px] text-ink-muted mb-2">
                {user.streak}-day streak · {user.totalLuckEarned} earned lifetime
              </div>
              {/* Streak freeze indicator */}
              {user.streak > 0 && (
                <div className="flex items-center gap-1.5 mb-3 text-[10px] text-leaf/80">
                  <Snowflake className="w-3 h-3" />
                  Streak freeze active — miss 1 day without losing your streak
                </div>
              )}
              {user.streak === 0 && (
                <div className="mb-3" />
              )}
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
                {(activity.length > 0 ? activity : Array(7).fill(null)).map((day: any, i: number) => {
                  const total = day?.total ?? 0;
                  const dayLabel = day?.label ?? ["S", "M", "T", "W", "T", "F", "S"][i];
                  const isToday = i === 6;
                  const height = total > 0 ? `${30 + Math.min(total, 6) * 12}%` : "18%";
                  return (
                    <div key={i} className="flex-1 flex flex-col items-center gap-1">
                      <div
                        className={`w-full rounded-md transition-all duration-500 ${total > 0 ? "bg-gradient-to-t from-leaf/40 to-leaf/80" : "bg-white/[0.04]"}`}
                        style={{ height }}
                      />
                      <span className={`text-[9px] ${isToday ? "text-gold font-medium" : "text-ink-muted/60"}`}>{dayLabel[0]}</span>
                    </div>
                  );
                })}
              </div>
              <div className="text-[10px] text-ink-muted mt-2 text-center">
                {activity.reduce((sum: number, d: any) => sum + (d?.total ?? 0), 0)} actions this week
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
  const qc = useQueryClient();
  const [reflection, setReflection] = React.useState(reading.reflection || "");
  const [saved, setSaved] = React.useState(!!reading.reflection);
  const [saving, setSaving] = React.useState(false);
  let cards: any[] = [];
  try { cards = JSON.parse(reading.cardsJson); } catch {}
  const card = cards[0];
  if (!card) return <div className="text-[13px] text-ink-muted">{reading.interpretation?.slice(0, 200)}…</div>;

  async function saveReflection() {
    if (!reflection.trim()) return;
    setSaving(true);
    try {
      const res = await fetch("/api/tarot/card-of-day", {
        method: "PATCH", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ reflection }),
      });
      const data = await res.json();
      if (data.bonusLuck) {
        toast.success(`Reflection saved · +${data.bonusLuck} Luck ✦`);
      } else {
        toast.success("Reflection updated");
      }
      setSaved(true);
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch { toast.error("Could not save reflection"); }
    finally { setSaving(false); }
  }

  return (
    <div>
      <div className="flex gap-4 mb-3">
        <div className={cn("w-20 h-32 rounded-xl border border-gold/30 bg-gradient-to-br from-surface to-surface-2 flex flex-col items-center justify-center shrink-0", card.reversed && "rotate-180")}>
          <div className="text-2xl mb-1">{card.symbol || "✦"}</div>
          <div className="text-[9px] text-ink px-1 text-center">{card.nameShort || card.id}</div>
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-0.5">
            <div className="text-[13px] text-ink font-medium">{card.name || "Card of the Day"}</div>
            <button
              onClick={async () => {
                const text = `${card.name || "Card of the Day"} (${card.reversed ? "Reversed" : "Upright"})\n\n${reading.interpretation?.replace(/[#*_`]/g, "").slice(0, 200)}`;
                if (navigator.share) {
                  try { await navigator.share({ title: "My Baydin Card of the Day", text, url: window.location.origin }); } catch {}
                } else {
                  await navigator.clipboard.writeText(text + "\n\n" + window.location.origin);
                  toast.success("Card shared ✦");
                }
              }}
              className="p-1 rounded-full text-ink-muted/60 hover:text-gold transition shrink-0"
              title="Share this card"
            >
              <Share2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="text-[11px] text-gold mb-1.5">{card.reversed ? "Reversed" : "Upright"}</div>
          <div className="text-[12px] text-ink-muted line-clamp-3 leading-relaxed">{reading.interpretation?.replace(/\*\*/g, "").slice(0, 180)}…</div>
        </div>
      </div>
      {/* Reflection journal */}
      <div className="mt-3 pt-3 border-t border-white/5">
        <div className="text-[10px] uppercase tracking-wide text-ink-muted mb-1.5 flex items-center gap-1">
          <BookOpen className="w-3 h-3 text-gold" /> Your reflection {saved && <span className="text-leaf">· saved</span>}
        </div>
        <textarea
          value={reflection}
          onChange={(e) => { setReflection(e.target.value); setSaved(false); }}
          placeholder="What does this card mean to you today?"
          className="w-full bg-white/[0.03] border border-white/5 rounded-lg px-3 py-2 text-[12px] text-ink placeholder:text-ink-muted/50 outline-none focus:border-gold/20 resize-none min-h-[48px]"
          rows={2}
        />
        {reflection.trim() && !saved && (
          <button
            onClick={saveReflection}
            disabled={saving}
            className="mt-1.5 px-3 py-1 rounded-full text-[10px] border border-gold/30 bg-gold/10 text-gold hover:bg-gold/20 active:scale-95 transition disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save reflection · +1 Luck"}
          </button>
        )}
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

function RecommendedPractice({ ritualDone, moodDone, manifestDone, tarotDone, streak, onNavigate }: {
  ritualDone: boolean; moodDone: boolean; manifestDone: boolean; tarotDone: boolean; streak: number; onNavigate: (v: any) => void;
}) {
  // Determine what's left to do today
  const tasks: { label: string; desc: string; icon: any; view: string; done: boolean; color: string }[] = [
    { label: "Check your mood", desc: "1 tap · +1 Luck", icon: Heart, view: "today", done: moodDone, color: "#D876A0" },
    { label: "Confirm your intention", desc: "Daily manifest · +1 Luck", icon: Target, view: "manifest", done: manifestDone, color: "#B5CD7E" },
    { label: "Draw a tarot card", desc: "Free daily reading", icon: Star, view: "tarot", done: tarotDone, color: "#C5A87C" },
    { label: "Complete your ritual", desc: "4 steps · +7 Luck", icon: Flame, view: "ritual", done: ritualDone, color: "#F09A3D" },
  ];
  const next = tasks.find((t) => !t.done);

  if (!next) {
    return (
      <ShellCard className="p-4 mb-5 lum-anim-float-up">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-leaf/15 border border-leaf/30 flex items-center justify-center shrink-0">
            <Flame className="w-5 h-5 text-leaf" />
          </div>
          <div className="flex-1">
            <div className="text-[13px] text-ink font-medium">Today's practice complete ✦</div>
            <div className="text-[11px] text-ink-muted">You've done everything. Come back tomorrow to keep your {streak}-day streak alive.</div>
          </div>
        </div>
      </ShellCard>
    );
  }

  return (
    <button onClick={() => onNavigate(next.view)} className="block w-full text-left mb-5 lum-anim-float-up group">
      <ShellCard className="p-4 hover:border-gold/30 transition">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0 border" style={{ background: `${next.color}15`, borderColor: `${next.color}40` }}>
            <next.icon className="w-5 h-5" style={{ color: next.color }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted mb-0.5">Recommended next</div>
            <div className="text-[14px] text-ink font-medium group-hover:text-gold transition">{next.label}</div>
            <div className="text-[11px] text-ink-muted">{next.desc}</div>
          </div>
          <ChevronRight className="w-4 h-4 text-ink-muted group-hover:text-gold group-hover:translate-x-0.5 transition shrink-0" />
        </div>
      </ShellCard>
    </button>
  );
}
