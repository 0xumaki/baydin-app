import "server-only";
import type { Language } from "@/lib/i18n";

/**
 * BAYDIN — Native Language Configuration
 *
 * Each language has its own voice, address forms, script purity rules,
 * and cultural terminology. The LLM system prompt is enhanced with
 * language-specific instructions so the output sounds natural and native,
 * not translated from English.
 *
 * Key principle: the LLM should sound like a local astrologer speaking
 * in their native tongue — not like a translation. This means:
 * - Myanmar: use သား/သမီး address, pure Burmese script, Vedic terminology in Burmese
 * - Thai: use polite particles (ครับ/ค่ะ), natural Thai astrological vocabulary
 * - Khmer: use បង/ប្អូន address, Khmer script purity
 * - Lao: use ອ້າຍ/ນ້ອງ address, Lao script purity
 * - English: warm, professional, no translation artifacts
 */

export type LanguageConfig = {
  code: Language;
  name: string;
  nativeName: string;
  /** How the astrologer addresses the client (male/female/unknown) */
  address: {
    male: string;
    female: string;
    unknown: string;
  };
  /** Script purity rules — what characters are forbidden */
  scriptRules: string;
  /** Native astrological terminology (zodiac signs, planets, key terms) */
  terminology: Record<string, string>;
  /** Cultural voice instructions — tone, formality, dialect notes */
  voiceInstructions: string;
  /** Polite particles or sentence-final markers */
  politeMarkers?: {
    male: string;
    female: string;
  };
};

export const LANGUAGE_CONFIGS: Record<Language, LanguageConfig> = {
  my: {
    code: "my",
    name: "Myanmar",
    nativeName: "မြန်မာ",
    address: {
      male: "သား",
      female: "သမီး",
      unknown: "သား/သမီး",
    },
    scriptRules: `Output MUST be 100% pure Myanmar (Burmese) script. Never mix Thai, Khmer, Sinhala, Cyrillic, Devanagari or CJK characters. CRITICAL: Do NOT mix languages mid-sentence. If writing in Myanmar, the ENTIRE response must be in Myanmar — no English words mixed in. Astrological terms must be in Burmese: dasha = ဝိံသုတ္တရီဒသာ, nakshatra = နက္ခတ်, yoga = ယောဂ.`,
    terminology: {
      zodiac: "ရာသီခွင်",
      planets: { sun: "နေ", moon: "လ", mars: "အင်္ဂါ", mercury: "ဗုဒ္ဓဟူး", jupiter: "ကြာသပတေး", venus: "သောကြာ", saturn: "စနေ", rahu: "ရာဟု", ketu: "ကိတ်ဂြိုဟ်" },
      signs: ["မိဿ", "ပြိဿ", "မေထုန်", "ကရကट", "သိဟ်", "ကန်", "တူ", "ဗြိစ္ဆာ", "ဓနု", "မကာရ", "ကုံ", "မိန်"],
      dasha: "ဝိံသုတ္တရီဒသာ",
      nakshatra: "နက္ခတ်",
      yoga: "ယောဂ",
      ascendant: "လဂ်",
      exalted: "ဥစ်",
      debilitated: "နီစ်",
      own_sign: "သွခေတ္တ",
      remedy: "ယတြာချေ",
      house: "ဘဝ",
    },
    voiceInstructions: `Sound like a traditional Myanmar astrologer (ဗေဒင်ဆရာ) speaking naturally in Burmese. CRITICAL RULES for natural Burmese:
- သား means "son" (used affectionately by an elder to address a younger male). သမီး means "daughter" (used affectionately for a younger female). Use ONLY ONE form consistently — never switch mid-conversation.
- Do NOT start every sentence with "သား" or "သမီး". Use it sparingly — at natural pause points or sentence ends, like a real elder would. Maybe 2-3 times in a full reading, not every sentence.
- Write flowing, natural Burmese prose in paragraphs — not bullet points or lists. A real astrologer speaks in flowing narrative.
- Use Burmese Buddhist cultural references naturally (ဥပမာ - ကံ၊ ကံ၏ အကျိုးပေး).
- NEVER use မိတ်ဆွေ, ညီ, အစ်ကို, ခင်ဗျား or ရှင် as forms of address.
- Use colloquial Burmese that feels warm and human, not stiff or formal like a textbook.
- If you must reference English astrological terms, write them in Burmese script first, then optionally in parentheses.`,
  },
  en: {
    code: "en",
    name: "English",
    nativeName: "English",
    address: {
      male: "",
      female: "",
      unknown: "",
    },
    scriptRules: `Output in clear, natural English. No translation artifacts. Use the client's name if provided, otherwise no address form needed.`,
    terminology: {
      zodiac: "zodiac sign",
      dasha: "Vimshottari dasha",
      nakshatra: "nakshatra",
      yoga: "yoga",
      ascendant: "ascendant",
      exalted: "exalted",
      debilitated: "debilitated",
      own_sign: "own sign",
      remedy: "remedy",
      house: "house",
    },
    voiceInstructions: `Sound like a warm, professional astrologer — not a fortune teller, not a therapist. Speak naturally as if in a real consultation. Use the client's name if known. Be direct but compassionate. Avoid generic horoscope language; be specific to their chart.`,
  },
  th: {
    code: "th",
    name: "Thai",
    nativeName: "ไทย",
    address: {
      male: "ครับ",
      female: "ค่ะ",
      unknown: "ครับ/ค่ะ",
    },
    scriptRules: `Output MUST be in Thai script (อักษรไทย). Do not mix Lao or Khmer characters. English astrological terms can be transliterated into Thai (เช่น ราศี, ดาว, นักษัตร).`,
    terminology: {
      zodiac: "ราศี",
      planets: { sun: "ดวงอาทิตย์", moon: "ดวงจันทร์", mars: "ดาวอังคาร", mercury: "ดาวพุธ", jupiter: "ดาวพฤหัสบดี", venus: "ดาวศุกร์", saturn: "ดาวเสาร์", rahu: "ราหู", ketu: "เกตุ" },
      signs: ["เมษ", "พฤษภ", "เมถุน", "กรกฎ", "สิงห์", "กันย์", "ตุลย์", "พิจิก", "ธนู", "มังกร", "กุมภ์", "มีน"],
      dasha: "ทศา",
      nakshatra: "นักษัตร",
      yoga: "โยค",
      ascendant: "ลัคน์",
      exalted: "อุจ",
      debilitated: "นิจ",
      own_sign: "ศุภะ",
      remedy: "การแก้เคล็ด",
      house: "ภพ",
    },
    voiceInstructions: `Sound like a traditional Thai astrologer (หมอดู) — warm, polite, respectful. Use ครับ (if male speaker) or ค่ะ (if female speaker) as polite particles at the end of sentences. Use Thai cultural references naturally (กรรม, บุญ, เวร). Speak as a respected elder would — with warmth, wisdom, and gentle authority. Use Thai numerals for lucky numbers when appropriate (๑, ๒, ๓, ๔, ๕, ๖, ๗, ๘, ๙).`,
    politeMarkers: {
      male: "ครับ",
      female: "ค่ะ",
    },
  },
  kh: {
    code: "kh",
    name: "Khmer",
    nativeName: "ខ្មែរ",
    address: {
      male: "បង",
      female: "ប្អូន",
      unknown: "បង/ប្អូន",
    },
    scriptRules: `Output MUST be in Khmer script (អក្សរខ្មែរ). Do not mix Thai or Lao characters. Astrological terms should use Khmer terminology where available.`,
    terminology: {
      zodiac: "រាសី",
      planets: { sun: "ព្រះអាទិត្យ", moon: "ព្រះច័ន្ទ", mars: "អង្គារ", mercury: "ពុធ", jupiter: "ព្រហស្បតិ៍", venus: "សុក្រ", saturn: "សៅរ៍", rahu: "រាហូ", ketu: "កេតុ" },
      signs: ["មេស", "វិច្ឆិកា", "មិថុន", "ករកិ", "សីហ", "កន្យា", "តុល", "ពិច្ឆិកា", "ធនូ", "មករ", "កុម្ភ", "មីន"],
      dasha: "តាសា",
      nakshatra: "នក្ខត្រ",
      yoga: "យោគ",
      ascendant: "លគ្ន៍",
      exalted: "ឧច្ឆ",
      debilitated: "និច្ឆ",
      own_sign: "សុភៈ",
      remedy: "ការប្រោសប្រណី",
      house: "ភព",
    },
    voiceInstructions: `Sound like a traditional Khmer astrologer (ហោរាសាស្ត្រ) — warm, respectful, grounded in Cambodian Buddhist culture. Address the client naturally using បង or ប្អូន. Use Khmer cultural references (កម្ម, បុណ្យ, វេរា). Speak with the warmth of a respected village elder.`,
  },
  lo: {
    code: "lo",
    name: "Lao",
    nativeName: "ລາວ",
    address: {
      male: "ອ້າຍ",
      female: "ນ້ອງ",
      unknown: "ອ້າຍ/ນ້ອງ",
    },
    scriptRules: `Output MUST be in Lao script (ອັກສອນລາວ). Do not mix Thai or Khmer characters. Astrological terms should use Lao terminology where available.`,
    terminology: {
      zodiac: "ລາສີ",
      planets: { sun: "ດວງຕາເວັນ", moon: "ດວງຈັນ", mars: "ດາວອັງຄານ", mercury: "ດາວພຸດ", jupiter: "ດາວພະຫັດ", venus: "ດາວສຸກ", saturn: "ດາວເສົາ", rahu: "ຣາຮູ", ketu: "ເກດຸ" },
      signs: ["ເມດ", "ພະລຶກ", "ມິຖຸນ", "ກະລາດ", "ສິງຫ໌", "ກັນຍາ", "ຕຸນ", "ພິຈິກ", "ທະນູ", "ມັງກອນ", "ກຸມ", "ມີນ"],
      dasha: "ທາສາ",
      nakshatra: "ນັກສັດ",
      yoga: "ໂຍຄ",
      ascendant: "ລັກນ໌",
      exalted: "ອຸດ",
      debilitated: "ນິຈ",
      own_sign: "ສຸພະ",
      remedy: "ການແກ້ໄຂ",
      house: "ພົບ",
    },
    voiceInstructions: `Sound like a traditional Lao astrologer (ໝໍໂຫລາສາດ) — warm, gentle, respectful. Address the client as ອ້າຍ or ນ້ອງ. Use Lao Buddhist cultural references (ການ, ບຸນ, ເວນ). Speak with the gentle authority of a respected elder in the community.`,
  },
};

/** Get the address form for a given language + gender */
export function getAddress(lang: Language, gender?: "male" | "female" | null): string {
  const config = LANGUAGE_CONFIGS[lang] || LANGUAGE_CONFIGS.en;
  if (gender === "male") return config.address.male;
  if (gender === "female") return config.address.female;
  return config.address.unknown;
}

/** Build language-specific LLM instructions */
export function buildLanguageInstructions(lang: Language, gender?: "male" | "female" | null): string {
  const config = LANGUAGE_CONFIGS[lang] || LANGUAGE_CONFIGS.en;
  const address = getAddress(lang, gender);

  let instructions = `\n\n## Language: ${config.nativeName} (${lang})\n`;
  instructions += `Write ENTIRELY in ${config.nativeName}. This is non-negotiable.\n`;
  instructions += `${config.scriptRules}\n`;

  if (address) {
    instructions += `\nAddress the client as ${address}. Keep this consistent for the entire session.\n`;
  }

  instructions += `\n${config.voiceInstructions}\n`;

  // Add terminology guide
  const terms = config.terminology;
  if (terms.signs) {
    instructions += `\nZodiac signs (use these native terms): ${terms.signs.join(", ")}.\n`;
  }
  if (terms.planets) {
    const planets = terms.planets as Record<string, string>;
    instructions += `Planets: ${Object.entries(planets).map(([k, v]) => `${v} (${k})`).join(", ")}.\n`;
  }
  instructions += `Key terms: ${terms.zodiac} (zodiac), ${terms.dasha} (dasha), ${terms.nakshatra} (nakshatra), ${terms.yoga} (yoga), ${terms.ascendant} (ascendant), ${terms.exalted} (exalted), ${terms.debilitated} (debilitated), ${terms.remedy} (remedy), ${terms.house} (house).\n`;

  if (config.politeMarkers) {
    const marker = gender === "male" ? config.politeMarkers.male : gender === "female" ? config.politeMarkers.female : config.politeMarkers.male;
    instructions += `\nUse ${marker} as a polite sentence-ending particle, placed naturally at the end of sentences — not after every clause.\n`;
  }

  return instructions;
}
