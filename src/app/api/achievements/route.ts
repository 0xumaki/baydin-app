import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { ACHIEVEMENTS } from "@/lib/achievements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/achievements — returns all achievements with unlocked status + any
 * newly-unlocked badges (not yet seen by the user). Marks newly-unlocked as seen.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ achievements: [], newlyUnlocked: [] });

  // Fetch lifetime stats to evaluate achievements
  const [tarot, chat, frequency, manifest, mood, ritual] = await Promise.all([
    db.tarotReading.count({ where: { userId: user.id } }),
    db.message.count({ where: { conversation: { userId: user.id }, role: "assistant" } }),
    db.frequencySession.count({ where: { userId: user.id } }),
    db.confirmation.count({ where: { userId: user.id } }),
    db.moodEntry.count({ where: { userId: user.id } }),
    db.ritualLog.count({ where: { userId: user.id, completed: true } }),
  ]);

  const stats = { tarot, chat, frequency, manifest, ritual, mood, streak: user.streak, luckEarned: user.totalLuckEarned };
  const seen: string[] = JSON.parse(user.seenAchievements || "[]");

  const achievements = ACHIEVEMENTS.map((a) => ({
    id: a.id, name: a.name, description: a.description, icon: a.icon, tier: a.tier,
    unlocked: a.check(stats),
  }));

  // Find newly-unlocked (unlocked but not yet seen)
  const newlyUnlocked = achievements.filter((a) => a.unlocked && !seen.includes(a.id));

  // Mark all unlocked as seen
  if (newlyUnlocked.length > 0) {
    const allSeen = [...new Set([...seen, ...achievements.filter((a) => a.unlocked).map((a) => a.id)])];
    await db.user.update({ where: { id: user.id }, data: { seenAchievements: JSON.stringify(allSeen) } });
  }

  return NextResponse.json({
    achievements,
    newlyUnlocked,
    stats,
  });
}
