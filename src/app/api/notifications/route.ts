import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/notifications — returns badge counts for pending items:
 * - unconfirmedGoals: active goals not confirmed today
 * - ritualIncomplete: today's ritual not yet completed
 * - unreadConversations: conversations updated in last 24h (rough unread proxy)
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ badges: {} });

  const today = new Date().toISOString().slice(0, 10);
  const yesterday = new Date(Date.now() - 86400000);

  const [activeGoals, todayConfirmations, todayRitual, recentConversations] = await Promise.all([
    db.goal.findMany({ where: { userId: user.id, status: "active" }, select: { id: true } }),
    db.confirmation.findMany({ where: { userId: user.id, date: today }, select: { goalId: true } }),
    db.ritualLog.findUnique({ where: { userId_date: { userId: user.id, date: today } } }),
    db.conversation.count({ where: { userId: user.id, updatedAt: { gte: yesterday } } }),
  ]);

  const confirmedGoalIds = new Set(todayConfirmations.map((c) => c.goalId));
  const unconfirmedGoals = activeGoals.filter((g) => !confirmedGoalIds.has(g.id)).length;
  const ritualIncomplete = todayRitual ? !todayRitual.completed : true;

  return NextResponse.json({
    badges: {
      unconfirmedGoals,
      ritualIncomplete,
      recentConversations,
    },
  });
}
