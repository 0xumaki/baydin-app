import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature, creditLuck } from "@/lib/luck";
import { computeNatalChart, type BirthContext } from "@/lib/astrology";
import { renderLifeReportSectionPrompt, callAstrologerLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const SECTIONS = [
  { id: "core_identity", name: "Core Identity" },
  { id: "chart_blueprint", name: "Chart Blueprint" },
  { id: "strengths", name: "Strengths & Gifts" },
  { id: "timeline", name: "Timeline & Dasha" },
  { id: "yogas", name: "Yogas" },
  { id: "life_areas", name: "Life Areas" },
  { id: "remedies", name: "Remedies" },
];

/**
 * POST /api/life-report — generates a 7-section life report.
 * Costs 15 Luck. Runs sections sequentially (each is an LLM call).
 * Returns a reportId + all sections.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.birthData) {
    return NextResponse.json({ error: "Add your birth details in your profile first." }, { status: 400 });
  }
  // Spend Luck
  const res = await spendForFeature({
    userId: user.id,
    feature: "life_report",
    description: "7-section Life Report",
  });
  if (!res.ok) {
    return NextResponse.json({ error: "Insufficient Luck.", balance: res.balance }, { status: 402 });
  }

  const birthData: BirthContext = JSON.parse(user.birthData);
  if (!birthData.dob) {
    return NextResponse.json({ error: "Birth date missing. Update your profile." }, { status: 400 });
  }
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch (e: any) {
    await creditLuck({ userId: user.id, amount: res.cost, type: "admin_grant", description: `Refund: life report chart compute failed (${e.message})` });
    return NextResponse.json({ error: "Could not compute your chart. Please check your birth details." }, { status: 500 });
  }
  const enhancedData = {
    dasha: chart.dasha,
    panchanga: chart.panchanga,
    ayanamsa: chart.ayanamsa,
  };

  const sections: { id: string; name: string; content: string; highlights: string[]; guidance: any }[] = [];
  for (const section of SECTIONS) {
    const { system, user: prompt } = renderLifeReportSectionPrompt({
      language: user.language || "my",
      gender: birthData.gender ?? null,
      sectionName: section.id,
      chart,
      enhancedData,
    });
    const result = await callAstrologerLLM(system, prompt, {
      temperature: 0.7,
      maxTokens: 1200,
    });
    sections.push({
      id: section.id,
      name: section.name,
      content: result.parsed?.content ?? result.content,
      highlights: result.parsed?.highlights ?? [],
      guidance: result.parsed?.guidance ?? null,
    });
  }

  // Persist as a conversation so it shows in history
  const conv = await db.conversation.create({
    data: {
      userId: user.id,
      mode: "life-report",
      title: `Life Report — ${new Date().toLocaleDateString()}`,
      birthContext: user.birthData,
      chartData: JSON.stringify(chart),
    },
  });
  await db.message.create({
    data: {
      conversationId: conv.id,
      role: "assistant",
      content: JSON.stringify(sections, null, 2),
      metadata: JSON.stringify({ interpretationType: "life_report", luckCost: res.cost, sections: sections.length }),
    },
  });

  return NextResponse.json({
    lifeReport: {
      id: conv.id,
      sections,
      luckSpent: res.cost,
      balance: res.balance,
      meta: { ai_generated: true, generated_at: new Date().toISOString(), interpretation_type: "life_report" },
    },
  });
}
