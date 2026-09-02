import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS, PLANET_MY, rev, julianDay, moonPosition, sunPosition } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/weekly-forecast — returns a 7-day astrological forecast based on
 * the user's natal chart and upcoming planetary transits.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ forecast: null });
  if (!user.birthData) return NextResponse.json({ forecast: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let natal: any;
  try {
    natal = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ forecast: null });
  }

  const ayanamsa = natal.ayanamsa;
  const natalMoon = natal.planets.find((p: any) => p.name === "Moon");
  const natalSun = natal.planets.find((p: any) => p.name === "Sun");

  // Build 7-day forecast
  const days: { date: string; dayName: string; moonSign: string; moonSignMy: string; mood: string; rating: number; highlights: string[] }[] = [];
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  for (let i = 0; i < 7; i++) {
    const date = new Date();
    date.setDate(date.getDate() + i);
    const dateStr = date.toISOString().slice(0, 10);
    const dayName = dayNames[date.getDay()];

    // Compute transit Moon position for this day
    const jd = julianDay(date.getUTCFullYear(), date.getUTCMonth() + 1, date.getUTCDate(), 12);
    const d = jd - 2451545.0;
    const moonLon = rev(moonPosition(d).lon - ayanamsa);
    const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
    const moonSignIdx = Math.floor(moonLon / 30);

    // Determine mood based on Moon's relationship to natal Moon
    const moonDiff = ((moonSignIdx - (natalMoon?.signIndex ?? 0) + 12) % 12) + 1;
    let mood: string;
    let rating: number;
    if ([1, 4, 7, 10].includes(moonDiff)) { mood = "Energetic & confident"; rating = 5; }
    else if ([5, 9].includes(moonDiff)) { mood = "Creative & inspired"; rating = 5; }
    else if ([3, 11].includes(moonDiff)) { mood = "Communicative & social"; rating = 4; }
    else if ([2, 6].includes(moonDiff)) { mood = "Reflective & emotional"; rating = 3; }
    else if (moonDiff === 8) { mood = "Intense & transformative"; rating = 3; }
    else if (moonDiff === 12) { mood = "Restless & changeable"; rating = 2; }
    else { mood = "Balanced & steady"; rating = 4; }

    // Highlights based on Moon sign and aspects
    const highlights: string[] = [];
    if ([1, 4, 7, 10].includes(moonDiff)) highlights.push("Favorable for new beginnings");
    if ([5, 9].includes(moonDiff)) highlights.push("Good for learning & creative work");
    if (moonDiff === 8) highlights.push("Avoid major decisions; spiritual practices favored");
    if (moonDiff === 12) highlights.push("Rest and self-care recommended");

    // Check transit Moon conjunct natal Sun (new energy)
    if (Math.abs(moonSignIdx - (natalSun?.signIndex ?? 0)) === 0) {
      highlights.push("Moon conjunct natal Sun — powerful new cycle energy");
    }

    days.push({
      date: dateStr,
      dayName,
      moonSign: ZODIAC_SIGNS[moonSignIdx],
      moonSignMy: PLANET_MY["Moon"] + " → " + ZODIAC_SIGNS[moonSignIdx],
      mood,
      rating,
      highlights: highlights.length > 0 ? highlights : ["Routine activities flow well"],
    });
  }

  return NextResponse.json({
    forecast: {
      days,
      weekStart: days[0].date,
      weekEnd: days[6].date,
      bestDay: [...days].sort((a, b) => b.rating - a.rating)[0],
      challengingDay: [...days].sort((a, b) => a.rating - b.rating)[0],
    },
  });
}
