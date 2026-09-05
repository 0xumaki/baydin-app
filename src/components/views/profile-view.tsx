"use client";

import * as React from "react";
import {
  GlassCard, GoldButton, Pill, SectionTitle, ShellCard, StarField,
} from "@/components/lumina/primitives";
import {
  ShimmerButton,
  AuroraGlowCard,
  GlowPill,
  NumberTicker,
  LiquidMetalText,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { BrandedImageCard, brandedFilename } from "@/components/branded-image";
import { useBrandedImageDownload } from "@/lib/use-branded-image-download";
import { CloverIcon, CloverPNG } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import {
  BarChart3, Sparkles, MessageCircle, Moon, Target, Flame, Wallet,
  Star, Heart, TrendingUp, Calendar, Award, Zap, Gift, Users, BookOpen, Lock,
  Download, Trash2, X, AlertTriangle, Bookmark, Copy, Share2, UserPlus,
  Bell, Globe, Sun, Moon as MoonIcon, Shield, Pencil, ChevronRight,
  Crown, Activity, Clock,
} from "lucide-react";
import { ACHIEVEMENTS, evaluateAchievements, tierColor } from "@/lib/achievements";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

const LANGUAGES = [
  { code: "my", label: "Myanmar" },
  { code: "en", label: "English" },
  { code: "th", label: "Thai" },
  { code: "kh", label: "Khmer" },
  { code: "lo", label: "Lao" },
];

export function ProfileView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [activity, setActivity] = React.useState<any>(null);
  const [showDelete, setShowDelete] = React.useState(false);
  const [notifications, setNotifications] = React.useState(true);
  const [language, setLanguage] = React.useState(user?.language ?? "my");

  React.useEffect(() => {
    if (!user) return;
    fetch("/api/activity").then((r) => r.json()).then((d) => setActivity(d)).catch(() => {});
  }, [user]);

  async function saveLanguage(lang: string) {
    setLanguage(lang);
    try {
      await api("/api/account", {
        method: "PATCH",
        json: { language: lang },
      });
      qc.invalidateQueries({ queryKey: ["me"] });
      toast.success("Language updated");
    } catch (e: any) {
      toast.error(e.message ?? "Could not update language");
    }
  }

  async function toggleNotifications(on: boolean) {
    setNotifications(on);
    try {
      await api("/api/account", {
        method: "PATCH",
        json: { notifications: on },
      });
      toast.success(on ? "Notifications on" : "Notifications off");
    } catch (e: any) {
      // Revert on failure
      setNotifications(!on);
      toast.error(e.message ?? "Could not update notifications");
    }
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <AnimatedGradientBackground variant="warm" />
          <StarField count={24} />
        </div>
        <div className="relative z-10 min-w-0 flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <BarChart3 className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
            <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to view your stats</div>
            <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
          </div>
        </div>
      </div>
    );
  }

  const totals = activity?.totals;
  const days = activity?.days ?? [];
  const totalActionsThisWeek = days.reduce((sum: number, d: any) => sum + (d?.total ?? 0), 0);
  const activeDays = days.filter((d: any) => (d?.total ?? 0) > 0).length;
  const archetype = determineArchetype(totals);

  const lifetimeReadings = (totals?.tarot ?? 0) + (totals?.chat ?? 0) + (totals?.frequency ?? 0) + (totals?.manifest ?? 0) + (totals?.ritual ?? 0);
  const memberSinceDate = totals?.memberSince ? new Date(totals.memberSince) : (user?.createdAt ? new Date(user.createdAt) : null);
  const memberSinceLabel = memberSinceDate ? memberSinceDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : "—";
  const daysActive = totals?.daysActive ?? 0;

  // Birth data
  const birthData = user?.birthData ? safeParseBirthData(user.birthData) : null;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Backdrop: AnimatedGradientBackground (warm) + StarField (36) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={36} />
      </div>

      <div className="relative z-10 min-w-0 overflow-hidden flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 pb-20">
          {/* Hero */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <BarChart3 className="w-5 h-5 text-[#C5A572]" />
              <GlowPill color="#C5A572" className="!text-[10px] uppercase tracking-wide">
                Your journey
              </GlowPill>
              <GlowPill color={archetype.color ?? "#7A8B6F"} className="text-[10px]">
                {archetype.icon} {archetype.name}
              </GlowPill>
              <GlowPill color="#9C9489" className="text-[10px]">
                <Clock className="w-3 h-3" /> {memberSinceLabel}
              </GlowPill>
            </div>
            <LiquidMetalText as="h1" className="text-[28px] sm:text-[32px] lg:text-[40px] font-light leading-tight block">
              {user.name || user.email.split("@")[0]}
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mt-2 max-w-2xl leading-relaxed">
              {archetype.desc}
            </p>
          </div>

          {/* Profile hero card — avatar + role + archetype */}
          <ShellCard className="p-6 mb-5 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4">
              <div className="relative shrink-0">
                <div className="w-16 h-16 rounded-full bg-gradient-to-br from-[#C5A572]/20 to-[#7A8B6F]/10 border border-[#C5A572]/30 flex items-center justify-center text-3xl">
                  {archetype.icon}
                </div>
                <div className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#0A0908] border border-[#C5A572]/40 flex items-center justify-center">
                  <Crown className="w-3 h-3 text-[#C5A572]" />
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1 flex-wrap">
                  <GlowPill color="#C5A572" className="text-[10px] uppercase tracking-wide">
                    {(user.role ?? "user").replace(/_/g, " ")}
                  </GlowPill>
                  <GlowPill color="#7A8B6F" className="text-[10px]">
                    {archetype.icon} {archetype.name}
                  </GlowPill>
                </div>
                <div className="text-[11px] text-[#9C9489] mb-1">Member since {memberSinceLabel}</div>
                <div className="text-[12px] text-[#9C9489] leading-relaxed">{archetype.desc}</div>
              </div>
              <div className="shrink-0 sm:self-end">
                <ShimmerButton
                  tone="gold"
                  onClick={() => setView("analytics")}
                  className="px-4 py-2 text-[12px]"
                >
                  <BarChart3 className="w-3.5 h-3.5" /> Full analytics
                </ShimmerButton>
              </div>
            </div>
          </ShellCard>

          {/* Lifetime stats — 4 AuroraGlowCards */}
          <SectionTitle eyebrow="Lifetime totals" className="mb-3" />
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <LifetimeStat
              icon={CloverIcon}
              label="Luck Balance"
              value={user.luckBalance}
              sub="Spendable now"
              accent="#C5A572"
              showClover
            />
            <LifetimeStat
              icon={Calendar}
              label="Days Active"
              value={daysActive}
              sub={`${user.streak} day streak`}
              accent="#7A8B6F"
            />
            <LifetimeStat
              icon={Sparkles}
              label="Total Readings"
              value={lifetimeReadings}
              sub="Across all practices"
              accent="#9E8AC9"
            />
            <LifetimeStat
              icon={Flame}
              label="Day Streak"
              value={user.streak}
              sub="Daily ritual chain"
              accent="#F09A3D"
            />
          </div>

          {/* Practice breakdown — 6 AuroraGlowCards */}
          <SectionTitle eyebrow="Practice breakdown" className="mb-3" />
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 mb-6">
            <PracticeStat icon={Sparkles} label="Tarot" value={totals?.tarot ?? 0} color="#C5A87C" />
            <PracticeStat icon={MessageCircle} label="Chats" value={totals?.chat ?? 0} color="#5FA9C7" />
            <PracticeStat icon={Moon} label="Frequency" value={totals?.frequency ?? 0} color="#9E8AC9" />
            <PracticeStat icon={Target} label="Manifest" value={totals?.manifest ?? 0} color="#B5CD7E" />
            <PracticeStat icon={Flame} label="Rituals" value={totals?.ritual ?? 0} color="#F09A3D" />
            <PracticeStat icon={Heart} label="Mood" value={totals?.mood ?? 0} color="#D876A0" />
          </div>

          {/* Birth Data ShellCard */}
          <BirthDataCard
            birthData={birthData}
            onEdit={() => setView("birth-chart")}
          />

          {/* 7-day activity heatmap */}
          <ShellCard className="p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Calendar className="w-3.5 h-3.5 text-[#C5A572]" />
                <span className="text-[12px] text-[#9C9489] font-medium">7-Day Activity</span>
              </div>
              <GlowPill color="#7A8B6F" className="text-[10px]">
                {activeDays}/7 active · {totalActionsThisWeek} actions
              </GlowPill>
            </div>
            <div className="grid grid-cols-7 gap-1.5 mb-3">
              {days.map((day: any, i: number) => {
                const isToday = i === days.length - 1;
                const total = day?.total ?? 0;
                const intensity = Math.min(total / 4, 1);
                const bg = total === 0
                  ? "rgba(255,255,255,0.03)"
                  : `rgba(197, 168, 124, ${0.2 + intensity * 0.6})`;
                return (
                  <div key={i} className="flex flex-col items-center gap-1">
                    <div
                      className={cn(
                        "w-full aspect-square rounded-sm flex items-center justify-center text-[10px] border",
                        total > 0
                          ? "border-[#C5A572]/40 text-[#F0D9A8]"
                          : "border-[#2A2722] text-[#9C9489]/40"
                      )}
                      style={{ background: bg, color: total > 0 ? "#F0D9A8" : "rgba(255,255,255,0.2)" }}
                      title={`${day?.label ?? ""} · ${total} activit${total === 1 ? "y" : "ies"}`}
                    >
                      {total > 0 ? total : "·"}
                    </div>
                    <span className={cn("text-[9px]", isToday ? "text-[#C5A572] font-medium" : "text-[#9C9489]")}>
                      {day?.label ?? "—"}
                    </span>
                  </div>
                );
              })}
            </div>
            <div className="flex items-center justify-between text-[9px] text-[#9C9489]">
              <span>Less</span>
              <div className="flex items-center gap-0.5">
                {[0.03, 0.3, 0.55, 0.8, 1].map((i) => (
                  <div
                    key={i}
                    className="w-3 h-3 rounded-sm"
                    style={{ background: i === 0.03 ? "rgba(255,255,255,0.03)" : `rgba(197,168,124,${i})` }}
                  />
                ))}
              </div>
              <span>More</span>
            </div>
          </ShellCard>

          {/* Achievements */}
          <ShellCard className="p-5 mb-5">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center gap-2">
                <Award className="w-3.5 h-3.5 text-[#C5A572]" />
                <span className="text-[12px] text-[#9C9489] font-medium">Achievements</span>
              </div>
              <span className="text-[11px] text-[#C5A572]">
                {totals ? evaluateAchievements({ tarot: totals.tarot, chat: totals.chat, frequency: totals.frequency, manifest: totals.manifest, ritual: totals.ritual, mood: totals.mood, streak: user.streak, luckEarned: totals.luckEarned }).unlocked.length : 0}/{ACHIEVEMENTS.length}
              </span>
            </div>
            <div className="grid grid-cols-4 sm:grid-cols-6 gap-2 mb-3">
              {ACHIEVEMENTS.map((a) => {
                const unlocked = totals ? a.check({ tarot: totals.tarot, chat: totals.chat, frequency: totals.frequency, manifest: totals.manifest, ritual: totals.ritual, mood: totals.mood, streak: user.streak, luckEarned: totals.luckEarned }) : false;
                const color = tierColor(a.tier);
                return (
                  <div
                    key={a.id}
                    className={cn(
                      "flex flex-col items-center gap-1 p-2 text-center transition",
                      unlocked ? "opacity-100" : "opacity-30"
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
            {/* Progress to next achievement */}
            <div className="pt-3 border-t border-[#2A2722] text-[11px] text-[#9C9489] leading-relaxed">
              {totals ? (() => {
                const next = ACHIEVEMENTS.find((a) =>
                  !a.check({ tarot: totals.tarot, chat: totals.chat, frequency: totals.frequency, manifest: totals.manifest, ritual: totals.ritual, mood: totals.mood, streak: user.streak, luckEarned: totals.luckEarned })
                );
                return next
                  ? <>Next: <span className="text-[#C5A572]">{next.name}</span> — {next.description}</>
                  : <span className="text-[#C5A572]">All achievements unlocked ✦</span>;
              })() : "—"}
            </div>
          </ShellCard>

          {/* Referral earnings card */}
          <ReferralEarningsCard user={user} />

          {/* Saved insights */}
          <SavedInsights />

          {/* Settings */}
          <ShellCard className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <Shield className="w-3.5 h-3.5 text-[#C5A572]" />
              <span className="text-[12px] text-[#9C9489] font-medium">Settings</span>
            </div>
            <div className="space-y-3">
              {/* Language */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Globe className="w-4 h-4 text-[#9C9489]" />
                  <div>
                    <div className="text-[12px] text-[#E8E2D5]">Language</div>
                    <div className="text-[10px] text-[#9C9489]">Preferred display language</div>
                  </div>
                </div>
                <Select value={language} onValueChange={saveLanguage}>
                  <SelectTrigger className="w-32 bg-[#0F0D0B] border-[#2A2722] text-[#E8E2D5] text-[12px] h-8">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
                    {LANGUAGES.map((l) => (
                      <SelectItem key={l.code} value={l.code} className="text-[12px]">
                        {l.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {/* Theme indicator (read-only — dark is enforced) */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <MoonIcon className="w-4 h-4 text-[#9C9489]" />
                  <div>
                    <div className="text-[12px] text-[#E8E2D5]">Theme</div>
                    <div className="text-[10px] text-[#9C9489]">Dark mode (locked)</div>
                  </div>
                </div>
                <GlowPill color="#9E8AC9" className="text-[10px]">
                  <Sun className="w-3 h-3" /> Dark
                </GlowPill>
              </div>
              {/* Notifications */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-[#9C9489]" />
                  <div>
                    <div className="text-[12px] text-[#E8E2D5]">Notifications</div>
                    <div className="text-[10px] text-[#9C9489]">Daily reminders and updates</div>
                  </div>
                </div>
                <Switch
                  checked={notifications}
                  onCheckedChange={toggleNotifications}
                />
              </div>
              {/* Privacy link */}
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Lock className="w-4 h-4 text-[#9C9489]" />
                  <div>
                    <div className="text-[12px] text-[#E8E2D5]">Privacy</div>
                    <div className="text-[10px] text-[#9C9489]">Your data and your rights</div>
                  </div>
                </div>
                <button
                  onClick={() => toast.info("Privacy policy opens externally")}
                  className="inline-flex items-center gap-1 text-[11px] text-[#9C9489] hover:text-[#C5A572] transition"
                >
                  View <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </ShellCard>

          {/* Account info */}
          <ShellCard className="p-5 mb-5">
            <div className="flex items-center gap-2 mb-3">
              <BookOpen className="w-3.5 h-3.5 text-[#C5A572]" />
              <span className="text-[12px] text-[#9C9489] font-medium">Account</span>
            </div>
            <div className="grid grid-cols-2 gap-3 text-[12px] mb-4">
              <div>
                <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">Email</div>
                <div className="text-[#E8E2D5] truncate">{user.email}</div>
              </div>
              <div>
                <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">Member since</div>
                <div className="text-[#E8E2D5]">{memberSinceLabel}</div>
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
              <ShimmerButton
                tone="gold"
                onClick={() => window.open("/api/export", "_blank")}
                className="px-3 py-2 text-[12px]"
              >
                <Download className="w-3.5 h-3.5" /> Export my data
              </ShimmerButton>
              <button
                onClick={() => setShowDelete(true)}
                className="px-3 py-2 rounded-sm text-[12px] border border-[#C26B5C]/20 text-[#C26B5C]/70 hover:text-[#C26B5C] hover:border-[#C26B5C]/40 transition flex items-center gap-1.5"
              >
                <Trash2 className="w-3 h-3" /> Delete account
              </button>
            </div>
          </ShellCard>

          {showDelete && <DeleteAccountModal onClose={() => setShowDelete(false)} />}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// safeParseBirthData — defensive JSON parse
// ============================================================

function safeParseBirthData(raw: string): Record<string, any> | null {
  try {
    const parsed = JSON.parse(raw);
    if (typeof parsed === "object" && parsed !== null) return parsed as Record<string, any>;
    return null;
  } catch {
    return null;
  }
}

// ============================================================
// determineArchetype — pick archetype from totals
// ============================================================

function determineArchetype(totals: any) {
  if (!totals) return { name: "Seeker", icon: "✦", desc: "Your journey is just beginning.", color: "#9C9489" };
  const { tarot, chat, frequency, manifest, ritual } = totals;
  const max = Math.max(tarot, chat, frequency, manifest, ritual);
  if (max === 0) return { name: "Seeker", icon: "✦", desc: "Your journey is just beginning.", color: "#9C9489" };
  if (max === chat) return { name: "The Seeker", icon: "🌙", desc: "You turn to the stars for guidance. The astrologer is your trusted confidant.", color: "#9CB4D1" };
  if (max === tarot) return { name: "The Cartomancer", icon: "🃏", desc: "You read the cards with intuition. The deck speaks to you in symbols.", color: "#C5A87C" };
  if (max === frequency) return { name: "The Resonator", icon: "♪", desc: "You tune your mind with sound. Frequencies are your daily medicine.", color: "#9E8AC9" };
  if (max === manifest) return { name: "The Manifestor", icon: "◎", desc: "You shape reality through intention. Daily practice is your power.", color: "#B5CD7E" };
  if (max === ritual) return { name: "The Devoted", icon: "🔥", desc: "You honor the old ways. Ritual is the rhythm of your life.", color: "#F09A3D" };
  return { name: "Seeker", icon: "✦", desc: "Your journey is just beginning.", color: "#9C9489" };
}

// ============================================================
// LifetimeStat — premium AuroraGlowCard with NumberTicker
// ============================================================

function LifetimeStat({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  showClover,
}: {
  icon: any;
  label: string;
  value: number;
  sub: string;
  accent: string;
  showClover?: boolean;
}) {
  return (
    <AuroraGlowCard className="p-4" glowColor={accent} glowIntensity={0.1}>
      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wide text-[#9C9489]">
        <Icon className="w-3 h-3" style={{ color: accent }} /> {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        {showClover && <CloverIcon className="w-4 h-4 text-[#C5A572] shrink-0" strokeWidth={1.6} aria-label="Luck" />}
        <NumberTicker
          value={value}
          className="serif-display text-[1.6rem] text-[#E8E2D5] tabular-nums leading-none"
        />
      </div>
      <div className="text-[10px] text-[#9C9489] mt-1">{sub}</div>
    </AuroraGlowCard>
  );
}

// ============================================================
// PracticeStat — small AuroraGlowCard with colored icon
// ============================================================

function PracticeStat({ icon: Icon, label, value, color }: { icon: any; label: string; value: number; color: string }) {
  return (
    <AuroraGlowCard className="p-3 text-center" glowColor={color} glowIntensity={0.08}>
      <div className="flex justify-center mb-1.5">
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <NumberTicker
        value={value}
        className="serif-display text-[1.4rem] text-[#E8E2D5] tabular-nums leading-none block"
      />
      <div className="text-[9px] text-[#9C9489] mt-0.5 leading-tight">{label}</div>
    </AuroraGlowCard>
  );
}

// ============================================================
// BirthDataCard — premium ShellCard with zodiac pill + grid
// ============================================================

function BirthDataCard({
  birthData,
  onEdit,
}: {
  birthData: Record<string, any> | null;
  onEdit: () => void;
}) {
  const fields: Array<{ key: string; label: string; value: string }> = [];
  if (birthData?.dob) fields.push({ key: "dob", label: "Date of birth", value: String(birthData.dob) });
  if (birthData?.tob) fields.push({ key: "tob", label: "Time of birth", value: String(birthData.tob) });
  if (birthData?.place) fields.push({ key: "place", label: "Birth place", value: String(birthData.place) });
  if (birthData?.latitude != null && birthData?.longitude != null) {
    fields.push({
      key: "coords",
      label: "Coordinates",
      value: `${birthData.latitude.toFixed(2)}, ${birthData.longitude.toFixed(2)}`,
    });
  }
  if (birthData?.gender) fields.push({ key: "gender", label: "Gender", value: String(birthData.gender) });
  if (birthData?.timezone) fields.push({ key: "tz", label: "Timezone", value: String(birthData.timezone) });

  const zodiac = inferZodiac(birthData?.dob);

  return (
    <ShellCard className="p-5 mb-5 relative overflow-hidden">
      {/* CloverPNG watermark */}
      <CloverPNG
        aria-hidden
        className="absolute -right-4 -top-4 w-24 h-24 opacity-[0.05] pointer-events-none"
      />
      <div className="relative z-10">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Star className="w-3.5 h-3.5 text-[#C5A572]" />
            <span className="text-[12px] text-[#9C9489] font-medium">Birth Data</span>
          </div>
          {zodiac && (
            <GlowPill color="#9E8AC9" className="text-[10px]">
              {zodiac.symbol} {zodiac.name}
            </GlowPill>
          )}
        </div>
        {fields.length === 0 ? (
          <div className="text-[12px] text-[#9C9489] leading-relaxed mb-4">
            No birth data on file. Add your birth details to unlock personalized horoscopes, birth charts, and Mahabote numerology.
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-4">
            {fields.map((f) => (
              <div key={f.key}>
                <div className="text-[#9C9489] text-[10px] uppercase tracking-wide">{f.label}</div>
                <div className="text-[#E8E2D5] text-[12px] truncate">{f.value}</div>
              </div>
            ))}
          </div>
        )}
        <ShimmerButton
          tone="gold"
          onClick={onEdit}
          className="px-4 py-2 text-[12px]"
        >
          <Pencil className="w-3.5 h-3.5" /> Edit birth data
        </ShimmerButton>
      </div>
    </ShellCard>
  );
}

// ============================================================
// inferZodiac — simple sun sign lookup from dob (YYYY-MM-DD)
// ============================================================

function inferZodiac(dob?: string | null): { name: string; symbol: string } | null {
  if (!dob) return null;
  const parts = String(dob).split("-").map((p) => parseInt(p, 10));
  if (parts.length < 2 || parts.some((p) => Number.isNaN(p))) return null;
  const [year, month, day] = parts;
  // Zodiac signs (Western) — start dates
  const zodiacSigns: Array<{ name: string; symbol: string; from: [number, number]; to: [number, number] }> = [
    { name: "Capricorn", symbol: "♑", from: [12, 22], to: [1, 19] },
    { name: "Aquarius", symbol: "♒", from: [1, 20], to: [2, 18] },
    { name: "Pisces", symbol: "♓", from: [2, 19], to: [3, 20] },
    { name: "Aries", symbol: "♈", from: [3, 21], to: [4, 19] },
    { name: "Taurus", symbol: "♉", from: [4, 20], to: [5, 20] },
    { name: "Gemini", symbol: "♊", from: [5, 21], to: [6, 20] },
    { name: "Cancer", symbol: "♋", from: [6, 21], to: [7, 22] },
    { name: "Leo", symbol: "♌", from: [7, 23], to: [8, 22] },
    { name: "Virgo", symbol: "♍", from: [8, 23], to: [9, 22] },
    { name: "Libra", symbol: "♎", from: [9, 23], to: [10, 22] },
    { name: "Scorpio", symbol: "♏", from: [10, 23], to: [11, 21] },
    { name: "Sagittarius", symbol: "♐", from: [11, 22], to: [12, 21] },
  ];
  const sign = zodiacSigns.find((s) => {
    const afterFrom = (month === s.from[0] && day >= s.from[1]) || month > s.from[0];
    const beforeTo = (month === s.to[0] && day <= s.to[1]) || month < s.to[0];
    if (s.from[0] > s.to[0]) {
      // Crosses year boundary
      return afterFrom || beforeTo;
    }
    return afterFrom && beforeTo;
  });
  // Use year to avoid unused variable
  void year;
  return sign ?? null;
}

// ============================================================
// DeleteAccountModal — confirmation modal
// ============================================================

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

// ============================================================
// SavedInsights — bookmarked deep readings
// ============================================================

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
    <ShellCard className="p-5 mb-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Bookmark className="w-3.5 h-3.5 text-[#C5A572]" />
          <span className="text-[12px] text-[#9C9489] font-medium">Saved Insights</span>
        </div>
        <GlowPill color="#C5A572" className="text-[10px]">{insights.length} bookmarked</GlowPill>
      </div>
      <div className="space-y-2 max-h-80 overflow-y-auto lumina-scroll">
        {insights.slice(0, 10).map((ins) => {
          const isOpen = expanded === ins.id;
          return (
            <div key={ins.id} className="rounded-sm border border-[#2A2722] bg-white/[0.02] overflow-hidden">
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
    </ShellCard>
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
    <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} className="p-5 mb-5 relative overflow-hidden">
      {/* CloverPNG watermark */}
      <CloverPNG
        aria-hidden
        className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.06] pointer-events-none"
      />
      <div className="relative z-10">
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
            <div className="space-y-1.5 max-h-48 overflow-y-auto lumina-scroll">
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
                      <NumberTicker value={r.totalLuck ?? 0} />
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
