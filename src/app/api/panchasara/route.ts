import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/panchasara — returns the 5-fold remedy (Panchasara/Pancha Karma) system.
 * The 5 remedies are: Mantra (chanting), Tantra (ritual), Yantra (talisman),
 * Aushadha (herbal/medicine), and Daan (charity).
 * Based on the most afflicted planet in the natal chart.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ panchasara: null });
  if (!user.birthData) return NextResponse.json({ panchasara: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ panchasara: null });
  }

  // 5-fold remedy mapping per planet
  const PANCHASARA: Record<string, {
    mantra: string; tantra: string; yantra: string; aushadha: string; daan: string;
  }> = {
    Sun: {
      mantra: "Gayatri Mantra at sunrise (108x)",
      tantra: "Surya Namaskar (Sun salutation) 12 rounds at dawn",
      yantra: "Surya Yantra (12-petaled lotus with Sun symbol) on copper",
      aushadha: "Aragvadha (Cassia fistula) or Arka (Calotropis) root on Sundays",
      daan: "Donate wheat, jaggery, copper vessels, or red flowers",
    },
    Moon: {
      mantra: "Om Chandraya Namaha (108x on Mondays)",
      tantra: "Offer white flowers to Shiva on Monday nights",
      yantra: "Chandra Yantra (16-petaled lotus) on silver plate",
      aushadha: "Bilva (Aegle marmelos) leaves or white sandalwood paste",
      daan: "Donate white rice, milk, silver, or white clothing on Mondays",
    },
    Mars: {
      mantra: "Om Angarakaya Namaha + Hanuman Chalisa on Tuesdays",
      tantra: "Light a mustard oil lamp at Hanuman temple on Tuesdays",
      yantra: "Mangal Yantra (triangle) on red copper",
      aushadha: "Ashwagandha root or red sandalwood paste",
      daan: "Donate red lentils, red cloth, or copper on Tuesdays",
    },
    Mercury: {
      mantra: "Om Budhaya Namaha + Vishnu Sahasranama on Wednesdays",
      tantra: "Offer green tulsi leaves to Vishnu on Wednesdays",
      yantra: "Budha Yantra (6-pointed star) on bronze",
      aushadha: "Brahmi (Bacopa monnieri) or tulsi (holy basil)",
      daan: "Donate green gram, green vegetables, or books on Wednesdays",
    },
    Jupiter: {
      mantra: "Om Gurave Namaha + Guru Stotra on Thursdays",
      tantra: "Offer turmeric and chickpeas to a Guru or temple on Thursdays",
      yantra: "Guru Yantra (8-petaled lotus) on gold-plated plate",
      aushadha: "Turmeric powder or yellow Ber (jujube) fruit",
      daan: "Donate turmeric, chickpeas, yellow flowers, or gold on Thursdays",
    },
    Venus: {
      mantra: "Om Shukraya Namaha + Lakshmi Stotra on Fridays",
      tantra: "Offer flowers and perfume to Lakshmi on Fridays",
      yantra: "Shukra Yantra on silver or diamond-set plate",
      aushadha: "Rose petals, saffron, or sandalwood paste",
      daan: "Donate white clothing, sweets, perfumes, or milk on Fridays",
    },
    Saturn: {
      mantra: "Om Shanaischaraya Namaha + Shani Stotra on Saturdays",
      tantra: "Light a mustard oil lamp under a Peepal tree on Saturdays",
      yantra: "Shani Yantra (3 intersecting triangles) on iron plate",
      aushadha: "Black sesame oil or Shami (Prosopis cineraria) leaves",
      daan: "Donate black sesame, iron, black cloth, or serve the poor on Saturdays",
    },
    Rahu: {
      mantra: "Om Rahave Namaha (18x) + Durga Saptashati",
      tantra: "Light a blue flame lamp; offer blue flowers",
      yantra: "Rahu Yantra (8 triangles) on lead plate",
      aushadha: "Nagakesara (Mesua ferrea) or blue lotus essence",
      daan: "Donate blue/black cloth, sesame seeds; feed birds and dogs",
    },
    Ketu: {
      mantra: "Om Ketave Namaha (18x) + Ganesha Atharvashirsha",
      tantra: "Offer durva grass to Ganesha on Tuesdays",
      yantra: "Ketu Yantra on a cat's eye gemstone",
      aushadha: "Durva grass (Cynodon dactylon) or ashwagandha root",
      daan: "Donate to spiritual causes; feed stray animals; help the homeless",
    },
  };

  // Find the most afflicted planet
  const planets = chart.planets;
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const ascSign = chart.ascendant.signIndex;

  // Score each planet's affliction level
  const afflicted = planets.map((p: any) => {
    let score = 0;
    if (p.dignity === "debilitated") score += 3;
    if ([6, 8, 12].includes(p.house)) score += 2;
    if (p.retrograde && ["Saturn", "Mars", "Jupiter"].includes(p.name)) score += 1;
    // Combust check
    const sun = planets.find((pl: any) => pl.name === "Sun");
    if (sun && p.signIndex === sun.signIndex && p.name !== "Sun") score += 2;
    return { planet: p, score };
  }).filter((a: any) => a.score > 0).sort((a: any, b: any) => b.score - a.score);

  if (afflicted.length === 0) {
    return NextResponse.json({
      panchasara: {
        status: "balanced",
        message: "Your chart shows no significant planetary afflictions. Continue your spiritual practices for continued well-being.",
        remedies: [],
      },
    });
  }

  const topPlanet = afflicted[0].planet;
  const remedies = PANCHASARA[topPlanet.name];
  if (!remedies) {
    return NextResponse.json({ panchasara: { status: "no_remedy", remedies: [] } });
  }

  const fiveRemedies = [
    { name: "Mantra", sanskrit: "मन्त्र", desc: remedies.mantra, icon: "🕉" },
    { name: "Tantra", sanskrit: "तन्त्र", desc: remedies.tantra, icon: "🔥" },
    { name: "Yantra", sanskrit: "यन्त्र", desc: remedies.yantra, icon: "🔯" },
    { name: "Aushadha", sanskrit: "औषध", desc: remedies.aushadha, icon: "🌿" },
    { name: "Daan", sanskrit: "दान", desc: remedies.daan, icon: "🤲" },
  ];

  return NextResponse.json({
    panchasara: {
      status: "remedy_needed",
      planet: topPlanet.name,
      planetSign: ZODIAC_SIGNS[topPlanet.signIndex],
      afflictionLevel: afflicted[0].score,
      problem: `${topPlanet.name} in ${ZODIAC_SIGNS[topPlanet.signIndex]} has affliction score ${afflicted[0].score}`,
      remedies: fiveRemedies,
    },
  });
}
