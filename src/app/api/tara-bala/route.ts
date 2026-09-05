import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS, julianDay, moonPosition, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/tara-bala — returns Tara Bala (9-fold nakshatra compatibility).
 * Used to determine favorable/unfavorable periods based on the user's
 * birth nakshatra vs today's nakshatra. Used especially for travel and
 * important undertakings.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ taraBala: null });
  if (!user.birthData) return NextResponse.json({ taraBala: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ taraBala: null });
  }

  // Birth nakshatra index
  const birthNakIdx = NAKSHATRAS.indexOf(chart.nakshatra);

  // Today's nakshatra (from current transit Moon)
  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours());
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const todayNakIdx = Math.floor(moonLon / (360 / 27));

  // Count from birth nakshatra to today's nakshatra (mod 9)
  const taraCount = ((todayNakIdx - birthNakIdx + 27) % 27) % 9;

  // 9 Taras with their nature
  const TARAS = [
    { name: "Janma", sanskrit: "जन्म", nature: "inauspicious", effect: "Danger to self, health; avoid new ventures", color: "#b5463a" },
    { name: "Sampat", sanskrit: "सम्पत्", nature: "auspicious", effect: "Wealth, prosperity; favorable for all activities", color: "#B5CD7E" },
    { name: "Vipat", sanskrit: "विपत्", nature: "inauspicious", effect: "Obstacles, accidents; avoid travel and risks", color: "#b5463a" },
    { name: "Kshema", sanskrit: "क्षेम", nature: "auspicious", effect: "Comfort, peace; favorable for domestic matters", color: "#B5CD7E" },
    { name: "Pratyari", sanskrit: "प्रत्यरि", nature: "inauspicious", effect: "Enemies, conflicts; avoid disputes and arguments", color: "#b5463a" },
    { name: "Sadhaka", sanskrit: "साधक", nature: "auspicious", effect: "Success, achievement; favorable for all efforts", color: "#B5CD7E" },
    { name: "Vadha", sanskrit: "वध", nature: "inauspicious", effect: "Destruction, loss; avoid important activities", color: "#b5463a" },
    { name: "Mitra", sanskrit: "मित्र", nature: "auspicious", effect: "Friendship, help; favorable for social activities", color: "#B5CD7E" },
    { name: "Ati-mitra", sanskrit: "अतिमित्र", nature: "auspicious", effect: "Great friend, best results; highly favorable", color: "#B5CD7E" },
  ];

  const currentTara = TARAS[taraCount];

  // Build next 9 days forecast (tara for each day)
  const dailyForecast: { day: string; taraName: string; nature: string; effect: string }[] = [];
  const dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  for (let i = 0; i < 9; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dayJd = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 12);
    const dayD = dayJd - 2451545.0;
    const dayMoonLon = rev(moonPosition(dayD).lon - ayanamsa);
    const dayNakIdx = Math.floor(dayMoonLon / (360 / 27));
    const dayTaraCount = ((dayNakIdx - birthNakIdx + 27) % 27) % 9;
    const dayTara = TARAS[dayTaraCount];
    dailyForecast.push({
      day: i === 0 ? "Today" : dayNames[date.getDay()],
      taraName: dayTara.name,
      nature: dayTara.nature,
      effect: dayTara.effect,
    });
  }

  return NextResponse.json({
    taraBala: {
      birthNakshatra: NAKSHATRAS[birthNakIdx],
      todayNakshatra: NAKSHATRAS[todayNakIdx],
      currentTara: {
        ...currentTara,
        number: taraCount + 1,
      },
      dailyForecast,
      recommendation: currentTara.nature === "auspicious"
        ? "Favorable day for important activities, travel, and new beginnings"
        : "Avoid major undertakings, travel, and risky activities today",
    },
  });
}
