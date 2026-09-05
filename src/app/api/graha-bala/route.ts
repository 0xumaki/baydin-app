import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS, PLANET_MY } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/graha-bala — returns Graha Bala (planetary power periods).
 * Identifies which planets are currently most powerful in the chart based on:
 * 1. Dignity (exalted/own sign = high power)
 * 2. House placement (kendra/trkona = high power)
 * 3. Avastha (Yuva = high power)
 * 4. Dasha lord status (current Mahadasha lord gets bonus)
 * 5. Combustion check (close to Sun = reduced power)
 *
 * Provides a "power ranking" of all planets and identifies the
 * dominant planetary influence in the user's life right now.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ grahaBala: null });
  if (!user.birthData) return NextResponse.json({ grahaBala: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ grahaBala: null });
  }

  const planets = chart.planets;
  const sun = planets.find((p: any) => p.name === "Sun");
  const dashaLord = chart.dasha?.current_mahadasha;

  const PLANET_INFO: Record<string, { significations: string[]; color: string }> = {
    Sun: { significations: ["soul", "father", "authority", "health", "ego"], color: "#C5A87C" },
    Moon: { significations: ["mind", "emotions", "mother", "comfort", "public"], color: "#9CA8A3" },
    Mars: { significations: ["energy", "courage", "siblings", "property", "accidents"], color: "#b5463a" },
    Mercury: { significations: ["intellect", "communication", "business", "friends"], color: "#B5CD7E" },
    Jupiter: { significations: ["wisdom", "fortune", "children", "spirituality", "wealth"], color: "#C5A87C" },
    Venus: { significations: ["love", "luxury", "arts", "marriage", "beauty"], color: "#D876A0" },
    Saturn: { significations: ["career", "discipline", "longevity", "service", "karma"], color: "#9E8AC9" },
    Rahu: { significations: ["ambition", "foreign", "technology", "illusion"], color: "#5FA9C7" },
    Ketu: { significations: ["spirituality", "liberation", "detachment", "research"], color: "#F09A3D" },
  };

  const results = planets.map((p: any) => {
    let power = 50; // base

    // 1. Dignity power
    if (p.dignity === "exalted") power += 30;
    else if (p.dignity === "own_sign") power += 20;
    else if (p.dignity === "debilitated") power -= 20;

    // 2. House power
    if ([1, 4, 7, 10].includes(p.house)) power += 15; // Kendra
    if ([5, 9].includes(p.house)) power += 20; // Trikona (best)
    if ([6, 8, 12].includes(p.house)) power -= 10; // Dusthana

    // 3. Avastha (degree-based)
    if (p.degree >= 12 && p.degree < 18) power += 15; // Yuva (adult = strongest)
    else if (p.degree >= 6 && p.degree < 12) power += 5; // Kumara
    else if (p.degree >= 24) power -= 10; // Mrita

    // 4. Dasha lord bonus
    if (p.name === dashaLord) power += 20;

    // 5. Combustion check
    if (sun && p.name !== "Sun") {
      const signDiff = Math.abs(p.signIndex - sun.signIndex);
      if (signDiff === 0) power -= 15; // combust
    }

    // 6. Retrograde bonus (intensified energy)
    if (p.retrograde && ["Mars", "Jupiter", "Saturn"].includes(p.name)) power += 5;

    power = Math.max(5, Math.min(100, power));
    const rating = power >= 80 ? "dominant" : power >= 60 ? "strong" : power >= 40 ? "moderate" : power >= 20 ? "weak" : "very weak";
    const info = PLANET_INFO[p.name] || { significations: ["general"], color: "#9CA8A3" };

    return {
      planet: p.name,
      planetMy: PLANET_MY[p.name] || p.name,
      symbol: ["☉","☽","♂","☿","♃","♀","♄","☊","☋"][["Sun","Moon","Mars","Mercury","Jupiter","Venus","Saturn","Rahu","Ketu"].indexOf(p.name)] || "•",
      sign: ZODIAC_SIGNS[p.signIndex],
      house: p.house,
      dignity: p.dignity || "neutral",
      retrograde: p.retrograde,
      isDashaLord: p.name === dashaLord,
      isCombust: sun && p.name !== "Sun" && p.signIndex === sun.signIndex,
      power: +power.toFixed(0),
      rating,
      significations: info.significations,
      color: info.color,
    };
  });

  // Sort by power descending
  results.sort((a, b) => b.power - a.power);

  const dominant = results[0];
  const weakest = results[results.length - 1];

  return NextResponse.json({
    grahaBala: {
      dashaLord,
      planets: results,
      dominant: {
        planet: dominant?.planet,
        power: dominant?.power,
        rating: dominant?.rating,
        significations: dominant?.significations,
        summary: `${dominant?.planet} is your most powerful planet (${dominant?.power}/100, ${dominant?.rating}) — it dominates your ${dominant?.significations.join(", ")} right now.`,
      },
      weakest: {
        planet: weakest?.planet,
        power: weakest?.power,
        rating: weakest?.rating,
        summary: `${weakest?.planet} is your weakest planet (${weakest?.power}/100, ${weakest?.rating}) — its significations need support through remedies.`,
      },
    },
  });
}
