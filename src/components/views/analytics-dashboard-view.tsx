"use client";

import * as React from "react";
import {
  GlassCard, GoldButton, GhostButton, Pill, SectionTitle, ShellCard,
} from "@/components/lumina/primitives";
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
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <BarChart3 className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
          <div className="text-[16px] text-[#E8E2D5] mb-1">Sign in to view insights</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  if (loading || !analytics) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-5 h-5 animate-spin text-[#C5A572]" />
      </div>
    );
  }

  const hasAnyActivity = analytics.totals.daysActive > 0;

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-5xl mx-auto px-6 py-10 lg:py-14">
        {/* Header — serif, no icon-in-row */}
        <div className="mb-10 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">Your practice</div>
          <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight">
            Insights
          </h1>
        </div>

        {!hasAnyActivity ? (
          <div className="pt-8 border-t border-[#2A2722]">
            <div className="text-[14px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
              Start using Baydin — record dreams, draw tarot, chat with the astrologer, complete rituals — and your patterns will appear here.
            </div>
          </div>
        ) : (
          <>
            {/* Top stats — hairline grid, no cards */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-[#2A2722] border border-[#2A2722] mb-10">
              <StatCard icon={Moon} label="Dreams" value={analytics.totals.dreams} accent="#C5A87C" />
              <StatCard icon={Sparkles} label="Tarot" value={analytics.totals.tarotReadings} accent="#D4A0B8" />
              <StatCard icon={MessageCircle} label="Chat turns" value={analytics.totals.chatMessages} accent="#9CB4D1" />
              <StatCard icon={Calendar} label="Days active" value={analytics.totals.daysActive} accent="#7A8B6F" />
              <StatCard icon={Flame} label="Rituals" value={analytics.totals.ritualsCompleted} accent="#B8553F" />
              <StatCard icon={Waves} label="Frequencies" value={analytics.totals.frequencySessions} accent="#6F8BA0" />
              <StatCard icon={Heart} label="Affirmations" value={analytics.totals.positivitySessions} accent="#D58FA3" />
              <StatCard icon={Target} label="Goals" value={analytics.totals.goals} accent="#8FA37E" />
            </div>

            {/* Luck breakdown */}
            <SectionTitle className="mb-3">Luck Economy</SectionTitle>
            <GlassCard className="p-5 lg:p-6 mb-6">
              <div className="grid grid-cols-3 gap-3 mb-4">
                <LuckStat label="Balance" value={analytics.luck.balance} color="#C5A87C" />
                <LuckStat label="Total Earned" value={analytics.luck.totalEarned} color="#7A8B6F" />
                <LuckStat label="Total Spent" value={analytics.luck.totalSpent} color="#B8553F" />
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
            </GlassCard>

            {/* Two-column section: Ritual streak + Practice activity */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
              {/* Ritual streak */}
              <GlassCard className="p-5 lg:p-6">
                <div className="flex items-center gap-2 mb-3">
                  <Flame className="w-4 h-4 text-[#C5A572]" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Ritual Streak</div>
                </div>
                <div className="flex items-baseline gap-4 mb-4">
                  <div>
                    <div className="text-[36px] font-light text-[#C5A572] leading-none">{analytics.ritualStreak.current}</div>
                    <div className="text-[10px] text-[#9C9489] mt-0.5">current</div>
                  </div>
                  <div className="text-[#9C9489]/40">/</div>
                  <div>
                    <div className="text-[24px] font-light text-[#9C9489] leading-none">{analytics.ritualStreak.longest}</div>
                    <div className="text-[10px] text-[#9C9489] mt-0.5">longest</div>
                  </div>
                </div>
                {/* Last 7 days dots */}
                <div className="flex items-center gap-1.5">
                  {analytics.ritualStreak.last7.map((d) => {
                    const dayLabel = new Date(d.date + "T12:00:00").toLocaleDateString("en-US", { weekday: "narrow" });
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
              </GlassCard>

              {/* Practice activity heatmap (last 14 days) */}
              <GlassCard className="p-5 lg:p-6">
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
              </GlassCard>
            </div>

            {/* Dreams analysis */}
            {analytics.totals.dreams > 0 && (
              <>
                <SectionTitle className="mb-3">Dream Patterns</SectionTitle>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
                  {/* Dreams by mood */}
                  {analytics.dreamsByMood.length > 0 && (
                    <GlassCard className="p-5 lg:p-6">
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
                              <div className="text-[11px] text-[#9C9489] w-6 text-right">{item.count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>
                  )}

                  {/* Dreams by moon phase */}
                  {analytics.dreamsByMoonPhase.length > 0 && (
                    <GlassCard className="p-5 lg:p-6">
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
                              <div className="text-[11px] text-[#9C9489] w-6 text-right">{item.count}</div>
                            </div>
                          );
                        })}
                      </div>
                    </GlassCard>
                  )}
                </div>

                {/* Top dream symbols */}
                {analytics.topDreamSymbols.length > 0 && (
                  <GlassCard className="p-5 lg:p-6 mb-6">
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
                  </GlassCard>
                )}
              </>
            )}

            {/* Tarot spread distribution */}
            {analytics.tarotBySpread.length > 0 && (
              <GlassCard className="p-5 lg:p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <Sparkles className="w-4 h-4 text-[#C5A572]" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Tarot Spreads Used</div>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {analytics.tarotBySpread.map((s) => (
                    <div key={s.spread} className="p-3 rounded-sm bg-black/20 border border-[#2A2722]">
                      <div className="text-[11px] text-[#9C9489] truncate">{SPREAD_LABELS[s.spread] || s.spread}</div>
                      <div className="text-[20px] font-light text-[#E8E2D5] mt-0.5">{s.count}</div>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Mood trend */}
            {analytics.moodTrend.length > 0 && (
              <GlassCard className="p-5 lg:p-6 mb-6">
                <div className="flex items-center gap-2 mb-3">
                  <TrendingUp className="w-4 h-4 text-[#C5A572]" />
                  <div className="text-[10px] uppercase tracking-[0.2em] text-[#C5A572]">Mood Trend · last 30 days</div>
                </div>
                <MoodTrendChart data={analytics.moodTrend} />
              </GlassCard>
            )}
          </>
        )}
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
    <div className="p-5 bg-[#0A0908]">
      <div className="flex items-center gap-2 mb-3">
        <Icon className="w-3.5 h-3.5" style={{ color: accent }} />
        <div className="text-[11px] text-[#6B6358] font-medium">{label}</div>
      </div>
      <div className="serif-display text-[2rem] text-[#E8E2D5] leading-none tabular-nums">{value}</div>
    </div>
  );
}

function LuckStat({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="p-4 bg-[#0A0908] border border-[#2A2722] text-center">
      <div className="text-[11px] text-[#6B6358] mb-1.5 font-medium">{label}</div>
      <div className="serif-display text-[1.75rem] leading-none tabular-nums" style={{ color }}>{value}</div>
      <div className="text-[10px] text-[#6B6358] mt-1">Luck</div>
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
