import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Confirm today's intention for a goal. Awards 1 Luck bonus (gamification). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { goalId, note } = await req.json();
  if (!goalId) return NextResponse.json({ error: "goalId required" }, { status: 400 });
  const goal = await db.goal.findFirst({ where: { id: goalId, userId: user.id } });
  if (!goal) return NextResponse.json({ error: "Goal not found" }, { status: 404 });
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.confirmation.findUnique({
    where: { goalId_date: { goalId, date: today } },
  });
  if (existing) {
    return NextResponse.json({ ok: false, reason: "already_confirmed", confirmation: existing });
  }
  const confirmation = await db.confirmation.create({
    data: { userId: user.id, goalId, date: today, note: note || null },
  });
  // Small Luck reward for daily practice (drives engagement)
  await creditLuck({
    userId: user.id,
    amount: 1,
    type: "daily_reward",
    description: `Manifestation confirmation: ${goal.title}`,
    referenceId: confirmation.id,
  });
  return NextResponse.json({ ok: true, confirmation, bonusLuck: 1 });
}
