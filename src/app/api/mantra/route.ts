import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS, rev, lahiriAyanamsa, julianDay, moonPosition } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/mantra — returns personalized mantra recommendations based on
 * the user's natal chart + today's nakshatra lord.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ mantras: null });
  if (!user.birthData) return NextResponse.json({ mantras: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ mantras: null });
  }

  // Planet → mantra mapping (Vedic)
  const PLANET_MANTRAS: Record<string, { sanskrit: string; meaning: string; count: number; countMy: string }> = {
    Sun: { sanskrit: "Om Suryaya Namaha", meaning: "Salutations to the Sun — vitality & self-expression", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Moon: { sanskrit: "Om Chandraya Namaha", meaning: "Salutations to the Moon — emotional peace & intuition", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Mars: { sanskrit: "Om Angarakaya Namaha", meaning: "Salutations to Mars — courage & protection", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Mercury: { sanskrit: "Om Budhaya Namaha", meaning: "Salutations to Mercury — intelligence & communication", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Jupiter: { sanskrit: "Om Gurave Namaha", meaning: "Salutations to Jupiter — wisdom & fortune", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Venus: { sanskrit: "Om Shukraya Namaha", meaning: "Salutations to Venus — love & beauty", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Saturn: { sanskrit: "Om Shanaischaraya Namaha", meaning: "Salutations to Saturn — discipline & patience", count: 108, countMy: "၁၀၈ ကြိမ်" },
    Rahu: { sanskrit: "Om Rahave Namaha", meaning: "Salutations to Rahu — material desires & ambition", count: 18, countMy: "၁၈ ကြိမ်" },
    Ketu: { sanskrit: "Om Ketave Namaha", meaning: "Salutations to Ketu — spiritual liberation", count: 18, countMy: "၁၈ ကြိမ်" },
  };

  // Today's nakshatra lord
  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours());
  const d = jd - 2451545.0;
  const moonTrop = moonPosition(d).lon;
  const ayanamsa = lahiriAyanamsa(jd);
  const moonSid = rev(moonTrop - ayanamsa);
  const nakIdx = Math.floor(moonSid / (360 / 27));
  const NAK_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const todayNakLord = NAK_LORDS[nakIdx % 9];

  // Ascendant lord (primary mantra)
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const ascLord = signLords[chart.ascendant.signIndex];

  // Build recommendations: today's nakshatra lord first, then ascendant lord
  const recommended = [
    { planet: todayNakLord, reason: "Today's nakshatra lord — chanting aligns you with today's lunar energy", priority: 1 },
    { planet: ascLord, reason: "Your ascendant lord — strengthens your core self", priority: 2 },
    { planet: "Jupiter", reason: "Benefic for all — wisdom, fortune & spiritual growth", priority: 3 },
  ].filter((r) => PLANET_MANTRAS[r.planet]);

  const mantras = recommended.map((r) => ({
    planet: r.planet,
    ...PLANET_MANTRAS[r.planet],
    reason: r.reason,
    priority: r.priority,
  }));

  return NextResponse.json({
    mantras: {
      todayNakshatra: NAKSHATRAS[nakIdx],
      todayLord: todayNakLord,
      recommendations: mantras,
    },
  });
}
