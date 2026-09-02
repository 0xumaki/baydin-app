import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: last 30 frequency sessions. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ sessions: [] });
  const sessions = await db.frequencySession.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ sessions });
}

/** POST: log a completed frequency session (free — no Luck cost). */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { intention, frequencyHz, mode, durationSec, baseHz, beatHz } = await req.json();
  if (!frequencyHz || !durationSec) {
    return NextResponse.json({ error: "frequencyHz and durationSec required" }, { status: 400 });
  }
  const session = await db.frequencySession.create({
    data: {
      userId: user.id,
      intention: intention || "healing",
      frequencyHz,
      mode: mode || "pure",
      durationSec,
      baseHz: baseHz ?? null,
      beatHz: beatHz ?? null,
      completed: true,
    },
  });
  return NextResponse.json({ session });
}
