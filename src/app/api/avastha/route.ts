import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/avastha — returns Vedic Avastha (planetary states/conditions).
 * Each planet is in one of 10 classical Avasthas (states) that describe
 * how the planet is functioning in the chart:
 * Sayana, Upavesana, Netrapani, Prakasa, Gamana, Agamana, Sabha, Agama,
 * Bhojana, Nritya.
 *
 * Simplified to use the 6 Bala Avasthas (dignity-based states):
 * 1. Sanna (infant) — 0-6° in a sign
 * 2. Kumara (youth) — 6-12°
 * 3. Yuva (adult) — 12-18° (strongest)
 * 4. Vriddha (old) — 18-24°
 * 5. Mrita (dead) — 24-30° (weakest)
 * Plus Jagradipta (awake/bright) vs Susupta (asleep) vs Swapna (dreaming)
 *
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ avastha: null });
  if (!user.birthData) return NextResponse.json({ avastha: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ avastha: null });
  }

  const ascSign = chart.ascendant.signIndex;
  const planets = chart.planets;

  const DEGREE_AVASTHAS: { range: [number, number]; name: string; sanskrit: string; strength: number; effect: string }[] = [
    { range: [0, 6], name: "Infant", sanskrit: "Sanna", strength: 25, effect: "Weak expression — planet's energy is just beginning to manifest" },
    { range: [6, 12], name: "Youth", sanskrit: "Kumara", strength: 50, effect: "Growing strength — planet is developing its full potential" },
    { range: [12, 18], name: "Adult", sanskrit: "Yuva", strength: 100, effect: "Full strength — planet expresses its significations powerfully" },
    { range: [18, 24], name: "Old", sanskrit: "Vriddha", strength: 50, effect: "Diminishing — planet's energy is waning but still experienced" },
    { range: [24, 30], name: "Dead", sanskrit: "Mrita", strength: 25, effect: "Weakest — planet's significations need significant support to manifest" },
  ];

  // Consciousness state (Jagrad/Swapna/Susupta) based on house from Lagna
  const CONSCIOUSNESS: { houses: number[]; name: string; sanskrit: string; effect: string }[] = [
    { houses: [1, 2, 3], name: "Awake", sanskrit: "Jagrad", effect: "Planet is fully active and conscious — results are immediate and visible" },
    { houses: [4, 5, 6, 7, 8, 9], name: "Dreaming", sanskrit: "Swapna", effect: "Planet is in a dream state — results manifest through intuition and circumstance" },
    { houses: [10, 11, 12], name: "Asleep", sanskrit: "Susupta", effect: "Planet is dormant — results require effort to activate" },
  ];

  const results = planets.map((p: any) => {
    const degree = p.degree;
    const degreeAvastha = DEGREE_AVASTHAS.find((a) => degree >= a.range[0] && degree < a.range[1]) || DEGREE_AVASTHAS[0];
    const consciousness = CONSCIOUSNESS.find((c) => c.houses.includes(p.house)) || CONSCIOUSNESS[1];

    // Combined strength
    const totalStrength = degreeAvastha.strength * (consciousness.name === "Awake" ? 1 : consciousness.name === "Dreaming" ? 0.7 : 0.4);
    const strengthRating = totalStrength >= 80 ? "excellent" : totalStrength >= 50 ? "good" : totalStrength >= 30 ? "average" : "weak";

    // Dignity bonus
    let dignityBonus = 0;
    if (p.dignity === "exalted") dignityBonus = 20;
    else if (p.dignity === "own_sign") dignityBonus = 10;
    else if (p.dignity === "debilitated") dignityBonus = -20;

    const finalStrength = Math.max(0, Math.min(100, totalStrength + dignityBonus));

    return {
      planet: p.name,
      symbol: PLANET_SYMBOLS[p.name] || "•",
      sign: ZODIAC_SIGNS[p.signIndex],
      house: p.house,
      degree: +degree.toFixed(2),
      degreeAvastha: { name: degreeAvastha.name, sanskrit: degreeAvastha.sanskrit, effect: degreeAvastha.effect },
      consciousness: { name: consciousness.name, sanskrit: consciousness.sanskrit, effect: consciousness.effect },
      dignity: p.dignity || "neutral",
      retrograde: p.retrograde,
      totalStrength: +finalStrength.toFixed(0),
      strengthRating,
      summary: `${p.name} is in ${degreeAvastha.name} (${degreeAvastha.sanskrit}) state, ${consciousness.name.toLowerCase()} (${consciousness.sanskrit}), at ${degree.toFixed(1)}° in ${ZODIAC_SIGNS[p.signIndex]}${p.dignity !== "neutral" ? `, ${p.dignity}` : ""}${p.retrograde ? ", retrograde" : ""} — ${degreeAvastha.effect}`,
    };
  });

  const strongest = [...results].sort((a, b) => b.totalStrength - a.totalStrength)[0];
  const weakest = [...results].sort((a, b) => a.totalStrength - b.totalStrength)[0];

  return NextResponse.json({
    avastha: {
      planets: results,
      strongest: { planet: strongest?.planet, strength: strongest?.totalStrength, rating: strongest?.strengthRating, summary: strongest?.summary },
      weakest: { planet: weakest?.planet, strength: weakest?.totalStrength, rating: weakest?.strengthRating, summary: weakest?.summary },
    },
  });
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};
