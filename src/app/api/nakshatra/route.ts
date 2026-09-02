import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, NAKSHATRAS, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/nakshatra — returns today's nakshatra (from transit Moon's position).
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ nakshatra: null });

  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60);
  const d = jd - 2451545.0;

  // Transit Moon position (tropical → sidereal)
  const moonTrop = moonPosition(d).lon;
  const ayanamsa = lahiriAyanamsa(jd);
  const moonSid = rev(moonTrop - ayanamsa);

  // Nakshatra: 27 nakshatras, each 13°20' (360/27)
  const nakIdx = Math.floor(moonSid / (360 / 27));
  const pada = Math.floor((moonSid % (360 / 27)) / ((360 / 27) / 4)) + 1;
  const nakName = NAKSHATRAS[nakIdx];

  // Nakshatra ruling planet
  const NAK_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const lord = NAK_LORDS[nakIdx % 9];

  // Nakshatra deity
  const NAK_DEITIES = ["Ashwini Kumaras", "Yama", "Agni", "Prajapati", "Soma", "Rudra", "Aditi", "Brihaspati", "Ahasa", "Pitris", "Bhaga", "Aryaman", "Savitar", "Tvashtar", "Vayu", "Indra", "Mitral", "Nirriti", "Varuna", "Vishve Devas", "Vishnu", "Vivasvat", "Soma", "Sarpas", "Ahir Budhnya", "Pushan", "Brihaspati"];
  const deity = NAK_DEITIES[nakIdx];

  return NextResponse.json({
    nakshatra: {
      name: nakName,
      pada,
      lord,
      deity,
      moonLongitude: +moonSid.toFixed(2),
    },
  });
}
