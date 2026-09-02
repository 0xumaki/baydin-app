import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/spiritual-practice — returns today's recommended spiritual practice
 * based on the user's natal chart, current weekday, nakshatra, and dosha.
 * Combines multiple astrological factors for a personalized daily practice.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ practice: null });
  if (!user.birthData) return NextResponse.json({ practice: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ practice: null });
  }

  const weekday = new Date().getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const dayLords = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
  const dayLord = dayLords[weekday];

  const moon = chart.planets.find((p: any) => p.name === "Moon");
  const moonNak = chart.nakshatra;
  const nakIdx = NAKSHATRAS.indexOf(moonNak);
  const NAK_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
  const nakLord = NAK_LORDS[nakIdx % 9];
  const nadiType = nakIdx % 3;
  const NADI_NAMES = ["Aadi (Vata)", "Madhya (Pitta)", "Antya (Kapha)"];
  const nadi = NADI_NAMES[nadiType];

  // Weekday-specific practices
  const WEEKDAY_PRACTICES: Record<string, { practice: string; mantra: string; activity: string; charity: string }> = {
    Sun: {
      practice: "Surya Namaskar (12 rounds at sunrise) + offer Arghya (water) to the Sun",
      mantra: "Gayatri Mantra: Om Bhur Bhuva Svaha, Tat Savitur Varenyam, Bhargo Devasya Dhimahi, Dhiyo Yo Nah Prachodayat (108x)",
      activity: "Practice selfless service; be a role model for others today",
      charity: "Donate wheat, jaggery, or copper to the needy",
    },
    Moon: {
      practice: "Meditate on a white flower or moonstone; practice silent sitting (Mauna)",
      mantra: "Om Chandraya Namaha (108x) or Om Namah Shivaya (1008x)",
      activity: "Spend time in nature; visit a body of water; practice loving-kindness",
      charity: "Donate white rice, milk, or white clothing",
    },
    Mars: {
      practice: "Practice Hanuman Chalisa (7x); physical exercise or martial arts with devotion",
      mantra: "Om Sri Hanumate Namaha (108x) or Om Angarakaya Namaha",
      activity: "Protect the weak; channel energy into constructive physical work",
      charity: "Donate red lentils or red cloth",
    },
    Mercury: {
      practice: "Study scriptures; practice clear speech and mindful communication",
      mantra: "Om Budhaya Namaha (108x) or recite Vishnu Sahasranama",
      activity: "Teach or share knowledge; write in a journal; practice right speech",
      charity: "Donate green vegetables, books, or stationery to students",
    },
    Jupiter: {
      practice: "Practice Guru Puja; study spiritual texts; teach or mentor someone",
      mantra: "Om Gurave Namaha (108x) or Guru Stotra",
      activity: "Serve at a temple or ashram; express gratitude to your teachers",
      charity: "Donate turmeric, chickpeas, or yellow items; feed Brahmins or students",
    },
    Venus: {
      practice: "Create beauty as worship — art, music, or flower arrangement; practice gratitude",
      mantra: "Om Sri Mahalakshmyai Namaha (108x) or Sri Sukta",
      activity: "Express love to family; appreciate beauty in nature; practice self-care",
      charity: "Donate sweets, flowers, or perfumes; serve women's shelters",
    },
    Saturn: {
      practice: "Practice silent meditation; light a mustard oil lamp; serve the poor",
      mantra: "Om Shanaischaraya Namaha (108x) or Shani Stotra",
      activity: "Practice patience and endurance; serve the elderly and disabled",
      charity: "Donate black sesame, iron, or dark cloth; serve at a homeless shelter",
    },
  };

  const dayPractice = WEEKDAY_PRACTICES[dayLord] || WEEKDAY_PRACTICES["Jupiter"];

  // Nadi-specific practice
  const NADI_PRACTICES: string[] = [
    "Vata: Practice grounding — sit on the earth, eat warm moist foods, do gentle yoga (not vigorous)",
    "Pitta: Practice cooling — meditate near water, eat sweet fruits, avoid midday sun, practice forgiveness",
    "Kapha: Practice stimulation — brisk walking, dry brushing, eat light spicy foods, stay active",
  ];
  const nadiPractice = NADI_PRACTICES[nadiType];

  // Nakshatra-specific deity meditation
  const NAK_MEDITATION: Record<string, string> = {
    "Ashwini": "Meditate on the Ashwini Kumaras — visualize healing light entering your body",
    "Magha": "Meditate on your ancestors — offer gratitude and seek their blessings",
    "Pushya": "Meditate on Brihaspati — focus on wisdom and spiritual growth",
    "Shravana": "Meditate on Lord Vishnu — chant 'Om Namo Narayanaya'",
    "Revati": "Meditate on Pushan — visualize a safe journey through life",
  };
  const nakMeditation = NAK_MEDITATION[moonNak] || `Meditate on the deity of ${moonNak} nakshatra: ${nakLord}`;

  // Timing recommendations
  const BRAHMA_MUHURTA = "4:24 AM – 6:00 AM (Brahma Muhurta) — most auspicious for spiritual practice";
  const SANDHYA = "Sunrise & Sunset (Sandhya times) — chant Gayatri Mantra";

  // Build the complete practice
  return NextResponse.json({
    practice: {
      day: dayNames[weekday],
      dayLord,
      nakshatra: moonNak,
      nakshatraLord: nakLord,
      nadi,
      morning: {
        time: BRAHMA_MUHURTA,
        primary: dayPractice.practice,
        mantra: dayPractice.mantra,
      },
      afternoon: {
        time: SANDHYA,
        practice: nakMeditation,
      },
      evening: {
        time: "After sunset — dusk meditation",
        practice: nadiPractice,
      },
      dailyActivity: dayPractice.activity,
      charity: dayPractice.charity,
      moonSign: ZODIAC_SIGNS[moon?.signIndex ?? 0],
    },
  });
}
