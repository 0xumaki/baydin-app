import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/moon — returns today's moon phase.
 * Computed from the Moon's elongation (Sun-Moon angle). Free feature.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ moon: null });

  // Calculate moon phase using a simple algorithm
  // Based on known new moon date + synodic month period
  const knownNewMoon = new Date("2024-01-11T11:57:00Z").getTime();
  const synodicMonth = 29.53058867 * 24 * 60 * 60 * 1000; // 29.53 days in ms
  const now = Date.now();
  const cycles = (now - knownNewMoon) / synodicMonth;
  const phaseFrac = cycles - Math.floor(cycles); // 0 = new, 0.5 = full
  const age = phaseFrac * 29.53; // days since new moon
  const illumination = (1 - Math.cos(phaseFrac * 2 * Math.PI)) / 2; // 0-1

  let phaseName: string;
  let phaseIcon: string;
  if (phaseFrac < 0.03 || phaseFrac > 0.97) { phaseName = "New Moon"; phaseIcon = "🌑"; }
  else if (phaseFrac < 0.22) { phaseName = "Waxing Crescent"; phaseIcon = "🌒"; }
  else if (phaseFrac < 0.28) { phaseName = "First Quarter"; phaseIcon = "🌓"; }
  else if (phaseFrac < 0.47) { phaseName = "Waxing Gibbous"; phaseIcon = "🌔"; }
  else if (phaseFrac < 0.53) { phaseName = "Full Moon"; phaseIcon = "🌕"; }
  else if (phaseFrac < 0.72) { phaseName = "Waning Gibbous"; phaseIcon = "🌖"; }
  else if (phaseFrac < 0.78) { phaseName = "Last Quarter"; phaseIcon = "🌗"; }
  else { phaseName = "Waning Crescent"; phaseIcon = "🌘"; }

  // Simple zodiac sign of the moon (approximate)
  const moonSigns = ["Capricorn", "Aquarius", "Pisces", "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo", "Libra", "Scorpio", "Sagittarius"];
  const dayOfYear = Math.floor((now - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const moonSign = moonSigns[Math.floor((dayOfYear * 13) / 365) % 12];

  return NextResponse.json({
    moon: {
      phase: phaseName,
      icon: phaseIcon,
      age: +age.toFixed(1),
      illumination: +(illumination * 100).toFixed(0),
      sign: moonSign,
    },
  });
}
