import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/yoga-today — returns today's Yoga (the 3rd limb of Panchanga).
 * Yoga is computed from the sum of Sun and Moon longitudes (sidereal).
 * 27 Yogas, each 13°20' (360/27).
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ yoga: null });

  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60);
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const yogaLon = rev(sunLon + moonLon);

  // 27 Yogas, each 13°20' (360/27)
  const yogaIdx = Math.floor(yogaLon / (360 / 27));

  const YOGA_NAMES = [
    "Vishkambha", "Priti", "Ayushman", "Saubhagya", "Shobhana",
    "Atiganda", "Sukarma", "Dhriti", "Shula", "Ganda",
    "Vriddhi", "Dhruva", "Vyaghata", "Harshana", "Vajra",
    "Siddhi", "Vyatipata", "Variyana", "Parigha", "Shiva",
    "Siddha", "Sadhya", "Shubha", "Shukla", "Brahma",
    "Indra", "Vaidhriti",
  ];

  // Yoga nature: auspicious or inauspicious
  const AUSPICIOUS = [1, 2, 3, 4, 7, 10, 11, 15, 16, 20, 21, 22, 23]; // 0-indexed
  const INAUSPICIOUS = [0, 5, 8, 9, 12, 17, 18, 24]; // 0-indexed

  const yogaName = YOGA_NAMES[yogaIdx];
  let nature: string;
  if (AUSPICIOUS.includes(yogaIdx)) nature = "Auspicious — favorable for new beginnings";
  else if (INAUSPICIOUS.includes(yogaIdx)) nature = "Inauspicious — avoid important activities";
  else nature = "Mixed — proceed with awareness";

  // Yoga effects (simplified)
  const YOGA_EFFECTS: Record<string, string> = {
    "Vishkambha": "Good for hard tasks; obstacles overcome with effort",
    "Priti": "Love, harmony, and pleasant activities favored",
    "Ayushman": "Long life, health, and vitality",
    "Saubhagya": "Good fortune, auspicious for all activities",
    "Shobhana": "Beautiful, good for arts and decoration",
    "Atiganda": "Challenging; practice patience and caution",
    "Sukarma": "Good deeds; favorable for charity and service",
    "Dhriti": "Determination; good for sustained efforts",
    "Shula": "Sharp, piercing; avoid conflicts",
    "Ganda": "Difficult; spiritual practices recommended",
    "Vriddhi": "Growth, expansion; good for business",
    "Dhruva": "Steady, firm; good for long-term commitments",
    "Vyaghata": "Obstacles; proceed carefully",
    "Harshana": "Joy, celebration; auspicious for festivities",
    "Vajra": "Strong, powerful; good for decisive actions",
    "Siddhi": "Success, accomplishment; excellent for all endeavors",
    "Vyatipata": "Reversal; avoid major decisions",
    "Variyana": "Excellent, superior; favorable",
    "Parigha": "Obstacle removal; good for clearing blockages",
    "Shiva": "Auspicious, divine; excellent for spiritual practices",
    "Siddha": "Accomplished; good for learning and achievement",
    "Sadhya": "Attainable; favorable for goals",
    "Shubha": "Auspicious, pure; excellent for all activities",
    "Shukla": "Bright, pure; good for new beginnings",
    "Brahma": "Divine, creative; excellent for spiritual and creative work",
    "Indra": "Royal, powerful; good for leadership",
    "Vaidhriti": "Poor support; avoid important activities",
  };

  return NextResponse.json({
    yoga: {
      name: yogaName,
      number: yogaIdx + 1,
      nature,
      effect: YOGA_EFFECTS[yogaName] || "General influence on the day's energies",
      sunMoonSum: +yogaLon.toFixed(2),
    },
  });
}
