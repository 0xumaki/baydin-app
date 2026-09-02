import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/pancha-mahapurusha — detects the 5 Pancha Mahapurusha Yogas.
 * These are the most auspicious planetary combinations in Vedic astrology,
 * formed when Mars, Mercury, Jupiter, Venus, or Saturn are:
 * 1. In their OWN sign (exalted counts too)
 * 2. In a Kendra house (1st, 4th, 7th, or 10th from Lagna)
 *
 * The 5 yogas are:
 * - Ruchaka (Mars) — warrior/leader qualities
 * - Bhadra (Mercury) — intellectual/commercial genius
 * - Hamsa (Jupiter) — spiritual/wisdom qualities
 * - Malavya (Venus) — artistic/luxury qualities
 * - Sasa (Saturn) — leadership/administrative qualities
 *
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ yogas: null });
  if (!user.birthData) return NextResponse.json({ yogas: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ yogas: null });
  }

  const planets = chart.planets;
  const ascSign = chart.ascendant.signIndex;

  // Sign rulers
  const SIGN_LORDS = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];

  // Exaltation signs (0-indexed)
  const EXALTED_SIGNS: Record<string, number> = {
    Sun: 0, Moon: 1, Mars: 9, Mercury: 5, Jupiter: 3, Venus: 11, Saturn: 6,
  };

  const YOGA_INFO: Record<string, {
    planet: string; yoga: string; sanskrit: string;
    qualities: string; physical: string; effects: string;
    famous: string; deity: string; remedy: string;
  }> = {
    Mars: {
      planet: "Mars",
      yoga: "Ruchaka",
      sanskrit: "रुचक",
      qualities: "Warrior, commander, athletic, brave, competitive, disciplined",
      physical: "Tall, strong, muscular, radiant, fierce eyes, ruddy complexion",
      effects: "Leadership ability, military success, athletic prowess, property gains, victory over enemies. May become a general, police officer, surgeon, or athlete.",
      famous: "Alexander the Great, famous warriors and military leaders",
      deity: "Lord Kartikeya (God of War)",
      remedy: "Worship Lord Hanuman; maintain physical discipline; protect the weak",
    },
    Mercury: {
      planet: "Mercury",
      yoga: "Bhadra",
      sanskrit: "भद्र",
      qualities: "Intellectual, communicative, business-minded, witty, youthful, versatile",
      physical: "Well-proportioned, beautiful, expressive face, clear complexion, youthful appearance",
      effects: "Intellectual brilliance, commercial success, eloquence, mathematical ability. May become a scholar, writer, businessman, or mathematician.",
      famous: "Great scholars, merchants, and intellectuals throughout history",
      deity: "Lord Vishnu",
      remedy: "Study scriptures; teach others; practice clear and truthful speech",
    },
    Jupiter: {
      planet: "Jupiter",
      yoga: "Hamsa",
      sanskrit: "हंस",
      qualities: "Wise, spiritual, compassionate, religious, generous, dignified, pure",
      physical: "Golden/ radiant complexion, graceful gait (like a swan), broad forehead, kind eyes",
      effects: "Spiritual wisdom, religious leadership, teaching ability, wealth through righteousness. May become a guru, priest, philosopher, or spiritual teacher.",
      famous: "Adi Shankaracharya, great spiritual teachers and philosophers",
      deity: "Lord Shiva / Dakshinamurti (Teacher of the Gods)",
      remedy: "Serve a Guru; teach and share wisdom; donate to spiritual causes",
    },
    Venus: {
      planet: "Venus",
      yoga: "Malavya",
      sanskrit: "मालव्य",
      qualities: "Artistic, beautiful, sensual, diplomatic, charming, luxurious, romantic",
      physical: "Beautiful, well-formed, radiant like silver, captivating smile, graceful movements",
      effects: "Artistic genius, wealth, luxury, romantic success, political power through charm. May become an artist, musician, diplomat, or leader of luxury industries.",
      famous: "Great artists, musicians, diplomats, and lovers throughout history",
      deity: "Goddess Lakshmi",
      remedy: "Create beauty as worship; express love generously; serve women and children",
    },
    Saturn: {
      planet: "Saturn",
      yoga: "Sasa",
      sanskrit: "शश",
      qualities: "Authoritative, disciplined, patient, ambitious, strategic, administrative, enduring",
      physical: "Small teeth, agile body, keen glance, sometimes prominent ears, dignified bearing",
      effects: "Political power, administrative authority, leadership of large organizations, real estate wealth. May become a king, CEO, politician, or administrator.",
      famous: "Great kings, emperors, and political leaders throughout history",
      deity: "Lord Shani / Lord Brahma",
      remedy: "Serve the poor and elderly; practice patience; lead with responsibility",
    },
  };

  const detected: any[] = [];
  const notFormed: any[] = [];

  for (const planetName of ["Mars", "Mercury", "Jupiter", "Venus", "Saturn"]) {
    const planet = planets.find((p: any) => p.name === planetName);
    const info = YOGA_INFO[planetName];
    if (!planet) continue;

    const isOwnSign = SIGN_LORDS[planet.signIndex] === planetName;
    const isExalted = EXALTED_SIGNS[planetName] === planet.signIndex;
    const isKendra = [1, 4, 7, 10].includes(planet.house);

    const formed = (isOwnSign || isExalted) && isKendra;

    if (formed) {
      detected.push({
        ...info,
        natalSign: ZODIAC_SIGNS[planet.signIndex],
        natalHouse: planet.house,
        dignity: isExalted ? "exalted" : "own_sign",
        formed: true,
      });
    } else {
      notFormed.push({
        yoga: info.yoga,
        planet: planetName,
        reason: !isOwnSign && !isExalted
          ? `${planetName} is not in its own/exalted sign (currently in ${ZODIAC_SIGNS[planet.signIndex]})`
          : !isKendra
          ? `${planetName} is in house ${planet.house} (not a kendra 1/4/7/10)`
          : "Unknown reason",
        formed: false,
      });
    }
  }

  return NextResponse.json({
    yogas: {
      formedCount: detected.length,
      formed: detected,
      notFormed,
      summary: detected.length > 0
        ? `${detected.length} Pancha Mahapurusha Yoga${detected.length > 1 ? "s" : ""} formed: ${detected.map((d) => d.yoga).join(", ")} — this is exceptionally rare and auspicious!`
        : "No Pancha Mahapurusha Yogas detected. These form when Mars/Mercury/Jupiter/Venus/Saturn are in their own or exalted sign in a kendra house (1, 4, 7, 10).",
      ascendant: ZODIAC_SIGNS[ascSign],
    },
  });
}
