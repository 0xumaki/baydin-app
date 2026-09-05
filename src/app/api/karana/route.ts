import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/karana — returns today's Karana (half-tithi, 4th Panchanga limb).
 * 11 Karanas total: 7 movable (repeating 8 times) + 4 fixed.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ karana: null });

  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60);
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const diff = rev(moonLon - sunLon);

  // 60 half-tithis (Karana index 0-59 in a lunar month)
  const karanaIdx = Math.floor(diff / 6); // 0-59

  // 11 Karanas: first 7 are movable (cycle through), last 4 are fixed
  const MOVABLE = ["Bava", "Balava", "Kaulava", "Taitila", "Gara", "Vanija", "Vishti"];
  const FIXED = ["Shakuni", "Chatushpada", "Naga", "Kimstughna"];

  let karanaName: string;
  let nature: string;
  if (karanaIdx === 0) {
    karanaName = "Kimstughna";
    nature = "Fixed — inauspicious for new ventures";
  } else if (karanaIdx >= 57) {
    const fixedIdx = karanaIdx - 57;
    karanaName = ["Shakuni", "Chatushpada", "Naga"][fixedIdx] || "Shakuni";
    nature = "Fixed — mixed results; good for spiritual activities";
  } else {
    const movableIdx = (karanaIdx - 1) % 7;
    karanaName = MOVABLE[movableIdx];
    const natures: Record<string, string> = {
      "Bava": "Auspicious — good for all activities",
      "Balava": "Auspicious — good for ceremonies and learning",
      "Kaulava": "Mixed — favorable with effort",
      "Taitila": "Auspicious — good for business and travel",
      "Gara": "Inauspicious — avoid important activities",
      "Vanija": "Mixed — good for trade and negotiation",
      "Vishti": "Inauspicious (Bhadra) — avoid all auspicious work",
    };
    nature = natures[karanaName] || "Mixed";
  }

  return NextResponse.json({
    karana: {
      name: karanaName,
      index: karanaIdx + 1,
      nature,
    },
  });
}
