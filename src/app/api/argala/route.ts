import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/argala — returns Vedic Argala (planetary interventions/blockages).
 * Argala means "bolt" or "intervention" — a planet in a specific position from
 * another planet/house can support or block its expression.
 *
 * Primary Argala: planets in 2nd, 4th, and 11th from a reference point
 * Vipreet Argala (counter-intervention): planets in 12th, 10th, 3rd (blocks the argala)
 *
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ argala: null });
  if (!user.birthData) return NextResponse.json({ argala: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ argala: null });
  }

  const planets = chart.planets;
  const ascSign = chart.ascendant.signIndex;

  type Argala = {
    target: string;
    targetType: "planet" | "house";
    targetSign: string;
    targetHouse: number;
    primaryArgala: { planet: string; position: string; effect: string }[];
    vipreetArgala: { planet: string; position: string; effect: string }[];
    netEffect: string;
  };

  const argalas: Argala[] = [];

  // Analyze Argala on each planet
  for (const target of planets) {
    const targetSign = target.signIndex;
    const targetHouse = target.house;

    // Primary Argala: planets in 2nd, 4th, 11th from target
    const primaryPositions = [
      { offset: 1, pos: "2nd", effect: "Supports through resources, family, speech" },
      { offset: 3, pos: "4th", effect: "Supports through home, comfort, emotional security" },
      { offset: 10, pos: "11th", effect: "Supports through gains, friends, aspirations" },
    ];

    const primary: { planet: string; position: string; effect: string }[] = [];
    for (const pp of primaryPositions) {
      const signIdx = (targetSign + pp.offset) % 12;
      const planetsInSign = planets.filter((p: any) => p.signIndex === signIdx && p.name !== target.name);
      for (const p of planetsInSign) {
        const isBenefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.name);
        primary.push({
          planet: p.name,
          position: pp.pos,
          effect: isBenefic ? pp.effect : `${pp.effect} (but ${p.name} creates friction)`,
        });
      }
    }

    // Vipreet Argala: planets in 12th, 10th, 3rd from target (blocks the argala)
    const vipreetPositions = [
      { offset: 11, pos: "12th", effect: "Blocks through loss, expenses, isolation" },
      { offset: 9, pos: "10th", effect: "Blocks through career demands, public pressure" },
      { offset: 2, pos: "3rd", effect: "Blocks through effort, siblings, communication" },
    ];

    const vipreet: { planet: string; position: string; effect: string }[] = [];
    for (const vp of vipreetPositions) {
      const signIdx = (targetSign + vp.offset) % 12;
      const planetsInSign = planets.filter((p: any) => p.signIndex === signIdx && p.name !== target.name);
      for (const p of planetsInSign) {
        vipreet.push({
          planet: p.name,
          position: vp.pos,
          effect: `${p.name} in ${vp.pos} — ${vp.effect}`,
        });
      }
    }

    let netEffect: string;
    if (primary.length > 0 && vipreet.length === 0) {
      netEffect = `${target.name} receives strong support — its significations flow freely`;
    } else if (primary.length === 0 && vipreet.length > 0) {
      netEffect = `${target.name} is blocked — its significations face obstacles`;
    } else if (primary.length > 0 && vipreet.length > 0) {
      netEffect = `${target.name} has mixed influences — support and blockage both present`;
    } else {
      netEffect = `${target.name} operates without significant interventions`;
    }

    if (primary.length > 0 || vipreet.length > 0) {
      argalas.push({
        target: target.name,
        targetType: "planet",
        targetSign: ZODIAC_SIGNS[targetSign],
        targetHouse,
        primaryArgala: primary,
        vipreetArgala: vipreet,
        netEffect,
      });
    }
  }

  // Also analyze Argala on the Ascendant (Lagna)
  const lagnaPrimary: { planet: string; position: string; effect: string }[] = [];
  for (const pp of [{ offset: 1, pos: "2nd", effect: "Wealth, family support" }, { offset: 3, pos: "4th", effect: "Home, comfort, mother" }, { offset: 10, pos: "11th", effect: "Gains, social circle" }]) {
    const signIdx = (ascSign + pp.offset) % 12;
    const planetsInSign = planets.filter((p: any) => p.signIndex === signIdx);
    for (const p of planetsInSign) {
      const isBenefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(p.name);
      lagnaPrimary.push({ planet: p.name, position: pp.pos, effect: isBenefic ? pp.effect : `${pp.effect} (with friction from ${p.name})` });
    }
  }

  const lagnaVipreet: { planet: string; position: string; effect: string }[] = [];
  for (const vp of [{ offset: 11, pos: "12th", effect: "Loss, expenses" }, { offset: 9, pos: "10th", effect: "Career pressure" }, { offset: 2, pos: "3rd", effect: "Effort required" }]) {
    const signIdx = (ascSign + vp.offset) % 12;
    const planetsInSign = planets.filter((p: any) => p.signIndex === signIdx);
    for (const p of planetsInSign) {
      lagnaVipreet.push({ planet: p.name, position: vp.pos, effect: `${p.name} — ${vp.effect}` });
    }
  }

  return NextResponse.json({
    argala: {
      ascendant: ZODIAC_SIGNS[ascSign],
      lagna: {
        target: "Lagna (Ascendant)",
        targetType: "house",
        targetSign: ZODIAC_SIGNS[ascSign],
        targetHouse: 1,
        primaryArgala: lagnaPrimary,
        vipreetArgala: lagnaVipreet,
        netEffect: lagnaPrimary.length > lagnaVipreet.length ? "Lagna is well-supported — overall chart expression flows" : lagnaVipreet.length > lagnaPrimary.length ? "Lagna faces blockages — chart expression is hindered" : "Mixed influences on Lagna",
      },
      planetArgalas: argalas,
      total: argalas.length + 1,
    },
  });
}
