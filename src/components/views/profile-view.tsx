"use client";

import * as React from "react";
import { GlassCard, GoldButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart3, Sparkles, MessageCircle, Moon, Target, Flame, Wallet,
  Star, Heart, TrendingUp, Calendar, Award, Zap, Gift, Users, BookOpen, Lock,
  Download, Trash2, X, AlertTriangle, Bookmark,
} from "lucide-react";
import { ACHIEVEMENTS, evaluateAchievements, tierColor } from "@/lib/achievements";
import { Input } from "@/components/ui/input";

export function ProfileView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [activity, setActivity] = React.useState<any>(null);
  const [showDelete, setShowDelete] = React.useState(false);

  React.useEffect(() => {
    if (!user) return;
    fetch("/api/activity").then((r) => r.json()).then((d) => setActivity(d)).catch(() => {});
  }, [user]);

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BarChart3 className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to view your stats</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  const totals = activity?.totals;
  const days = activity?.days ?? [];
  const totalActionsThisWeek = days.reduce((sum: number, d: any) => sum + (d?.total ?? 0), 0);
  const activeDays = days.filter((d: any) => (d?.total ?? 0) > 0).length;

  // Determine archetype based on usage patterns
  const archetype = determineArchetype(totals);

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Your journey" title="Profile & Stats" subtitle="Your spiritual practice at a glance." className="mb-6" />

        {/* Archetype card */}
        <ShellCard className="p-6 mb-5 relative overflow-hidden">
          <div className="lum-glow-gold absolute inset-0 opacity-30" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 flex items-center justify-center text-3xl shrink-0">
              {archetype.icon}
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-gold mb-1">Your archetype</div>
              <div className="text-[20px] font-light text-ink mb-1">{archetype.name}</div>
              <div className="text-[12px] text-ink-muted leading-relaxed">{archetype.desc}</div>
            </div>
          </div>
        </ShellCard>

        {/* Lifetime stats grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 mb-5">
          <StatCard icon={Sparkles} label="Tarot readings" value={totals?.tarot ?? 0} color="#C5A87C" />
          <StatCard icon={MessageCircle} label="Astrologer chats" value={totals?.chat ?? 0} color="#5FA9C7" />
          <StatCard icon={Moon} label="Frequency sessions" value={totals?.frequency ?? 0} color="#9E8AC9" />
          <StatCard icon={Target} label="Manifest confirmations" value={totals?.manifest ?? 0} color="#B5CD7E" />
          <StatCard icon={Flame} label="Rituals completed" value={totals?.ritual ?? 0} color="#F09A3D" />
          <StatCard icon={Heart} label="Mood check-ins" value={totals?.mood ?? 0} color="#D876A0" />
        </div>

        {/* Luck + streak */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-5">
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Wallet className="w-4 h-4 text-gold" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Luck economy</span>
            </div>
            <div className="flex items-baseline gap-4 mb-2">
              <div>
                <div className="text-[24px] font-light text-gold leading-none">{user.luckBalance}</div>
                <div className="text-[10px] text-ink-muted">current balance</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-leaf">{totals?.luckEarned ?? 0}</div>
                <div className="text-[10px] text-ink-muted">earned</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-ink-muted">{totals?.luckSpent ?? 0}</div>
                <div className="text-[10px] text-ink-muted">spent</div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-leaf" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-ink-muted">Consistency</span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-[24px] font-light text-leaf leading-none">{user.streak}</div>
                <div className="text-[10px] text-ink-muted">day streak</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-ink">{activeDays}/7</div>
                <div className="text-[10px] text-ink-muted">active this week</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-ink">{totalActionsThisWeek}</div>
                <div className="text-[10px] text-ink-muted">actions</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 7-day activity breakdown */}
        <GlassCard className="p-5 mb-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-gold" /> 7-day activity breakdown</div>
          <div className="space-y-1.5">
            {days.map((day: any, i: number) => {
              const isToday = i === days.length - 1;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn("w-8 text-[11px]", isToday ? "text-gold font-medium" : "text-ink-muted")}>{day?.label ?? "—"}</span>
                  <div className="flex-1 flex items-center gap-1">
                    {day?.activities?.ritual && <ActivityDot icon="🔥" title="Ritual" />}
                    {day?.activities?.tarot > 0 && <ActivityDot icon="✦" title="Tarot" count={day.activities.tarot} />}
                    {day?.activities?.chat > 0 && <ActivityDot icon="💬" title="Chat" count={day.activities.chat} />}
                    {day?.activities?.frequency > 0 && <ActivityDot icon="♪" title="Frequency" count={day.activities.frequency} />}
                    {day?.activities?.mood && <ActivityDot icon="♡" title="Mood" />}
                    {day?.activities?.manifest && <ActivityDot icon="◎" title="Manifest" />}
                    {(day?.total ?? 0) === 0 && <span className="text-[10px] text-ink-muted/40">No activity</span>}
                  </div>
                  <span className="text-[10px] text-ink-muted/60 w-8 text-right">{day?.total ?? 0}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Achievements */}
        <GlassCard className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-gold" />
              <span className="text-[12px] text-ink-muted">Achievements</span>
            </div>
            <span className="text-[11px] text-gold">
              {totals ? evaluateAchievements({ tarot: totals.tarot, chat: totals.chat, frequency: totals.frequency, manifest: totals.manifest, ritual: totals.ritual, mood: totals.mood, streak: user.streak, luckEarned: totals.luckEarned }).unlocked.length : 0}/{ACHIEVEMENTS.length}
            </span>
          </div>
          <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
            {ACHIEVEMENTS.map((a) => {
              const unlocked = totals ? a.check({ tarot: totals.tarot, chat: totals.chat, frequency: totals.frequency, manifest: totals.manifest, ritual: totals.ritual, mood: totals.mood, streak: user.streak, luckEarned: totals.luckEarned }) : false;
              const color = tierColor(a.tier);
              return (
                <div
                  key={a.id}
                  className={cn("flex flex-col items-center gap-1 p-2 rounded-lg border text-center transition", unlocked ? "border-white/10 bg-white/[0.03]" : "border-white/5 bg-white/[0.01] opacity-40")}
                  title={`${a.name} — ${a.description}`}
                >
                  <div className="text-xl" style={{ filter: unlocked ? "none" : "grayscale(1)" }}>{a.icon}</div>
                  <div className="text-[8px] text-ink-muted leading-tight">{a.name}</div>
                  {!unlocked && <Lock className="w-2.5 h-2.5 text-ink-muted/50" />}
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Saved insights (bookmarked deep readings) */}
        <SavedInsights />

        {/* Account info */}
        <GlassCard className="p-5">
          <div className="text-[12px] text-ink-muted mb-3 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-gold" /> Account</div>
          <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
            <div>
              <div className="text-ink-muted text-[10px] uppercase tracking-wide">Email</div>
              <div className="text-ink truncate">{user.email}</div>
            </div>
            <div>
              <div className="text-ink-muted text-[10px] uppercase tracking-wide">Member since</div>
              <div className="text-ink">{totals?.memberSince ? new Date(totals.memberSince).toLocaleDateString() : "—"}</div>
            </div>
            <div>
              <div className="text-ink-muted text-[10px] uppercase tracking-wide">Language</div>
              <div className="text-ink uppercase">{user.language}</div>
            </div>
            <div>
              <div className="text-ink-muted text-[10px] uppercase tracking-wide">Referral code</div>
              <div className="text-gold font-mono">{user.referralCode}</div>
            </div>
          </div>
          {/* Data export + delete */}
          <div className="pt-4 border-t border-white/5 flex items-center gap-2">
            <button
              onClick={() => window.open("/api/export", "_blank")}
              className="px-3 py-1.5 rounded-full text-[11px] border border-white/10 text-ink-muted hover:text-gold hover:border-gold/30 transition flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Export my data
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="px-3 py-1.5 rounded-full text-[11px] border border-destructive/20 text-destructive/70 hover:text-destructive hover:border-destructive/40 transition flex items-center gap-1.5"
            >
              <Trash2 className="w-3 h-3" /> Delete account
            </button>
          </div>
        </GlassCard>

        {/* Delete account modal */}
        {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
      </div>
    </div>
  );
}

function determineArchetype(totals: any) {
  if (!totals) return { name: "Seeker", icon: "✦", desc: "Your journey is just beginning." };
  const { tarot, chat, frequency, manifest, ritual } = totals;
  const max = Math.max(tarot, chat, frequency, manifest, ritual);
  if (max === 0) return { name: "Seeker", icon: "✦", desc: "Your journey is just beginning." };
  if (max === chat) return { name: "The Seeker", icon: "🌙", desc: "You turn to the stars for guidance. The astrologer is your trusted confidant." };
  if (max === tarot) return { name: "The Cartomancer", icon: "🃏", desc: "You read the cards with intuition. The deck speaks to you in symbols." };
  if (max === frequency) return { name: "The Resonator", icon: "♪", desc: "You tune your mind with sound. Frequencies are your daily medicine." };
  if (max === manifest) return { name: "The Manifestor", icon: "◎", desc: "You shape reality through intention. Daily practice is your power." };
  if (max === ritual) return { name: "The Devoted", icon: "🔥", desc: "You honor the old ways. Ritual is the rhythm of your life." };
  return { name: "Seeker", icon: "✦", desc: "Your journey is just beginning." };
}

function StatCard({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <GlassCard className="p-3 text-center">
      <Icon className="w-4 h-4 mx-auto mb-1" style={{ color }} />
      <div className="text-[20px] font-light text-ink leading-none">{value}</div>
      <div className="text-[9px] text-ink-muted mt-0.5 leading-tight">{label}</div>
    </GlassCard>
  );
}

function ActivityDot({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-ink" title={title}>
      {icon}{count && count > 1 ? `×${count}` : ""}
    </span>
  );
}

function DeleteAccountModal({ onClose }: { onClose: () => void }) {
  const [password, setPassword] = React.useState("");
  const [deleting, setDeleting] = React.useState(false);
  const qc = useQueryClient();

  async function confirm() {
    if (!password) { toast.error("Enter your password to confirm"); return; }
    setDeleting(true);
    try {
      const res = await fetch("/api/account", {
        method: "DELETE", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      toast.success("Account deleted");
      qc.clear();
      setTimeout(() => window.location.reload(), 1000);
    } catch { toast.error("Could not delete account"); }
    finally { setDeleting(false); }
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md" onClick={onClose}>
      <GlassCard float className="max-w-sm w-full p-6 rounded-3xl" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-[15px] font-medium">Delete account</span>
            </div>
            <button onClick={onClose} className="text-ink-muted hover:text-ink"><X className="w-5 h-5" /></button>
          </div>
          <div className="text-[12px] text-ink-muted mb-4 leading-relaxed">
            This permanently deletes your account and all data — conversations, readings, Luck balance, achievements, and history. This cannot be undone.
          </div>
          <div className="mb-4">
            <div className="text-[11px] text-ink-muted mb-1.5">Confirm your password to proceed</div>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink" placeholder="Your password" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-full text-[12px] text-ink-muted border border-white/10 hover:text-ink transition">Cancel</button>
            <button onClick={confirm} disabled={deleting || !password} className="flex-1 py-2.5 rounded-full text-[12px] bg-destructive text-white hover:brightness-110 active:scale-95 transition disabled:opacity-40">
              {deleting ? "Deleting…" : "Delete forever"}
            </button>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}

function SavedInsights() {
  const [insights, setInsights] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [expanded, setExpanded] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetch("/api/insights/save", { credentials: "include" })
      .then((r) => r.json())
      .then((d) => setInsights(d.insights || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  async function remove(id: string) {
    try {
      await fetch(`/api/insights/save?id=${id}`, { method: "DELETE", credentials: "include" });
      setInsights((is) => is.filter((i) => i.id !== id));
      toast.success("Removed");
    } catch {}
  }

  if (loading) return null;
  if (insights.length === 0) return null;

  return (
    <GlassCard className="p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-gold" />
          <span className="text-[12px] text-ink-muted">Saved Insights</span>
        </div>
        <span className="text-[11px] text-gold">{insights.length} bookmarked</span>
      </div>
      <div className="space-y-2">
        {insights.slice(0, 10).map((ins) => {
          const isOpen = expanded === ins.id;
          return (
            <div key={ins.id} className="rounded-lg border border-white/5 bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : ins.id)}
                className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/[0.02] transition"
              >
                <span className="text-base shrink-0">{ins.skillName?.[0] || "✦"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-ink truncate">{ins.skillName || ins.skill}</div>
                  <div className="text-[10px] text-ink-muted">{new Date(ins.savedAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(ins.id); }}
                  className="p-1 rounded text-ink-muted/40 hover:text-destructive transition shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 border-t border-white/5 pt-2 lum-prose text-[12px] text-ink-muted leading-relaxed max-h-48 overflow-y-auto lumina-scroll">
                  {ins.content}
                  {ins.highlights?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-2">
                      {ins.highlights.map((h: string, i: number) => (
                        <Pill key={i} variant="gold" className="text-[9px]">{h}</Pill>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </GlassCard>
  );
}
