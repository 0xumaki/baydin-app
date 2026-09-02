import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/yadaya — returns Vedic remedial measures (Yadaya) based on the
 * user's natal chart. Analyzes afflicted planets and recommends remedies.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ yadaya: null });
  if (!user.birthData) return NextResponse.json({ yadaya: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ yadaya: null });
  }

  // Remedy types
  type Remedy = { planet: string; problem: string; remedies: { type: string; desc: string; detail: string }[] };

  // Planet → remedy mapping
  const PLANET_REMEDIES: Record<string, { chanting: string; charity: string; gem: string; lifestyle: string }> = {
    Sun: {
      chanting: "Om Suryaya Namaha (108x at sunrise)",
      charity: "Donate wheat, copper, or red flowers on Sundays",
      gem: "Wear Ruby on ring finger (right hand)",
      lifestyle: "Offer water to the Sun at sunrise; wake before dawn",
    },
    Moon: {
      chanting: "Om Chandraya Namaha (108x on Mondays)",
      charity: "Donate white rice, milk, or silver on Mondays",
      gem: "Wear Pearl on little finger",
      lifestyle: "Keep a silver vessel with water near bed; avoid harsh speech",
    },
    Mars: {
      chanting: "Om Angarakaya Namaha (108x on Tuesdays)",
      charity: "Donate red lentils or red cloth on Tuesdays",
      gem: "Wear Red Coral on ring finger",
      lifestyle: "Feed animals; practice martial arts or physical discipline",
    },
    Mercury: {
      chanting: "Om Budhaya Namaha (108x on Wednesdays)",
      charity: "Donate green vegetables or green gram on Wednesdays",
      gem: "Wear Emerald on little finger",
      lifestyle: "Study scriptures; keep plants at home; practice clear speech",
    },
    Jupiter: {
      chanting: "Om Gurave Namaha (108x on Thursdays)",
      charity: "Donate yellow items (turmeric, chickpeas, gold) on Thursdays",
      gem: "Wear Yellow Sapphire on index finger",
      lifestyle: "Respect teachers and elders; serve at temples; study Vedas",
    },
    Venus: {
      chanting: "Om Shukraya Namaha (108x on Fridays)",
      charity: "Donate white items, sweets, or perfumes on Fridays",
      gem: "Wear Diamond on middle finger",
      lifestyle: "Keep home beautiful; respect women; wear clean clothes",
    },
    Saturn: {
      chanting: "Om Shanaischaraya Namaha (108x on Saturdays)",
      charity: "Donate black sesame, iron, or black cloth on Saturdays",
      gem: "Wear Blue Sapphire on middle finger (with caution)",
      lifestyle: "Serve the poor and elderly; light a mustard oil lamp on Saturdays",
    },
    Rahu: {
      chanting: "Om Rahave Namaha (18x daily)",
      charity: "Donate blue or black items; feed birds",
      gem: "Wear Hessonite (Gomed) on middle finger",
      lifestyle: "Avoid intoxicants; practice meditation; keep a dog as pet",
    },
    Ketu: {
      chanting: "Om Ketave Namaha (18x daily)",
      charity: "Donate to spiritual causes; feed stray animals",
      gem: "Wear Cat's Eye on middle finger",
      lifestyle: "Practice spirituality; visit sacred places; keep a cat",
    },
  };

  const remedies: Remedy[] = [];

  // Analyze each planet for affliction
  for (const p of chart.planets) {
    const issues: string[] = [];
    const planetRemedies: { type: string; desc: string; detail: string }[] = [];
    const remedyData = PLANET_REMEDIES[p.name];
    if (!remedyData) continue;

    // Debilitated planet
    if (p.dignity === "debilitated") {
      issues.push(`${p.name} is debilitated in ${ZODIAC_SIGNS[p.signIndex]} — weakens its significations`);
    }
    // In 6th, 8th, or 12th house (dusthana)
    if ([6, 8, 12].includes(p.house)) {
      issues.push(`${p.name} in house ${p.house} (${p.house === 6 ? "enemies/illness" : p.house === 8 ? "longevity/obstacles" : "loss/expenses"}) creates challenges`);
    }
    // Retrograde
    if (p.retrograde && ["Saturn", "Mars", "Jupiter"].includes(p.name)) {
      issues.push(`${p.name} is retrograde — delays and intensity in its significations`);
    }
    // Combust (close to Sun) — simplified check
    const sun = chart.planets.find((pl: any) => pl.name === "Sun");
    if (sun && Math.abs(p.signIndex - sun.signIndex) === 0 && p.name !== "Sun") {
      issues.push(`${p.name} is combust (conjunct Sun) — weakened energy`);
    }

    if (issues.length > 0) {
      planetRemedies.push({ type: "Chanting", desc: "Mantra japa", detail: remedyData.chanting });
      planetRemedies.push({ type: "Charity", desc: "Daan (donation)", detail: remedyData.charity });
      planetRemedies.push({ type: "Gemstone", desc: "Ratna", detail: remedyData.gem });
      planetRemedies.push({ type: "Lifestyle", desc: "Daily practice", detail: remedyData.lifestyle });

      remedies.push({
        planet: p.name,
        problem: issues.join("; "),
        remedies: planetRemedies,
      });
    }
  }

  return NextResponse.json({
    yadaya: {
      count: remedies.length,
      remedies,
    },
  });
}
