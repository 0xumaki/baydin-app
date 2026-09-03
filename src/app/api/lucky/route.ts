import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/lucky — returns today's lucky numbers, colors, and time derived from
 * the user's natal chart. Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (!user.birthData) return NextResponse.json({ lucky: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ lucky: null });
  }

  // Derive lucky numbers from chart:
  // - Moon sign index (1-12)
  // - Ascendant sign index (1-12)
  // - Current dasha lord index
  // - Sum of planet sign indices mod 9 + 1
  const moonSign = chart.planets.find((p: any) => p.name === "Moon")?.signIndex ?? 0;
  const ascSign = chart.ascendant.signIndex;
  const dashaLord = chart.dasha?.current_mahadasha;
  const dashaIdx = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"].indexOf(dashaLord);

  // Numerology: reduce to single digits, keep meaningful ones
  const luckyNumbers = [
    ((moonSign + 1) % 9) + 1,
    ((ascSign + 1) % 9) + 1,
    dashaIdx >= 0 ? ((dashaIdx + 1) % 9) + 1 : 3,
    ((moonSign + ascSign + 1) % 9) + 1,
  ].filter((v, i, arr) => arr.indexOf(v) === i).slice(0, 3);

  // Lucky colors based on ruling planet of the day
  const weekday = new Date().getDay();
  const dayPlanets = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const dayPlanet = dayPlanets[weekday];
  const planetColors: Record<string, string> = {
    Sun: "Gold / Orange", Moon: "White / Silver", Mars: "Red / Crimson",
    Mercury: "Green / Emerald", Jupiter: "Yellow / Saffron", Venus: "Pink / Lavender", Saturn: "Dark Blue / Black",
  };

  // Lucky time based on day planet's hour (simplified — just pick morning/afternoon/evening)
  const luckyTimes = ["Morning (6-9 AM)", "Midday (12-2 PM)", "Afternoon (3-5 PM)", "Evening (6-8 PM)"];
  const luckyTime = luckyTimes[weekday % 4];

  return NextResponse.json({
    lucky: {
      numbers: luckyNumbers,
      color: planetColors[dayPlanet] || "Gold",
      time: luckyTime,
      dayPlanet,
      moonSign: ZODIAC_SIGNS[moonSign],
      ascendant: ZODIAC_SIGNS[ascSign],
    },
  });
}
