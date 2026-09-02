import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/activity — 7-day activity heatmap data.
 * Aggregates activity from multiple sources: ritual completions, tarot readings,
 * astrologer chat messages, frequency sessions, mood entries, manifest confirmations.
 * Returns per-day activity counts + totals.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ days: [], totals: null });

  // Build the last 7 days (oldest first)
  const days: { date: string; label: string; activities: { ritual: boolean; tarot: number; chat: number; frequency: number; mood: boolean; manifest: boolean }; total: number }[] = [];
  const dayLabels = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().slice(0, 10);
    days.push({
      date: dateStr,
      label: dayLabels[d.getDay()],
      activities: { ritual: false, tarot: 0, chat: 0, frequency: 0, mood: false, manifest: false },
      total: 0,
    });
  }

  const dates = days.map((d) => d.date);
  const startDate = dates[0] + "T00:00:00";
  const endDate = dates[6] + "T23:59:59";

  // Fetch activity from all sources in parallel
  const [rituals, tarotReadings, chatMessages, freqSessions, moodEntries, manifestConfs] = await Promise.all([
    db.ritualLog.findMany({ where: { userId: user.id, date: { in: dates }, completed: true }, select: { date: true } }),
    db.tarotReading.findMany({ where: { userId: user.id, createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }, select: { createdAt: true } }),
    db.message.findMany({
      where: {
        conversation: { userId: user.id },
        role: "assistant",
        createdAt: { gte: new Date(startDate), lte: new Date(endDate) },
      },
      select: { createdAt: true },
    }),
    db.frequencySession.findMany({ where: { userId: user.id, createdAt: { gte: new Date(startDate), lte: new Date(endDate) } }, select: { createdAt: true } }),
    db.moodEntry.findMany({ where: { userId: user.id, date: { in: dates } }, select: { date: true } }),
    db.confirmation.findMany({ where: { userId: user.id, date: { in: dates } }, select: { date: true } }),
  ]);

  // Aggregate into days
  for (const day of days) {
    day.activities.ritual = rituals.some((r) => r.date === day.date);
    day.activities.tarot = tarotReadings.filter((r) => r.createdAt.toISOString().slice(0, 10) === day.date).length;
    day.activities.chat = chatMessages.filter((m) => m.createdAt.toISOString().slice(0, 10) === day.date).length;
    day.activities.frequency = freqSessions.filter((f) => f.createdAt.toISOString().slice(0, 10) === day.date).length;
    day.activities.mood = moodEntries.some((m) => m.date === day.date);
    day.activities.manifest = manifestConfs.some((c) => c.date === day.date);
    // Total activity score
    day.total =
      (day.activities.ritual ? 1 : 0) +
      day.activities.tarot +
      day.activities.chat +
      day.activities.frequency +
      (day.activities.mood ? 1 : 0) +
      (day.activities.manifest ? 1 : 0);
  }

  // Lifetime totals
  const [
    totalTarot, totalChat, totalFreq, totalMood, totalManifest, totalRitual,
  ] = await Promise.all([
    db.tarotReading.count({ where: { userId: user.id } }),
    db.message.count({ where: { conversation: { userId: user.id }, role: "assistant" } }),
    db.frequencySession.count({ where: { userId: user.id } }),
    db.moodEntry.count({ where: { userId: user.id } }),
    db.confirmation.count({ where: { userId: user.id } }),
    db.ritualLog.count({ where: { userId: user.id, completed: true } }),
  ]);

  return NextResponse.json({
    days,
    totals: {
      tarot: totalTarot,
      chat: totalChat,
      frequency: totalFreq,
      mood: totalMood,
      manifest: totalManifest,
      ritual: totalRitual,
      streak: user.streak,
      luckEarned: user.totalLuckEarned,
      luckSpent: user.totalLuckSpent,
      memberSince: user.createdAt,
    },
  });
}
