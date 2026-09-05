import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/nadi — returns Vedic Nadi astrology analysis.
 * Nadi (pulse) is one of the three most important factors in Vedic matching:
 * Aadi (beginning), Madhya (middle), Antya (end).
 * Also determines the user's Nadi from their Moon nakshatra and provides
 * health, longevity, and spiritual tendencies based on Nadi.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ nadi: null });
  if (!user.birthData) return NextResponse.json({ nadi: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ nadi: null });
  }

  const moonNakIdx = NAKSHATRAS.indexOf(chart.nakshatra);

  // 27 nakshatras divided into 3 Nadis (9 each)
  // Aadi (Vata) = nakshatras 0,3,6,9,12,15,18,21,24
  // Madhya (Pitta) = 1,4,7,10,13,16,19,22,25
  // Antya (Kapha) = 2,5,8,11,14,17,20,23,26
  const nadiType = moonNakIdx % 3;
  const NADI_NAMES = ["Aadi", "Madhya", "Antya"];
  const NADI_DOSHA = ["Vata", "Pitta", "Kapha"];
  const nadiName = NADI_NAMES[nadiType];
  const dosha = NADI_DOSHA[nadiType];

  // Nadi characteristics
  const NADI_INFO: Record<string, {
    dosha: string; element: string; temperament: string;
    health: string; spiritual: string; compatible: string; incompatible: string;
  }> = {
    Aadi: {
      dosha: "Vata",
      element: "Air + Ether",
      temperament: "Creative, energetic, changeable; prone to anxiety and nervous system issues",
      health: "Prone to gas, joint pain, dryness, insomnia. Favor warm, moist foods. Avoid cold.",
      spiritual: "Strong connection to higher consciousness; meditation comes naturally",
      compatible: "Antya (Kapha) Nadi partners — complementary energies",
      incompatible: "Same Nadi (Aadi) — Nadi Dosha for marriage (health/genetic issues)",
    },
    Madhya: {
      dosha: "Pitta",
      element: "Fire + Water",
      temperament: "Intelligent, ambitious, fiery; prone to anger and inflammation",
      health: "Prone to acidity, skin issues, overheating. Favor cooling foods. Avoid spicy.",
      spiritual: "Driven seeker; karma yoga and service paths resonate",
      compatible: "Antya (Kapha) Nadi partners — calming influence",
      incompatible: "Same Nadi (Madhya) — Nadi Dosha for marriage",
    },
    Antya: {
      dosha: "Kapha",
      element: "Earth + Water",
      temperament: "Calm, steady, nurturing; prone to lethargy and congestion",
      health: "Prone to weight gain, congestion, diabetes. Favor light, dry foods. Avoid heavy.",
      spiritual: "Devotional nature; bhakti and prayer paths resonate strongly",
      compatible: "Aadi (Vata) or Madhya (Pitta) partners — complementary",
      incompatible: "Same Nadi (Antya) — Nadi Dosha for marriage",
    },
  };

  const info = NADI_INFO[nadiName];

  // Nadi Dosha check: if both partners have same Nadi, it's a dosha
  // Here we show which nakshatras to avoid (same Nadi)
  const sameNadiNakshatras: string[] = [];
  for (let i = 0; i < 27; i++) {
    if (i % 3 === nadiType && i !== moonNakIdx) {
      sameNadiNakshatras.push(NAKSHATRAS[i]);
    }
  }

  // Nadi-based remedies
  const remedies = dosha === "Vata" ? [
    "Practice grounding: walk barefoot on earth, eat root vegetables",
    "Abhyanga (oil massage) with sesame oil before bath",
    "Chant 'Om Vayu Namaha' to balance Vata",
  ] : dosha === "Pitta" ? [
    "Practice cooling: meditate near water, eat sweet fruits",
    "Avoid sun exposure during midday (12-2 PM)",
    "Chant 'Om Agni Namaha' to balance Pitta",
  ] : [
    "Practice stimulation: brisk walking, dry brushing, spicy foods in moderation",
    "Avoid daytime napping; stay active",
    "Chant 'Om Prithvi Namaha' to balance Kapha",
  ];

  return NextResponse.json({
    nadi: {
      nadiName,
      dosha,
      element: info.element,
      nakshatra: chart.nakshatra,
      moonSign: ZODIAC_SIGNS[chart.planets.find((p: any) => p.name === "Moon")?.signIndex ?? 0],
      temperament: info.temperament,
      health: info.health,
      spiritual: info.spiritual,
      compatible: info.compatible,
      incompatible: info.incompatible,
      sameNadiNakshatras: sameNadiNakshatras.slice(0, 8),
      remedies,
    },
  });
}
