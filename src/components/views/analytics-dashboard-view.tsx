"use client";

import * as React from "react";
import {
  GlassCard, GoldButton, Pill, SectionTitle, ShellCard, StarField,
} from "@/components/lumina/primitives";
import {
  AuroraGlowCard,
  GlowPill,
  LiquidMetalText,
  NumberTicker,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, CloverPNG } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import type { AnalyticsPayload } from "@/lib/analytics";
import {
  BarChart3, Moon, Star, Sparkles, Wallet, Flame, MessageCircle,
  BookOpen, Waves, Heart, Target, Calendar, TrendingUp, Award, Loader2,
  Zap, Hash,
} from "lucide-react";
import { toast } from "sonner";

const MOOD_META: Record<string, { label: string; emoji: string; color: string }> = {
  peaceful: { label: "Peaceful", emoji: "🌙", color: "#9CB4D1" },
  vivid: { label: "Vivid", emoji: "✨", color: "#C5A87C" },
  nightmare: { label: "Nightmare", emoji: "🔥", color: "#B8553F" },
  lucid: { label: "Lucid", emoji: "👁", color: "#7A8B6F" },
  prophetic: { label: "Prophetic", emoji: "⭐", color: "#D4A0B8" },
  neutral: { label: "Neutral", emoji: "○", color: "#8B7355" },
};

const FEATURE_LABELS: Record<string, string> = {
  astrologer_chat: "Astrologer Chat",
  birth_chart: "Birth Chart",
  insight: "Insights",
  life_report: "Life Report",
  compatibility: "Compatibility",
  mahabote: "Mahabote",
  horoscope_personal: "Personal Horoscope",
  tarot_premium: "Premium Tarot",
  numerology: "Numerology",
};

const SPREAD_LABELS: Record<string, string> = {
  "yes-no": "Yes/No",
  single: "Single Card",
  "three-card": "Three Card",
  "celtic-cross": "Celtic Cross",
  relationship: "Relationship",
  career: "Career",
  "card-of-day": "Card of Day",
};

const EARNED_LABELS: Record<string, string> = {
  purchase: "Purchased",
  daily_reward: "Daily Reward",
  referral_bonus: "Referral Bonus",
  admin_grant: "Admin Grant",
  signup_bonus: "Signup Bonus",
  reseller_transfer_in: "Reseller Transfer",
};

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];

export function AnalyticsDashboardView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [analytics, setAnalytics] = React.useState<AnalyticsPayload | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    if (!user) return;
    setLoading(true);
    api<AnalyticsPayload>("/api/analytics")
      .then(setAnalytics)
      .catch((e) => toast.error(e.message))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={24} />
        </div>
        <div className="relative z-10 min-w-0 flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <BarChart3 className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
            <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to view insights</div>
            <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
          </div>
        </div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={24} />
        </div>
        <div className="relative z-10 min-w-0 flex-1 flex items-center justify-center">
          <div className="flex items-center gap-2 text-[#9C9489]">
            <Loader2 className="w-5 h-5 animate-spin text-[#C5A572]" />
            <span className="text-[12px]">Loading your insights…</span>
          </div>
        </div>
      </div>
    );
  }

  const hasAnyActivity = analytics.totals.daysActive > 0;

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Backdrop: AnimatedGradientBackground (cosmic) + StarField (30) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>

      <div className="relative z-10 min-w-0 overflow-hidden flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 pb-20">
          {/* Hero */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <BarChart3 className="w-5 h-5 text-[#C5A572]" />
              <GlowPill color="#C5A572" className="!text-[10px] uppercase tracking-wide">
                Your practice
              </GlowPill>
              <GlowPill color="#7A8B6F" className="text-[10px]">
                {analytics.totals.daysActive} days active
              </GlowPill>
            </div>
            <LiquidMetalText as="h1" className="text-[28px] sm:text-[32px] lg:text-[40px] font-light leading-tight block">
              Your Practice Insights
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mt-2 max-w-2xl leading-relaxed">
              Patterns across your dreams, tarot readings, astrologer chats, rituals, and Luck economy.
            </p>
          </div>

          {!hasAnyActivity ? (
            <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-6">
              <div className="text-[14px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
                Start using Baydin — record dreams, draw tarot, chat with the astrologer, complete rituals — and your patterns will appear here.
              </div>
            </AuroraGlowCard>
          ) : (
            <>
              {/* Top stats — 8 AuroraGlowCards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                <StatCard icon={Moon} label="Dreams" value={analytics.totals.dreams} accent="#C5A87C" />
                <StatCard icon={Sparkles} label="Tarot" value={analytics.totals.tarotReadings} accent="#D4A0B8" />
                <StatCard icon={MessageCircle} label="Chat turns" value={analytics.totals.chatMessages} accent="#9CB4D1" />
                <StatCard icon={Calendar} label="Days active" value={analytics.totals.daysActive} accent="#7A8B6F" />
                <StatCard icon={Flame} label="Rituals" value={analytics.totals.ritualsCompleted} accent="#B8553F" />
                <StatCard icon={Waves} label="Frequencies" value={analytics.totals.frequencySessions} accent="#6F8BA0" />
                <StatCard icon={Heart} label="Affirmations" value={analytics.totals.positivitySessions} accent="#D58FA3" />
                <StatCard icon={Target} label="Goals" value={analytics.totals.goals} accent="#8FA37E" />
              </div>

              {/* Luck Economy (AuroraGlowCard with CloverPNG watermark) */}
              <div className="mb-3 flex items-center justify-between">
                <SectionTitle eyebrow="In-app credit">Luck Economy</SectionTitle>
                <GlowPill color="#C5A572" className="text-[10px]">
                  <CloverIcon className="w-3 h-3" /> Live
                </GlowPill>
              </div>
              <AuroraGlowCard
                glowColor="#C5A572"
                glowIntensity={0.12}
                className="p-5 lg:p-6 mb-6 relative overflow-hidden"
              >
                <CloverPNG
                  aria-hidden
                  className="absolute -right-4 -bottom-4 w-32 h-32 opacity-[0.06] pointer-events-none"
                />
                <div className="relative z-10">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-4">
                    <LuckStat label="Balance" value={analytics.luck.balance} accent="#C5A87C" />
                    <LuckStat label="Total Earned" value={analytics.luck.totalEarned} accent="#7A8B6F" />
                    <LuckStat label="Total Spent" value={analytics.luck.totalSpent} accent="#B8553F" />
                  </div>

                  {/* Spent by feature bar chart */}
                  {analytics.luck.spentByFeature.length > 0 && (
                    <div className="mb-4">
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#9C9489] mb-2">Spent by Feature</div>
                      <div className="space-y-2">
                        {analytics.luck.spentByFeature.map((item) => {
                          const maxAmount = Math.max(...analytics.luck.spentByFeature.map((x) => x.amount), 1);
                          const pct = (item.amount / maxAmount) * 100;
                          return (
                            <div key={item.feature} className="flex items-center gap-3">
                              <div className="text-[11px] text-[#E8E2D5] w-32 truncate">{FEATURE_LABELS[item.feature] || item.feature}</div>
                              <div className="flex-1 h-5 bg-black/30 rounded-md overflow-hidden relative">
                                <div
                                  className="h-full bg-gradient-to-r from-gold/40 to-gold rounded-md transition-all"
                                  style={{ width: `${pct}%` }}
                                />
                                <div className="absolute inset-0 flex items-center justify-between px-2 text-[10px] text-[#E8E2D5]">
                                  <span></span>
                                  <span>{item.amount} Luck · {item.count}×</span>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Earned by type */}
                  {analytics.luck.earnedByType.length > 0 && (
                    <div>
                      <div className="text-[11px] uppercase tracking-[0.18em] text-[#9C9489] mb-2">Earned by Source</div>
                      <div className="flex flex-wrap gap-2">
                        {analytics.luck.earnedByType.map((item) => (
                          <span key={item.type} className="text-[11px] px-2.5 py-1 rounded-full bg-leaf/10 border border-leaf/20 text-[#7A8B6F]">
                            {EARNED_LABELS[item.type] || item.type}: +{item.amount} ({item.count}×)
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </AuroraGlowCard>

              {/* Two-column section: Ritual streak + Practice activity */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                {/* Ritual streak */}
                <AuroraGlowCard glowColor="#F09A3D" glowIntensity={0.1} className="p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Flame className="w-4 h-4 text-[#C5A572]" />
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Ritual Streak</div>
                  </div>
                  <div className="flex items-baseline gap-4 mb-4">
                    <div>
                      <NumberTicker
                        value={analytics.ritualStreak.current}
                        className="text-[36px] font-light text-[#C5A572] leading-none tabular-nums"
                      />
                      <div className="text-[10px] text-[#9C9489] mt-0.5">current</div>
                    </div>
                    <div className="text-[#9C9489]/40">/</div>
                    <div>
                      <NumberTicker
                        value={analytics.ritualStreak.longest}
                        className="text-[24px] font-light text-[#9C9489] leading-none tabular-nums"
                      />
                      <div className="text-[10px] text-[#9C9489] mt-0.5">longest</div>
                    </div>
                  </div>
                  {/* Last 7 days dots with S/M/T/W/T/F/S labels */}
                  <div className="grid grid-cols-7 gap-1.5">
                    {analytics.ritualStreak.last7.map((d, i) => {
                      const dayLabel = DAY_LABELS[i] ?? new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
                      return (
                        <div key={d.date} className="flex flex-col items-center gap-1">
                          <div
                            className={cn(
                              "w-7 h-7 rounded-md flex items-center justify-center text-[10px] border",
                              d.completed
                                ? "bg-[#C5A572]/20 border-[#C5A572]/40 text-[#C5A572]"
                                : "bg-black/20 border-[#2A2722] text-[#9C9489]/40"
                            )}
                            title={`${d.date} · ${d.completed ? "completed" : "—"}`}
                          >
                            {d.completed ? "✦" : "·"}
                          </div>
                          <span className="text-[9px] text-[#9C9489]">{dayLabel}</span>
                        </div>
                      );
                    })}
                  </div>
                </AuroraGlowCard>

                {/* Practice activity heatmap (last 14 days) */}
                <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-5 lg:p-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Zap className="w-4 h-4 text-[#C5A572]" />
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Practice Activity · 14 days</div>
                  </div>
                  <div className="grid grid-cols-7 gap-1.5">
                    {analytics.practiceActivity.map((d) => {
                      const intensity = Math.min(d.count / 4, 1); // 4 = max activities per day
                      const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { day: "numeric" });
                      const bg = d.count === 0
                        ? "rgba(255,255,255,0.03)"
                        : `rgba(197, 168, 124, ${0.2 + intensity * 0.6})`;
                      return (
                        <div
                          key={d.date}
                          className="aspect-square rounded-md flex items-center justify-center text-[10px] border border-[#2A2722]"
                          style={{ background: bg, color: d.count > 0 ? "#F0D9A8" : "rgba(255,255,255,0.2)" }}
                          title={`${d.date} · ${d.count} activit${d.count === 1 ? "y" : "ies"}`}
                        >
                          {dayLabel}
                        </div>
                      );
                    })}
                  </div>
                  <div className="flex items-center justify-between mt-3 text-[9px] text-[#9C9489]">
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
                </AuroraGlowCard>
              </div>

              {/* Dreams analysis */}
              {analytics.totals.dreams > 0 && (
                <>
                  <div className="mb-3">
                    <SectionTitle eyebrow="Sleep journal">Dream Patterns</SectionTitle>
                  </div>
                  <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 mb-6">
                    {/* Dreams by mood */}
                    {analytics.dreamsByMood.length > 0 && (
                      <AuroraGlowCard glowColor="#9CB4D1" glowIntensity={0.08} className="p-5 lg:p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Moon className="w-4 h-4 text-[#C5A572]" />
                          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Dreams by Mood</div>
                        </div>
                        <div className="space-y-2">
                          {analytics.dreamsByMood.map((item) => {
                            const meta = MOOD_META[item.mood] || MOOD_META.neutral;
                            const maxCount = Math.max(...analytics.dreamsByMood.map((x) => x.count), 1);
                            const pct = (item.count / maxCount) * 100;
                            return (
                              <div key={item.mood} className="flex items-center gap-3">
                                <span className="text-[14px] w-6 text-center">{meta.emoji}</span>
                                <div className="text-[11px] text-[#E8E2D5] w-16">{meta.label}</div>
                                <div className="flex-1 h-4 bg-black/30 rounded-md overflow-hidden">
                                  <div
                                    className="h-full rounded-md"
                                    style={{ width: `${pct}%`, background: meta.color }}
                                  />
                                </div>
                                <div className="text-[11px] text-[#9C9489] w-6 text-right">
                                  <NumberTicker value={item.count} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AuroraGlowCard>
                    )}

                    {/* Dreams by moon phase */}
                    {analytics.dreamsByMoonPhase.length > 0 && (
                      <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.08} className="p-5 lg:p-6">
                        <div className="flex items-center gap-2 mb-3">
                          <Moon className="w-4 h-4 text-[#C5A572]" />
                          <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Dreams by Moon Phase</div>
                        </div>
                        <div className="space-y-2">
                          {analytics.dreamsByMoonPhase.map((item) => {
                            const maxCount = Math.max(...analytics.dreamsByMoonPhase.map((x) => x.count), 1);
                            const pct = (item.count / maxCount) * 100;
                            return (
                              <div key={item.phase} className="flex items-center gap-3">
                                <span className="text-[14px] w-6 text-center">{item.emoji}</span>
                                <div className="text-[11px] text-[#E8E2D5] flex-1 truncate">{item.phase}</div>
                                <div className="flex-1 h-4 bg-black/30 rounded-md overflow-hidden">
                                  <div className="h-full bg-gradient-to-r from-ink-muted/30 to-gold rounded-md" style={{ width: `${pct}%` }} />
                                </div>
                                <div className="text-[11px] text-[#9C9489] w-6 text-right">
                                  <NumberTicker value={item.count} />
                                </div>
                              </div>
                            );
                          })}
                        </div>
                      </AuroraGlowCard>
                    )}
                  </div>

                  {/* Top dream symbols */}
                  {analytics.topDreamSymbols.length > 0 && (
                    <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-5 lg:p-6 mb-6">
                      <div className="flex items-center gap-2 mb-3">
                        <Hash className="w-4 h-4 text-[#C5A572]" />
                        <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Top Dream Symbols</div>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {analytics.topDreamSymbols.map((s, i) => (
                          <span
                            key={s.symbol}
                            className="text-[12px] px-3 py-1.5 rounded-full border"
                            style={{
                              background: i === 0 ? "rgba(197,168,124,0.2)" : "rgba(255,255,255,0.03)",
                              borderColor: i === 0 ? "rgba(197,168,124,0.4)" : "rgba(255,255,255,0.08)",
                              color: i === 0 ? "#C5A87C" : "#888",
                            }}
                          >
                            #{s.symbol} <span className="opacity-60 text-[10px]">×{s.count}</span>
                          </span>
                        ))}
                      </div>
                    </AuroraGlowCard>
                  )}
                </>
              )}

              {/* Tarot spread distribution */}
              {analytics.tarotBySpread.length > 0 && (
                <AuroraGlowCard glowColor="#D4A0B8" glowIntensity={0.1} className="p-5 lg:p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <Sparkles className="w-4 h-4 text-[#C5A572]" />
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Tarot Spreads Used</div>
                  </div>
                  <TarotSpreadChart data={analytics.tarotBySpread} />
                </AuroraGlowCard>
              )}

              {/* Mood trend */}
              {analytics.moodTrend.length > 0 && (
                <AuroraGlowCard glowColor="#D58FA3" glowIntensity={0.1} className="p-5 lg:p-6 mb-6">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-4 h-4 text-[#C5A572]" />
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Mood Trend · last 30 days</div>
                  </div>
                  <MoodTrendChart data={analytics.moodTrend} />
                </AuroraGlowCard>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// SUB-COMPONENTS
// ============================================================

function StatCard({
  icon: Icon, label, value, accent,
}: { icon: any; label: string; value: number; accent: string }) {
  return (
    <AuroraGlowCard glowColor={accent} glowIntensity={0.1} className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <div className="text-[11px] text-[#9C9489] font-medium">{label}</div>
      </div>
      <NumberTicker
        value={value}
        className="serif-display text-[2rem] text-[#E8E2D5] leading-none tabular-nums block"
      />
    </AuroraGlowCard>
  );
}

function LuckStat({ label, value, accent }: { label: string; value: number; accent: string }) {
  return (
    <div className="p-4 bg-[#0A0908] border border-[#2A2722] rounded-sm text-center">
      <div className="text-[11px] text-[#9C9489] mb-1.5 font-medium uppercase tracking-wide">{label}</div>
      <div className="flex items-center justify-center gap-1">
        <CloverIcon className="w-4 h-4 text-[#C5A572]" aria-label="Luck" />
        <span style={{ color: accent }}>
          <NumberTicker
            value={value}
            className="serif-display text-[1.75rem] leading-none tabular-nums"
          />
        </span>
      </div>
      <div className="text-[10px] text-[#9C9489] mt-1">Luck</div>
    </div>
  );
}

// ============================================================
// TarotSpreadChart — hand-rolled SVG horizontal bar chart
// ============================================================

function TarotSpreadChart({ data }: { data: { spread: string; count: number }[] }) {
  const maxCount = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="space-y-2">
      {data.map((s) => {
        const pct = (s.count / maxCount) * 100;
        return (
          <div key={s.spread} className="flex items-center gap-3">
            <div className="text-[11px] text-[#E8E2D5] w-24 truncate">
              {SPREAD_LABELS[s.spread] || s.spread}
            </div>
            <div className="flex-1 h-5 bg-black/30 rounded-md overflow-hidden relative">
              <div
                className="h-full bg-gradient-to-r from-[#C5A572]/40 to-[#C5A572] rounded-md transition-all"
                style={{ width: `${pct}%` }}
              />
              <div className="absolute inset-0 flex items-center justify-end px-2 text-[10px] text-[#E8E2D5]">
                <NumberTicker value={s.count} />
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

function MoodTrendChart({ data }: { data: { date: string; mood: number }[] }) {
  if (data.length === 0) {
    return <div className="text-[12px] text-[#9C9489] py-4 text-center">No mood entries yet.</div>;
  }
  const width = 600;
  const height = 120;
  const padding = 8;
  const chartW = width - padding * 2;
  const chartH = height - padding * 2;
  const maxMood = 5;
  const stepX = data.length > 1 ? chartW / (data.length - 1) : 0;

  // Build line path
  const points = data.map((d, i) => ({
    x: padding + i * stepX,
    y: padding + chartH - (d.mood / maxMood) * chartH,
  }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x},${p.y}`).join(" ");
  const areaPath = `${linePath} L ${points[points.length - 1].x},${padding + chartH} L ${points[0].x},${padding + chartH} Z`;

  return (
    <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
      <defs>
        <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#C5A87C" stopOpacity="0.4" />
          <stop offset="100%" stopColor="#C5A87C" stopOpacity="0" />
        </linearGradient>
      </defs>
      {/* Grid lines */}
      {[1, 2, 3, 4, 5].map((m) => {
        const y = padding + chartH - (m / maxMood) * chartH;
        return (
          <g key={m}>
            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.05)" strokeWidth="1" />
            <text x={2} y={y + 3} fontSize="8" fill="rgba(255,255,255,0.3)">{m}</text>
          </g>
        );
      })}
      {/* Area */}
      <path d={areaPath} fill="url(#moodGrad)" />
      {/* Line */}
      <path d={linePath} fill="none" stroke="#C5A87C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      {/* Points */}
      {points.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="2.5" fill="#F0D9A8" stroke="#C5A87C" strokeWidth="1" />
      ))}
    </svg>
  );
}
