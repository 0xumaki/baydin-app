import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, computeTransits, type BirthContext, ZODIAC_SIGNS, PLANET_MY } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/gochar — returns Gochar (transit) predictions based on current
 * planetary positions relative to the user's natal chart.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ gochar: null });
  if (!user.birthData) return NextResponse.json({ gochar: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let natal: any;
  try {
    natal = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ gochar: null });
  }

  let transitData: any;
  try {
    transitData = computeTransits(birthData, natal, 7);
  } catch {
    return NextResponse.json({ gochar: null });
  }

  const ascSign = natal.ascendant.signIndex;
  const moonSign = natal.planets.find((p: any) => p.name === "Moon")?.signIndex ?? 0;

  const HOUSE_PREDICTIONS: Record<number, string> = {
    1: "Personal transformation, new beginnings, identity shifts",
    2: "Financial changes, family matters, speech and values",
    3: "Short journeys, siblings, courage, communication",
    4: "Home, property, mother, emotional foundation",
    5: "Creativity, romance, children, intelligence",
    6: "Health, obstacles, enemies, service — challenges to overcome",
    7: "Partnerships, marriage, business, public image",
    8: "Transformation, longevity, sudden changes, hidden matters",
    9: "Fortune, higher learning, spirituality, father, dharma",
    10: "Career, reputation, authority, public standing",
    11: "Gains, income, friendships, wishes fulfilled",
    12: "Expenses, losses, foreign lands, spiritual retreat",
  };

  const PLANET_EFFECTS: Record<string, string> = {
    Sun: "vitality, confidence, authority",
    Moon: "emotions, mind, comfort",
    Mars: "energy, drive, conflict potential",
    Mercury: "communication, intellect, business",
    Jupiter: "wisdom, fortune, expansion, growth",
    Venus: "love, beauty, relationships, luxury",
    Saturn: "discipline, delays, hard work, maturity",
    Rahu: "ambition, material desires, unconventional paths",
    Ketu: "spiritual liberation, detachment",
  };

  const currentTransits = transitData.current_transits || {};
  const predictions = Object.entries(currentTransits).map(([name, pos]: [string, any]) => {
    const signIdx = Math.floor((pos as any).longitude / 30);
    const houseFromAsc = ((signIdx - ascSign + 12) % 12) + 1;
    const houseFromMoon = ((signIdx - moonSign + 12) % 12) + 1;
    const houseEffect = HOUSE_PREDICTIONS[houseFromAsc] || "general influence";
    const planetEffect = PLANET_EFFECTS[name] || "various effects";
    return {
      planet: name,
      planetMy: PLANET_MY[name] || name,
      sign: (pos as any).sign || ZODIAC_SIGNS[signIdx],
      houseFromAsc,
      houseFromMoon,
      prediction: `${name} in ${houseFromAsc}${ordinalSuffix(houseFromAsc)} house (${houseEffect}) — affects ${planetEffect}`,
    };
  });

  const keyTransits = predictions.filter((p) => ["Saturn", "Jupiter", "Rahu"].includes(p.planet));

  return NextResponse.json({
    gochar: {
      date: transitData.target_date,
      predictions: predictions.slice(0, 8),
      keyTransits: keyTransits.length > 0 ? keyTransits : predictions.slice(0, 3),
    },
  });
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
