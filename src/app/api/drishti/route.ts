import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/drishti — returns Vedic Drishti (planetary aspects).
 * Vedic aspect rules differ from Western:
 * - All planets aspect the 7th house from themselves (opposition)
 * - Mars additionally aspects 4th and 8th
 * - Jupiter additionally aspects 5th and 9th
 * - Saturn additionally aspects 3rd and 10th
 * - Rahu/Ketu aspect 5th, 7th, 9th (like Jupiter)
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ drishti: null });
  if (!user.birthData) return NextResponse.json({ drishti: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ drishti: null });
  }

  const planets = chart.planets;
  const ascSign = chart.ascendant.signIndex;

  // Special aspect houses per planet (beyond the universal 7th)
  const SPECIAL_ASPECTS: Record<string, number[]> = {
    Mars: [4, 7, 8],
    Jupiter: [5, 7, 9],
    Saturn: [3, 7, 10],
    Rahu: [5, 7, 9],
    Ketu: [5, 7, 9],
  };

  const aspects: {
    from: string;
    fromSign: string;
    fromHouse: number;
    toSign: string;
    toHouse: number;
    aspectType: string;
    planetsInTarget: string[];
    effect: string;
  }[] = [];

  for (const p of planets) {
    const fromHouse = p.house;
    const fromSignIdx = p.signIndex;
    const aspectHouses = SPECIAL_ASPECTS[p.name] || [7];

    for (const aspectHouse of aspectHouses) {
      const toHouse = ((fromHouse + aspectHouse - 1) % 12) + 1;
      const toSignIdx = (fromSignIdx + aspectHouse - 1) % 12;
      const toSign = ZODIAC_SIGNS[toSignIdx];

      // Find planets in the target sign
      const planetsInTarget = planets
        .filter((other: any) => other.name !== p.name && other.signIndex === toSignIdx)
        .map((other: any) => other.name);

      // Aspect effects
      const isBenefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.name);
      const aspectName = aspectHouse === 7 ? "Opposition" : `${aspectHouse}th aspect`;

      let effect: string;
      if (planetsInTarget.length > 0) {
        effect = `${p.name} ${aspectName} on ${planetsInTarget.join(", ")} in ${toSign} — ${isBenefic ? "beneficial influence, enhances" : "challenging influence, tests"} the aspected planet's energy`;
      } else {
        effect = `${p.name} ${aspectName} on ${toSign} (house ${toHouse}) — ${isBenefic ? "blesses" : "challenges"} the matters of this house`;
      }

      aspects.push({
        from: p.name,
        fromSign: ZODIAC_SIGNS[fromSignIdx],
        fromHouse,
        toSign,
        toHouse,
        aspectType: aspectName,
        planetsInTarget,
        effect,
      });
    }
  }

  // Sort: aspects that hit other planets first, then by planet name
  aspects.sort((a, b) => {
    if (a.planetsInTarget.length > 0 && b.planetsInTarget.length === 0) return -1;
    if (a.planetsInTarget.length === 0 && b.planetsInTarget.length > 0) return 1;
    return a.from.localeCompare(b.from);
  });

  // Group by planet
  const byPlanet: Record<string, typeof aspects> = {};
  for (const a of aspects) {
    if (!byPlanet[a.from]) byPlanet[a.from] = [];
    byPlanet[a.from].push(a);
  }

  return NextResponse.json({
    drishti: {
      ascendant: ZODIAC_SIGNS[ascSign],
      totalAspects: aspects.length,
      aspectsHittingPlanets: aspects.filter((a) => a.planetsInTarget.length > 0).length,
      aspects,
      byPlanet,
    },
  });
}
