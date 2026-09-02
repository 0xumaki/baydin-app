import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/tarot/history?saved=true — list past tarot readings, optionally filtered by saved. */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ readings: [] });
  const savedOnly = req.nextUrl.searchParams.get("saved") === "true";
  const readings = await db.tarotReading.findMany({
    where: { userId: user.id, ...(savedOnly ? { saved: true } : {}) },
    orderBy: { createdAt: "desc" },
    take: 50,
    select: { id: true, question: true, spreadType: true, cardsJson: true, interpretation: true, saved: true, createdAt: true },
  });
  return NextResponse.json({ readings });
}
