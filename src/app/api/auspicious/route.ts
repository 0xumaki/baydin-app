import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, moonPosition, rev, lahiriAyanamsa, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/auspicious — returns today's auspicious and inauspicious activities
 * based on the current Panchanga (tithi, nakshatra, yoga, karana, vara).
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ auspicious: null });

  const now = new Date();
  const weekday = now.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  const jd = julianDay(now.getUTCFullYear(), now.getUTCMonth() + 1, now.getUTCDate(), now.getUTCHours());
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const diff = rev(moonLon - sunLon);

  // Tithi
  const tithiIdx = Math.floor(diff / 12);
  const tithiNum = (tithiIdx % 15) + 1;
  const isKrishna = tithiIdx >= 15;
  const isPurnima = tithiNum === 15 && !isKrishna;
  const isAmavasya = tithiNum === 15 && isKrishna;
  const isEkadashi = tithiNum === 11;

  // Nakshatra
  const nakIdx = Math.floor(moonLon / (360 / 27));
  const NAKSHATRAS = ["Ashwini","Bharani","Krittika","Rohini","Mrigashira","Ardra","Punarvasu","Pushya","Ashlesha","Magha","Purva Phalguni","Uttara Phalguni","Hasta","Chitra","Swati","Vishakha","Anuradha","Jyeshtha","Mula","Purva Ashadha","Uttara Ashadha","Shravana","Dhanishta","Shatabhisha","Purva Bhadrapada","Uttara Bhadrapada","Revati"];
  const nakName = NAKSHATRAS[nakIdx];

  // Activity recommendations based on Panchanga factors
  type Activity = { name: string; status: "favorable" | "neutral" | "avoid"; note: string };

  const activities: Activity[] = [];

  // Marriage / relationships
  const marriageFavorable = ![6, 7, 8, 14].includes(tithiNum) && !isAmavasya && !["Bharani", "Krittika", "Ardra", "Ashlesha", "Jyeshtha", "Mula"].includes(nakName);
  activities.push({
    name: "Marriage & Engagement",
    status: marriageFavorable ? "favorable" : "avoid",
    note: marriageFavorable ? `${dayNames[weekday]}, ${nakName} nakshatra is favorable` : `Avoid — ${isAmavasya ? "Amavasya" : nakName + " nakshatra"} not suitable`,
  });

  // Starting new business / venture
  const businessFavorable = [1, 2, 3, 5, 10, 11, 12].includes(tithiNum) && !isAmavasya;
  activities.push({
    name: "New Business / Venture",
    status: businessFavorable ? "favorable" : "neutral",
    note: businessFavorable ? `Shukla tithi ${tithiNum} supports new beginnings` : "Wait for a Shukla tithi (waxing moon)",
  });

  // Travel
  const travelFavorable = !["Bharani", "Krittika", "Ardra"].includes(nakName) && !isAmavasya;
  activities.push({
    name: "Travel & Journey",
    status: travelFavorable ? "favorable" : "neutral",
    note: travelFavorable ? `${nakName} nakshatra supports safe travel` : `${nakName} nakshatra — travel with caution`,
  });

  // Property purchase
  const propertyFavorable = [2, 3, 5, 7, 10, 11, 13].includes(tithiNum) && ["Rohini", "Anuradha", "Uttara Ashadha", "Uttara Bhadrapada", "Revati"].includes(nakName);
  activities.push({
    name: "Property Purchase",
    status: propertyFavorable ? "favorable" : "neutral",
    note: propertyFavorable ? "Excellent tithi and nakshatra for property" : "Neutral — consult a Muhurta specialist",
  });

  // Spiritual practices
  const spiritualFavorable = isEkadashi || isPurnima || isAmavasya || ["Pushya", "Punarvasu", "Shravana", "Dhanishta", "Revati"].includes(nakName);
  activities.push({
    name: "Spiritual Practices",
    status: spiritualFavorable ? "favorable" : "favorable",
    note: isEkadashi ? "Ekadashi — most auspicious for fasting & devotion" : isPurnima ? "Purnima — excellent for meditation & worship" : isAmavasya ? "Amavasya — powerful for ancestral rites & meditation" : `${nakName} supports spiritual activities`,
  });

  // Education / learning
  const educationFavorable = [2, 3, 5, 7, 10, 11].includes(tithiNum);
  activities.push({
    name: "Education & Learning",
    status: educationFavorable ? "favorable" : "neutral",
    note: educationFavorable ? `Tithi ${tithiNum} favors learning` : "Neutral for education today",
  });

  // Medical / health procedures
  const medicalFavorable = ![4, 8, 9, 14].includes(tithiNum) && !["Ardra", "Jyeshtha", "Mula"].includes(nakName);
  activities.push({
    name: "Medical Procedures",
    status: medicalFavorable ? "favorable" : "avoid",
    note: medicalFavorable ? `${nakName} nakshatra is safe for medical work` : `Avoid — ${nakName} nakshatra not suitable for medical procedures`,
  });

  // Haircut / nail cutting
  const haircutAvoid = ["Saturday"].includes(dayNames[weekday]) || [8, 14].includes(tithiNum);
  activities.push({
    name: "Haircut / Grooming",
    status: haircutAvoid ? "avoid" : "favorable",
    note: haircutAvoid ? `Avoid on ${dayNames[weekday]} / tithi ${tithiNum}` : "Favorable day for grooming",
  });

  // Filing court cases / legal
  const legalFavorable = [2, 3, 5, 11, 13].includes(tithiNum) && !["Ardra", "Ashlesha", "Jyeshtha"].includes(nakName);
  activities.push({
    name: "Legal Matters",
    status: legalFavorable ? "favorable" : "neutral",
    note: legalFavorable ? `${nakName} nakshatra supports legal proceedings` : "Neutral for legal matters",
  });

  // Investing / financial
  const investFavorable = [2, 5, 11].includes(tithiNum) && ["Rohini", "Pushya", "Anuradha", "Revati"].includes(nakName);
  activities.push({
    name: "Investment & Finance",
    status: investFavorable ? "favorable" : "neutral",
    note: investFavorable ? "Excellent for investments" : "Neutral for investments today",
  });

  const favorable = activities.filter((a) => a.status === "favorable");
  const avoid = activities.filter((a) => a.status === "avoid");
  const neutral = activities.filter((a) => a.status === "neutral");

  return NextResponse.json({
    auspicious: {
      weekday: dayNames[weekday],
      tithiNumber: tithiNum,
      nakshatra: nakName,
      isPurnima,
      isAmavasya,
      isEkadashi,
      activities,
      summary: {
        favorable: favorable.length,
        avoid: avoid.length,
        neutral: neutral.length,
      },
    },
  });
}
