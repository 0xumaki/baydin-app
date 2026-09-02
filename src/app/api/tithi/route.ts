import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tithi — returns today's tithi (lunar day) from the Moon-Sun elongation.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ tithi: null });

  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60);
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const diff = rev(moonLon - sunLon);

  // 30 tithis, each 12° of Moon-Sun elongation
  const tithiIdx = Math.floor(diff / 12);
  const tithiNum = (tithiIdx % 15) + 1;
  const isKrishna = tithiIdx >= 15;

  const TITHI_NAMES = [
    "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami",
    "Shashthi", "Saptami", "Ashtami", "Navami", "Dashami",
    "Ekadashi", "Dwadashi", "Trayodashi", "Chaturdashi", "Purnima",
  ];

  const tithiName = TITHI_NAMES[tithiNum - 1];
  const paksha = isKrishna ? "Krishna Paksha (waning)" : "Shukla Paksha (waxing)";
  const fullTithi = `${isKrishna ? "Krishna" : "Shukla"} ${tithiName}`;

  // Special tithis
  let special = "";
  if (tithiName === "Purnima") special = "Full Moon — auspicious for spiritual practices";
  else if (tithiName === "Amavasya" || (tithiNum === 15 && isKrishna)) special = "New Moon — good for meditation & new beginnings";
  else if (tithiName === "Ekadashi") special = "Ekadashi — auspicious for fasting & devotion";
  else if (tithiName === "Ashtami") special = "Ashtami — good for remedies & worship";

  return NextResponse.json({
    tithi: {
      name: fullTithi,
      tithiName,
      number: tithiNum,
      paksha,
      special,
      moonSunDiff: +diff.toFixed(2),
    },
  });
}
