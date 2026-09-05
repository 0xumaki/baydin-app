import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, NAKSHATRAS, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/namkaran — returns Vedic Namkaran (naming) suggestions based on
 * the user's birth nakshatra pada. Each nakshatra pada has starting letters.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ namkaran: null });
  if (!user.birthData) return NextResponse.json({ namkaran: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ namkaran: null });
  }

  // Nakshatra pada → starting letters (classical Vedic Namkaran rules)
  const NAK_LETTERS: Record<string, string[]> = {
    "Ashwini": ["Chu", "Che", "Cho", "La"],
    "Bharani": ["Li", "Lu", "Le", "Lo"],
    "Krittika": ["A", "I", "U", "E"],
    "Rohini": ["O", "Va", "Vi", "Vu"],
    "Mrigashira": ["Ve", "Vo", "Ka", "Ki"],
    "Ardra": ["Ku", "Gha", "Ng", "Chha"],
    "Punarvasu": ["Ke", "Ko", "Ha", "Hi"],
    "Pushya": ["Hu", "He", "Ho", "Da"],
    "Ashlesha": ["Di", "Du", "De", "Do"],
    "Magha": ["Ma", "Mi", "Mu", "Me"],
    "Purva Phalguni": ["Mo", "Ta", "Ti", "Tu"],
    "Uttara Phalguni": ["Te", "To", "Pa", "Pi"],
    "Hasta": ["Pu", "Sha", "Na", "De"],
    "Chitra": ["Pe", "Po", "Ra", "Ri"],
    "Swati": ["Ru", "Re", "Ro", "Ta"],
    "Vishakha": ["Ti", "Tu", "Te", "To"],
    "Anuradha": ["Na", "Ni", "Nu", "Ne"],
    "Jyeshtha": ["No", "Ya", "Yi", "Yu"],
    "Mula": ["Ye", "Yo", "Bha", "Bhi"],
    "Purva Ashadha": ["Bhu", "Dha", "Pha", "Dha"],
    "Uttara Ashadha": ["Bhe", "Bho", "Ja", "Ji"],
    "Shravana": ["Ju", "Je", "Jo", "Gha"],
    "Dhanishta": ["Ga", "Gi", "Gu", "Ge"],
    "Shatabhisha": ["Go", "Sa", "Si", "Su"],
    "Purva Bhadrapada": ["Se", "So", "Da", "Di"],
    "Uttara Bhadrapada": ["Du", "Tha", "Jha", "Da"],
    "Revati": ["De", "Do", "Cha", "Chi"],
  };

  // Sample name suggestions for common starting letters
  const SAMPLE_NAMES: Record<string, string[]> = {
    "Chu": ["Chandra", "Chunni", "Chudamani"], "Che": ["Chetan", "Cherry", "Chetak"],
    "A": ["Aarav", "Ananya", "Aryan"], "I": ["Ishaan", "Ira", "Indu"],
    "Ma": ["Maya", "Manav", "Mahesh"], "Mi": ["Mira", "Mithun", "Minal"],
    "Ra": ["Rahul", "Radha", "Ravi"], "Ri": ["Ritu", "Rishi", "Riva"],
    "Ke": ["Keshav", "Ketaki", "Keerti"], "Na": ["Naveen", "Nandini", "Nakul"],
    "Su": ["Surya", "Sunita", "Sudhir"], "Sa": ["Saanvi", "Sahil", "Sara"],
    "Vi": ["Vikram", "Vidya", "Vivaan"], "Du": ["Durga", "Dwij", "Dulaal"],
    "Ja": ["Jaya", "Jagdish", "Jatin"], "Bha": ["Bharat", "Bhavna", "Bhasma"],
  };

  const moonNak = chart.nakshatra;
  const pada = chart.nakshatraPada;
  const nakName = moonNak;

  const letters = NAK_LETTERS[nakName] || ["A", "B", "C", "D"];
  const padaLetter = letters[pada - 1] || letters[0];
  const sampleNames = SAMPLE_NAMES[padaLetter] || [`${padaLetter}a`, `${padaLetter}i`, `${padaLetter}u`];

  return NextResponse.json({
    namkaran: {
      nakshatra: nakName,
      pada,
      startingLetters: letters,
      padaLetter,
      sampleNames,
      moonSign: ZODIAC_SIGNS[chart.planets.find((p: any) => p.name === "Moon")?.signIndex ?? 0],
    },
  });
}
