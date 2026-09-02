import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, rev, lahiriAyanamsa, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/planetary-hours — returns today's planetary hours.
 * Each hour of the day (and night) is ruled by one of the 7 classical planets.
 * The day ruler is determined by the weekday; subsequent hours cycle through
 * the Chaldean order: Saturn, Jupiter, Mars, Sun, Venus, Mercury, Moon.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ hours: null });

  const now = new Date();
  const weekday = now.getDay(); // 0=Sun ... 6=Sat

  // Day rulers: Sun, Moon, Mars, Mercury, Jupiter, Venus, Saturn
  const DAY_RULERS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const dayRuler = DAY_RULERS[weekday];

  // Chaldean order (for cycling hours)
  const CHALDEAN = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];

  // Find the starting index in Chaldean order for the first hour of the day
  const dayStartIdx = CHALDEAN.indexOf(dayRuler);

  // Simplified: 12 day hours + 12 night hours = 24 hours
  // Day starts at 6 AM (approximate sunrise), night starts at 6 PM
  const currentHour = now.getHours();
  const isDaytime = currentHour >= 6 && currentHour < 18;
  const hourInPeriod = isDaytime ? currentHour - 6 : currentHour - 18 + 12;

  // Planet symbols and effects
  const PLANET_INFO: Record<string, { symbol: string; effect: string; color: string }> = {
    Sun: { symbol: "☉", effect: "Favorable for leadership, health, authority, government matters", color: "#C5A87C" },
    Moon: { symbol: "☽", effect: "Favorable for emotions, travel, domestic matters, intuition", color: "#9CA8A3" },
    Mars: { symbol: "♂", effect: "Favorable for courage, physical work, competition, surgery", color: "#b5463a" },
    Mercury: { symbol: "☿", effect: "Favorable for communication, study, business, writing", color: "#B5CD7E" },
    Jupiter: { symbol: "♃", effect: "Favorable for wisdom, wealth, legal matters, spirituality", color: "#C5A87C" },
    Venus: { symbol: "♀", effect: "Favorable for love, beauty, arts, music, social events", color: "#D876A0" },
    Saturn: { symbol: "♄", effect: "Favorable for discipline, patience, long-term planning, meditation", color: "#9E8AC9" },
  };

  // Build 24 hours
  const hours: { hour: number; period: "day" | "night"; planet: string; symbol: string; effect: string; color: string; isCurrent: boolean }[] = [];
  for (let i = 0; i < 24; i++) {
    const period = i < 12 ? "day" : "night";
    const planetIdx = (dayStartIdx + i) % 7;
    const planet = CHALDEAN[planetIdx];
    const info = PLANET_INFO[planet];
    const hourNum = i < 12 ? i + 6 : i - 12 + 18; // 6-17 day, 18-5 night
    hours.push({
      hour: hourNum,
      period,
      planet,
      symbol: info.symbol,
      effect: info.effect,
      color: info.color,
      isCurrent: currentHour === hourNum || (hourNum === 0 && currentHour === 0),
    });
  }

  const currentHourData = hours.find((h) => h.isCurrent) || hours[0];

  return NextResponse.json({
    hours: {
      dayRuler,
      dayRulerSymbol: PLANET_INFO[dayRuler].symbol,
      current: currentHourData,
      all: hours,
    },
  });
}
