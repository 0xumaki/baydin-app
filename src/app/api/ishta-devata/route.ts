import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, computeNavamsa, type BirthContext, NAKSHATRAS, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/ishta-devata — returns the user's Ishta Devata (personal deity).
 * In Vedic tradition, the Ishta Devata is determined by the 12th house
 * (house of liberation/moksha) from the Moon in the D-9 (Navamsa) chart.
 * The planet in or ruling that sign indicates the deity to worship for
 * spiritual progress and ultimate liberation.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ ishtaDevata: null });
  if (!user.birthData) return NextResponse.json({ ishtaDevata: null });

  const birthData: BirthContext = JSON.parse(user.birthData);
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ ishtaDevata: null });
  }

  const moon = chart.planets.find((p: any) => p.name === "Moon");
  if (!moon) return NextResponse.json({ ishtaDevata: null });

  // 12th house from Moon in D-1 (simplified — classical uses D-9)
  const twelfthFromMoon = (moon.signIndex + 11) % 12;
  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];
  const twelfthLord = signLords[twelfthFromMoon];

  // Planet → Deity mapping (classical Vedic)
  const PLANET_DEITIES: Record<string, { deity: string; mantra: string; form: string; description: string; color: string }> = {
    Sun: {
      deity: "Surya (Sun God) / Lord Rama",
      mantra: "Om Sri Suryaya Namaha / Om Sri Ramaya Namaha",
      form: "Worship the Sun at dawn; offer water (Arghya) facing east",
      description: "The Sun as Ishta Devata indicates a path of self-realization through duty, leadership, and righteous action (Dharma).",
      color: "#C5A87C",
    },
    Moon: {
      deity: "Lord Shiva (Chandra Shekhara) / Parvati",
      mantra: "Om Namah Shivaya / Om Sri Somaya Namaha",
      form: "Offer white flowers and milk on Mondays; chant 'Om Namah Shivaya'",
      description: "The Moon as Ishta Devata indicates a devotional path through love, compassion, and emotional surrender.",
      color: "#9CA8A3",
    },
    Mars: {
      deity: "Lord Hanuman / Kartikeya (Murugan)",
      mantra: "Om Sri Hanumate Namaha / Om Sri Karthikeyaya Namaha",
      form: "Offer red flowers and light a ghee lamp on Tuesdays",
      description: "Mars as Ishta Devata indicates a path of courageous service, self-discipline, and protection of the weak.",
      color: "#b5463a",
    },
    Mercury: {
      deity: "Lord Vishnu / Lord Budha",
      mantra: "Om Sri Vishnave Namaha / Om Budhaya Namaha",
      form: "Offer green tulsi leaves to Vishnu on Wednesdays; study scriptures",
      description: "Mercury as Ishta Devata indicates a path of knowledge, scripture, and intellectual devotion (Jnana Yoga).",
      color: "#B5CD7E",
    },
    Jupiter: {
      deity: "Lord Shiva (Dakshinamurti) / Lord Vishnu (Hayagriva)",
      mantra: "Om Sri Gurave Namaha / Om Namo Bhagavate Vasudevaya",
      form: "Offer yellow flowers and turmeric on Thursdays; teach or serve a Guru",
      description: "Jupiter as Ishta Devata indicates a path of wisdom, teaching, and spiritual guidance to others.",
      color: "#C5A87C",
    },
    Venus: {
      deity: "Goddess Lakshmi / Goddess Saraswati",
      mantra: "Om Sri Mahalakshmyai Namaha / Om Sri Saraswatyai Namaha",
      form: "Offer flowers and perfume on Fridays; create beauty as worship",
      description: "Venus as Ishta Devata indicates a path of love, beauty, devotion through art and relationship (Bhakti Yoga).",
      color: "#D876A0",
    },
    Saturn: {
      deity: "Lord Shiva (Bhairava) / Lord Hanuman",
      mantra: "Om Sri Shaneescharaya Namaha / Om Sri Hanumate Namaha",
      form: "Light a mustard oil lamp on Saturdays; serve the poor and elderly",
      description: "Saturn as Ishta Devata indicates a path of austerity, service to the marginalized, and karmic release.",
      color: "#9E8AC9",
    },
  };

  const deity = PLANET_DEITIES[twelfthLord] || PLANET_DEITIES["Jupiter"];

  // Also check the D-9 (Navamsa) 12th from Moon for additional confirmation
  const navamsa = computeNavamsa(chart);
  const navMoon = navamsa.planets.find((p: any) => p.name === "Moon");
  const nav12th = navMoon ? (navMoon.signIndex + 11) % 12 : twelfthFromMoon;
  const nav12thLord = signLords[nav12th];
  const navDeity = PLANET_DEITIES[nav12thLord] || deity;

  // Nakshatra Devata (the deity of the Moon's nakshatra)
  const NAK_DEVATAS: Record<string, string> = {
    "Ashwini": "Ashwini Kumaras (twin healers)",
    "Bharani": "Yama (Lord of Death / Dharma)",
    "Krittika": "Agni (Fire God)",
    "Rohini": "Brahma (Creator)",
    "Mrigashira": "Soma (Moon God)",
    "Ardra": "Rudra (Fierce Shiva)",
    "Punarvasu": "Aditi (Mother of Gods)",
    "Pushya": "Brihaspati (Guru of Gods)",
    "Ashlesha": "Nagas (Serpent Deities)",
    "Magha": "Pitris (Ancestors)",
    "Purva Phalguni": "Bhaga (God of Fortune)",
    "Uttara Phalguni": "Aryaman (God of Chivalry)",
    "Hasta": "Savitar (Sun as Inspirer)",
    "Chitra": "Tvashtar (Divine Architect)",
    "Swati": "Vayu (Wind God)",
    "Vishakha": "Indra-Agni (King & Fire)",
    "Anuradha": "Mitra (God of Friendship)",
    "Jyeshtha": "Indra (King of Gods)",
    "Mula": "Nirriti (Goddess of Dissolution)",
    "Purva Ashadha": "Apah (Water Deities)",
    "Uttara Ashadha": "Vishvedevas (Universal Gods)",
    "Shravana": "Vishnu (Preserver)",
    "Dhanishta": "Vasus (Eight Deities of Light)",
    "Shatabhisha": "Varuna (God of Cosmic Order)",
    "Purva Bhadrapada": "Aja Ekapada (One-footed Goat / Shiva)",
    "Uttara Bhadrapada": "Ahir Budhnya (Serpent of the Deep)",
    "Revati": "Pushan (Nourisher / Protector of Journeys)",
  };
  const nakDevata = NAK_DEVATAS[chart.nakshatra] || "Lord Ganesha";

  return NextResponse.json({
    ishtaDevata: {
      primary: {
        planet: twelfthLord,
        sign: ZODIAC_SIGNS[twelfthFromMoon],
        deity: deity.deity,
        mantra: deity.mantra,
        form: deity.form,
        description: deity.description,
        color: deity.color,
      },
      navamsa: {
        planet: nav12thLord,
        sign: ZODIAC_SIGNS[nav12th],
        deity: navDeity.deity,
        confirms: twelfthLord === nav12thLord,
      },
      nakshatraDevata: {
        nakshatra: chart.nakshatra,
        deity: nakDevata,
      },
      moonSign: ZODIAC_SIGNS[moon.signIndex],
    },
  });
}
