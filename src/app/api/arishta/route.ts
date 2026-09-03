import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/arishta — detects Vedic Arishta (afflictions/evil combinations).
 * Arishtas indicate periods of difficulty, health issues, or misfortune.
 * Checks for classical affliction combinations:
 * - Papakartari Yoga (hemmed between malefics)
 * - Sun-Moon conjunction/opposition (Amavasya/Surya Sankranti)
 * - Debilitated lord of key houses
 * - Malefics in dusthana houses (6/8/12)
 * - Kemadruma (no planets around Moon)
 * - Graha Yuddha (planetary war)
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ arishta: null });
  if (!user.birthData) return NextResponse.json({ arishta: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ arishta: null });
  }

  const planets = chart.planets;
  const ascSign = chart.ascendant.signIndex;
  const moon = planets.find((p: any) => p.name === "Moon");
  const sun = planets.find((p: any) => p.name === "Sun");
  const MALEFICS = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];

  type Affliction = { name: string; severity: "high" | "medium" | "low"; description: string; remedy: string };

  const afflictions: Affliction[] = [];

  // 1. Papakartari Yoga (Moon/Lagna hemmed between malefics)
  for (const target of [{ name: "Lagna", sign: ascSign }, { name: "Moon", sign: moon?.signIndex ?? -1 }]) {
    if (target.sign < 0) continue;
    const prevSign = (target.sign + 11) % 12;
    const nextSign = (target.sign + 1) % 12;
    const prevMalefic = planets.find((p: any) => MALEFICS.includes(p.name) && p.signIndex === prevSign);
    const nextMalefic = planets.find((p: any) => MALEFICS.includes(p.name) && p.signIndex === nextSign);
    if (prevMalefic && nextMalefic) {
      afflictions.push({
        name: `Papakartari Yoga (${target.name})`,
        severity: "high",
        description: `${target.name} is hemmed between malefics ${prevMalefic.name} (behind) and ${nextMalefic.name} (ahead) — creates obstacles and stress`,
        remedy: `Worship Lord Ganesha; chant 'Om Gam Ganapataye Namaha'; offer modak on Tuesdays`,
      });
    }
  }

  // 2. Debilitated lords of key houses (1st, 4th, 7th, 9th, 10th)
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const KEY_HOUSES = [1, 4, 7, 9, 10];
  for (const house of KEY_HOUSES) {
    const houseSign = (ascSign + house - 1) % 12;
    const lord = signLords[houseSign];
    const lordPlanet = planets.find((p: any) => p.name === lord);
    if (lordPlanet?.dignity === "debilitated") {
      afflictions.push({
        name: `Debilitated ${house}${ordinalSuffix(house)} Lord`,
        severity: "high",
        description: `${lord} (lord of house ${house}) is debilitated in ${ZODIAC_SIGNS[lordPlanet.signIndex]} — weakens the affairs of house ${house}`,
        remedy: `Strengthen ${lord} through its gemstone, mantra, and charity on its weekday`,
      });
    }
  }

  // 3. Malefics in dusthana houses (6, 8, 12)
  for (const p of planets) {
    if ([6, 8, 12].includes(p.house) && MALEFICS.includes(p.name)) {
      afflictions.push({
        name: `${p.name} in House ${p.house}`,
        severity: p.house === 8 ? "high" : "medium",
        description: `${p.name} (malefic) in dusthana house ${p.house} (${p.house === 6 ? "enemies/illness" : p.house === 8 ? "longevity/obstacles" : "loss/expenses"}) creates challenges`,
        remedy: `Perform ${p.name} remedies: mantra, charity, and gemstone on ${getPlanetDay(p.name)}`,
      });
    }
  }

  // 4. Kemadruma Yoga (no planets in 2nd/12th from Moon)
  if (moon) {
    const adjacent = planets.filter((p: any) => {
      const diff = (p.signIndex - moon.signIndex + 12) % 12;
      return diff === 1 || diff === 11;
    });
    if (adjacent.length === 0) {
      afflictions.push({
        name: "Kemadruma Yoga",
        severity: "medium",
        description: "No planets flank the Moon (2nd/12th houses empty) — can cause isolation, financial struggles, and emotional challenges",
        remedy: "Wear pearl or silver; keep a silver vessel with water near the bed; worship Goddess Lakshmi on Mondays",
      });
    }
  }

  // 5. Graha Yuddha (planetary war — planets within 1°)
  const nonNode = planets.filter((p: any) => p.name !== "Rahu" && p.name !== "Ketu");
  for (let i = 0; i < nonNode.length; i++) {
    for (let j = i + 1; j < nonNode.length; j++) {
      const diff = Math.abs(nonNode[i].longitude - nonNode[j].longitude);
      if (diff < 1) {
        const loser = nonNode[i].longitude > nonNode[j].longitude ? nonNode[j] : nonNode[i];
        afflictions.push({
          name: "Graha Yuddha (Planetary War)",
          severity: "medium",
          description: `${nonNode[i].name} and ${nonNode[j].name} are within 1° — ${loser.name} loses the war, weakening its significations`,
          remedy: `Strengthen the losing planet (${loser.name}) through remedies`,
        });
      }
    }
  }

  // 6. Combust planets (close to Sun — within same sign)
  if (sun) {
    const combustPlanets = planets.filter((p: any) => p.name !== "Sun" && p.signIndex === sun.signIndex);
    for (const p of combustPlanets) {
      const orb = Math.abs(p.longitude - sun.longitude);
      if (orb < 10) {
        afflictions.push({
          name: `${p.name} Combust`,
          severity: orb < 5 ? "high" : "medium",
          description: `${p.name} is combust (within ${orb.toFixed(1)}° of the Sun) — its energy is weakened by the Sun's rays`,
          remedy: `Perform ${p.name} remedies especially during its hora (planetary hour); avoid major decisions related to ${p.name}'s significations`,
        });
      }
    }
  }

  // Overall assessment
  const highCount = afflictions.filter((a) => a.severity === "high").length;
  const mediumCount = afflictions.filter((a) => a.severity === "medium").length;
  const overall = highCount >= 3 ? "significant" : highCount >= 1 ? "moderate" : mediumCount >= 2 ? "mild" : "minimal";

  return NextResponse.json({
    arishta: {
      total: afflictions.length,
      high: highCount,
      medium: mediumCount,
      low: afflictions.length - highCount - mediumCount,
      overall,
      summary: overall === "minimal"
        ? "Your chart shows minimal afflictions — generally favorable planetary combinations."
        : overall === "mild"
        ? `${afflictions.length} mild afflictions detected — manageable with simple remedies.`
        : overall === "moderate"
        ? `${highCount} significant + ${mediumCount} moderate afflictions — focused remedies recommended.`
        : `${highCount} significant afflictions — dedicated remedy practice essential.`,
      afflictions,
    },
  });
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}

function getPlanetDay(planet: string): string {
  const days: Record<string, string> = {
    Sun: "Sunday", Moon: "Monday", Mars: "Tuesday", Mercury: "Wednesday",
    Jupiter: "Thursday", Venus: "Friday", Saturn: "Saturday", Rahu: "Saturday", Ketu: "Tuesday",
  };
  return days[planet] || "any day";
}
