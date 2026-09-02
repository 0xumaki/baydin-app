import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/shraaddha — returns Vedic Shraaddha (ancestral rites) recommendations.
 * Based on the Moon's nakshatra and the user's chart, suggests appropriate
 * ancestral remedies and timing.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ shraaddha: null });
  if (!user.birthData) return NextResponse.json({ shraaddha: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ shraaddha: null });
  }

  const moonNak = chart.nakshatra;
  const moon = chart.planets.find((p: any) => p.name === "Moon");
  const sun = chart.planets.find((p: any) => p.name === "Sun");
  const sunHouse = sun?.house;
  const moonHouse = moon?.house;
  const ninthHouse = chart.planets.find((p: any) => p.house === 9);

  // Determine if ancestral remedies are needed
  const indicators: string[] = [];
  if (moonHouse === 9 || moonHouse === 4) indicators.push("Moon in house " + moonHouse + " — strong ancestral connection");
  if (sunHouse === 9) indicators.push("Sun in 9th house — duty toward ancestors emphasized");
  // Pitra Dosha indicators (simplified)
  if (chart.planets.find((p: any) => p.name === "Rahu" && (p.house === 9 || p.house === 1))) {
    indicators.push("Rahu in " + (chart.planets.find((p: any) => p.name === "Rahu")?.house === 9 ? "9th" : "1st") + " house — Pitra Dosha indicator");
  }
  if (chart.planets.find((p: any) => p.name === "Sun" && p.signIndex === 9)) {
    indicators.push("Sun in Capricorn — ancestral obligations significant");
  }

  // Nakshatra-specific ancestral practices
  const NAK_PRACTICES: Record<string, string> = {
    "Magha": "Your nakshatra (Magha) is ruled by the Pitrs (ancestors). Honor them with monthly Shraaddha on Amavasya (new moon).",
    "Bharani": "Yama (lord of ancestors) rules your nakshatra. Light a sesame oil lamp on Saturdays for ancestral peace.",
    "Pushya": "Brihaspati-ruled nakshatra — excellent for ancestral prayers and charity in their name.",
    "Ashlesha": "Nagas rule this nakshatra. Perform Naga-related remedies for ancestral serpentine energies.",
    "Jyeshtha": "Indra-ruled — honor father's lineage with special prayers on father's birthday or death anniversary.",
    "Mula": "Nirriti-ruled — deep ancestral clearing recommended; perform remedies for past-life karma.",
  };

  const practice = NAK_PRACTICES[moonNak] || "Honor your ancestors with simple acts: offer water (tarpana) on Amavasya, light a lamp, or donate in their memory.";

  // Recommended days for Shraaddha
  const recommendedDays = [
    { day: "Amavasya (New Moon)", desc: "Most auspicious for ancestral rites — offer tarpana (water oblation)" },
    { day: "Solar eclipse days", desc: "Powerful for ancestral remedies — meditate and offer prayers" },
    { day: "Saturday (Shani day)", desc: "Light sesame oil lamp for ancestral peace" },
    { day: "Pitru Paksha (16-day period)", desc: "Dedicated period for Shraaddha — usually Sep-Oct" },
  ];

  // Simple remedies
  const remedies = [
    { name: "Tarpana", desc: "Offer water mixed with sesame seeds and black rice to ancestors, facing south", timing: "Amavasya mornings" },
    { name: "Pinda Daan", desc: "Offer rice balls (pindas) with sesame seeds in the name of 3 generations", timing: "Pitru Paksha or Amavasya" },
    { name: "Sesame Lamp", desc: "Light a mustard/sesame oil lamp facing south on Saturdays", timing: "Saturdays at dusk" },
    { name: "Charity in their name", desc: "Donate food, clothing, or money to the needy in your ancestors' memory", timing: "Any day, especially Amavasya" },
    { name: "Feeding animals", desc: "Feed crows, dogs, or cows — considered messengers to the ancestral realm", timing: "Daily, especially mornings" },
  ];

  return NextResponse.json({
    shraaddha: {
      nakshatra: moonNak,
      indicators: indicators.length > 0 ? indicators : ["No major ancestral affliction detected — continue regular honor of ancestors"],
      practice,
      recommendedDays,
      remedies,
    },
  });
}
