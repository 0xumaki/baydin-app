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
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { question, spreadType } = body;

    // Validate spreadType — only allow known spreads
    const validSpread = Object.keys(SPREAD_COUNTS).includes(spreadType) ? spreadType : "three-card";
    const safeQuestion = typeof question === "string" && question.trim().length > 0 && question.trim().length <= 500
      ? question.trim()
      : "What do I need to know right now?";

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
        description: `Tarot reading: ${validSpread}`,
      });
      if (!luckResult.ok) {
        return NextResponse.json({
          error: "You've used your free daily readings. Top up Luck to draw again.",
          balance: luckResult.balance,
      }, { status: 402 });
    }
  }

  const count = SPREAD_COUNTS[validSpread] ?? 3;
  const drawnRaw = drawCards(count);
  const drawn: DrawnCardWithMeta[] = attachMeta(drawnRaw);

  // Interpret — if this fails, refund Luck and return error.
  // Never charge the user for a failed LLM call.
  let interpretation: string;
  try {
    interpretation = await interpretReading(safeQuestion, validSpread, drawn, false);
  } catch (interpErr) {
    console.error("Tarot interpretation failed:", interpErr);
    // Refund Luck if it was charged
    if (luckResult && luckResult.ok && luckResult.cost > 0) {
      await creditLuck({
        userId: user.id,
        amount: luckResult.cost,
        type: "admin_grant",
        description: `Refund: tarot interpretation failed`,
      });
    }
    return NextResponse.json(
      { error: "The cards were drawn, but the interpretation couldn't be completed. Your Luck has been refunded." },
      { status: 500 }
    );
  }

  // Persist the reading to the database — this happens BEFORE returning,
  // so even if the user navigates away, the reading is saved.
  const reading = await db.tarotReading.create({
    data: {
      userId: user.id,
      question: safeQuestion,
      spreadType: validSpread,
      cardsJson: JSON.stringify(drawn.map((d) => ({ id: d.card.id, reversed: d.reversed, position: d.position }))),
      interpretation,
    },
  });

  return NextResponse.json({
    reading: {
      id: reading.id,
      question: safeQuestion, spreadType: validSpread, interpretation,
      cards: drawn.map((d) => ({ card: d.card, reversed: d.reversed, position: d.position })),
      freeRemaining: Math.max(0, freeRemaining - 1),
      luckSpent: luckResult?.cost ?? 0,
    },
  });
  } catch (err) {
    console.error("Tarot read failed:", err);
    // Refund Luck on any unexpected error
    if (luckResult?.ok && luckResult.cost > 0) {
      await creditLuck({
        userId: user.id,
        amount: luckResult.cost,
        type: "admin_grant",
        description: `Refund: tarot read failed`,
      }).catch(() => {});
    }
    return NextResponse.json({ error: "Failed to read tarot." }, { status: 500 });
  }
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
