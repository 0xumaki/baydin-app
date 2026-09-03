import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { spendForFeature, creditLuck } from "@/lib/luck";
import { computeNatalChart, computeTransits, type BirthContext } from "@/lib/astrology";
import { renderInsightPrompt, callAstrologerLLM, INSIGHT_SKILLS } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/** GET: list available insight skills. */
export async function GET() {
  return NextResponse.json({ skills: INSIGHT_SKILLS });
}

/** POST: run a specific insight skill. Costs 3 Luck. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.birthData) {
    return NextResponse.json({ error: "Add your birth details in your profile first." }, { status: 400 });
  }
  const { skill, query, division } = await req.json();
  const skillMeta = INSIGHT_SKILLS.find((s) => s.id === skill);
  if (!skillMeta) return NextResponse.json({ error: "Unknown skill." }, { status: 400 });

  // Spend Luck
  const res = await spendForFeature({
    userId: user.id,
    feature: "insight",
    description: `Insight: ${skillMeta.name}`,
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Insufficient Luck.", balance: res.balance }, { status: 402 });
  }

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  if (!birthData.dob) {
    return NextResponse.json({ error: "Birth date missing. Update your profile." }, { status: 400 });
  }
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch (e: any) {
    // Refund the Luck since we can't compute
    await creditLuck({ userId: user.id, amount: res.cost, type: "admin_grant", description: `Refund: insight chart compute failed (${e.message})` });
    return NextResponse.json({ error: "Could not compute your chart. Please check your birth details." }, { status: 500 });
  }
  let transits: any = null;
  try { transits = computeTransits(birthData, chart, 7); } catch {}
  const extraContext: any = {};
  if (division) extraContext.division = division;

  const { system, user: prompt } = renderInsightPrompt({
    language: user.language || "my",
    gender: birthData.gender ?? null,
    skill: skillMeta.skill,
    query,
    chart,
    transits,
    extraContext,
  });
  const result = await callAstrologerLLM(system, prompt, {
    temperature: 0.7,
    maxTokens: 1800,
  });

  return NextResponse.json({
    insight: {
      skill: skillMeta.skill,
      skillName: skillMeta.name,
      content: result.parsed?.content ?? result.content,
      highlights: result.parsed?.highlights ?? [],
      guidance: result.parsed?.guidance ?? null,
      luckSpent: res.cost,
      balance: res.balance,
      meta: { ai_generated: true, generated_at: new Date().toISOString(), interpretation_type: "insight" },
    },
  });
}
