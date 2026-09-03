import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/marriage-match — returns additional Vedic marriage matching checks
 * beyond Ashtakoota: Mahendra, Vedha, Rajju, Stree-Deergha, Mahendra Vedha.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ match: null });
  if (!user.birthData) return NextResponse.json({ match: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ match: null });
  }

  const moonNakIdx = NAKSHATRAS.indexOf(chart.nakshatra);
  const moonSignIdx = chart.planets.find((p: any) => p.name === "Moon")?.signIndex ?? 0;

  // Mahendra: count from groom's Moon nakshatra to bride's
  // If the count % 27 is in {1, 4, 7, 10, 13, 16, 19, 22, 25} it's Mahendra (good for progeny)
  // Here we show what to look for in a partner
  const mahendraFavorable = [1, 4, 7, 10, 13, 16, 19, 22, 25];
  const compatibleNakshatras: string[] = [];
  for (let i = 0; i < 27; i++) {
    const diff = ((i - moonNakIdx + 27) % 27) + 1;
    if (mahendraFavorable.includes(diff)) {
      compatibleNakshatras.push(NAKSHATRAS[i]);
    }
  }

  // Vedha: certain nakshatra pairs are "vedha" (obstruction) — incompatible
  const VEDHA_PAIRS: Record<number, number[]> = {
    0: [11], 1: [12], 2: [13], 3: [14], 4: [15], 5: [16],
    6: [17], 7: [18], 8: [19], 9: [20], 10: [21], 11: [0],
    12: [1], 13: [2], 14: [3], 15: [4], 16: [5], 17: [6],
    18: [7], 19: [8], 20: [9], 21: [10],
  };
  const vedhaNakshatras: string[] = (VEDHA_PAIRS[moonNakIdx] || []).map((i) => NAKSHATRAS[i]);

  // Rajju: all nakshatras are classified into 5 Rajju types
  // Prathama (foot), Madhya (waist), Antya (end), etc.
  const RAJJU_TYPES = ["Prathama (feet)", "Madhya (waist)", "Antya (head)", "Prathama (feet)", "Madhya (waist)"];
  const userRajju = RAJJU_TYPES[moonNakIdx % 5];
  // Same Rajju is considered inauspicious for marriage
  const rajjuIncompatible = NAKSHATRAS.filter((_, i) => RAJJU_TYPES[i % 5] === userRajju && i !== moonNakIdx);

  // Stree-Deergha: distance from Moon to 7th house (partner's Moon)
  // If the distance is >= 7 signs, it's considered Stree-Deergha (good)
  const seventhHouseSign = (moonSignIdx + 6) % 12;

  return NextResponse.json({
    match: {
      yourNakshatra: chart.nakshatra,
      yourMoonSign: ZODIAC_SIGNS[moonSignIdx],
      checks: {
        mahendra: {
          name: "Mahendra",
          desc: "Favorable for progeny and longevity of the marriage",
          favorableNakshatras: compatibleNakshatras,
          status: `${compatibleNakshatras.length} compatible nakshatras found`,
        },
        vedha: {
          name: "Vedha",
          desc: "Vedha (obstruction) nakshatras — avoid these for marriage",
          incompatibleNakshatras: vedhaNakshatras,
          status: vedhaNakshatras.length > 0 ? `${vedhaNakshatras.length} vedha nakshatras to avoid` : "No vedha obstructions",
        },
        rajju: {
          name: "Rajju",
          desc: `Your Rajju type: ${userRajju}. Same Rajju = inauspicious for marriage`,
          yourType: userRajju,
          incompatibleNakshatras: rajjuIncompatible,
          status: `${rajjuIncompatible.length} same-Rajju nakshatras to avoid`,
        },
        streeDeergha: {
          name: "Stree-Deergha",
          desc: "Distance between Moon signs should be 7+ signs for good compatibility",
          yourMoonSign: ZODIAC_SIGNS[moonSignIdx],
          favorableSigns: Array.from({ length: 7 }, (_, i) => ZODIAC_SIGNS[(moonSignIdx + 6 + i) % 12]),
          status: `Partner's Moon should be in ${ZODIAC_SIGNS[seventhHouseSign]} or beyond`,
        },
      },
    },
  });
}
