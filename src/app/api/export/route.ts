import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/export — download all user data as JSON (GDPR-style data portability).
 * Returns the user's profile, conversations, tarot readings, goals, mood entries,
 * ritual logs, frequency sessions, positivity sessions, compatibility readings,
 * Luck transactions, purchases, daily rewards, and transfers.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const [
    conversations, tarotReadings, goals, confirmations, moodEntries,
    ritualLogs, frequencySessions, positivitySessions, compatibilityReadings,
    transactions, purchases, dailyRewards, transfersOut, transfersIn,
  ] = await Promise.all([
    db.conversation.findMany({ where: { userId: user.id }, include: { messages: true }, orderBy: { createdAt: "desc" } }),
    db.tarotReading.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.goal.findMany({ where: { userId: user.id }, include: { confirmations: true }, orderBy: { createdAt: "desc" } }),
    db.confirmation.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    db.moodEntry.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    db.ritualLog.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    db.frequencySession.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.positivitySession.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.compatibilityReading.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.luckTransaction.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.luckPurchase.findMany({ where: { userId: user.id }, orderBy: { createdAt: "desc" } }),
    db.dailyReward.findMany({ where: { userId: user.id }, orderBy: { date: "desc" } }),
    db.luckTransfer.findMany({ where: { fromUserId: user.id }, orderBy: { createdAt: "desc" } }),
    db.luckTransfer.findMany({ where: { toUserId: user.id }, orderBy: { createdAt: "desc" } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    profile: {
      email: user.email,
      name: user.name,
      language: user.language,
      role: user.role,
      luckBalance: user.luckBalance,
      streak: user.streak,
      totalLuckEarned: user.totalLuckEarned,
      totalLuckSpent: user.totalLuckSpent,
      referralCode: user.referralCode,
      birthData: parseBirthData(user.birthData),
      createdAt: user.createdAt,
    },
    conversations,
    tarotReadings,
    goals,
    confirmations,
    moodEntries,
    ritualLogs,
    frequencySessions,
    positivitySessions,
    compatibilityReadings,
    luckTransactions: transactions,
    luckPurchases: purchases,
    dailyRewards,
    transfersOut,
    transfersIn,
  };

  const json = JSON.stringify(data, null, 2);
  return new NextResponse(json, {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="baydin-data-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}
