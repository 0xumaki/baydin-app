import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tarot/reflections — list past card-of-day readings that have a reflection.
 * Returns the last 30 reflections with card data + reflection text + date.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ reflections: [] });
  const readings = await db.tarotReading.findMany({
    where: {
      userId: user.id,
      spreadType: "card-of-day",
      reflection: { not: null },
    },
    orderBy: { createdAt: "desc" },
    take: 30,
    select: {
      id: true,
      cardsJson: true,
      reflection: true,
      interpretation: true,
      createdAt: true,
    },
  });
  // Parse cardsJson for each
  const reflections = readings.map((r) => {
    let cards: any[] = [];
    try { cards = JSON.parse(r.cardsJson); } catch {}
    return {
      id: r.id,
      card: cards[0] || null,
      reflection: r.reflection,
      interpretation: r.interpretation?.slice(0, 150),
      date: r.createdAt.toISOString().slice(0, 10),
      createdAt: r.createdAt,
    };
  });
  return NextResponse.json({ reflections });
}
