import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, signOf, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/gemstones — recommends gemstones based on the user's natal chart.
 * Analyzes benefic planets (lords of trines/1st house) and recommends their gemstones.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ gemstones: null });
  if (!user.birthData) return NextResponse.json({ gemstones: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ gemstones: null });
  }

  // Planet → gemstone mapping
  const PLANET_GEMSTONES: Record<string, { gem: string; color: string; benefit: string; finger: string }> = {
    Sun: { gem: "Ruby", color: "Red/Pink", benefit: "Vitality, confidence & leadership", finger: "Ring (right)" },
    Moon: { gem: "Pearl", color: "White", benefit: "Emotional balance, calm & intuition", finger: "Little" },
    Mars: { gem: "Red Coral", color: "Red/Orange", benefit: "Courage, energy & protection", finger: "Ring" },
    Mercury: { gem: "Emerald", color: "Green", benefit: "Intelligence, communication & business", finger: "Little" },
    Jupiter: { gem: "Yellow Sapphire", color: "Yellow/Gold", benefit: "Wisdom, fortune & spiritual growth", finger: "Index" },
    Venus: { gem: "Diamond", color: "White/Clear", benefit: "Love, beauty & prosperity", finger: "Middle" },
    Saturn: { gem: "Blue Sapphire", color: "Blue", benefit: "Discipline, longevity & focus", finger: "Middle" },
  };

  const ascSign = chart.ascendant.signIndex;
  const planets = chart.planets;
  const beneficPlanets: string[] = [];

  // 1st house lord (ascendant ruler) is always benefic
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const ascLord = signLords[ascSign];
  beneficPlanets.push(ascLord);

  // 5th house lord (trine of creativity/intelligence)
  const fifthLord = signLords[(ascSign + 4) % 12];
  if (!beneficPlanets.includes(fifthLord)) beneficPlanets.push(fifthLord);

  // 9th house lord (trine of fortune/dharma)
  const ninthLord = signLords[(ascSign + 8) % 12];
  if (!beneficPlanets.includes(ninthLord)) beneficPlanets.push(ninthLord);

  // Moon is generally benefic
  if (!beneficPlanets.includes("Moon")) beneficPlanets.push("Moon");

  // Jupiter is generally benefic
  if (!beneficPlanets.includes("Jupiter")) beneficPlanets.push("Jupiter");

  // Build recommendations with planet position context
  const recommendations = beneficPlanets
    .filter((p) => PLANET_GEMSTONES[p])
    .map((planetName) => {
      const planet = planets.find((p: any) => p.name === planetName);
      const gem = PLANET_GEMSTONES[planetName];
      return {
        planet: planetName,
        gem: gem.gem,
        color: gem.color,
        benefit: gem.benefit,
        finger: gem.finger,
        planetSign: planet ? ZODIAC_SIGNS[planet.signIndex] : "—",
        planetHouse: planet ? planet.house : "—",
        dignity: planet?.dignity || "neutral",
      };
    });

  return NextResponse.json({
    gemstones: {
      ascendant: ZODIAC_SIGNS[ascSign],
      recommendations: recommendations.slice(0, 5),
    },
  });
}
