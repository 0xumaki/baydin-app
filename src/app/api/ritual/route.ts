import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const STEPS = ["step1Cleanse", "step2Manifest", "step3Tarot", "step4Balance"] as const;

/** GET: today's ritual progress + streak. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ritual: null });
  const today = new Date().toISOString().slice(0, 10);
  const ritual = await db.ritualLog.findUnique({ where: { userId_date: { userId: user.id, date: today } } });
  // Compute streak (count consecutive past days with completed=true, ending yesterday)
  let streak = 0;
  for (let i = 1; i < 365; i++) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const r = await db.ritualLog.findUnique({ where: { userId_date: { userId: user.id, date: d.toISOString().slice(0, 10) } } });
    if (r?.completed) streak++;
    else if (i > 1) break; // allow 1 gap (freeze)
  }
  return NextResponse.json({ ritual, streak, today });
}

/** POST: mark a ritual step complete. Awards +1 Luck per step, +50 bonus on full completion. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { step } = await req.json();
  if (!STEPS.includes(step)) return NextResponse.json({ error: "Invalid step" }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);

  const ritual = await db.ritualLog.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { userId: user.id, date: today, [step]: true },
    update: { [step]: true },
  });

  // Check if all 4 steps done (step3Tarot optional — completed when 1,2,4 done)
  const justCompleted = !ritual.completed && ritual.step1Cleanse && ritual.step2Manifest && ritual.step4Balance;
  if (justCompleted) {
    await db.ritualLog.update({ where: { id: ritual.id }, data: { completed: true } });
    await creditLuck({ userId: user.id, amount: 3, type: "daily_reward", description: "Daily ritual completed ✦" });
    return NextResponse.json({ ritual: { ...ritual, completed: true }, bonusLuck: 3, justCompleted: true });
  }

  // Small Luck for each step
  await creditLuck({ userId: user.id, amount: 1, type: "daily_reward", description: `Ritual step: ${step}` });
  return NextResponse.json({ ritual: { ...ritual, completed: false }, bonusLuck: 1 });
}
