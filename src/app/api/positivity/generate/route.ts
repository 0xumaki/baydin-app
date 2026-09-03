import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature, creditLuck, todayKey } from "@/lib/luck";
import { POSITIVITY_CATEGORIES } from "@/lib/positivity";
import { renderPositivityPrompt, callAstrologerLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET: list categories + today's usage. */
export async function GET() {
  const user = await getCurrentUser();
  const today = todayKey();
  const todayCount = user
    ? await db.positivitySession.count({ where: { userId: user.id, date: today } })
    : 0;
  return NextResponse.json({
    categories: POSITIVITY_CATEGORIES.map((c) => ({ id: c.id, name: c.name, description: c.description, color: c.color, frequencyHz: c.frequencyHz })),
    todayCount,
    freePerDay: 1,
  });
}

/** POST: generate a positivity script. 1 free/day, then 1 Luck. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { category, intention, durationSec } = await req.json();
  const cat = POSITIVITY_CATEGORIES.find((c) => c.id === category);
  if (!cat) return NextResponse.json({ error: "Unknown category" }, { status: 400 });

  const today = todayKey();
  const todayCount = await db.positivitySession.count({ where: { userId: user.id, date: today } });
  const isFree = todayCount === 0;

  // Charge Luck if not free
  if (!isFree) {
    const res = await spendForFeature({
      userId: user.id,
      feature: "positivity",
      description: `Positivity script: ${cat.name}`,
    });
    if (!res.ok) {
      return NextResponse.json({ error: "Insufficient Luck for another script today.", balance: res.balance }, { status: 402 });
    }
  }

  // Try LLM, fall back to template
  let script = "";
  let source = "template";
  try {
    const { system, user: prompt } = renderPositivityPrompt({
      language: user.language || "my",
      gender: parseBirthData(user.birthData)?.gender ?? null,
      category: cat.id,
      intention,
    });
    const result = await callAstrologerLLM(system, prompt, { temperature: 0.8, maxTokens: 400 });
    if (result.parsed?.content && result.parsed.content.length > 50) {
      script = result.parsed.content;
      source = "llm";
    }
  } catch (e) {
    console.error("Positivity LLM failed:", e);
  }

  if (!script) {
    // Template fallback: weave affirmations into a flowing script
    const affs = cat.affirmations;
    script = affs.slice(0, 6).join(" ") + " " + affs[0];
    source = "template";
  }

  const session = await db.positivitySession.create({
    data: {
      userId: user.id,
      date: today,
      category: cat.id,
      intention: intention || null,
      durationSec: durationSec || 120,
      source,
      script,
    },
  });

  return NextResponse.json({
    session,
    category: { id: cat.id, name: cat.name, color: cat.color, frequencyHz: cat.frequencyHz },
    isFree,
    luckSpent: isFree ? 0 : 1,
  });
}
