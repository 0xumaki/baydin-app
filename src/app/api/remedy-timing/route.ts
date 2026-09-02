import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/remedy-timing — returns the best times today for specific remedies.
 * Combines planetary hours, tithi, and nakshatra to recommend optimal timing
 * for different types of remedies (chanting, charity, fasting, worship).
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ timing: null });

  const now = new Date();
  const weekday = now.getDay();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours());
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const diff = rev(moonLon - sunLon);
  const tithiIdx = Math.floor(diff / 12);
  const tithiNum = (tithiIdx % 15) + 1;
  const isKrishna = tithiIdx >= 15;
  const isAmavasya = tithiNum === 15 && isKrishna;
  const isEkadashi = tithiNum === 11;

  const nakIdx = Math.floor(moonLon / (360 / 27));
  const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const nakName = NAKSHATRAS[nakIdx];

  const dayLords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const dayLord = dayLords[weekday];
  const CHALDEAN = ["Saturn", "Jupiter", "Mars", "Sun", "Venus", "Mercury", "Moon"];
  const dayStartIdx = CHALDEAN.indexOf(dayLord);

  // Generate remedy timing recommendations
  type RemedyTiming = { remedy: string; bestHour: string; planet: string; reason: string; priority: "high" | "medium" | "low" };

  const timings: RemedyTiming[] = [];

  // 1. Mantra chanting — best during the planet's hour
  const PLANET_HOURS: Record<string, string> = {
    Sun: "Surya/Gayatri mantra",
    Moon: "Chandra/Shiva mantra",
    Mars: "Hanuman/Mangal mantra",
    Mercury: "Budha/Vishnu mantra",
    Jupiter: "Guru/Brihaspati mantra",
    Venus: "Lakshmi/Saraswati mantra",
    Saturn: "Shani/Hanuman mantra",
  };

  for (let h = 0; h < 12; h++) {
    const planet = CHALDEAN[(dayStartIdx + h) % 7];
    const hourTime = `${6 + h}:00 - ${6 + h + 1}:00`;
    if (PLANET_HOURS[planet]) {
      timings.push({
        remedy: PLANET_HOURS[planet],
        bestHour: hourTime,
        planet,
        reason: `${planet} hour — optimal for ${planet}-related mantras`,
        priority: ["Jupiter", "Sun", "Moon"].includes(planet) ? "high" : "medium",
      });
    }
  }

  // 2. Special tithi-based recommendations
  if (isEkadashi) {
    timings.push({
      remedy: "Fasting (Ekadashi Vrata) — fast from grains and beans",
      bestHour: "Sunrise to next sunrise",
      planet: "Vishnu",
      reason: "Ekadashi tithi — most auspicious day for fasting and devotion",
      priority: "high",
    });
  }
  if (isAmavasya) {
    timings.push({
      remedy: "Tarpana (ancestral water offering) + meditation",
      bestHour: "Before noon (12:00 PM)",
      planet: "Pitrs (Ancestors)",
      reason: "Amavasya (new moon) — ancestral rites and deep meditation",
      priority: "high",
    });
  }

  // 3. Nakshatra-based recommendations
  const NAK_REMEDIES: Record<string, string> = {
    "Pushya": "Pushya nakshatra — most auspicious for all spiritual activities; chant throughout the day",
    "Hasta": "Hasta nakshatra — excellent for hand-related crafts, healing, and giving",
    "Shravana": "Shravana nakshatra — ideal for listening to scriptures and devotional music",
    "Rohini": "Rohini nakshatra — favorable for creative work and devotional arts",
    "Anuradha": "Anuradha nakshatra — good for friendship, worship, and group prayers",
    "Revati": "Revati nakshatra — ideal for concluding practices and safe journeys",
  };
  if (NAK_REMEDIES[nakName]) {
    timings.push({
      remedy: NAK_REMEDIES[nakName],
      bestHour: "Any time today",
      planet: nakName,
      reason: `${nakName} nakshatra enhances this practice`,
      priority: "medium",
    });
  }

  // 4. Brahma Muhurta (always recommended)
  timings.push({
    remedy: "Morning meditation + Surya Namaskar",
    bestHour: "4:24 AM - 6:00 AM (Brahma Muhurta)",
    planet: "Brahma",
    reason: "Brahma Muhurta — 96 minutes before sunrise, when cosmic energy is highest",
    priority: "high",
  });

  // 5. Sandhya times (always recommended)
  timings.push({
    remedy: "Sandhya Vandana — Gayatri Mantra chanting",
    bestHour: "Sunrise (6:00 AM) & Sunset (6:00 PM)",
    planet: "Savita (Sun)",
    reason: "Sandhya (junction times) — transition energies amplify mantra power",
    priority: "high",
  });

  // Sort by priority
  const priorityOrder = { high: 0, medium: 1, low: 2 };
  timings.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);

  return NextResponse.json({
    timing: {
      weekday: ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"][weekday],
      dayLord,
      tithi: `${isKrishna ? "Krishna" : "Shukla"} ${tithiNum}`,
      nakshatra: nakName,
      isEkadashi,
      isAmavasya,
      recommendations: timings.slice(0, 8),
      bestOverall: timings[0],
    },
  });
}
