import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, computeTransits, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/gochar-phala — returns detailed Gochar Phala (transit effects).
 * For each transit planet passing through a house from the natal Moon,
 * returns the specific effects based on classical Gochar Phala texts.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ gocharPhala: null });
  if (!user.birthData) return NextResponse.json({ gocharPhala: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let natal: any;
  try {
    natal = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ gocharPhala: null });
  }

  let transitData: any;
  try {
    transitData = computeTransits(birthData, natal, 7);
  } catch {
    return NextResponse.json({ gocharPhala: null });
  }

  const moonSign = natal.planets.find((p: any) => p.name === "Moon")?.signIndex ?? 0;
  const ascSign = natal.ascendant.signIndex;
  const currentTransits = transitData.current_transits || {};

  // Classical Gochar Phala: transit planet effects from natal Moon (Janma Rashi)
  const HOUSE_FROM_MOON_EFFECTS: Record<number, string> = {
    1: "Physical vitality changes, mental state shifts, new beginnings in personal life",
    2: "Financial fluctuations, family matters, speech and diet changes, expenses increase",
    3: "Short journeys, courage fluctuations, sibling relationships, communication changes",
    4: "Home life, mother's health, property matters, emotional foundation, vehicle concerns",
    5: "Romantic life, children's matters, intellectual pursuits, creative expression shifts",
    6: "Health concerns, obstacle removal, competition, service obligations, debt issues",
    7: "Marriage/partnership matters, public image, foreign connections, travel abroad",
    8: "Longevity concerns, sudden changes, hidden matters, transformation, research",
    9: "Fortune shifts, spiritual inclination, father's health, higher learning, dharma",
    10: "Career changes, reputation, authority matters, public standing, professional shifts",
    11: "Gains, income increases, friendship circles, wish fulfillment, social networking",
    12: "Expenses, losses, foreign travel, spiritual retreat, isolation, charitable giving",
  };

  // Planet-specific transit effects
  const PLANET_TRANSIT_EFFECTS: Record<string, { benefic: string; malefic: string; duration: string }> = {
    Sun: {
      benefic: "Increased vitality, recognition, authority, improved relationship with father",
      malefic: "Ego conflicts, health issues, tension with authority, eye problems",
      duration: "~1 month (moves ~1 sign per month)",
    },
    Moon: {
      benefic: "Emotional peace, mental clarity, public favor, domestic happiness",
      malefic: "Emotional volatility, mental anxiety, mother's health, restlessness",
      duration: "~2.5 days (moves ~1 sign every 2.5 days)",
    },
    Mars: {
      benefic: "Increased energy, courage, property gains, competitive success",
      malefic: "Conflicts, accidents, surgery risk, property disputes, legal issues",
      duration: "~1.5 months (moves ~1 sign every 45 days)",
    },
    Mercury: {
      benefic: "Intellectual clarity, business gains, communication success, friendship",
      malefic: "Communication breakdowns, nervous tension, business losses, skin issues",
      duration: "~2-3 weeks (fast-moving, retrograde extends)",
    },
    Jupiter: {
      benefic: "Wisdom, fortune, wealth, children's welfare, spiritual growth, education",
      malefic: "Over-optimism, weight gain, laziness, religious conflicts, excess",
      duration: "~1 year (moves ~1 sign per year) — MAJOR INFLUENCE",
    },
    Venus: {
      benefic: "Love, romance, luxury, artistic success, marriage, comfort",
      malefic: "Relationship tension, overindulgence, vanity, financial excess",
      duration: "~1 month (except during retrograde)",
    },
    Saturn: {
      benefic: "Career stability, real estate gains, discipline, long-term achievement",
      malefic: "Delays, obstacles, health issues, financial stress, isolation, sorrow",
      duration: "~2.5 years (moves ~1 sign every 2.5 years) — MOST SIGNIFICANT TRANSIT",
    },
    Rahu: {
      benefic: "Material desires fulfilled, foreign connections, technology, ambition",
      malefic: "Illusion, confusion, addiction, skin issues, relationship deception",
      duration: "~1.5 years (moves ~1 sign every 1.5 years) — MAJOR INFLUENCE",
    },
  };

  const transitEffects = Object.entries(currentTransits).map(([name, pos]: [string, any]) => {
    const signIdx = Math.floor(pos.longitude / 30);
    const houseFromMoon = ((signIdx - moonSign + 12) % 12) + 1;
    const houseFromAsc = ((signIdx - ascSign + 12) % 12) + 1;
    const houseEffect = HOUSE_FROM_MOON_EFFECTS[houseFromMoon] || "General influence";
    const planetEffect = PLANET_TRANSIT_EFFECTS[name] || { benefic: "Various effects", malefic: "Various challenges", duration: "Variable" };

    const isBenefic = ["Jupiter", "Venus", "Mercury", "Moon"].includes(name);
    const isMajorTransit = ["Saturn", "Jupiter", "Rahu"].includes(name);

    return {
      planet: name,
      sign: pos.sign || ZODIAC_SIGNS[signIdx],
      houseFromMoon,
      houseFromAsc,
      houseEffect,
      beneficialEffect: planetEffect.benefic,
      challengingEffect: planetEffect.malefic,
      duration: planetEffect.duration,
      nature: isBenefic ? "beneficial" : "challenging",
      isMajorTransit,
      summary: isMajorTransit
        ? `⚠ MAJOR: ${name} transit (${planetEffect.duration}) through ${houseFromMoon}${ordinalSuffix(houseFromMoon)} from Moon — ${houseEffect}`
        : `${name} transit through ${houseFromMoon}${ordinalSuffix(houseFromMoon)} from Moon — ${houseEffect}`,
    };
  });

  const majorTransits = transitEffects.filter((t) => t.isMajorTransit);
  const beneficial = transitEffects.filter((t) => t.nature === "beneficial");
  const challenging = transitEffects.filter((t) => t.nature === "challenging");

  return NextResponse.json({
    gocharPhala: {
      date: transitData.target_date,
      moonSign: ZODIAC_SIGNS[moonSign],
      ascendant: ZODIAC_SIGNS[ascSign],
      totalTransits: transitEffects.length,
      beneficialCount: beneficial.length,
      challengingCount: challenging.length,
      majorTransits,
      allTransits: transitEffects,
      summary: `Currently ${beneficial.length} beneficial and ${challenging.length} challenging transit${challenging.length !== 1 ? "s" : ""}. ${majorTransits.length > 0 ? `Major transit${majorTransits.length > 1 ? "s" : ""}: ${majorTransits.map((t) => t.planet).join(", ")}.` : ""}`,
    },
  });
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
