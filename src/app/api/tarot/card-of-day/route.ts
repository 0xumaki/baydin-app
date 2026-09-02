import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { drawCards, type DrawnCardWithMeta } from "@/lib/tarot";
import { interpretReading } from "@/lib/ai-tarot";
import { creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** Deterministic card-of-day (FNV-1a hash of userId+date → card index). */
function hashStr(s: string): number {
  let h = 2166136261;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = (h * 16777619) >>> 0;
  }
  return h >>> 0;
}

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.tarotReading.findFirst({
    where: { userId: user.id, spreadType: "card-of-day", createdAt: { gte: new Date(today + "T00:00:00") } },
    orderBy: { createdAt: "desc" },
  });
  if (existing) {
    return NextResponse.json({
      reading: {
        id: existing.id, question: existing.question, spreadType: existing.spreadType,
        interpretation: existing.interpretation,
        cardsJson: existing.cardsJson,
        reflection: existing.reflection,
      },
    });
  }
  // Generate today's card deterministically
  const { TAROT_DECK } = await import("@/lib/tarot-data");
  const hash = hashStr(user.id + today);
  const cardIdx = hash % TAROT_DECK.length;
  const reversed = (hash >> 8) % 100 < 38;
  const card = TAROT_DECK[cardIdx];
  const drawn: DrawnCardWithMeta[] = [{ card, reversed, position: "Card of the Day" }];
  const interpretation = await interpretReading("What does today hold for me?", "card-of-day", drawn, false);
  const reading = await db.tarotReading.create({
    data: {
      userId: user.id,
      question: "Card of the Day",
      spreadType: "card-of-day",
      cardsJson: JSON.stringify([{ id: card.id, reversed, position: "Card of the Day" }]),
      interpretation,
    },
  });
  return NextResponse.json({ reading: { id: reading.id, interpretation, cardsJson: reading.cardsJson, question: reading.question, spreadType: "card-of-day", reflection: null } });
}

/** PATCH — save/update the user's reflection note on today's card-of-day. Awards +1 Luck. */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { reflection } = await req.json();
  if (typeof reflection !== "string") return NextResponse.json({ error: "reflection required" }, { status: 400 });
  const today = new Date().toISOString().slice(0, 10);
  const existing = await db.tarotReading.findFirst({
    where: { userId: user.id, spreadType: "card-of-day", createdAt: { gte: new Date(today + "T00:00:00") } },
    orderBy: { createdAt: "desc" },
  });
  if (!existing) return NextResponse.json({ error: "No card-of-day yet" }, { status: 404 });
  const wasEmpty = !existing.reflection;
  const updated = await db.tarotReading.update({ where: { id: existing.id }, data: { reflection } });
  // Award +1 Luck only the first time a reflection is saved
  if (wasEmpty && reflection.trim()) {
    await creditLuck({ userId: user.id, amount: 1, type: "daily_reward", description: "Card-of-day reflection saved" });
  }
  return NextResponse.json({ reading: updated, bonusLuck: wasEmpty && reflection.trim() ? 1 : 0 });
}
