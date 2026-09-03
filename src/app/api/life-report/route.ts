import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
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

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
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

  // Generate all 7 sections concurrently using allSettled so partial failures don't
  // lose the entire report. This prevents the "15 Luck lost, no report" scenario.
  const sectionPromises = SECTIONS.map(async (section) => {
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
    return {
      id: section.id,
      name: section.name,
      content: result.parsed?.content ?? result.content,
      highlights: result.parsed?.highlights ?? [],
      guidance: result.parsed?.guidance ?? null,
    };
  });

  const settled = await Promise.allSettled(sectionPromises);

  // Collect successful sections
  const sectionResults = settled
    .map((r, i) => r.status === "fulfilled" ? r.value : null)
    .filter((r): r is NonNullable<typeof r> => r !== null);

  // If ALL sections failed, refund fully
  if (sectionResults.length === 0) {
    await creditLuck({
      userId: user.id,
      amount: res.cost,
      type: "admin_grant",
      description: "Refund: life report — all sections failed",
    });
    return NextResponse.json(
      { error: "The report couldn't be generated. Your Luck has been refunded." },
      { status: 500 }
    );
  }

  // If some sections failed, partial refund (proportional)
  const failedCount = SECTIONS.length - sectionResults.length;
  if (failedCount > 0) {
    const refundAmount = Math.round((res.cost * failedCount) / SECTIONS.length);
    if (refundAmount > 0) {
      await creditLuck({
        userId: user.id,
        amount: refundAmount,
        type: "admin_grant",
        description: `Partial refund: ${failedCount}/${SECTIONS.length} sections failed`,
      });
    }
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
      content: JSON.stringify(sectionResults, null, 2),
      metadata: JSON.stringify({ interpretationType: "life_report", luckCost: res.cost, sections: sectionResults.length }),
    },
  });

  return NextResponse.json({
    lifeReport: {
      id: conv.id,
      sections: sectionResults,
      luckSpent: res.cost,
      balance: res.balance,
      meta: { ai_generated: true, generated_at: new Date().toISOString(), interpretation_type: "life_report" },
    },
  });
}

/** GET /api/life-report — list past life reports for the user. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const reports = await db.conversation.findMany({
    where: { userId: user.id, mode: "life-report" },
    orderBy: { createdAt: "desc" },
    take: 10,
    select: {
      id: true,
      title: true,
      createdAt: true,
      messageCount: true,
      _count: { select: { messages: true } },
    },
  });

  return NextResponse.json({ reports });
}
