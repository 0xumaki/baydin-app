import "server-only";
import { db } from "@/lib/db";
import { buildLunarDay } from "@/lib/lunar-calendar";

/**
 * BAYDIN — Analytics aggregation.
 *
 * Pulls from: MoodEntry, RitualLog, FrequencySession, PositivitySession,
 * TarotReading, LuckTransaction, Conversation, Message, DreamJournal, Goal.
 *
 * Returns a single analytics payload for the Insights Dashboard view.
 */

export type AnalyticsPayload = {
  totals: {
    dreams: number;
    tarotReadings: number;
    conversations: number;
    chatMessages: number;
    frequencySessions: number;
    positivitySessions: number;
    moodEntries: number;
    goals: number;
    ritualsCompleted: number;
    daysActive: number;
  };
  luck: {
    balance: number;
    totalEarned: number;
    totalSpent: number;
    spentByFeature: { feature: string; amount: number; count: number }[];
    earnedByType: { type: string; amount: number; count: number }[];
  };
  dreamsByMood: { mood: string; count: number }[];
  dreamsByMoonPhase: { phase: string; emoji: string; count: number }[];
  moodTrend: { date: string; mood: number }[]; // last 30 days
  ritualStreak: { current: number; longest: number; last7: { date: string; completed: boolean }[] };
  practiceActivity: { date: string; count: number }[]; // last 14 days, any practice
  topDreamSymbols: { symbol: string; count: number }[];
  tarotBySpread: { spread: string; count: number }[];
};

export async function buildAnalytics(userId: string): Promise<AnalyticsPayload> {
  // Run all queries in parallel
  const [
    dreams, tarotReadings, conversations, chatMessages,
    frequencySessions, positivitySessions, moodEntries, goals,
    ritualsCompleted, luckTransactions, user,
  ] = await Promise.all([
    db.dreamJournal.findMany({ where: { userId }, select: { dreamDate: true, mood: true, symbols: true, lunarContext: true } }),
    db.tarotReading.findMany({ where: { userId }, select: { spreadType: true, createdAt: true } }),
    db.conversation.findMany({ where: { userId }, select: { id: true, mode: true, createdAt: true } }),
    db.message.count({ where: { conversation: { userId }, role: "user" } }),
    db.frequencySession.findMany({ where: { userId, completed: true }, select: { createdAt: true, durationSec: true } }),
    db.positivitySession.findMany({ where: { userId }, select: { date: true, category: true } }),
    db.moodEntry.findMany({ where: { userId }, select: { date: true, mood: true }, orderBy: { date: "asc" } }),
    db.goal.count({ where: { userId } }),
    db.ritualLog.count({ where: { userId, completed: true } }),
    db.luckTransaction.findMany({ where: { userId }, select: { amount: true, type: true, feature: true, createdAt: true } }),
    db.user.findUnique({ where: { id: userId }, select: { luckBalance: true, totalLuckEarned: true, totalLuckSpent: true, createdAt: true } }),
  ]);

  // Days active = distinct dates across all activity types
  const allDates = new Set<string>();
  dreams.forEach((d) => allDates.add(d.dreamDate));
  moodEntries.forEach((m) => allDates.add(m.date));
  tarotReadings.forEach((t) => allDates.add(t.createdAt.toISOString().slice(0, 10)));
  frequencySessions.forEach((f) => allDates.add(f.createdAt.toISOString().slice(0, 10)));
  positivitySessions.forEach((p) => allDates.add(p.date));
  conversations.forEach((c) => allDates.add(c.createdAt.toISOString().slice(0, 10)));

  // Luck aggregation
  const spentByFeatureMap = new Map<string, { amount: number; count: number }>();
  const earnedByTypeMap = new Map<string, { amount: number; count: number }>();
  for (const tx of luckTransactions) {
    if (tx.amount < 0) {
      const key = tx.feature || "other";
      const cur = spentByFeatureMap.get(key) || { amount: 0, count: 0 };
      spentByFeatureMap.set(key, { amount: cur.amount + Math.abs(tx.amount), count: cur.count + 1 });
    } else if (tx.amount > 0) {
      const key = tx.type;
      const cur = earnedByTypeMap.get(key) || { amount: 0, count: 0 };
      earnedByTypeMap.set(key, { amount: cur.amount + tx.amount, count: cur.count + 1 });
    }
  }

  // Dreams by mood
  const moodMap = new Map<string, number>();
  for (const d of dreams) {
    moodMap.set(d.mood, (moodMap.get(d.mood) || 0) + 1);
  }

  // Dreams by moon phase (parse lunarContext JSON)
  const phaseMap = new Map<string, { emoji: string; count: number }>();
  const symbolCounts = new Map<string, number>();
  for (const d of dreams) {
    try {
      const lunar = d.lunarContext ? JSON.parse(d.lunarContext) : null;
      if (lunar?.moonPhase) {
        const cur = phaseMap.get(lunar.moonPhase) || { emoji: lunar.emoji || "🌑", count: 0 };
        phaseMap.set(lunar.moonPhase, { emoji: cur.emoji, count: cur.count + 1 });
      }
    } catch { /* ignore */ }
    if (d.symbols) {
      try {
        const syms = JSON.parse(d.symbols) as string[];
        for (const s of syms) symbolCounts.set(s, (symbolCounts.get(s) || 0) + 1);
      } catch { /* ignore */ }
    }
  }

  // Mood trend (last 30 days)
  const now = new Date();
  const thirtyDaysAgo = new Date(now.getTime() - 30 * 86400000);
  const moodTrend = moodEntries
    .filter((m) => new Date(m.date + "T12:00:00") >= thirtyDaysAgo)
    .map((m) => ({ date: m.date, mood: m.mood }))
    .slice(-30);

  // Ritual streak
  const ritualLogs = await db.ritualLog.findMany({
    where: { userId },
    orderBy: { date: "desc" },
    take: 60,
    select: { date: true, completed: true },
  });
  const ritualStreak = computeStreak(ritualLogs.map((r) => ({ date: r.date, completed: r.completed })));

  // Practice activity (last 14 days) — use Set lookups for O(1) per check
  const moodDates = new Set(moodEntries.map((m) => m.date));
  const ritualDates = new Set(ritualLogs.filter((r) => r.completed).map((r) => r.date));
  const freqDates = new Set(frequencySessions.map((f) => f.createdAt.toISOString().slice(0, 10)));
  const posDates = new Set(positivitySessions.map((p) => p.date));
  const tarotDates = new Set(tarotReadings.map((t) => t.createdAt.toISOString().slice(0, 10)));
  const dreamDates = new Set(dreams.map((d) => d.dreamDate));
  const practiceActivity: { date: string; count: number }[] = [];
  for (let i = 13; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    let count = 0;
    if (moodDates.has(dateStr)) count++;
    if (ritualDates.has(dateStr)) count++;
    if (freqDates.has(dateStr)) count++;
    if (posDates.has(dateStr)) count++;
    if (tarotDates.has(dateStr)) count++;
    if (dreamDates.has(dateStr)) count++;
    practiceActivity.push({ date: dateStr, count });
  }

  // Tarot by spread
  const spreadMap = new Map<string, number>();
  for (const t of tarotReadings) {
    spreadMap.set(t.spreadType, (spreadMap.get(t.spreadType) || 0) + 1);
  }

  return {
    totals: {
      dreams: dreams.length,
      tarotReadings: tarotReadings.length,
      conversations: conversations.length,
      chatMessages,
      frequencySessions: frequencySessions.length,
      positivitySessions: positivitySessions.length,
      moodEntries: moodEntries.length,
      goals,
      ritualsCompleted,
      daysActive: allDates.size,
    },
    luck: {
      balance: user?.luckBalance || 0,
      totalEarned: user?.totalLuckEarned || 0,
      totalSpent: user?.totalLuckSpent || 0,
      spentByFeature: Array.from(spentByFeatureMap.entries())
        .map(([feature, v]) => ({ feature, amount: v.amount, count: v.count }))
        .sort((a, b) => b.amount - a.amount),
      earnedByType: Array.from(earnedByTypeMap.entries())
        .map(([type, v]) => ({ type, amount: v.amount, count: v.count }))
        .sort((a, b) => b.amount - a.amount),
    },
    dreamsByMood: Array.from(moodMap.entries())
      .map(([mood, count]) => ({ mood, count }))
      .sort((a, b) => b.count - a.count),
    dreamsByMoonPhase: Array.from(phaseMap.entries())
      .map(([phase, v]) => ({ phase, emoji: v.emoji, count: v.count }))
      .sort((a, b) => b.count - a.count),
    moodTrend,
    ritualStreak,
    practiceActivity,
    topDreamSymbols: Array.from(symbolCounts.entries())
      .map(([symbol, count]) => ({ symbol, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 8),
    tarotBySpread: Array.from(spreadMap.entries())
      .map(([spread, count]) => ({ spread, count }))
      .sort((a, b) => b.count - a.count),
  };
}

/** Compute current + longest streak + last 7 days. */
function computeStreak(logs: { date: string; completed: boolean }[]): {
  current: number;
  longest: number;
  last7: { date: string; completed: boolean }[];
} {
  const sorted = [...logs].sort((a, b) => b.date.localeCompare(a.date));
  let current = 0;
  let longest = 0;
  let tempStreak = 0;
  let prevDate: string | null = null;

  for (const log of sorted) {
    if (log.completed) {
      if (prevDate) {
        const prev = new Date(prevDate + "T12:00:00");
        const cur = new Date(log.date + "T12:00:00");
        const diffDays = Math.round((prev.getTime() - cur.getTime()) / 86400000);
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays === 0) {
          // same day, skip
        } else {
          tempStreak = 1;
        }
      } else {
        tempStreak = 1;
      }
      longest = Math.max(longest, tempStreak);
      // Current streak: only count if it's contiguous from today/yesterday backward
      const today = new Date().toISOString().slice(0, 10);
      const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
      if (log.date === today || log.date === yesterday) {
        // Count this as part of current streak
      }
    } else {
      tempStreak = 0;
    }
    prevDate = log.date;
  }

  // Recompute current streak: walk backward from today/yesterday
  current = 0;
  const todayStr = new Date().toISOString().slice(0, 10);
  let cursor = new Date();
  // Allow today OR yesterday as starting point
  const hasToday = logs.some((l) => l.date === todayStr && l.completed);
  if (!hasToday) {
    cursor = new Date(Date.now() - 86400000);
  }
  for (let i = 0; i < 365; i++) {
    const dateStr = cursor.toISOString().slice(0, 10);
    const log = logs.find((l) => l.date === dateStr);
    if (log?.completed) {
      current++;
      cursor = new Date(cursor.getTime() - 86400000);
    } else {
      break;
    }
  }

  const last7 = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date(Date.now() - i * 86400000);
    const dateStr = d.toISOString().slice(0, 10);
    const log = logs.find((l) => l.date === dateStr);
    last7.push({ date: dateStr, completed: !!log?.completed });
  }

  return { current, longest, last7 };
}
