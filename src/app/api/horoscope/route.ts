import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature } from "@/lib/luck";
import { computeNatalChart, computeTransits, sunSignForDate, julianDay, type BirthContext } from "@/lib/astrology";
import { renderHoroscopePrompt, callAstrologerLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * GET /api/horoscope?sign=aries&type=daily
 * If user has birth data, uses personalized transits (costs Luck).
 * Otherwise returns a generic sun-sign horoscope (free, lighter).
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  const sign = req.nextUrl.searchParams.get("sign") || (user?.birthData ? sunSignFromBirth(user.birthData) : "aries");
  const type = (req.nextUrl.searchParams.get("type") as "daily" | "weekly" | "monthly") || "daily";
  const date = new Date().toISOString().slice(0, 10);

  // Try cached horoscope (per sign+type+date+language)
  const language = user?.language || "my";
  // No DB table for horoscope cache — compute fresh each time but it's cheap to cache in-memory.
  // For now compute on demand.

  // Determine transits
  let transits: any = null;
  let personalized = false;
  let luckCost = 0;
  if (user?.birthData) {
    const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
    // Spend Luck for personalized horoscope
    const res = await spendForFeature({
      userId: user.id,
      feature: "horoscope_personal",
      description: `Personalized ${type} horoscope`,
    });
    if (res.ok) {
      luckCost = res.cost;
      personalized = true;
      try {
        const chart = computeNatalChart(birthData, "vedic");
        transits = computeTransits(birthData, chart, type === "monthly" ? 30 : 7);
      } catch (e) { console.error("Horoscope transit compute failed:", e); }
    }
  }

  // Generic transit fallback (just current planet positions from a default chart)
  if (!transits) {
    transits = genericTransits();
  }

  const { system, user: prompt } = renderHoroscopePrompt({
    language, sign, date, period: type, transits,
  });
  const result = await callAstrologerLLM(system, prompt, {
    temperature: 0.8,
    maxTokens: 1400,
  });

  return NextResponse.json({
    horoscope: {
      sign, type, date, language, personalized, luckCost,
      content: result.parsed?.content ?? result.content,
      highlights: result.parsed?.highlights ?? [],
      guidance: result.parsed?.guidance ?? null,
      meta: { ai_generated: true, generated_at: new Date().toISOString(), interpretation_type: "horoscope" },
    },
  });
}

function sunSignFromBirth(birthDataJson: string): string {
  try {
    const b = JSON.parse(birthDataJson);
    return sunSignForDate(b.dob);
  } catch { return "aries"; }
}

/** Generic current transits (no natal chart needed). */
function genericTransits() {
  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60);
  const d = jd - 2451545.0;
  const sunM = rev(356.047 + 0.9856002585 * d);
  const sunLon = rev(sunM + (180 / Math.PI) * 0.016709 * Math.sin(sunM * D2R) * (1 + 0.016709 * Math.cos(sunM * D2R)) + 282.9404);
  const moonLon = rev(218.31617 + 481267.88088 * (d / 36525));
  return {
    target_date: now.toISOString(),
    current_transits: {
      Sun: { longitude: +sunLon.toFixed(2) },
      Moon: { longitude: +moonLon.toFixed(2) },
    },
    note: "Generic transit data (no natal chart).",
  };
}

const D2R = Math.PI / 180;
const rev = (x: number) => ((x % 360) + 360) % 360;
