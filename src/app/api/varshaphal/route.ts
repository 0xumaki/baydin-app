import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, computeSolarReturn, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/varshaphal — returns a summary of the user's current solar year (Varshaphal).
 * Shows the year's Muntha (progressed ascendant) and key planetary themes.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ varshaphal: null });
  if (!user.birthData) return NextResponse.json({ varshaphal: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let natal: any;
  try {
    natal = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ varshaphal: null });
  }

  // Calculate age
  const birthYear = parseInt(birthData.dob.slice(0, 4));
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Get solar return chart
  let solarReturn: any;
  try {
    solarReturn = computeSolarReturn(birthData, natal);
  } catch {
    return NextResponse.json({ varshaphal: null });
  }

  // Muntha: progressed ascendant that moves 1 sign per year
  // Muntha = Ascendant + age signs (mod 12)
  const munthaSign = (natal.ascendant.signIndex + age) % 12;
  const munthaSignName = ZODIAC_SIGNS[munthaSign];

  // Muntha lord (lord of the sign Muntha is in)
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const munthaLord = signLords[munthaSign];

  // Muntha effects by sign (simplified)
  const MUNTHA_EFFECTS: Record<string, string> = {
    "Aries": "Active year — new ventures, leadership, physical energy",
    "Taurus": "Stable year — wealth accumulation, family focus, patience rewarded",
    "Gemini": "Dynamic year — learning, travel, communication, networking",
    "Cancer": "Emotional year — home, family, property, inner growth",
    "Leo": "Powerful year — recognition, authority, creative expression",
    "Virgo": "Practical year — work, health, service, detail-oriented success",
    "Libra": "Balanced year — partnerships, harmony, diplomacy, aesthetics",
    "Scorpio": "Transformative year — deep changes, research, hidden matters surface",
    "Sagittarius": "Expansive year — wisdom, travel, spirituality, higher learning",
    "Capricorn": "Achievement year — career, authority, long-term goals, discipline",
    "Aquarius": "Innovative year — social causes, networking, unconventional ideas",
    "Pisces": "Spiritual year — meditation, compassion, artistic inspiration, letting go",
  };

  // Year lord (lord of the year = Muntha lord in simplified system)
  const yearLord = munthaLord;
  const yearLordPlanet = natal.planets.find((p: any) => p.name === yearLord);

  // Solar return Sun sign theme
  const srSun = solarReturn.planets.find((p: any) => p.name === "Sun");

  // Key themes based on Muntha sign
  const themes: string[] = [];
  themes.push(`Muntha in ${munthaSignName}: ${MUNTHA_EFFECTS[munthaSignName] || "General growth"}`);
  themes.push(`Year Lord: ${yearLord}${yearLordPlanet ? ` (in your chart: ${ZODIAC_SIGNS[yearLordPlanet.signIndex]}, house ${yearLordPlanet.house})` : ""}`);
  if (srSun) themes.push(`Solar Return Sun in ${srSun.sign}: sets the tone for the year`);
  themes.push(`Age ${age}: ${age < 30 ? "formative years" : age < 50 ? "productive years" : age < 70 ? "wisdom years" : "reflection years"}`);

  return NextResponse.json({
    varshaphal: {
      age,
      munthaSign: munthaSignName,
      munthaLord,
      yearLord,
      effect: MUNTHA_EFFECTS[munthaSignName] || "General growth and development",
      themes,
      solarReturnDate: solarReturn.returnDate,
      solarReturnSun: srSun?.sign || "—",
    },
  });
}
