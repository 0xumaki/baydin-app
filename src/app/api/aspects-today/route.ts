import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, computeTransits, type BirthContext, ZODIAC_SIGNS, PLANET_MY } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/aspects-today — returns today's detailed planetary aspects
 * (transit-to-natal) with nature (benefic/malefic) and life-area impact.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ aspects: null });
  if (!user.birthData) return NextResponse.json({ aspects: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let natal: any;
  try {
    natal = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ aspects: null });
  }

  let transitData: any;
  try {
    transitData = computeTransits(birthData, natal, 7);
  } catch {
    return NextResponse.json({ aspects: null });
  }

  const currentTransits = transitData.current_transits || {};
  const aspects: {
    transitPlanet: string;
    natalPlanet: string;
    aspectType: string;
    orb: number;
    nature: "benefic" | "malefic" | "neutral";
    lifeArea: string;
    effect: string;
  }[] = [];

  // Benefic/malefic classification
  const BENEFICS = ["Jupiter", "Venus", "Mercury", "Moon"];
  const MALEFICS = ["Saturn", "Mars", "Rahu", "Ketu", "Sun"];
  const LIFE_AREAS: Record<string, string> = {
    Sun: "vitality, ego, father, authority",
    Moon: "emotions, mind, mother, comfort",
    Mars: "energy, courage, siblings, property",
    Mercury: "intellect, communication, business",
    Jupiter: "wisdom, fortune, children, spirituality",
    Venus: "love, relationships, luxury, arts",
    Saturn: "career, discipline, longevity, service",
    Rahu: "ambition, foreign matters, desires",
    Ketu: "spirituality, detachment, past karma",
  };

  // Check transit-to-natal conjunctions (within same sign)
  for (const [tName, tPos] of Object.entries(currentTransits)) {
    const transitSignIdx = Math.floor((tPos as any).longitude / 30);
    for (const natalPlanet of natal.planets) {
      if (natalPlanet.name === tName) continue; // skip same planet
      const natalSignIdx = natalPlanet.signIndex;
      const signDiff = Math.abs(transitSignIdx - natalSignIdx);
      const minDiff = Math.min(signDiff, 12 - signDiff);

      let aspectType = "";
      let orb = 0;

      if (minDiff === 0) { aspectType = "Conjunction"; orb = 0; }
      else if (minDiff === 1 || minDiff === 5) { aspectType = "Sextile (60°)"; orb = minDiff === 1 ? 30 : 150; }
      else if (minDiff === 2 || minDiff === 4) { aspectType = "Trine (120°)"; orb = minDiff === 4 ? 120 : 60; }
      else if (minDiff === 3) { aspectType = "Opposition (180°)"; orb = 90; }
      else if (minDiff === 6) { aspectType = "Quincunx (150°)"; orb = 180; }

      if (aspectType) {
        const isTransitBenefic = BENEFICS.includes(tName);
        const isTransitMalefic = MALEFICS.includes(tName);
        const nature = isTransitBenefic ? "benefic" : isTransitMalefic ? "malefic" : "neutral";

        let effect: string;
        if (aspectType === "Conjunction") {
          effect = isTransitBenefic
            ? `${tName} conjunct natal ${natalPlanet.name} — enhances ${LIFE_AREAS[natalPlanet.name] || "its significations"}`
            : `${tName} conjunct natal ${natalPlanet.name} — challenges ${LIFE_AREAS[natalPlanet.name] || "its significations"}`;
        } else if (aspectType.includes("Trine")) {
          effect = `${tName} trine natal ${natalPlanet.name} — harmonious flow, ${isTransitBenefic ? "great blessings" : "productive tension"} in ${LIFE_AREAS[natalPlanet.name] || "life"}`;
        } else if (aspectType.includes("Opposition")) {
          effect = `${tName} opposite natal ${natalPlanet.name} — tension and awareness, requires balance in ${LIFE_AREAS[natalPlanet.name] || "life"}`;
        } else if (aspectType.includes("Sextile")) {
          effect = `${tName} sextile natal ${natalPlanet.name} — opportunity for growth in ${LIFE_AREAS[natalPlanet.name] || "life"}`;
        } else {
          effect = `${tName} aspects natal ${natalPlanet.name} — adjustment needed in ${LIFE_AREAS[natalPlanet.name] || "life"}`;
        }

        aspects.push({
          transitPlanet: tName,
          natalPlanet: natalPlanet.name,
          aspectType,
          orb,
          nature,
          lifeArea: LIFE_AREAS[natalPlanet.name] || "general",
          effect,
        });
      }
    }
  }

  // Sort: conjunctions first, then by orb
  aspects.sort((a, b) => {
    if (a.aspectType === "Conjunction" && b.aspectType !== "Conjunction") return -1;
    if (a.aspectType !== "Conjunction" && b.aspectType === "Conjunction") return 1;
    return a.orb - b.orb;
  });

  const beneficCount = aspects.filter((a) => a.nature === "benefic").length;
  const maleficCount = aspects.filter((a) => a.nature === "malefic").length;

  return NextResponse.json({
    aspects: {
      date: transitData.target_date,
      total: aspects.length,
      benefic: beneficCount,
      malefic: maleficCount,
      summary: beneficCount > maleficCount
        ? `Favorable period — ${beneficCount} beneficial aspects vs ${maleficCount} challenging`
        : maleficCount > beneficCount
        ? `Challenging period — ${maleficCount} challenging aspects vs ${beneficCount} beneficial`
        : `Balanced period — equal beneficial and challenging aspects`,
      aspects: aspects.slice(0, 10),
    },
  });
}
