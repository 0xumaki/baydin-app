import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { spendForFeature } from "@/lib/luck";
import { computeNatalChart, computeMahabote, type BirthContext, type AstrologyMode } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Compute a natal chart. Costs Luck (birth_chart = 3). */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const mode = (req.nextUrl.searchParams.get("mode") as AstrologyMode) || "vedic";
  if (!user.birthData) {
    return NextResponse.json({ error: "Please add your birth details in your profile first." }, { status: 400 });
  }
  // Spend Luck
  const feature = mode === "mahabote" ? "mahabote" : "birth_chart";
  const res = await spendForFeature({ userId: user.id, feature: feature as any, description: `Natal chart (${mode})` });
  if (!res.ok) {
    return NextResponse.json({ error: "Insufficient Luck.", balance: res.balance }, { status: 402 });
  }
  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart;
  if (mode === "mahabote") {
    chart = computeMahabote(birthData);
  } else {
    chart = computeNatalChart(birthData, mode);
  }
  return NextResponse.json({ chart, luckSpent: res.cost, balance: res.balance });
}
