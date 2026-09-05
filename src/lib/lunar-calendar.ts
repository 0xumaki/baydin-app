/**
 * BAYDIN — Lunar calendar engine.
 *
 * Computes moon phase + panchanga (tithi, nakshatra, yoga, karana) for any
 * calendar day, plus auspicious/inauspicious flags for festivals and eclipses.
 *
 * The moon phase is computed accurately from the Sun-Moon elongation using
 * the same Schlyter algorithms as the rest of the astrology engine — not
 * from a fixed synodic-month approximation.
 */

import { julianDay, sunPosition, moonPosition, rev, lahiriAyanamsa, panchanga, NAKSHATRAS } from "@/lib/astrology";

export type MoonPhaseName =
  | "New Moon"
  | "Waxing Crescent"
  | "First Quarter"
  | "Waxing Gibbous"
  | "Full Moon"
  | "Waning Gibbous"
  | "Last Quarter"
  | "Waning Crescent";

export type LunarDay = {
  date: string; // YYYY-MM-DD (local, noon as reference)
  dayOfWeek: number; // 0=Sun ... 6=Sat
  dayOfWeekName: string;
  moonPhase: {
    phaseFrac: number; // 0..1 (0 = new, 0.5 = full)
    illumination: number; // 0..1
    age: number; // days since new moon
    name: MoonPhaseName;
    emoji: string;
    zodiacSign: string; // tropical sign of the moon
  };
  panchanga: {
    tithi: string;
    tithi_number: number;
    tithi_paksha: string;
    nakshatra: string;
    nakshatra_index: number;
    nakshatra_pada: number;
    yoga: string;
    yoga_index: number;
    karana: string;
    karana_index: number;
  };
  isToday: boolean;
  isFestival: boolean;
  festivalName?: string;
  isAmavasya: boolean; // New Moon day — ancestor rituals
  isPurnima: boolean; // Full Moon day — auspicious
  isEkadashi: boolean; // 11th lunar day — fasting
  isAshtami: boolean; // 8th lunar day
  isNavami: boolean; // 9th lunar day
  isChaturdashi: boolean; // 14th — Shivaratri potential
};

export type LunarMonth = {
  year: number;
  month: number; // 1-12
  monthName: string;
  days: LunarDay[];
};

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ZODIAC_SIGNS = [
  "Aries", "Taurus", "Gemini", "Cancer", "Leo", "Virgo",
  "Libra", "Scorpio", "Sagittarius", "Capricorn", "Aquarius", "Pisces",
];
const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

/**
 * Compute the moon phase fraction (0=new, 0.5=full, ~1=new again) for a date.
 * Uses the accurate Sun-Moon elongation via Schlyter algorithms + Lahiri ayanamsa.
 */
function moonPhaseForDate(year: number, month: number, day: number): {
  phaseFrac: number;
  illumination: number;
  age: number;
  name: MoonPhaseName;
  emoji: string;
  zodiacSign: string;
} {
  // Use noon local time as reference (avoids day-boundary edge cases)
  const jd = julianDay(year, month, day, 12);
  const d = jd - 2451545.0;
  const ayanamsa = lahiriAyanamsa(jd);

  const sunLon = rev(sunPosition(d).lon + 282.9404 - ayanamsa);
  const moonLon = rev(moonPosition(d).lon - ayanamsa);
  const elong = rev(moonLon - sunLon); // 0..360

  const phaseFrac = elong / 360; // 0..1
  const illumination = (1 - Math.cos(phaseFrac * 2 * Math.PI)) / 2;
  const age = phaseFrac * 29.53058867;

  let name: MoonPhaseName;
  let emoji: string;
  if (phaseFrac < 0.03 || phaseFrac > 0.97) { name = "New Moon"; emoji = "🌑"; }
  else if (phaseFrac < 0.22) { name = "Waxing Crescent"; emoji = "🌒"; }
  else if (phaseFrac < 0.28) { name = "First Quarter"; emoji = "🌓"; }
  else if (phaseFrac < 0.47) { name = "Waxing Gibbous"; emoji = "🌔"; }
  else if (phaseFrac < 0.53) { name = "Full Moon"; emoji = "🌕"; }
  else if (phaseFrac < 0.72) { name = "Waning Gibbous"; emoji = "🌖"; }
  else if (phaseFrac < 0.78) { name = "Last Quarter"; emoji = "🌗"; }
  else { name = "Waning Crescent"; emoji = "🌘"; }

  const signIdx = Math.floor(moonLon / 30) % 12;
  return { phaseFrac, illumination, age, name, emoji, zodiacSign: ZODIAC_SIGNS[signIdx] };
}

/** Build a LunarDay for a specific local date. */
export function buildLunarDay(year: number, month: number, day: number, today?: { y: number; m: number; d: number }): LunarDay {
  const dateObj = new Date(year, month - 1, day, 12, 0, 0);
  const dow = dateObj.getDay();
  const jd = julianDay(year, month, day, 12);
  const moon = moonPhaseForDate(year, month, day);
  const pan = panchanga(jd);

  const tithiNum = pan.tithi_number % 30; // 0-29
  const tithiInPaksha = tithiNum % 15; // 0-14

  // Festival detection — simplified but covers the major ones
  const festival = detectFestival(month, day, tithiInPaksha, pan.tithi_paksha, dow, moon.name);

  return {
    date: `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`,
    dayOfWeek: dow,
    dayOfWeekName: DAY_NAMES[dow],
    moonPhase: moon,
    panchanga: {
      tithi: pan.tithi,
      tithi_number: pan.tithi_number,
      tithi_paksha: pan.tithi_paksha,
      nakshatra: pan.nakshatra,
      nakshatra_index: pan.nakshatra_index,
      nakshatra_pada: pan.nakshatra_pada,
      yoga: pan.yoga,
      yoga_index: pan.yoga_index,
      karana: pan.karana,
      karana_index: pan.karana_index,
    },
    isToday: today ? today.y === year && today.m === month && today.d === day : false,
    isFestival: !!festival,
    festivalName: festival,
    isAmavasya: tithiInPaksha === 0 && pan.tithi_paksha === "Krishna",
    isPurnima: tithiInPaksha === 14 && pan.tithi_paksha === "Shukla",
    isEkadashi: tithiInPaksha === 10,
    isAshtami: tithiInPaksha === 7,
    isNavami: tithiInPaksha === 8,
    isChaturdashi: tithiInPaksha === 13,
  };
}

/** Detect major Vedic / cultural festivals by date + tithi. */
function detectFestival(
  gregMonth: number,
  gregDay: number,
  tithiInPaksha: number,
  paksha: string,
  dow: number,
  moonPhaseName: string
): string | undefined {
  // Purnima-based festivals
  if (tithiInPaksha === 14 && paksha === "Shukla") {
    if (gregMonth === 1 || gregMonth === 2) return "Vasant Panchami area / Purnima";
    if (gregMonth === 7 || gregMonth === 8) return "Raksha Bandhan / Purnima";
    if (gregMonth === 10 || gregMonth === 11) return "Sharad Purnima";
    if (gregMonth === 4 || gregMonth === 5) return "Buddha Purnima";
    return "Purnima (Full Moon)";
  }
  // Amavasya
  if (tithiInPaksha === 0 && paksha === "Krishna") {
    if (gregMonth === 10 || gregMonth === 11) return "Diwali (Amavasya)";
    return "Amavasya (New Moon)";
  }
  // Maha Shivaratri — Krishna Chaturdashi in Magha (Feb-Mar)
  if (tithiInPaksha === 13 && paksha === "Krishna" && (gregMonth === 2 || gregMonth === 3)) {
    return "Maha Shivaratri";
  }
  // Ekadashi — generic
  if (tithiInPaksha === 10) {
    if (paksha === "Shukla" && (gregMonth === 2 || gregMonth === 3)) return "Vijaya Ekadashi";
    if (paksha === "Krishna" && (gregMonth === 7 || gregMonth === 8)) return "Aja Ekadashi";
    return `${paksha} Ekadashi`;
  }
  // Ashtami — Ashtami of Krishna paksha (Krishna Janmashtami in Aug)
  if (tithiInPaksha === 7 && paksha === "Krishna" && (gregMonth === 7 || gregMonth === 8)) {
    return "Krishna Janmashtami";
  }
  // Navaratri (around Sep-Oct)
  if (tithiInPaksha === 0 && paksha === "Shukla" && (gregMonth === 9 || gregMonth === 10)) {
    return "Navaratri begins";
  }
  // Holi — Phalguna Purnima (Feb-Mar)
  if (tithiInPaksha === 14 && paksha === "Shukla" && (gregMonth === 2 || gregMonth === 3)) {
    return "Holi (Holika Dahan)";
  }
  return undefined;
}

/** Build a full month of LunarDay objects. */
export function buildLunarMonth(year: number, month: number): LunarMonth {
  const daysInMonth = new Date(year, month, 0).getDate();
  const today = {
    y: new Date().getFullYear(),
    m: new Date().getMonth() + 1,
    d: new Date().getDate(),
  };
  const days: LunarDay[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    days.push(buildLunarDay(year, month, d, today));
  }
  return {
    year,
    month,
    monthName: MONTH_NAMES[month - 1],
    days,
  };
}

/** Nakshatra deity + meaning (for detail view). */
export const NAKSHATRA_DETAILS: Record<string, { deity: string; symbol: string; meaning: string; nature: string }> = {
  Ashwini: { deity: "Ashwini Kumaras", symbol: "Horse's head", meaning: "Speed, healing, initiation", nature: "Deva (light)" },
  Bharani: { deity: "Yama", symbol: "Yoni", meaning: "Restrained creativity, endurance", nature: "Manushya (human)" },
  Krittika: { deity: "Agni", symbol: "Razor/Flame", meaning: "Purification, sharpness, cutting", nature: "Rakshasa (demon)" },
  Rohini: { deity: "Brahma", symbol: "Chariot", meaning: "Growth, beauty, fertility", nature: "Manushya (human)" },
  Mrigashira: { deity: "Soma", symbol: "Deer's head", meaning: "Searching, gentle, wandering", nature: "Deva (light)" },
  Ardra: { deity: "Rudra", symbol: "Teardrop", meaning: "Storm, transformation, intensity", nature: "Manushya (human)" },
  Punarvasu: { deity: "Aditi", symbol: "Bow and quiver", meaning: "Renewal, restoration", nature: "Deva (light)" },
  Pushya: { deity: "Brihaspati", symbol: "Cow's udder", meaning: "Nourishment, auspiciousness", nature: "Deva (light)" },
  Ashlesha: { deity: "Nagas", symbol: "Coiled serpent", meaning: "Insight, entanglement, hidden wisdom", nature: "Rakshasa (demon)" },
  Magha: { deity: "Pitris (ancestors)", symbol: "Royal throne", meaning: "Ancestral honor, power", nature: "Rakshasa (demon)" },
  "Purva Phalguni": { deity: "Bhaga", symbol: "Hammock", meaning: "Pleasure, romance, play", nature: "Manushya (human)" },
  "Uttara Phalguni": { deity: "Aryaman", symbol: "Bed", meaning: "Commitment, partnership, charity", nature: "Manushya (human)" },
  Hasta: { deity: "Savitar", symbol: "Hand", meaning: "Skill, dexterity, craft", nature: "Deva (light)" },
  Chitra: { deity: "Tvashtar", symbol: "Bright jewel", meaning: "Brilliance, artistry, illusion", nature: "Rakshasa (demon)" },
  Swati: { deity: "Vayu", symbol: "Young sprout", meaning: "Independence, flexibility, wind", nature: "Rakshasa (demon)" },
  Vishakha: { deity: "Indra-Agni", symbol: "Triumphal arch", meaning: "Goal-seeking, ambition, triumph", nature: "Rakshasa (demon)" },
  Anuradha: { deity: "Mitra", symbol: "Lotus", meaning: "Friendship, devotion, balance", nature: "Deva (light)" },
  Jyeshtha: { deity: "Indra", symbol: "Circular amulet", meaning: "Seniority, protection, leadership", nature: "Rakshasa (demon)" },
  Mula: { deity: "Nirriti", symbol: "Tied roots", meaning: "Root causes, destruction of illusion", nature: "Rakshasa (demon)" },
  "Purva Ashadha": { deity: "Apah (Waters)", symbol: "Fan", meaning: "Early victory, invigoration", nature: "Manushya (human)" },
  "Uttara Ashadha": { deity: "Vishvadevas", symbol: "Elephant tusk", meaning: "Later victory, integrity", nature: "Manushya (human)" },
  Shravana: { deity: "Vishnu", symbol: "Ear", meaning: "Listening, learning, sacred tradition", nature: "Deva (light)" },
  Dhanishta: { deity: "Vasus", symbol: "Drum", meaning: "Wealth, rhythm, music", nature: "Rakshasa (demon)" },
  Shatabhisha: { deity: "Varuna", symbol: "Empty circle", meaning: "Healing, mystery, concealment", nature: "Rakshasa (demon)" },
  "Purva Bhadrapada": { deity: "Aja Ekapada", symbol: "Two-faced man", meaning: "Intense energy, spiritual fire", nature: "Manushya (human)" },
  "Uttara Bhadrapada": { deity: "Ahir Budhnya", symbol: "Twin/Serpent", meaning: "Wisdom, restraint, depth", nature: "Manushya (human)" },
  Revati: { deity: "Pushan", symbol: "Fish", meaning: "Nourishment, journey's end, protection", nature: "Deva (light)" },
};
