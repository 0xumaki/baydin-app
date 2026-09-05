import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/graha-yuddha — detects Graha Yuddha (planetary war) in the natal chart.
 * Graha Yuddha occurs when two planets are within 1° of each other.
 * The planet with higher longitude wins; the loser is weakened.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ yuddha: null });
  if (!user.birthData) return NextResponse.json({ yuddha: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ yuddha: null });
  }

  const planets = chart.planets.filter((p: any) => p.name !== "Rahu" && p.name !== "Ketu");
  const wars: { planet1: string; planet2: string; orb: number; winner: string; loser: string; effect: string }[] = [];

  const WAR_EFFECTS: Record<string, string> = {
    Sun: "Ego conflicts, authority struggles, vitality fluctuates",
    Moon: "Emotional volatility, mind-body tension, mood swings",
    Mars: "Energy conflicts, aggression, drive becomes scattered",
    Mercury: "Communication breakdowns, nervous tension, intellect scattered",
    Jupiter: "Wisdom vs material conflict, growth stunted, fortune delayed",
    Venus: "Relationship tension, desire conflicts, values challenged",
    Saturn: "Discipline vs freedom conflict, delays intensify, patience tested",
  };

  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const diff = Math.abs(p1.longitude - p2.longitude);
      if (diff < 1) {
        const winner = p1.longitude > p2.longitude ? p1 : p2;
        const loser = p1.longitude > p2.longitude ? p2 : p1;
        wars.push({
          planet1: p1.name,
          planet2: p2.name,
          orb: +diff.toFixed(4),
          winner: winner.name,
          loser: loser.name,
          effect: `${loser.name} loses the war — ${WAR_EFFECTS[loser.name] || "its significations are weakened"}. ${winner.name} dominates and its qualities intensify.`,
        });
      }
    }
  }

  // Also check for close conjunctions (within 5° but not war)
  const conjunctions: { planet1: string; planet2: string; orb: number; sign: string; effect: string }[] = [];
  for (let i = 0; i < planets.length; i++) {
    for (let j = i + 1; j < planets.length; j++) {
      const p1 = planets[i];
      const p2 = planets[j];
      const diff = Math.abs(p1.longitude - p2.longitude);
      if (diff >= 1 && diff < 5) {
        conjunctions.push({
          planet1: p1.name,
          planet2: p2.name,
          orb: +diff.toFixed(2),
          sign: ZODIAC_SIGNS[p1.signIndex],
          effect: `${p1.name} and ${p2.name} are conjunct in ${ZODIAC_SIGNS[p1.signIndex]} — their energies blend and influence each other`,
        });
      }
    }
  }

  return NextResponse.json({
    yuddha: {
      warsCount: wars.length,
      wars: wars.length > 0 ? wars : [],
      conjunctionsCount: conjunctions.length,
      conjunctions: conjunctions.slice(0, 5),
      hasGrahaYuddha: wars.length > 0,
    },
  });
}
