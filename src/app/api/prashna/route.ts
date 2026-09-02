import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, meanNode, rev, lahiriAyanamsa, ZODIAC_SIGNS, NAKSHATRAS, PLANET_MY } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * POST /api/prashna — Vedic Prashna (horary astrology).
 * Casts a chart at the moment the question is asked and answers based on
 * the Moon's position, the rising sign, and the relationship between them.
 * Costs 2 Luck.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { question } = await req.json();
  if (!question?.trim()) return NextResponse.json({ error: "Question required" }, { status: 400 });

  // Cast chart at the moment of asking
  const now = new Date();
  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(),
    now.getUTCHours() + now.getUTCMinutes() / 60 + now.getUTCSeconds() / 3600);
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  // Transit positions at question time
  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const rahuLon = rev(meanNode(jd) - ayanamsa);
  const ketuLon = rev(rahuLon + 180);

  const moonSign = Math.floor(moonLon / 30);
  const sunSign = Math.floor(sunLon / 30);
  const moonNakIdx = Math.floor(moonLon / (360 / 27));

  // Determine the Prashna Lagna (rising sign) — simplified: use the time of day
  const hours = now.getHours() + now.getMinutes() / 60;
  const lagnaSign = Math.floor((hours / 2)) % 12; // approximately 1 sign per 2 hours

  // Determine answer based on Moon's relationship to the Lagna
  const moonFromLagna = ((moonSign - lagnaSign + 12) % 12) + 1;
  const moonFromSun = ((moonSign - sunSign + 12) % 12) + 1;

  // Answer logic
  let answer: "yes" | "no" | "maybe";
  let confidence: number;
  let reasoning: string;

  if ([1, 4, 7, 10].includes(moonFromLagna)) {
    answer = "yes";
    confidence = 80 + Math.floor(Math.random() * 15);
    reasoning = `Moon is in a kendra (${moonFromLagna}${ordinalSuffix(moonFromLagna)} house from Lagna) — strong positive signal`;
  } else if ([5, 9].includes(moonFromLagna)) {
    answer = "yes";
    confidence = 70 + Math.floor(Math.random() * 15);
    reasoning = `Moon is in a trikona (${moonFromLagna}${ordinalSuffix(moonFromLagna)} house from Lagna) — favorable but requires effort`;
  } else if ([6, 8, 12].includes(moonFromLagna)) {
    answer = "no";
    confidence = 65 + Math.floor(Math.random() * 20);
    reasoning = `Moon is in a dusthana (${moonFromLagna}${ordinalSuffix(moonFromLagna)} house) — obstacles indicated`;
  } else if (moonFromLagna === 3 || moonFromLagna === 11) {
    answer = "maybe";
    confidence = 50 + Math.floor(Math.random() * 15);
    reasoning = `Moon is in an Upachaya house (${moonFromLagna}${ordinalSuffix(moonFromLagna)}) — outcome depends on effort`;
  } else {
    answer = "maybe";
    confidence = 55 + Math.floor(Math.random() * 20);
    reasoning = `Moon is in the ${moonFromLagna}${ordinalSuffix(moonFromLagna)} house from Lagna — mixed signals`;
  }

  // Adjust for Moon-Sun relationship (Krupa/Chandra Bala)
  if ([1, 4, 7, 10].includes(moonFromSun)) {
    confidence += 5;
    reasoning += "; Moon-Sun relationship is supportive";
  } else if ([6, 8, 12].includes(moonFromSun)) {
    confidence -= 5;
    reasoning += "; Moon-Sun relationship adds challenge";
  }

  // Nakshatra influence
  const nakName = NAKSHATRAS[moonNakIdx];
  const NAK_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const nakLord = NAK_LORDS[moonNakIdx % 9];
  const beneficNak = ["Jupiter", "Venus", "Mercury", "Moon"].includes(nakLord);
  if (beneficNak) {
    confidence += 5;
    reasoning += `; ${nakName} nakshatra (lord: ${nakLord}) is benefic`;
  }

  // Timing prediction
  const timingHours = Math.ceil((moonFromLagna * 2.5) % 24);
  const timing = answer === "yes"
    ? `Positive outcome likely within ${timingHours} days`
    : answer === "no"
    ? `Obstacles persist; revisit after ${timingHours} days`
    : `Clarity expected in ${timingHours} days`;

  return NextResponse.json({
    prashna: {
      question: question.trim(),
      askedAt: now.toISOString(),
      answer,
      confidence: Math.min(confidence, 95),
      reasoning,
      timing,
      chart: {
        lagnaSign: ZODIAC_SIGNS[lagnaSign],
        moonSign: ZODIAC_SIGNS[moonSign],
        moonNakshatra: nakName,
        nakshatraLord: nakLord,
        sunSign: ZODIAC_SIGNS[sunSign],
        moonFromLagna,
      },
    },
  });
}

function ordinalSuffix(n: number): string {
  const s = ["th", "st", "nd", "rd"];
  const v = n % 100;
  return s[(v - 20) % 10] || s[v] || s[0];
}
