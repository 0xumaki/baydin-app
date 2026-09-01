import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { drawCards, attachMeta, type DrawnCardWithMeta } from "@/lib/tarot";
import { interpretReading } from "@/lib/ai-tarot";
import { spendForFeature, FREE_LIMITS, creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const SPREAD_COUNTS: Record<string, number> = {
  "yes-no": 1, "single": 1, "three-card": 3, "celtic-cross": 10,
  "relationship": 5, "career": 4, "card-of-day": 1,
};

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { question, spreadType } = await req.json();

  // Free-tier: 2 free readings/day, then 1 Luck each
  const today = new Date().toISOString().slice(0, 10);
  const todayCount = await db.tarotReading.count({
    where: { userId: user.id, createdAt: { gte: new Date(today + "T00:00:00") } },
  });
  const freeRemaining = Math.max(0, FREE_LIMITS.tarot_per_day - todayCount);

  let luckResult: { ok: boolean; balance: number; cost: number; reason?: string } | null = null;
  if (freeRemaining <= 0) {
    luckResult = await spendForFeature({
      userId: user.id,
      feature: "tarot_premium",
      description: `Tarot reading: ${spreadType}`,
    });
    if (!luckResult.ok) {
      return NextResponse.json({
        error: "You've used your free daily readings. Top up Luck to draw again.",
        balance: luckResult.balance,
      }, { status: 402 });
    }
  }

  const count = SPREAD_COUNTS[spreadType] ?? 3;
  const drawnRaw = drawCards(count);
  const drawn: DrawnCardWithMeta[] = attachMeta(drawnRaw);
  const interpretation = await interpretReading(question, spreadType, drawn, false);

  const reading = await db.tarotReading.create({
    data: {
      userId: user.id,
      question,
      spreadType,
      cardsJson: JSON.stringify(drawn.map((d) => ({ id: d.card.id, reversed: d.reversed, position: d.position }))),
      interpretation,
    },
  });

  return NextResponse.json({
    reading: {
      id: reading.id,
      question, spreadType, interpretation,
      cards: drawn.map((d) => ({ card: d.card, reversed: d.reversed, position: d.position })),
      freeRemaining: Math.max(0, freeRemaining - 1),
      luckSpent: luckResult?.cost ?? 0,
    },
  });
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ readings: [] });
  const readings = await db.tarotReading.findMany({
    where: { userId: user.id },
    orderBy: { createdAt: "desc" },
    take: 30,
  });
  return NextResponse.json({ readings });
}
