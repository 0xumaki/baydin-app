import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature, creditLuck } from "@/lib/luck";
import { computeCompatibility, type BirthContext } from "@/lib/astrology";
import { renderCompatibilityPrompt, callAstrologerLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** POST: compute + interpret compatibility. Costs 5 Luck. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.birthData) {
    return NextResponse.json({ error: "Add your birth details in your profile first." }, { status: 400 });
  }
  const { partner, relationshipType } = await req.json();
  if (!partner?.dob) {
    return NextResponse.json({ error: "Partner's birth details are required." }, { status: 400 });
  }

  // Spend Luck
  const res = await spendForFeature({
    userId: user.id,
    feature: "compatibility",
    description: `Compatibility reading`,
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Insufficient Luck.", balance: res.balance }, { status: 402 });
  }

  const personA: BirthContext = JSON.parse(user.birthData);
  const personB: BirthContext = partner;

  let compat: any;
  try {
    compat = computeCompatibility(personA, personB, relationshipType || "MARRIAGE");
  } catch (e: any) {
    await creditLuck({ userId: user.id, amount: res.cost, type: "admin_grant", description: `Refund: compatibility compute failed (${e.message})` });
    return NextResponse.json({ error: "Could not compute compatibility. Check both birth details." }, { status: 500 });
  }

  // LLM interpretation
  const { system, user: prompt } = renderCompatibilityPrompt({
    language: user.language || "my",
    gender: personA.gender ?? null,
    compatibility: compat,
    relationshipType: relationshipType || "MARRIAGE",
  });
  const result = await callAstrologerLLM(system, prompt, { temperature: 0.7, maxTokens: 1600 });

  const interpretation = result.parsed?.content ?? result.content;

  // Persist
  const reading = await db.compatibilityReading.create({
    data: {
      userId: user.id,
      partnerData: JSON.stringify({ personA, personB, relationshipType }),
      calculation: JSON.stringify(compat),
      interpretation,
    },
  });

  return NextResponse.json({
    compatibility: {
      ...compat,
      interpretation,
      highlights: result.parsed?.highlights ?? [],
      guidance: result.parsed?.guidance ?? null,
      readingId: reading.id,
      luckSpent: res.cost,
      balance: res.balance,
      meta: { ai_generated: true, generated_at: new Date().toISOString(), interpretation_type: "compatibility" },
    },
  });
}
