import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, computeTransits, type BirthContext, ZODIAC_SIGNS, ZODIAC_MY, PLANET_MY } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/transits — returns today's current planetary positions + aspects to natal chart.
 * Free feature (no Luck cost). Requires birth data for natal aspects.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ transits: null });
  if (!user.birthData) return NextResponse.json({ transits: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let natal: any;
  try {
    natal = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ transits: null });
  }

  let transitData: any;
  try {
    transitData = computeTransits(birthData, natal, 7);
  } catch {
    return NextResponse.json({ transits: null });
  }

  // Format current transit positions for display
  const currentPositions = Object.entries(transitData.current_transits || {}).map(([name, pos]: [string, any]) => ({
    name,
    nameMy: PLANET_MY[name] || name,
    longitude: pos.longitude,
    sign: pos.sign,
    signMy: pos.signMy,
    retrograde: pos.retrograde,
    symbol: PLANET_SYMBOLS[name] || "•",
  }));

  // Format aspects to natal
  const aspects = (transitData.current_aspects_to_natal || []).slice(0, 5);

  return NextResponse.json({
    transits: {
      date: transitData.target_date,
      positions: currentPositions,
      aspects,
    },
  });
}

const PLANET_SYMBOLS: Record<string, string> = {
  Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂",
  Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋",
};
