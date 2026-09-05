import { NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { computeNatalChart, type BirthContext, ZODIAC_SIGNS } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/yogas — detects classical Vedic yogas (planetary combinations) in the natal chart. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ yogas: null });
  if (!user.birthData) return NextResponse.json({ yogas: null });

  const birthData = parseBirthData(user.birthData); if (!birthData) return NextResponse.json({ error: "Birth data required" }, { status: 400 });
  let chart: any;
  try {
    chart = computeNatalChart(birthData, "vedic");
  } catch {
    return NextResponse.json({ yogas: null });
  }

  const planets = chart.planets;
  const asc = chart.ascendant;
  const get = (name: string) => planets.find((p: any) => p.name === name);

  const signLords = ["Mars", "Venus", "Mercury", "Moon", "Sun", "Mercury", "Venus", "Mars", "Jupiter", "Saturn", "Saturn", "Jupiter"];

  const detected: { name: string; desc: string; planets: string; effect: string; strength: "strong" | "moderate" | "weak" }[] = [];

  // Gaja Kesari Yoga — Jupiter in kendra (1,4,7,10) from Moon
  const moon = get("Moon");
  const jupiter = get("Jupiter");
  if (moon && jupiter) {
    const housesFromMoon = ((jupiter.signIndex - moon.signIndex + 12) % 12) + 1;
    if ([1, 4, 7, 10].includes(housesFromMoon)) {
      detected.push({
        name: "Gaja Kesari Yoga",
        desc: "Jupiter in a kendra (angular house) from the Moon",
        planets: `Moon in ${ZODIAC_SIGNS[moon.signIndex]}, Jupiter in ${ZODIAC_SIGNS[jupiter.signIndex]} (${housesFromMoon}th from Moon)`,
        effect: "Intelligence, fame, respect, and a strong moral character",
        strength: jupiter.dignity === "exalted" || jupiter.dignity === "own_sign" ? "strong" : "moderate",
      });
    }
  }

  // Raja Yoga — lords of kendra (1,4,7,10) and trikona (1,5,9) houses conjoined
  const kendraHouses = [1, 4, 7, 10];
  const trikonaHouses = [1, 5, 9];
  const allHouses = [...kendraHouses, ...trikonaHouses];
  const ascSign = asc.signIndex;
  const houseSigns = allHouses.map((h) => (ascSign + h - 1) % 12);
  const houseLords = houseSigns.map((s) => signLords[s]);

  // Check for conjunctions between kendra and trikona lords
  const kendraLords = [1, 4, 7, 10].map((h) => signLords[(ascSign + h - 1) % 12]);
  const trikonaLordsArr = [1, 5, 9].map((h) => signLords[(ascSign + h - 1) % 12]);

  for (const kl of [...new Set(kendraLords)]) {
    for (const tl of [...new Set(trikonaLordsArr)]) {
      if (kl === tl) continue; // same planet
      const kp = get(kl);
      const tp = get(tl);
      if (kp && tp && kp.signIndex === tp.signIndex) {
        detected.push({
          name: "Raja Yoga",
          desc: `Lord of a kendra (${kl}) conjoined with lord of a trikona (${tl})`,
          planets: `${kl} (${ZODIAC_SIGNS[kp.signIndex]}) + ${tl} (${ZODIAC_SIGNS[tp.signIndex]})`,
          effect: "Power, authority, success, and prosperity in life",
          strength: "strong",
        });
        break;
      }
    }
  }

  // Dhana Yoga — lords of 2nd, 5th, 9th, 11th houses conjoined or aspecting
  const dhanaHouses = [2, 5, 9, 11];
  const dhanaLords = [...new Set(dhanaHouses.map((h) => signLords[(ascSign + h - 1) % 12]))];

  for (let i = 0; i < dhanaLords.length; i++) {
    for (let j = i + 1; j < dhanaLords.length; j++) {
      const p1 = get(dhanaLords[i]);
      const p2 = get(dhanaLords[j]);
      if (p1 && p2 && p1.signIndex === p2.signIndex) {
        detected.push({
          name: "Dhana Yoga",
          desc: `Lords of wealth houses (2nd, 5th, 9th, 11th) conjoined: ${dhanaLords[i]} + ${dhanaLords[j]}`,
          planets: `${dhanaLords[i]} + ${dhanaLords[j]} in ${ZODIAC_SIGNS[p1.signIndex]}`,
          effect: "Wealth, financial prosperity, and material abundance",
          strength: "moderate",
        });
        break;
      }
    }
  }

  // Chandra-Mangala Yoga — Moon and Mars in the same sign
  const mars = get("Mars");
  if (moon && mars && moon.signIndex === mars.signIndex) {
    detected.push({
      name: "Chandra-Mangala Yoga",
      desc: "Moon and Mars conjoined in the same sign",
      planets: `Moon + Mars in ${ZODIAC_SIGNS[moon.signIndex]}`,
      effect: "Wealth through enterprise, drive, and emotional intensity",
      strength: "moderate",
    });
  }

  // Budha-Aditya Yoga — Sun and Mercury in the same sign
  const sun = get("Sun");
  const mercury = get("Mercury");
  if (sun && mercury && sun.signIndex === mercury.signIndex) {
    detected.push({
      name: "Budha-Aditya Yoga",
      desc: "Sun and Mercury conjoined in the same sign",
      planets: `Sun + Mercury in ${ZODIAC_SIGNS[sun.signIndex]}`,
      effect: "Intelligence, wisdom, communication skills, and intellectual success",
      strength: "strong",
    });
  }

  // Neecha Bhanga Raja Yoga — debilitated planet whose lord cancels debilitation
  for (const p of planets) {
    if (p.dignity === "debilitated") {
      // Check if the lord of the debilitation sign is in a kendra from the Moon or Ascendant
      const debSignLord = signLords[p.signIndex];
      const lord = get(debSignLord);
      if (lord) {
        const fromAsc = ((lord.signIndex - ascSign + 12) % 12) + 1;
        const fromMoon = moon ? ((lord.signIndex - moon.signIndex + 12) % 12) + 1 : 0;
        if ([1, 4, 7, 10].includes(fromAsc) || [1, 4, 7, 10].includes(fromMoon)) {
          detected.push({
            name: "Neecha Bhanga Raja Yoga",
            desc: `${p.name} is debilitated but cancellation occurs via ${debSignLord} in a kendra`,
            planets: `${p.name} debilitated in ${ZODIAC_SIGNS[p.signIndex]}, ${debSignLord} in kendra`,
            effect: "Initial difficulties that transform into great success and power",
            strength: "moderate",
          });
        }
      }
    }
  }

  // Kemadruma Yoga — no planets in 2nd or 12th from Moon (on either side)
  if (moon) {
    const next2 = planets.filter((p: any) => {
      const diff = (p.signIndex - moon.signIndex + 12) % 12;
      return diff === 1 || diff === 11;
    });
    if (next2.length === 0) {
      detected.push({
        name: "Kemadruma Yoga",
        desc: "No planets in the 2nd or 12th house from the Moon",
        planets: `Moon in ${ZODIAC_SIGNS[moon.signIndex]} with no flanking planets`,
        effect: "Prone to struggle and solitude; can be cancelled by benefic aspects",
        strength: "weak",
      });
    }
  }

  return NextResponse.json({
    yogas: {
      count: detected.length,
      detected,
      ascendant: ZODIAC_SIGNS[ascSign],
    },
  });
}

// Helper functions (avoiding naming collision)
function trionaHouses(arr: number[]) { return arr; }
function trionalLords(arr: string[]) { return arr; }
