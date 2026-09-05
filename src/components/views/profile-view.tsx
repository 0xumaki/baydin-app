"use client";

import * as React from "react";
import { GlassCard, GoldButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { ShimmerButton, AuroraGlowCard, GlowPill, NumberTicker } from "@/components/lumina/premium-ui";
import { BrandedImageCard, brandedFilename } from "@/components/branded-image";
import { useBrandedImageDownload } from "@/lib/use-branded-image-download";
import { CloverIcon } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart3, Sparkles, MessageCircle, Moon, Target, Flame, Wallet,
  Star, Heart, TrendingUp, Calendar, Award, Zap, Gift, Users, BookOpen, Lock,
  Download, Trash2, X, AlertTriangle, Bookmark, Copy, Share2, UserPlus,
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
          <BarChart3 className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
          <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to view your stats</div>
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
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Your journey" title="Profile & Stats" subtitle="Your spiritual practice at a glance." className="mb-6" />

        {/* Archetype card */}
        <ShellCard className="p-6 mb-5 relative overflow-hidden">
          <div className="" />
          <div className="relative flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-[#C5A572]/20 flex items-center justify-center text-3xl shrink-0">
              {archetype.icon}
            </div>
            <div className="flex-1">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#C5A572] mb-1">Your archetype</div>
              <div className="text-[20px] font-light text-[#E8E2D5] mb-1">{archetype.name}</div>
              <div className="text-[12px] text-[#9C9489] leading-relaxed">{archetype.desc}</div>
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
              <Wallet className="w-4 h-4 text-[#C5A572]" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Luck economy</span>
            </div>
            <div className="flex items-baseline gap-4 mb-2">
              <div>
                <div className="text-[24px] font-light text-[#C5A572] leading-none">{user.luckBalance}</div>
                <div className="text-[10px] text-[#9C9489]">current balance</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-[#7A8B6F]">{totals?.luckEarned ?? 0}</div>
                <div className="text-[10px] text-[#9C9489]">earned</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-[#9C9489]">{totals?.luckSpent ?? 0}</div>
                <div className="text-[10px] text-[#9C9489]">spent</div>
              </div>
            </div>
          </GlassCard>
          <GlassCard className="p-5">
            <div className="flex items-center gap-2 mb-2">
              <Flame className="w-4 h-4 text-[#7A8B6F]" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Consistency</span>
            </div>
            <div className="flex items-baseline gap-4">
              <div>
                <div className="text-[24px] font-light text-[#7A8B6F] leading-none">{user.streak}</div>
                <div className="text-[10px] text-[#9C9489]">day streak</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-[#E8E2D5]">{activeDays}/7</div>
                <div className="text-[10px] text-[#9C9489]">active this week</div>
              </div>
              <div>
                <div className="text-[16px] font-light text-[#E8E2D5]">{totalActionsThisWeek}</div>
                <div className="text-[10px] text-[#9C9489]">actions</div>
              </div>
            </div>
          </GlassCard>
        </div>

        {/* 7-day activity breakdown */}
        <GlassCard className="p-5 mb-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2"><Calendar className="w-3.5 h-3.5 text-[#C5A572]" /> 7-day activity breakdown</div>
          <div className="space-y-1.5">
            {days.map((day: any, i: number) => {
              const isToday = i === days.length - 1;
              return (
                <div key={i} className="flex items-center gap-2">
                  <span className={cn("w-8 text-[11px]", isToday ? "text-[#C5A572] font-medium" : "text-[#9C9489]")}>{day?.label ?? "—"}</span>
                  <div className="flex-1 flex items-center gap-1">
                    {day?.activities?.ritual && <ActivityDot icon="🔥" title="Ritual" />}
                    {day?.activities?.tarot > 0 && <ActivityDot icon="✦" title="Tarot" count={day.activities.tarot} />}
                    {day?.activities?.chat > 0 && <ActivityDot icon="💬" title="Chat" count={day.activities.chat} />}
                    {day?.activities?.frequency > 0 && <ActivityDot icon="♪" title="Frequency" count={day.activities.frequency} />}
                    {day?.activities?.mood && <ActivityDot icon="♡" title="Mood" />}
                    {day?.activities?.manifest && <ActivityDot icon="◎" title="Manifest" />}
                    {(day?.total ?? 0) === 0 && <span className="text-[10px] text-[#9C9489]/40">No activity</span>}
                  </div>
                  <span className="text-[10px] text-[#9C9489]/60 w-8 text-right">{day?.total ?? 0}</span>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Achievements */}
        <GlassCard className="p-5 mb-5">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Award className="w-3.5 h-3.5 text-[#C5A572]" />
              <span className="text-[12px] text-[#9C9489]">Achievements</span>
            </div>
            <span className="text-[11px] text-[#C5A572]">
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
                  className={cn(
                    "flex flex-col items-center gap-1 p-2 text-center transition",
                    unlocked
                      ? "opacity-100"
                      : "opacity-30"
                  )}
                  title={`${a.name} — ${a.description}`}
                >
                  <img
                    src={`/badges/${a.badge || "star-bearer"}.svg`}
                    alt={a.name}
                    className="w-10 h-10"
                    style={{ filter: unlocked ? `drop-shadow(0 0 6px ${color}40)` : "grayscale(1)" }}
                    onError={(e) => {
                      (e.target as HTMLImageElement).style.display = "none";
                      const fallback = document.createElement("span");
                      fallback.textContent = a.icon;
                      fallback.style.fontSize = "20px";
                      (e.target as HTMLImageElement).parentElement?.appendChild(fallback);
                    }}
                  />
                  <div className="text-[8px] text-[#9C9489] leading-tight">{a.name}</div>
                </div>
              );
            })}
          </div>
        </GlassCard>

        {/* Referral earnings card */}
        <ReferralEarningsCard user={user} />

        {/* Saved insights (bookmarked deep readings) */}
        <SavedInsights />

        {/* Account info */}
        <GlassCard className="p-5">
          <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2"><Award className="w-3.5 h-3.5 text-[#C5A572]" /> Account</div>
          <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
            <div>
              <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">Email</div>
              <div className="text-[#E8E2D5] truncate">{user.email}</div>
            </div>
            <div>
              <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">Member since</div>
              <div className="text-[#E8E2D5]">{totals?.memberSince ? new Date(totals.memberSince).toLocaleDateString() : "—"}</div>
            </div>
            <div>
              <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">Language</div>
              <div className="text-[#E8E2D5] uppercase">{user.language}</div>
            </div>
            <div>
              <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">Referral code</div>
              <div className="text-[#C5A572] font-mono">{user.referralCode}</div>
            </div>
          </div>
          {/* Data export + delete */}
          <div className="pt-4 border-t border-[#2A2722] flex items-center gap-2">
            <button
              onClick={() => window.open("/api/export", "_blank")}
              className="px-3 py-1.5 rounded-full text-[11px] border border-[#2A2722] text-[#9C9489] hover:text-[#C5A572] hover:border-[#C5A572]/30 transition flex items-center gap-1.5"
            >
              <Download className="w-3 h-3" /> Export my data
            </button>
            <button
              onClick={() => setShowDelete(true)}
              className="px-3 py-1.5 rounded-full text-[11px] border border-[#C26B5C]/20 text-[#C26B5C]/70 hover:text-[#C26B5C] hover:border-[#C26B5C]/40 transition flex items-center gap-1.5"
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
      <div className="text-[20px] font-light text-[#E8E2D5] leading-none">{value}</div>
      <div className="text-[9px] text-[#9C9489] mt-0.5 leading-tight">{label}</div>
    </GlassCard>
  );
}

function ActivityDot({ icon, title, count }: { icon: string; title: string; count?: number }) {
  return (
    <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full bg-white/[0.04] text-[10px] text-[#E8E2D5]" title={title}>
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
      <GlassCard float className="max-w-sm w-full p-6 rounded-sm" >
        <div onClick={(e) => e.stopPropagation()}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2 text-[#C26B5C]">
              <AlertTriangle className="w-5 h-5" />
              <span className="text-[15px] font-medium">Delete account</span>
            </div>
            <button onClick={onClose} className="text-[#9C9489] hover:text-[#E8E2D5]"><X className="w-5 h-5" /></button>
          </div>
          <div className="text-[12px] text-[#9C9489] mb-4 leading-relaxed">
            This permanently deletes your account and all data — conversations, readings, Luck balance, achievements, and history. This cannot be undone.
          </div>
          <div className="mb-4">
            <div className="text-[11px] text-[#9C9489] mb-1.5">Confirm your password to proceed</div>
            <Input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5]" placeholder="Your password" />
          </div>
          <div className="flex items-center gap-2">
            <button onClick={onClose} className="flex-1 py-2.5 rounded-full text-[12px] text-[#9C9489] border border-[#2A2722] hover:text-[#E8E2D5] transition">Cancel</button>
            <button onClick={confirm} disabled={deleting || !password} className="flex-1 py-2.5 rounded-full text-[12px] bg-[#C26B5C] text-white hover:brightness-110 active:scale-95 transition disabled:opacity-40">
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
          <Bookmark className="w-3.5 h-3.5 text-[#C5A572]" />
          <span className="text-[12px] text-[#9C9489]">Saved Insights</span>
        </div>
        <span className="text-[11px] text-[#C5A572]">{insights.length} bookmarked</span>
      </div>
      <div className="space-y-2">
        {insights.slice(0, 10).map((ins) => {
          const isOpen = expanded === ins.id;
          return (
            <div key={ins.id} className="rounded-lg border border-[#2A2722] bg-white/[0.02] overflow-hidden">
              <button
                onClick={() => setExpanded(isOpen ? null : ins.id)}
                className="w-full flex items-center gap-2 p-2.5 text-left hover:bg-white/[0.02] transition"
              >
                <span className="text-base shrink-0">{ins.skillName?.[0] || "✦"}</span>
                <div className="flex-1 min-w-0">
                  <div className="text-[12px] text-[#E8E2D5] truncate">{ins.skillName || ins.skill}</div>
                  <div className="text-[10px] text-[#9C9489]">{new Date(ins.savedAt).toLocaleDateString()}</div>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(ins.id); }}
                  className="p-1 rounded text-[#9C9489]/40 hover:text-[#C26B5C] transition shrink-0"
                >
                  <Trash2 className="w-3 h-3" />
                </button>
              </button>
              {isOpen && (
                <div className="px-3 pb-3 border-t border-[#2A2722] pt-2 serif prose-editorial text-[12px] text-[#9C9489] leading-relaxed max-h-48 overflow-y-auto lumina-scroll">
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

// ============================================================
// ReferralEarningsCard — fetches GET /api/referral/earnings and
// shows 4 stat cards, a 6-month SVG bar chart (gold gradient),
// top-5 referees list, referral code with Copy + Share buttons,
// and a "Download Referral Card" ShimmerButton.
// ============================================================

function ReferralEarningsCard({ user }: { user: any }) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const { download, downloading } = useBrandedImageDownload();
  const hiddenCardRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    let cancelled = false;
    api<any>("/api/referral/earnings")
      .then((d) => { if (!cancelled) setData(d); })
      .catch(() => {})
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, []);

  const monthly = React.useMemo(() => {
    const map = new Map<string, { luck: number; referrals: number }>();
    const now = new Date();
    // Pre-fill the last 6 months (including current month)
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      map.set(k, { luck: 0, referrals: 0 });
    }
    for (const r of data?.referrals ?? []) {
      const d = new Date(r.createdAt);
      const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const cur = map.get(k);
      if (cur) {
        cur.luck += (r.totalLuck ?? 0);
        cur.referrals += 1;
      }
    }
    return Array.from(map.entries()).map(([k, v]) => {
      const [y, m] = k.split("-");
      const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
      return { key: k, label, ...v };
    });
  }, [data]);

  if (loading) return null;

  const stats = data?.stats ?? {
    totalReferrals: 0,
    totalLuckEarned: 0,
    signupBonusTotal: 0,
    firstPurchaseBonusTotal: 0,
  };
  const referrals = (data?.referrals ?? []).slice(0, 5);
  const referralCode = data?.referralCode ?? user?.referralCode ?? "";
  const shareUrl = data?.shareCard?.url ?? `${window.location.origin}/?ref=${referralCode}`;
  const shareText = data?.shareCard?.text ?? `Join me on Baydin — get free Luck on signup with my code: ${referralCode}`;
  const signupBonusLuck = 5; // SIGNUP_BONUS constant for the share card

  async function copyCode() {
    try {
      await navigator.clipboard.writeText(referralCode);
      toast.success("Referral code copied");
    } catch { toast.error("Could not copy code"); }
  }

  async function shareLink() {
    if (navigator.share) {
      try {
        await navigator.share({ title: "Baydin", text: shareText, url: shareUrl });
      } catch { /* user dismissed */ }
    } else {
      try {
        await navigator.clipboard.writeText(shareUrl);
        toast.success("Referral link copied");
      } catch { toast.error("Could not copy link"); }
    }
  }

  async function downloadCard() {
    if (!hiddenCardRef.current) return;
    await download(hiddenCardRef.current, brandedFilename("referral-share"));
  }

  return (
    <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} className="p-5 mb-5">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-[#C5A572]" />
          <span className="text-[13px] text-[#E8E2D5] font-medium">Referral earnings</span>
        </div>
        <GlowPill color="#C5A572">{referralCode}</GlowPill>
      </div>

      {/* 4 stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-5">
        <RefStatCard label="Total referees" value={stats.totalReferrals ?? 0} />
        <RefStatCard label="Luck earned" value={stats.totalLuckEarned ?? 0} icon={<CloverIcon className="w-3 h-3" aria-label="Luck" />} />
        <RefStatCard label="Signup bonus" value={stats.signupBonusTotal ?? 0} icon={<CloverIcon className="w-3 h-3" aria-label="Luck" />} />
        <RefStatCard label="First-purchase bonus" value={stats.firstPurchaseBonusTotal ?? 0} icon={<CloverIcon className="w-3 h-3" aria-label="Luck" />} />
      </div>

      {/* 6-month monthly bar chart */}
      <div className="mb-5">
        <div className="text-[11px] text-[#9C9489] mb-2">Luck earned — last 6 months</div>
        <ReferralBarChart data={monthly} />
      </div>

      {/* Top referees */}
      {referrals.length > 0 && (
        <div className="mb-5">
          <div className="text-[11px] text-[#9C9489] mb-2">Top referees</div>
          <div className="space-y-1.5">
            {referrals.map((r: any, i: number) => (
              <div
                key={r.id}
                className="flex items-center justify-between py-1.5 border-b border-[#2A2722] last:border-0 text-[12px]"
              >
                <div className="flex items-center gap-2 min-w-0">
                  <span className="text-[10px] text-[#6B6358] w-4">{i + 1}</span>
                  <span className="text-[#E8E2D5] truncate">
                    {r.referee?.name || r.referee?.email || "—"}
                  </span>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="text-[#C5A572] tabular-nums flex items-center gap-1">
                    <CloverIcon className="w-3 h-3" aria-label="Luck" />
                    {r.totalLuck ?? 0}
                  </span>
                  <span className="text-[10px] text-[#9C9489]">
                    {new Date(r.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Referral code + actions */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-3 p-3 rounded-sm border border-[#2A2722] bg-[#0F0D0B]">
        <div className="flex-1 min-w-0">
          <div className="text-[10px] text-[#9C9489] mb-1 uppercase tracking-wide">Your referral code</div>
          <div className="serif-display text-[1.25rem] text-[#C5A572] tabular-nums tracking-[0.2em]">
            {referralCode}
          </div>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={copyCode}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-[12px] border border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5] hover:border-[#4A4540] transition"
          >
            <Copy className="w-3.5 h-3.5" /> Copy code
          </button>
          <button
            onClick={shareLink}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-[12px] border border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5] hover:border-[#4A4540] transition"
          >
            <Share2 className="w-3.5 h-3.5" /> Share
          </button>
          <ShimmerButton tone="gold" onClick={downloadCard} disabled={downloading} className="px-3 py-2 text-[12px]">
            <Download className="w-3.5 h-3.5" />
            {downloading ? "Preparing…" : "Download Referral Card"}
          </ShimmerButton>
        </div>
      </div>

      {/* Hidden BrandedImageCard mount for PNG download */}
      <div
        ref={hiddenCardRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <BrandedImageCard
          variant="referral-share"
          referral={{
            userName: user?.name ?? null,
            userEmail: user?.email ?? "",
            referralCode,
            signupBonusLuck,
            referralUrl: shareUrl,
          }}
        />
      </div>
    </AuroraGlowCard>
  );
}

function RefStatCard({ label, value, icon }: { label: string; value: number; icon?: React.ReactNode }) {
  return (
    <div className="p-3 rounded-sm border border-[#2A2722] bg-[#0F0D0B] text-center">
      <div className="text-[18px] font-light text-[#E8E2D5] leading-none flex items-center justify-center gap-1">
        {icon}
        <NumberTicker value={value} className="tabular-nums" />
      </div>
      <div className="text-[9px] text-[#9C9489] mt-1 leading-tight">{label}</div>
    </div>
  );
}

function ReferralBarChart({ data }: { data: { key: string; label: string; luck: number; referrals: number }[] }) {
  const max = Math.max(1, ...data.map((d) => d.luck));
  const W = 100; // viewBox width per bar slot
  const H = 80;  // viewBox height
  const barW = 36;
  const gap = (W * data.length - barW * data.length) / (data.length + 1);
  return (
    <svg
      viewBox={`0 0 ${W * data.length} ${H + 18}`}
      className="w-full h-24"
      role="img"
      aria-label="Luck earned per month over the last 6 months"
    >
      <defs>
        <linearGradient id="ref-bar-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E7D2A8" />
          <stop offset="60%" stopColor="#C5A87C" />
          <stop offset="100%" stopColor="#9C7F54" />
        </linearGradient>
      </defs>
      {/* baseline */}
      <line x1="0" y1={H} x2={W * data.length} y2={H} stroke="#2A2722" strokeWidth="0.5" />
      {data.map((d, i) => {
        const h = (d.luck / max) * (H - 8);
        const x = gap + i * (barW + gap);
        const y = H - h;
        return (
          <g key={d.key}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(0.5, h)}
              rx="1.5"
              fill="url(#ref-bar-gold)"
              opacity={d.luck > 0 ? 1 : 0.18}
            />
            {d.luck > 0 && (
              <text
                x={x + barW / 2}
                y={y - 3}
                textAnchor="middle"
                fontSize="9"
                fill="#E8E2D5"
                fontFamily="Inter, Arial, sans-serif"
              >
                {d.luck}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H + 12}
              textAnchor="middle"
              fontSize="9"
              fill="#9C9489"
              fontFamily="Inter, Arial, sans-serif"
            >
              {d.label}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
