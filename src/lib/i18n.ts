/**
 * BAYDIN — UI internationalization.
 *
 * The app's LLM-generated content (chat, tarot, horoscopes) is already
 * produced in the user's preferred language. This module provides UI
 * string translations for the chrome — navigation, buttons, common
 * phrases — so the interface itself reads natively.
 *
 * Supported languages: English (en), Myanmar (my), Thai (th), Khmer (kh), Lao (lo).
 * Falls back to English for missing keys.
 *
 * Usage in a client component:
 *   const t = useT();
 *   <button>{t("sign_in")}</button>
 *
 * The hook reads the user's language from useMe() and looks up strings.
 * Server components should pass language explicitly to translate().
 */

export type Language = "en" | "my" | "th" | "kh" | "lo";

export const SUPPORTED_LANGUAGES: { id: Language; name: string; nativeName: string; flag: string }[] = [
  { id: "en", name: "English", nativeName: "English", flag: "🇬🇧" },
  { id: "my", name: "Myanmar", nativeName: "မြန်မာ", flag: "🇲🇲" },
  { id: "th", name: "Thai", nativeName: "ไทย", flag: "🇹🇭" },
  { id: "kh", name: "Khmer", nativeName: "ខ្មែរ", flag: "🇰🇭" },
  { id: "lo", name: "Lao", nativeName: "ລາວ", flag: "🇱🇦" },
];

// Dictionary of UI strings. Keys are stable identifiers.
// Each key maps to { en, my, th, kh, lo } — missing translations fall back to en.
type Dict = Record<string, Partial<Record<Language, string>>>;

const DICT: Dict = {
  // Nav groups
  nav_daily: { en: "Daily", my: "နေ့စဉ်", th: "ประจำวัน", kh: "ប្រចាំថ្ងៃ", lo: "ປະຈໍາວັນ" },
  nav_practice: { en: "Practice", my: "ကျင့်စဉ်", th: "การปฏิบัติ", kh: "ការអនុវត្ត", lo: "ການປະຕິບັດ" },
  nav_astrology: { en: "Astrology", my: "ဗေဒင်", th: "โหราศาสตร์", kh: "តារាសាស្ត្រ", lo: "ໂຫລາສາດ" },
  nav_account: { en: "Account", my: "အကောင့်", th: "บัญชี", kh: "គណនី", lo: "ບັນຊີ" },

  // Nav items
  nav_today: { en: "Today", my: "ယနေ့", th: "วันนี้", kh: "ថ្ងៃនេះ", lo: "ມື້ນີ້" },
  nav_astrologer: { en: "Astrologer", my: "ဗေဒင်ဆရာ", th: "หมอดู", kh: "ហោរាសាស្ត្រ", lo: "ໝໍໂຫລາສາດ" },
  nav_tarot: { en: "Tarot", my: "တာရော့", th: "ทาโรต์", kh: "តារោ", lo: "ຕາໂຣ" },
  nav_tarot_history: { en: "Tarot History", my: "တာရော့မှတ်တမ်း", th: "ประวัติทาโรต์", kh: "ប្រវត្តិតារោ", lo: "ປະຫວັດຕາໂຣ" },
  nav_horoscope: { en: "Horoscope", my: "ဟောစာတမ်း", th: "ดวงชะตา", kh: "រាសី", lo: "ຮານາຈັກ" },
  nav_lunar_calendar: { en: "Lunar Calendar", my: "လပြက္ခဒိန်", th: "ปฏิทินจันทรคติ", kh: "ប្រតិទិនច័ន្ទគតិ", lo: "ປະຕິທິນຈັນທຣ໌" },
  nav_dream_journal: { en: "Dream Journal", my: "အိပ်မက်မှတ်တမ်း", th: "บันทึกความฝัน", kh: "កំណត់ហេតុភ្លើង", lo: "ບັນທຶກຄວາມຝັນ" },
  nav_manifest: { en: "Manifest", my: "ဆုတောင်း", th: "การอธิษฐาน", kh: "ការអធិស្ឋាន", lo: "ການອະທິຖານ" },
  nav_ritual: { en: "Ritual", my: "ပူဇော်ပွဲ", th: "พิธีกรรม", kh: "ពិធី", lo: "ພິທີ" },
  nav_frequencies: { en: "Frequencies", my: "ကြိမ်နှုန်း", th: "ความถี่", kh: "ប្រេកង់", lo: "ຄວາມຖີ່" },
  nav_breath: { en: "Breath", my: "အသက်ရှူ", th: "ลมหายใจ", kh: "ដង្ហើម", lo: "ລົມຫາຍໃຈ" },
  nav_positivity: { en: "Positivity", my: "အပြုသဘော", th: "ความเชิงบวก", kh: "ភាពវិជ្ជមាន", lo: "ຄວາມເປັນບວກ" },
  nav_birth_chart: { en: "Birth Chart", my: "ွင်းချက်", th: "แผนผังกำเนิด", kh: "ផ្ទាំងកំណើត", lo: "ແຜນຜັງການເກີດ" },
  nav_numerology: { en: "Numerology", my: "အရေအတွက်ဗေဒင်", th: "เลขศาสตร์", kh: "លេខសាស្ត្រ", lo: "ເລກສາດ" },
  nav_insights: { en: "Insights", my: "အသိပေး", th: "ข้อเสนอแนะ", kh: "ការយល់ដឹង", lo: "ຄວາມເຂົ້າໃຈ" },
  nav_compatibility: { en: "Compatibility", my: "ကိုက်ညီမှု", th: "ความเข้ากัน", kh: "ភាពឆបគ្នា", lo: "ຄວາມເຂົ້າກັນ" },
  nav_life_report: { en: "Life Report", my: "ဘဝအစီရင်ချက်", th: "รายงานชีวิต", kh: "របាយការណ៍ជីវិត", lo: "ບົດລາຍງານຊີວິດ" },
  nav_earn_luck: { en: "Earn Luck", my: "Luck ရယူ", th: "รับ Luck", kh: "ទទួល Luck", lo: "ຮັບ Luck" },
  nav_profile: { en: "Profile & Stats", my: "ပရိုဖိုင်", th: "โปรไฟล์", kh: "ប្រវត្តិរូប", lo: "ໂປຣໄຟລ໌" },
  nav_analytics: { en: "Insights Dashboard", my: "အသိပေးဒိုင်", th: "แดชบอร์ด", kh: "ផ្ទាំងគ្រប់គ្រង", lo: "ແດສບອດ" },
  nav_reseller: { en: "Reseller", my: "ပြန်ရောင်း", th: "ตัวแทนจำหน่าย", kh: "អ្នកលក់បន្ត", lo: "ຜູ້ຂາຍຕໍ່" },
  nav_admin: { en: "Admin", my: "စီမံခန့်ခွဲ", th: "ผู้ดูแล", kh: "អ្នកគ្រប់គ្រង", lo: "ຜູ້ບໍລິຫານ" },

  // Common actions
  sign_in: { en: "Sign in", my: "ဝင်ရောက်", th: "เข้าสู่ระบบ", kh: "ចូល", lo: "ເຂົ້າສູ່ລະບົບ" },
  sign_out: { en: "Sign out", my: "ထွက်ရောက်", th: "ออกจากระบบ", kh: "ចាកចេញ", lo: "ອອກຈາກລະບົບ" },
  begin: { en: "Begin", my: "စတင်", th: "เริ่ม", kh: "ចាប់ផ្តើម", lo: "ເລີ່ມ" },
  cancel: { en: "Cancel", my: "မလုပ်တော့", th: "ยกเลิก", kh: "បោះបង់", lo: "ຍົກເລີກ" },
  save: { en: "Save", my: "သိမ်း", th: "บันทึก", kh: "រក្សាទុក", lo: "ບັນທຶກ" },
  delete: { en: "Delete", my: "ဖျက်", th: "ลบ", kh: "លុប", lo: "ລຶບ" },
  close: { en: "Close", my: "ပိတ်", th: "ปิด", kh: "បិទ", lo: "ປິດ" },
  back: { en: "Back", my: "နောက်သို့", th: "กลับ", kh: "ត្រឡប់", lo: "ກັບຄືນ" },
  continue: { en: "Continue", my: "ဆက်", th: "ดำเนินการต่อ", kh: "បន្ត", lo: "ສືບຕໍ່" },
  loading: { en: "Loading…", my: "ခဏစောင့်…", th: "กำลังโหลด…", kh: "កំពុងផ្ទុក…", lo: "ກຳລັງໂຫລດ…" },

  // Auth modal
  auth_create_account: { en: "Create account", my: "အကောင့်ဖန်တီး", th: "สร้างบัญชี", kh: "បង្កើតគណនី", lo: "ສ້າງບັນຊີ" },
  auth_demo_admin: { en: "Continue as demo admin", my: "ဒီမိုအက်မင်းအဖြစ်ဆက်", th: "ดำเนินการต่อในฐานะเดโมแอดมิน", kh: "បន្តជាអ្នកគ្រប់គ្រងសាកល្បង", lo: "ສືບຕໍ່ເປັນແອດມິນທົດລອງ" },
  auth_email: { en: "Email", my: "အီးမေးလ်", th: "อีเมล", kh: "អ៊ីមែល", lo: "ອີເມວ" },
  auth_password: { en: "Password", my: "စကားဝှက်", th: "รหัสผ่าน", kh: "ពាក្យសម្ងាត់", lo: "ລະຫັດຜ່ານ" },
  auth_name: { en: "Name (optional)", my: "အမည် (ရွေးချယ်)", th: "ชื่อ (ไม่บังคับ)", kh: "ឈ្មោះ (មិនบាល)", lo: "ຊື່ (ເລືອກໄດ້)" },
  auth_referral: { en: "Referral code (optional)", my: "ရည်ညွှန်းကုတ် (ရွေးချယ်)", th: "รหัสแนะนำ (ไม่บังคับ)", kh: "កូដយោង (មិនบាល)", lo: "ລະຫັດແນະນຳ (ເລືອກໄດ້)" },

  // Today / hero
  hero_read_sky: { en: "Read the sky like a page.", my: "ကောင်းကင်ကိုစာမျက်နှာသဖွယ်ဖတ်ပါ။", th: "อ่านท้องฟ้าเหมือนหน้าหนังสือ", kh: "អានមេឃដូចជាទំព័រមួយ", lo: "ອ່ານຟ້າຄືໜ້າໜັງສື" },
  hero_pillar_today: { en: "Today's sky", my: "ယနေ့ကောင်းကင်", th: "ท้องฟ้าวันนี้", kh: "មេ疙ថ្ងៃនេះ", lo: "ຟ້າມື້ນີ້" },
  hero_pillar_card: { en: "Draw a card", my: "ကတ်ဆွဲ", th: "จั่วไพ่", kh: "ចាប់ប័ណ្ណ", lo: "ຈັບໄພ່" },
  hero_pillar_practice: { en: "Keep a practice", my: "ကျင့်စဉ်ထိန်း", th: "รักษาการปฏิบัติ", kh: "រក្សាការអនុវត្ត", lo: "ຮັກສາການປະຕິບັດ" },

  // Luck
  luck_balance: { en: "Luck", my: "Luck", th: "Luck", kh: "Luck", lo: "Luck" },
  luck_earn: { en: "Earn Luck", my: "Luck ရယူ", th: "รับ Luck", kh: "ទទួល Luck", lo: "ຮັບ Luck" },
  luck_what_buys: { en: "What Luck buys", my: "Luck ဖြင့်ဝယ်ရသမျှ", th: "Luck ซื้ออะไรได้", kh: "Luck ទិញអ្វីបាន", lo: "Luck ຊື້ຫຍັງໄດ້" },
  luck_ways_to_earn: { en: "Ways to earn", my: "ရယူနည်းလမ်းများ", th: "วิธีรับ", kh: "វិធីទទួល", lo: "ວິທີຮັບ" },
  luck_packs: { en: "Luck packs", my: "Luck ပါကင်", th: "แพ็ค Luck", kh: "កញ្ចប់ Luck", lo: "ແພັກ Luck" },

  // Common UI phrases
  new_consultation: { en: "New consultation", my: "ဆွေးနွေးမှုအသစ်", th: "การปรึกษาใหม่", kh: "ការប្រឹក្សាថ្មី", lo: "ການປຶກສາໃໝ່" },
  record_dream: { en: "Record dream", my: "အိပ်မက်မှတ်", th: "บันทึกความฝัน", kh: "កត់ត្រាភ្លើង", lo: "ບັນທຶກຄວາມຝັນ" },
  claim_daily: { en: "Claim daily Luck", my: "နေ့စဉ် Luck ရယူ", th: "รับ Luck ประจำวัน", kh: "ទទួល Luck ប្រចាំថ្ងៃ", lo: "ຮັບ Luck ປະຈໍາວັນ" },
  settings: { en: "Settings", my: "ဆက်တင်", th: "การตั้งค่า", kh: "ការកំណត់", lo: "ການຕັ້ງຄ່າ" },
};

/** Translate a key for a given language. Falls back to English. */
export function translate(key: string, lang: Language = "en"): string {
  const entry = DICT[key];
  if (!entry) return key;
  return entry[lang] ?? entry.en ?? key;
}

/** Get all available translation keys (for debugging / completeness checks). */
export function getTranslationKeys(): string[] {
  return Object.keys(DICT);
}
