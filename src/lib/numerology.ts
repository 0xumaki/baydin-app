/**
 * BAYDIN — Numerology engine (Pythagorean + Chaldean systems).
 *
 * Numerology reduces names and dates to single digits (1-9) or master numbers
 * (11, 22, 33). Each number carries archetypal meaning:
 *
 * Numbers computed:
 *  - Life Path (from full birth date — the most important number)
 *  - Destiny / Expression (from full birth name)
 *  - Soul Urge (from vowels in birth name)
 *  - Personality (from consonants in birth name)
 *  - Birthday (from day-of-month of birth)
 *  - Maturity (Life Path + Destiny, reduced)
 *  - Personal Year (birth month + birth day + current year, reduced — forecast)
 *
 * Two systems are supported:
 *  - Pythagorean: A=1,B=2,C=3,I=9,J=1... (Western standard)
 *  - Chaldean: name-number values 1-8 (no 9), used in Vedic/Myanmar tradition
 *
 * Master numbers (11, 22, 33) are preserved during reduction when they arise
 * from the full sum (not from intermediate steps).
 */

export type NumerologySystem = "pythagorean" | "chaldean";

export type NumberMeaning = {
  number: number;
  title: string;
  keywords: string[];
  traits: string[];
  challenges: string[];
  element: "Fire" | "Earth" | "Air" | "Water" | "Spirit";
  rulingPlanet: string;
  color: string;
  summary: string;
};

export type NumerologyReport = {
  system: NumerologySystem;
  name: string;
  birthDate: string;
  numbers: {
    lifePath: number;
    destiny: number;
    soulUrge: number;
    personality: number;
    birthday: number;
    maturity: number;
    personalYear: number;
    personalMonth: number;
  };
  meanings: Record<string, NumberMeaning>;
  // Composite interpretation
  synthesis: string;
  lucky: {
    days: string[];
    colors: string[];
    gems: string[];
    numbers: number[];
  };
};

// ============================================================
// LETTER VALUE TABLES
// ============================================================

const PYTHAGOREAN: Record<string, number> = {
  A: 1, J: 1, S: 1,
  B: 2, K: 2, T: 2,
  C: 3, L: 3, U: 3,
  D: 4, M: 4, V: 4,
  E: 5, N: 5, W: 5,
  F: 6, O: 6, X: 6,
  G: 7, P: 7, Y: 7,
  H: 8, Q: 8, Z: 8,
  I: 9, R: 9,
};

const CHALDEAN: Record<string, number> = {
  A: 1, I: 1, J: 1, Y: 1, Q: 1,
  B: 2, K: 2, R: 2,
  C: 3, G: 3, L: 3, S: 3,
  D: 4, M: 4, T: 4,
  E: 5, H: 5, N: 5, X: 5,
  U: 6, V: 6, W: 6,
  O: 7, Z: 7,
  F: 8, P: 8,
};

const VOWELS = new Set(["A", "E", "I", "O", "U"]);
const MASTER_NUMBERS = new Set([11, 22, 33]);

// ============================================================
// CORE REDUCTION
// ============================================================

/** Reduce a number to a single digit, preserving master numbers 11/22/33. */
export function reduceNumber(n: number): number {
  while (n > 9 && !MASTER_NUMBERS.has(n)) {
    n = String(n).split("").reduce((s, d) => s + Number(d), 0);
  }
  return n;
}

/** Sum letter values for a string using the given system. */
function letterSum(text: string, system: NumerologySystem): number {
  const table = system === "pythagorean" ? PYTHAGOREAN : CHALDEAN;
  let sum = 0;
  for (const ch of text.toUpperCase()) {
    if (table[ch]) sum += table[ch];
  }
  return sum;
}

/** Reduce a date (YYYY-MM-DD) to a life path number.
 *  Standard method: reduce day, reduce month, reduce year, sum all, reduce.
 *  Preserve master numbers throughout.
 */
function reduceDate(yyyy: number, mm: number, dd: number): number {
  const day = reduceNumber(dd);
  const month = reduceNumber(mm);
  const year = reduceNumber(yyyy);
  const total = day + month + year;
  return reduceNumber(total);
}

function splitName(name: string): { all: string; vowels: string; consonants: string } {
  const clean = name.replace(/[^A-Za-z ]/g, " ").trim();
  const upper = clean.toUpperCase().replace(/\s+/g, "");
  let v = "";
  let c = "";
  for (const ch of upper) {
    if (VOWELS.has(ch)) v += ch;
    else if (ch !== " ") c += ch;
  }
  return { all: upper, vowels: v, consonants: c };
}

// ============================================================
// NUMBER MEANINGS (1-9, 11, 22, 33)
// ============================================================

export const NUMBER_MEANINGS: Record<number, NumberMeaning> = {
  1: {
    number: 1, title: "The Pioneer", keywords: ["leadership", "independence", "innovation"],
    traits: ["Ambitious and self-driven", "Natural-born leader", "Original thinker", "Courageous in the face of adversity"],
    challenges: ["Can become stubborn or arrogant", "Loneliness from excessive independence", "Impatience with slower minds"],
    element: "Fire", rulingPlanet: "Sun", color: "#E8B557",
    summary: "Number 1 carries the energy of beginnings — the seed from which all things grow. You are meant to lead, to initiate, to walk where others have not yet dared. Your path is one of self-mastery and original creation.",
  },
  2: {
    number: 2, title: "The Diplomat", keywords: ["harmony", "partnership", "intuition"],
    traits: ["Sensitive and empathetic", "Skilled mediator", "Cooperative and patient", "Deeply intuitive"],
    challenges: ["Over-sensitivity to criticism", "Indecisiveness", "Tendency to absorb others' emotions"],
    element: "Water", rulingPlanet: "Moon", color: "#9CB4D1",
    summary: "Number 2 is the energy of partnership and balance. You are the bridge between worlds, the one who harmonizes opposites. Your gift is intuition — trust the quiet voice that knows before the mind does.",
  },
  3: {
    number: 3, title: "The Creator", keywords: ["expression", "joy", "communication"],
    traits: ["Artistic and expressive", "Charismatic and social", "Optimistic and playful", "Gifted communicator"],
    challenges: ["Scattered focus", "Superficiality", "Mood swings when unexpressed"],
    element: "Air", rulingPlanet: "Jupiter", color: "#D4A574",
    summary: "Number 3 is the energy of creative expression and joy. You are here to bring beauty, laughter and inspiration to the world. Your words and art are the medicine others did not know they needed.",
  },
  4: {
    number: 4, title: "The Builder", keywords: ["stability", "discipline", "work"],
    traits: ["Practical and grounded", "Hardworking and reliable", "Loyal and dependable", "Strong sense of order"],
    challenges: ["Rigidity and resistance to change", "Workaholism", "Difficulty expressing emotion"],
    element: "Earth", rulingPlanet: "Rahu (Uranus)", color: "#7A8B6F",
    summary: "Number 4 is the energy of foundations — the four pillars of the temple. You build what lasts. Your discipline and patience create security not only for yourself but for everyone you love.",
  },
  5: {
    number: 5, title: "The Freedom-Seeker", keywords: ["freedom", "change", "adventure"],
    traits: ["Adaptable and versatile", "Curious and magnetic", "Loves travel and new experience", "Quick-witted"],
    challenges: ["Restlessness", "Difficulty committing", "Overindulgence in senses"],
    element: "Air", rulingPlanet: "Mercury", color: "#C19BD5",
    summary: "Number 5 is the energy of change — the five senses through which we experience the world. You are the traveler, the experimenter, the one who refuses to be boxed in. Your freedom is sacred; your lesson is to find freedom within commitment.",
  },
  6: {
    number: 6, title: "The Nurturer", keywords: ["love", "responsibility", "home"],
    traits: ["Caring and protective", "Strong sense of duty", "Artistic and harmonious", "Family-oriented"],
    challenges: ["Self-sacrifice to the point of burnout", "Controlling behavior", "Difficulty receiving"],
    element: "Earth", rulingPlanet: "Venus", color: "#D58FA3",
    summary: "Number 6 is the energy of love made visible — the heart that serves. You are the healer, the parent, the one who makes a house a home. Your gift is to nurture, and your lesson is to include yourself in the circle of care.",
  },
  7: {
    number: 7, title: "The Seeker", keywords: ["wisdom", "mystery", "introspection"],
    traits: ["Deeply analytical and intuitive", "Spiritually inclined", "Loves solitude and study", "Truth-seeker"],
    challenges: ["Aloofness and emotional distance", "Overthinking", "Skepticism that becomes cynicism"],
    element: "Water", rulingPlanet: "Ketu (Neptune)", color: "#6F8BA0",
    summary: "Number 7 is the energy of the mystic — the seven chakras, the seven heavens. You are here to question, to seek, to know the hidden truth. Your solitude is not loneliness; it is the laboratory of the soul.",
  },
  8: {
    number: 8, title: "The Powerhouse", keywords: ["abundance", "power", "ambition"],
    traits: ["Ambitious and driven", "Natural executive", "Visionary with material skill", "Resilient"],
    challenges: ["Work obsession", "Control issues", "Karmic intensity in relationships"],
    element: "Spirit", rulingPlanet: "Saturn", color: "#8B7355",
    summary: "Number 8 is the energy of power and abundance — the infinity symbol turned upright. You are here to master the material world without being mastered by it. Your wealth, when aligned with purpose, becomes a force for good.",
  },
  9: {
    number: 9, title: "The Humanitarian", keywords: ["compassion", "completion", "wisdom"],
    traits: ["Compassionate and idealistic", "Artistic and creative", "Wise and philosophical", "Selfless servant"],
    challenges: ["Martyrdom", "Difficulty letting go", "Mood swings from world-pain"],
    element: "Fire", rulingPlanet: "Mars", color: "#B8553F",
    summary: "Number 9 is the energy of completion — the last single digit, containing all the others. You are here to serve humanity, to give what you have learned. Your compassion is your superpower; your lesson is to give without losing yourself.",
  },
  11: {
    number: 11, title: "The Illuminator (Master)", keywords: ["vision", "inspiration", "spiritual insight"],
    traits: ["Highly intuitive and visionary", "Inspirational presence", "Spiritual sensitivity", "Idealistic reformer"],
    challenges: ["Nervous tension and anxiety", "Self-doubt despite great gifts", "Feeling different from the world"],
    element: "Spirit", rulingPlanet: "Moon (Higher)", color: "#A0C4E8",
    summary: "Master Number 11 is the bridge between the human and the divine. You carry illumination — the ability to see and to inspire. Your nervous system is sensitive because it is attuned to higher frequencies. Channel this through art, teaching, or healing.",
  },
  22: {
    number: 22, title: "The Master Builder", keywords: ["manifestation", "vision-into-form", "legacy"],
    traits: ["Capable of large-scale manifestation", "Practical visionary", "Combines dream with discipline", "Legacy-maker"],
    challenges: ["Pressure to perform at high level", "Self-imposed standards", "Potential for burnout"],
    element: "Earth", rulingPlanet: "Rahu (Higher)", color: "#8FA37E",
    summary: "Master Number 22 is the master builder — the one who turns dreams into institutions, ideas into empires. You have the rare ability to combine spiritual vision with material execution. Your legacy will outlast you.",
  },
  33: {
    number: 33, title: "The Master Teacher", keywords: ["unconditional love", "healing", "upliftment"],
    traits: ["Selfless nurturer of humanity", "Healing presence", "Spiritual teacher", "Embodiment of compassion"],
    challenges: ["Extreme self-sacrifice", "Carrying the pain of others", "Few in number — high calling"],
    element: "Spirit", rulingPlanet: "Venus (Higher)", color: "#D4A0B8",
    summary: "Master Number 33 is the master teacher — the Christ-consciousness, the energy of unconditional love in human form. Few truly embody this number; those who do uplift entire communities through their very presence.",
  },
};

// ============================================================
// LUCKY DAYS / GEMS / NUMBERS
// ============================================================

const LUCKY_BY_NUMBER: Record<number, { days: string[]; colors: string[]; gems: string[]; numbers: number[] }> = {
  1: { days: ["Sunday", "Monday"], colors: ["Gold", "Yellow", "Bronze"], gems: ["Ruby", "Topaz", "Citrine"], numbers: [1, 4, 19] },
  2: { days: ["Monday", "Friday"], colors: ["White", "Silver", "Cream"], gems: ["Pearl", "Moonstone"], numbers: [2, 7, 11] },
  3: { days: ["Thursday", "Tuesday"], colors: ["Yellow", "Purple", "Lilac"], gems: ["Yellow Sapphire", "Amethyst"], numbers: [3, 5, 21] },
  4: { days: ["Saturday", "Sunday"], colors: ["Grey", "Khaki", "Earth tones"], gems: ["Hessonite Garnet"], numbers: [4, 8, 13] },
  5: { days: ["Wednesday", "Friday"], colors: ["Green", "Turquoise", "Silver"], gems: ["Emerald", "Aquamarine"], numbers: [5, 14, 23] },
  6: { days: ["Friday", "Monday"], colors: ["Rose", "Pink", "White"], gems: ["Diamond", "Clear Quartz"], numbers: [6, 15, 24] },
  7: { days: ["Monday", "Wednesday"], colors: ["Deep blue", "Indigo", "Violet"], gems: ["Blue Sapphire", "Lapis Lazuli"], numbers: [7, 16, 25] },
  8: { days: ["Saturday", "Wednesday"], colors: ["Black", "Dark blue", "Dark grey"], gems: ["Blue Sapphire", "Onyx"], numbers: [8, 17, 26] },
  9: { days: ["Tuesday", "Thursday"], colors: ["Red", "Crimson", "Maroon"], gems: ["Red Coral", "Garnet"], numbers: [9, 18, 27] },
  11: { days: ["Monday", "Thursday"], colors: ["Pearl white", "Silver", "Violet"], gems: ["Moonstone", "Selenite"], numbers: [11, 2, 29] },
  22: { days: ["Saturday", "Wednesday"], colors: ["Earth tones", "Olive", "Bronze"], gems: ["Tiger's Eye", "Smoky Quartz"], numbers: [22, 4, 31] },
  33: { days: ["Friday", "Sunday"], colors: ["Rose", "Gold", "White"], gems: ["Rose Quartz", "Rhodochrosite"], numbers: [33, 6, 24] },
};

// ============================================================
// PUBLIC: BUILD REPORT
// ============================================================

export function buildNumerologyReport(params: {
  name: string;
  birthDate: string; // YYYY-MM-DD
  system?: NumerologySystem;
}): NumerologyReport {
  const { name, birthDate } = params;
  const system = params.system || "pythagorean";

  const [yStr, mStr, dStr] = birthDate.split("-");
  const yyyy = parseInt(yStr, 10);
  const mm = parseInt(mStr, 10);
  const dd = parseInt(dStr, 10);

  if (!yyyy || !mm || !dd) {
    throw new Error("Invalid birth date. Use YYYY-MM-DD.");
  }

  const parts = splitName(name);

  const lifePath = reduceDate(yyyy, mm, dd);
  const destiny = reduceNumber(letterSum(parts.all, system));
  const soulUrge = reduceNumber(letterSum(parts.vowels, system));
  const personality = reduceNumber(letterSum(parts.consonants, system));
  const birthday = reduceNumber(dd);
  const maturity = reduceNumber(lifePath + destiny);

  // Personal Year: birth month + birth day + current year, reduced
  const now = new Date();
  const currentYear = now.getFullYear();
  const personalYear = reduceNumber(mm + dd + currentYear);
  const personalMonth = reduceNumber(personalYear + (now.getMonth() + 1));

  const meanings: Record<string, NumberMeaning> = {
    lifePath: NUMBER_MEANINGS[lifePath],
    destiny: NUMBER_MEANINGS[destiny],
    soulUrge: NUMBER_MEANINGS[soulUrge],
    personality: NUMBER_MEANINGS[personality],
    birthday: NUMBER_MEANINGS[birthday],
    maturity: NUMBER_MEANINGS[maturity],
    personalYear: NUMBER_MEANINGS[personalYear],
  };

  const lpLucky = LUCKY_BY_NUMBER[lifePath] || LUCKY_BY_NUMBER[1];

  const synthesis = buildSynthesis({
    name, lifePath, destiny, soulUrge, personality, maturity,
  });

  return {
    system,
    name,
    birthDate,
    numbers: {
      lifePath, destiny, soulUrge, personality, birthday, maturity,
      personalYear, personalMonth,
    },
    meanings,
    synthesis,
    lucky: lpLucky,
  };
}

function buildSynthesis(p: {
  name: string;
  lifePath: number;
  destiny: number;
  soulUrge: number;
  personality: number;
  maturity: number;
}): string {
  const lp = NUMBER_MEANINGS[p.lifePath];
  const dn = NUMBER_MEANINGS[p.destiny];
  const su = NUMBER_MEANINGS[p.soulUrge];
  const ps = NUMBER_MEANINGS[p.personality];

  return `Your core self (${p.name}) is shaped by the meeting of four sacred numbers.

Life Path ${p.lifePath} — ${lp.title} — is the road you walk. ${lp.summary}

Destiny ${p.destiny} — ${dn.title} — is what you are meant to accomplish in this lifetime. ${dn.summary}

Soul Urge ${p.soulUrge} — ${su.title} — is the secret longing of your heart, the dream that drives you from within. ${su.summary}

Personality ${p.personality} — ${ps.title} — is the mask you wear, the first impression others receive. ${ps.summary}

When these four numbers align, you are unstoppable. When they conflict, you are being asked to grow.`;
}
