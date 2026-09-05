import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/dasha-effects — returns the effects of the current Vimshottari
 * Dasha period (Mahadasha + Antardasha) on the user's life.
 * Based on the natal placement of the Dasha lords and their strength.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ dashaEffects: null });
  if (!user.birthData) return NextResponse.json({ dashaEffects: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ dashaEffects: null });
  }

  const dasha = chart.dasha;
  if (!dasha) return NextResponse.json({ dashaEffects: null });

  const mahadashaLord = dasha.current_mahadasha;
  const currentMaha = dasha.mahadashas?.find((m: any) => m.lord === mahadashaLord);
  const birthDasha = dasha.birth_dasha;

  // Find the natal planet that is the Mahadasha lord
  const mahaPlanet = chart.planets.find((p: any) => p.name === mahadashaLord);
  const allPlanets = chart.planets;

  // Dasha lord effects based on natal placement
  const DASHA_EFFECTS: Record<string, {
    general: string;
    beneficial: string;
    challenging: string;
    lifeAreas: string[];
    remedies: string[];
  }> = {
    Ketu: {
      general: "Spiritual transformation, detachment, liberation from past patterns",
      beneficial: "Spiritual growth, intuition, letting go of what no longer serves",
      challenging: "Confusion, disorientation, health issues, feeling ungrounded",
      lifeAreas: ["spirituality", "liberation", "past karma", "research"],
      remedies: ["Worship Lord Ganesha", "Feed stray animals", "Meditate on 'Om Gam Ganapataye Namaha'"],
    },
    Venus: {
      general: "Love, relationships, luxury, comfort, artistic expression",
      beneficial: "Marriage, romance, artistic success, material comfort, social popularity",
      challenging: "Relationship conflicts, overindulgence, vanity, financial excess",
      lifeAreas: ["marriage", "love", "luxury", "arts", "vehicles"],
      remedies: ["Worship Goddess Lakshmi", "Offer flowers on Fridays", "Chant 'Om Shukraya Namaha'"],
    },
    Sun: {
      general: "Authority, self-expression, leadership, father, health, vitality",
      beneficial: "Career advancement, recognition, leadership roles, improved health",
      challenging: "Ego conflicts, father's health, government issues, eye problems",
      lifeAreas: ["career", "authority", "father", "health", "government"],
      remedies: ["Offer Arghya to Sun at sunrise", "Surya Namaskar", "Chant Gayatri Mantra"],
    },
    Moon: {
      general: "Emotions, mind, mother, home, comfort, public life",
      beneficial: "Emotional stability, domestic happiness, public recognition, travel",
      challenging: "Emotional volatility, mother's health, mental anxiety, restlessness",
      lifeAreas: ["emotions", "mother", "home", "public", "travel"],
      remedies: ["Meditate on Lord Shiva", "Offer white flowers on Mondays", "Chant 'Om Chandraya Namaha'"],
    },
    Mars: {
      general: "Energy, courage, siblings, property, competition, accidents",
      beneficial: "Property gains, athletic success, competitive victories, engineering",
      challenging: "Conflicts, accidents, surgery, blood-related issues, legal disputes",
      lifeAreas: ["energy", "property", "siblings", "competition", "surgery"],
      remedies: ["Worship Lord Hanuman", "Feed red lentils on Tuesdays", "Chant Hanuman Chalisa"],
    },
    Rahu: {
      general: "Ambition, foreign matters, material desires, unconventional paths",
      beneficial: "Foreign travel, sudden gains, technology, unconventional success, ambition fulfilled",
      challenging: "Illusion, addiction, confusion, skin issues, relationship deception",
      lifeAreas: ["ambition", "foreign", "technology", "desires", "illusion"],
      remedies: ["Worship Goddess Durga", "Feed birds and dogs", "Chant 'Om Rahave Namaha'"],
    },
    Jupiter: {
      general: "Wisdom, fortune, children, spirituality, higher learning, wealth",
      beneficial: "Wealth, children, spiritual growth, teaching, pilgrimage, wisdom",
      challenging: "Over-optimism, weight gain, excess, religious conflicts, lazy tendencies",
      lifeAreas: ["wisdom", "children", "wealth", "spirituality", "education"],
      remedies: ["Worship Guru or Lord Vishnu", "Donate turmeric on Thursdays", "Chant 'Om Gurave Namaha'"],
    },
    Saturn: {
      general: "Discipline, hard work, career, longevity, service, delays, karma",
      beneficial: "Career stability, real estate, long-term achievements, spiritual maturity",
      challenging: "Delays, obstacles, health issues, financial stress, isolation, sorrow",
      lifeAreas: ["career", "longevity", "service", "real estate", "karma"],
      remedies: ["Worship Lord Shani/Hanuman", "Serve the poor on Saturdays", "Light mustard oil lamp"],
    },
    Mercury: {
      general: "Intelligence, communication, business, trade, friends, nervous system",
      beneficial: "Business success, education, communication skills, friendships, trade gains",
      challenging: "Nervous tension, communication breakdowns, business losses, skin issues",
      lifeAreas: ["intelligence", "business", "communication", "friends", "education"],
      remedies: ["Worship Lord Vishnu", "Donate green items on Wednesdays", "Chant 'Om Budhaya Namaha'"],
    },
  };

  const effects = DASHA_EFFECTS[mahadashaLord] || DASHA_EFFECTS["Jupiter"];

  // Determine if the Dasha is likely beneficial or challenging based on natal placement
  let placementEffect = "mixed";
  if (mahaPlanet) {
    if (mahaPlanet.dignity === "exalted" || mahaPlanet.dignity === "own_sign") {
      placementEffect = "beneficial";
    } else if (mahaPlanet.dignity === "debilitated") {
      placementEffect = "challenging";
    } else if ([1, 4, 5, 7, 9, 10, 11].includes(mahaPlanet.house)) {
      placementEffect = "beneficial";
    } else if ([6, 8, 12].includes(mahaPlanet.house)) {
      placementEffect = "challenging";
    }
  }

  // Get upcoming dasha periods
  const upcoming = (dasha.mahadashas || [])
    .filter((m: any) => new Date(m.startDate) > new Date())
    .slice(0, 3)
    .map((m: any) => ({
      lord: m.lord,
      years: +m.years.toFixed(1),
      startDate: m.startDate?.toISOString().slice(0, 10),
      endDate: m.endDate?.toISOString().slice(0, 10),
    }));

  return NextResponse.json({
    dashaEffects: {
      current: {
        mahadasha: mahadashaLord,
        birthDasha: birthDasha?.lord,
        birthBalance: birthDasha ? +birthDasha.balance_years.toFixed(2) : null,
        startDate: currentMaha?.startDate?.toISOString().slice(0, 10),
        endDate: currentMaha?.endDate?.toISOString().slice(0, 10),
        years: currentMaha ? +currentMaha.years.toFixed(1) : null,
        natalPlacement: mahaPlanet
          ? `${mahadashaLord} in ${ZODIAC_SIGNS[mahaPlanet.signIndex]}, house ${mahaPlanet.house}, ${mahaPlanet.dignity}`
          : "Placement unknown",
        placementEffect,
        general: effects.general,
        beneficial: effects.beneficial,
        challenging: effects.challenging,
        lifeAreas: effects.lifeAreas,
        remedies: effects.remedies,
      },
      upcoming,
      summary: `You are currently in the ${mahadashaLord} Mahadasha. This period brings ${effects.general}. Based on your natal placement (${placementEffect}), expect ${placementEffect === "beneficial" ? effects.beneficial : placementEffect === "challenging" ? effects.challenging : "a mix of beneficial and challenging experiences"}.`,
    },
  });
}
