import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ today: null, history: [] });
  const today = new Date().toISOString().slice(0, 10);
  const todayEntry = await db.moodEntry.findUnique({ where: { userId_date: { userId: user.id, date: today } } });
  const history = await db.moodEntry.findMany({
    where: { userId: user.id },
    orderBy: { date: "desc" },
    take: 30,
  });
  return NextResponse.json({ today: todayEntry, history });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mood, note } = await req.json();
  if (!mood || mood < 1 || mood > 5) return NextResponse.json({ error: "Mood must be 1-5" }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  const entry = await db.moodEntry.upsert({
    where: { userId_date: { userId: user.id, date: today } },
    create: { userId: user.id, date: today, mood, note: note || null },
    update: { mood, note: note || null },
  });
  return NextResponse.json({ entry });
}
