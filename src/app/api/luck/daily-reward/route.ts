import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditLuck, todayKey, getDailyRewardAmount } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Claim the daily Luck reward. One per day per user. Streak grows each day. */
export async function POST() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = todayKey();
  const already = await db.dailyReward.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });
  if (already) {
    return NextResponse.json({
      ok: false,
      reason: "already_claimed",
      amount: already.amount,
      message: "You've already claimed today's Luck. Come back tomorrow.",
    });
  }
  // Determine streak day number
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  const yesterdayReward = await db.dailyReward.findUnique({
    where: { userId_date: { userId: user.id, date: yesterday } },
  });
  const newStreak = yesterdayReward ? user.streak + 1 : 1;
  const dayNumber = newStreak;
  const amount = getDailyRewardAmount(dayNumber);

  await db.dailyReward.create({
    data: { userId: user.id, date: today, amount, dayNumber },
  });
  await db.user.update({
    where: { id: user.id },
    data: { streak: newStreak, lastDailyAt: new Date() },
  });
  await creditLuck({
    userId: user.id,
    amount,
    type: "daily_reward",
    description: `Daily Luck reward (streak day ${dayNumber})`,
  });

  return NextResponse.json({ ok: true, amount, streak: newStreak, dayNumber });
}

/** Check today's daily reward status. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ claimed: false, streak: 0 });
  const today = todayKey();
  const claimed = await db.dailyReward.findUnique({
    where: { userId_date: { userId: user.id, date: today } },
  });
  return NextResponse.json({
    claimed: !!claimed,
    amount: claimed?.amount ?? null,
    streak: user.streak,
    nextDayNumber: (user.streak || 0) + 1,
  });
}
