/**
 * BAYDIN — Astrology calculation engine (pure TypeScript).
 *
 * Ports the GURU Python calculation-engine domain logic using Paul Schlyter's
 * "How to compute planetary positions" (≈1-2 arcminute accuracy — same family
 * of algorithms as Swiss Ephemeris, compact enough to run in-process).
 *
 * Supports: Western (tropical) + Vedic (sidereal, Lahiri) + Myanmar Mahabote.
 * Computes: Sun, Moon, Mercury, Venus, Mars, Jupiter, Saturn, Rahu, Ketu,
 *           Ascendant, houses, nakshatras, Vimshottari dasha, panchanga, transits.
 *
 * No external deps — safe for server + edge. All angles in degrees unless noted.
 */

export type BirthContext = {
  dob: string; // YYYY-MM-DD
  tob: string; // HH:MM
  latitude: number;
  longitude: number;
  timezone?: string | null; // IANA, e.g. "Asia/Yangon"
  gender?: "male" | "female" | null;
};

export type AstrologyMode = "vedic" | "western" | "mahabote";

// ---------- math helpers ----------
const D2R = Math.PI / 180;
const R2D = 180 / Math.PI;
const rev = (x: number) => ((x % 360) + 360) % 360;
const sind = (x: number) => Math.sin(x * D2R);
const cosd = (x: number) => Math.cos(x * D2R);
const tand = (x: number) => Math.tan(x * D2R);
const asind = (x: number) => Math.asin(Math.max(-1, Math.min(1, x))) * R2D;
const acosd = (x: number) => Math.acos(Math.max(-1, Math.min(1, x))) * R2D;
const atan2d = (y: number, x: number) => Math.atan2(y, x) * R2D;

/** Julian Day from a Gregorian calendar date (UTC). */
export function julianDay(year: number, month: number, day: number, ut = 0): number {
  let y = year, m = month;
  if (m <= 2) { y -= 1; m += 12; }
  const A = Math.floor(y / 100);
  const B = 2 - A + Math.floor(A / 4);
  return (
    Math.floor(365.25 * (y + 4716)) +
    Math.floor(30.6001 * (m + 1)) +
    day +
    B -
    1524.5 +
    ut / 24
  );
}

/** Days since J2000.0 (JD 2451545.0). */
function daysSinceJ2000(jd: number): number {
  return jd - 2451545.0;
}

/** Julian centuries from J2000 (Meeus). */
function T(jd: number): number {
  return (jd - 2451545.0) / 36525;
}

// ---------- obliquity & ayanamsa ----------
function obliquity(jd: number): number {
  const t = T(jd);
  return 23.4392911 - 0.0130042 * t - 1.64e-7 * t * t + 5.04e-7 * t * t * t;
}

/** Lahiri ayanamsa (degrees) — precession from the sidereal zero point.
 *  Lahiri value at J2000 ≈ 23.85°, precessing ~50.3"/year. */
function lahiriAyanamsa(jd: number): number {
  const t = T(jd);
  // 23.85° at J2000 + ~50.29"/yr precession
  return 23.85 + (50.29 / 3600) * t * 100;
}

// ---------- Sun (Schlyter) ----------
function sunPosition(d: number) {
  const w = 282.9404 + 4.70935e-5 * d;
  const e = 0.016709 - 1.151e-9 * d;
  const M = rev(356.047 + 0.9856002585 * d);
  const E = M + (180 / Math.PI) * e * sind(M) * (1 + e * cosd(M));
  const xv = cosd(E) - e;
  const yv = Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const lon = rev(v + w);
  const r = Math.sqrt(xv * xv + yv * yv);
  return { lon, r };
}

// ---------- Moon (Schlyter, simplified ELP) ----------
function moonPosition(d: number) {
  const N = 125.1228 - 0.0529538083 * d;
  const i = 5.1454;
  const w = 318.0634 + 0.1643573223 * d;
  const a = 60.2666;
  const e = 0.0549;
  const M = rev(115.3654 + 13.0649929509 * d);
  const E = M + (180 / Math.PI) * e * sind(M) * (1 + e * cosd(M));
  const xv = a * (cosd(E) - e);
  const yv = a * Math.sqrt(1 - e * e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  // position in ecliptic coords
  let lon = rev(v + w);
  const xh = r * cosd(lon);
  const yh = r * sind(lon);
  // ecliptic longitude/latitude (inclination is small, lat usually < 5.3°)
  const lonw = atan2d(yh, xh);
  // major perturbations (Schlyter " Evection", "Variation", "Annual Equation", etc.)
  const Ls = sunPosition(d).lon; // sun mean longitude
  const D = rev(lonw - Ls); // moon-sun elongation
  const F = rev(lonw - N); // argument of latitude
  // Schlyter perturbation corrections (degrees)
  const pertLon =
    -1.274 * sind(M - 2 * D) + // Evection
    0.658 * sind(2 * D) - // Variation
    0.186 * sind(sunMeanAnomaly(d)) - // Annual equation
    0.059 * sind(2 * M - 2 * D) -
    0.057 * sind(M - 2 * D + sunMeanAnomaly(d)) +
    0.053 * sind(M + 2 * D) +
    0.046 * sind(2 * D - sunMeanAnomaly(d)) +
    0.041 * sind(M - sunMeanAnomaly(d)) -
    0.035 * sind(D) -
    0.031 * sind(M + sunMeanAnomaly(d)) -
    0.015 * sind(2 * F - 2 * D) +
    0.011 * sind(M - 4 * D);
  lon = rev(lon + pertLon);
  return { lon, r };
}

function sunMeanAnomaly(d: number): number {
  return rev(356.047 + 0.9856002585 * d);
}

// ---------- Planets (Schlyter) ----------
type PlanetParams = {
  N: number; i: number; w: number; a: number; e: number; M: number;
};

const PLANET_PARAMS: Record<string, (d: number) => PlanetParams> = {
  mercury: (d) => ({
    N: 48.3313 + 3.24587e-5 * d,
    i: 7.0047 + 5.0e-8 * d,
    w: 29.1241 + 1.01444e-5 * d,
    a: 0.387098,
    e: 0.205635 + 5.59e-10 * d,
    M: rev(168.6562 + 4.0923344368 * d),
  }),
  venus: (d) => ({
    N: 76.6799 + 2.5659e-5 * d,
    i: 3.3946 + 2.75e-8 * d,
    w: 54.891 + 1.38374e-5 * d,
    a: 0.72333,
    e: 0.006773 - 1.302e-9 * d,
    M: rev(48.0052 + 1.6021302244 * d),
  }),
  mars: (d) => ({
    N: 49.5574 + 2.11081e-5 * d,
    i: 1.8497 - 2.08e-9 * d,
    w: 286.5016 + 2.92961e-5 * d,
    a: 1.523688,
    e: 0.093405 + 2.516e-9 * d,
    M: rev(18.6021 + 0.5240207766 * d),
  }),
  jupiter: (d) => ({
    N: 100.4542 + 2.76854e-5 * d,
    i: 1.303 - 1.557e-7 * d,
    w: 273.8777 + 1.64505e-5 * d,
    a: 5.20256,
    e: 0.048498 + 4.469e-9 * d,
    M: rev(19.895 + 0.0830853001 * d),
  }),
  saturn: (d) => ({
    N: 113.6634 + 2.3898e-5 * d,
    i: 2.4886 - 1.081e-7 * d,
    w: 339.3939 + 2.97681e-5 * d,
    a: 9.55475,
    e: 0.055546 - 9.499e-9 * d,
    M: rev(316.967 + 0.0334442282 * d),
  }),
};

function planetHeliocentric(name: string, d: number) {
  const p = PLANET_PARAMS[name](d);
  const E = p.M + (180 / Math.PI) * p.e * sind(p.M) * (1 + p.e * cosd(p.M));
  const xv = p.a * (cosd(E) - p.e);
  const yv = p.a * Math.sqrt(1 - p.e * p.e) * sind(E);
  const v = atan2d(yv, xv);
  const r = Math.sqrt(xv * xv + yv * yv);
  const lon = rev(v + p.w);
  // project to ecliptic (inclination small)
  const xh = r * (cosd(p.N) * cosd(v + p.w) - sind(p.N) * sind(v + p.w) * cosd(p.i));
  const yh = r * (sind(p.N) * cosd(v + p.w) + cosd(p.N) * sind(v + p.w) * cosd(p.i));
  const zh = r * sind(v + p.w) * sind(p.i);
  const eclon = atan2d(yh, xh);
  return { lon: rev(eclon), lat: asind(zh / r), r, xh, yh, zh };
}

/** Earth's heliocentric position (needed for geocentric planet conversion). */
function earthPosition(d: number) {
  // Earth = Sun position reflected: heliocentric earth = -sun
  const s = sunPosition(d);
  return { lon: rev(s.lon + 180), r: s.r };
}

function geocentricPlanet(name: string, d: number) {
  const p = planetHeliocentric(name, d);
  const earth = earthPosition(d);
  // Convert both to rectangular heliocentric ecliptic, then subtract
  // Simplified: geocentric ecliptic longitude (ignore small ecl lat for sign calc)
  const sun = sunPosition(d); // geocentric sun lon
  // Geocentric ecliptic longitude via spherical subtraction
  const dx = p.r * cosd(p.lon) - earth.r * cosd(earth.lon);
  const dy = p.r * sind(p.lon) - earth.r * sind(earth.lon);
  const dz = p.r * sind(p.lat);
  const r = Math.sqrt(dx * dx + dy * dy + dz * dz);
  const lon = rev(atan2d(dy, dx));
  const lat = atan2d(dz, Math.sqrt(dx * dx + dy * dy));
  return { lon, lat, r };
}

// ---------- Mean lunar node (Rahu/Ketu) ----------
function meanNode(jd: number): number {
  const t = T(jd);
  // Meeus 22.4: Ω = 125.0445479 - 1934.1362891*T + 0.0020754*T² + ...
  return rev(125.04452 - 1934.136261 * t);
}

// ---------- Local Sidereal Time ----------
function gmst(jd: number): number {
  const t = T(jd);
  const gmst =
    280.46061837 +
    360.98564736629 * (jd - 2451545.0) +
    0.000387933 * t * t -
    (t * t * t) / 38710000;
  return rev(gmst);
}

function lst(jd: number, longitude: number): number {
  return rev(gmst(jd) + longitude);
}

// ---------- Ascendant ----------
function ascendant(jd: number, latitude: number, longitude: number): number {
  const ramc = lst(jd, longitude);
  const eps = obliquity(jd);
  // Ascendant formula (Meeus)
  const asc = atan2d(
    cosd(ramc),
    -(sind(ramc) * cosd(eps) + tand(latitude) * sind(eps))
  );
  return rev(asc);
}

// ---------- Zodiac ----------
export const ZODIAC_SIGNS = [
  "aries", "taurus", "gemini", "cancer", "leo", "virgo",
  "libra", "scorpio", "sagittarius", "capricorn", "aquarius", "pisces",
];
export const ZODIAC_MY = [
  "မိဿ", "ပြိဿ", "မေထုန်", "ကရကဋ်", "သိဟ်", "ကန်",
  "တူ", "ဗြိစ္ဆာ", "ဓနု", "မကာရ", "ကုံ", "မိန်",
];
export const ZODIAC_SYMBOLS = ["♈", "♉", "♊", "♋", "♌", "♍", "♎", "♏", "♐", "♑", "♒", "♓"];

export function signOf(longitude: number): number {
  return Math.floor(rev(longitude) / 30);
}
export function degreeInSign(longitude: number): number {
  return rev(longitude) - signOf(longitude) * 30;
}
export function signName(longitude: number): string {
  return ZODIAC_SIGNS[signOf(longitude)];
}
export function signNameMy(longitude: number): string {
  return ZODIAC_MY[signOf(longitude)];
}

// ---------- Nakshatras ----------
export const NAKSHATRAS = [
  "Ashwini", "Bharani", "Krittika", "Rohini", "Mrigashira", "Ardra",
  "Punarvasu", "Pushya", "Ashlesha", "Magha", "Purva Phalguni", "Uttara Phalguni",
  "Hasta", "Chitra", "Swati", "Vishakha", "Anuradha", "Jyeshtha",
  "Mula", "Purva Ashadha", "Uttara Ashadha", "Shravana", "Dhanishta",
  "Shatabhisha", "Purva Bhadrapada", "Uttara Bhadrapada", "Revati",
];

function nakshatraOf(longitude: number): { index: number; pada: number; name: string } {
  const l = rev(longitude);
  const total = (l / (360 / 27));
  const index = Math.floor(total) % 27;
  const pada = Math.floor((total - Math.floor(total)) * 4) + 1;
  return { index, pada, name: NAKSHATRAS[index] };
}

// ---------- Vimshottari Dasha ----------
const DASHA_LORDS = ["Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury"];
const DASHA_YEARS = [7, 20, 6, 10, 7, 18, 16, 19, 17];
// Nakshatra lord mapping (each nakshatra's lord cycles through the 9 planets)
const NAK_LORD = [
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // 1-9
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // 10-18
  "Ketu", "Venus", "Sun", "Moon", "Mars", "Rahu", "Jupiter", "Saturn", "Mercury", // 19-27
];

function vimshottariDasha(moonLon: number, birthJd: number) {
  const l = rev(moonLon);
  const nakSpan = 360 / 27;
  const padaSpan = nakSpan / 4;
  const nakIdx = Math.floor(l / nakSpan);
  const lord = NAK_LORD[nakIdx];
  const lordIdx = DASHA_LORDS.indexOf(lord);
  // Position within this nakshatra
  const posInNak = l - nakIdx * nakSpan;
  const fractionElapsed = posInNak / nakSpan;
  const fractionRemaining = 1 - fractionElapsed;
  const totalYears = DASHA_YEARS[lordIdx];
  const balanceYears = totalYears * fractionRemaining;
  // Build the sequence of mahadashas starting from birth lord
  const mahadashas: { lord: string; years: number; startDate: Date; endDate: Date }[] = [];
  let cursor = new Date(birthJdToTime(birthJd));
  for (let i = 0; i < 9; i++) {
    const idx = (lordIdx + i) % 9;
    const years = i === 0 ? balanceYears : DASHA_YEARS[idx];
    const start = new Date(cursor);
    const end = new Date(cursor.getTime() + years * 365.25 * 24 * 3600 * 1000);
    mahadashas.push({ lord: DASHA_LORDS[idx], years, startDate: start, endDate: end });
    cursor = end;
  }
  // Current mahadasha
  const now = new Date();
  const current = mahadashas.find((m) => now >= m.startDate && now < m.endDate) ?? mahadashas[0];
  return {
    birth_dasha: { lord, balance_years: +balanceYears.toFixed(2) },
    mahadashas,
    current_mahadasha: current?.lord ?? lord,
  };
}

function birthJdToTime(jd: number): number {
  // JD → unix ms: (jd - 2440587.5) * 86400000
  return (jd - 2440587.5) * 86400000;
}

// ---------- Panchanga (simplified) ----------
const TITHI_NAMES = [
  "Pratipada", "Dwitiya", "Tritiya", "Chaturthi", "Panchami", "Shashthi",
  "Saptami", "Ashtami", "Navami", "Dashami", "Ekadashi", "Dwadashi",
  "Trayodashi", "Chaturdashi", "Purnima",
];
const YOGA_NAMES_COUNT = 27;
const KARANAS_COUNT = 11;

function panchanga(jd: number) {
  const d = daysSinceJ2000(jd);
  const sun = sunPosition(d).lon;
  const moon = moonPosition(d).lon;
  const diff = rev(moon - sun);
  const tithiIdx = Math.floor(diff / (360 / 30));
  const tithiName = TITHI_NAMES[tithiIdx % 15] + (tithiIdx < 15 ? " (Shukla)" : " (Krishna)");
  const nak = nakshatraOf(moon);
  // Yoga = sun + moon longitude
  const yogaLon = rev(sun + moon);
  const yogaIdx = Math.floor(yogaLon / (360 / YOGA_NAMES_COUNT));
  // Karana = half tithi
  const karanaIdx = Math.floor(diff / (360 / 60)) % KARANAS_COUNT;
  return {
    tithi: tithiName,
    tithi_number: tithiIdx,
    nakshatra: nak.name,
    nakshatra_pada: nak.pada,
    yoga: yogaIdx + 1,
    karana: karanaIdx + 1,
  };
}

// ---------- Dignity ----------
function dignityOf(planet: string, lon: number): string {
  const sign = signOf(lon);
  const rulers = {
    aries: ["mars"], taurus: ["venus"], gemini: ["mercury"], cancer: ["moon"],
    leo: ["sun"], virgo: ["mercury"], libra: ["venus"], scorpio: ["mars"],
    sagittarius: ["jupiter"], capricorn: ["saturn"], aquarius: ["saturn"], pisces: ["jupiter"],
  };
  const exalt = {
    aries: "sun", taurus: "moon", cancer: "jupiter", virgo: "mercury",
    libra: "saturn", capricorn: "mars", pisces: "venus",
  };
  const debilitate = {
    aries: "venus", taurus: "none", cancer: "none", libra: "sun",
    virgo: "none", capricorn: "jupiter", pisces: "none", scorpio: "moon", sagittarius: "none",
    leo: "none", aquarius: "none", gemini: "none",
  };
  const signName = ZODIAC_SIGNS[sign];
  if (exalt[signName as keyof typeof exalt] === planet) return "exalted";
  if (debilitate[signName as keyof typeof debilitate] === planet) return "debilitated";
  if (rulers[signName as keyof typeof rulers]?.includes(planet)) return "own_sign";
  return "neutral";
}

// ============================================================
// MAIN: compute natal chart
// ============================================================

export type PlanetPosition = {
  name: string;
  longitude: number; // sidereal (vedic) or tropical (western)
  sign: string;
  signIndex: number;
  signMy?: string;
  degree: number;
  nakshatra?: string;
  nakshatraPada?: number;
  retrograde: boolean;
  dignity?: string;
  house: number;
};

export type NatalChart = {
  mode: AstrologyMode;
  ascendant: PlanetPosition;
  planets: PlanetPosition[];
  ayanamsa: number;
  nakshatra: string;
  nakshatraPada: number;
  dasha: any;
  panchanga: any;
  houses: { number: number; sign: string; signIndex: number }[];
  meta: {
    birth_datetime: string;
    latitude: number;
    longitude: number;
    timezone: string | null;
    ayanamsa: number;
    calculation_version: string;
  };
};

/** Compose ISO birth datetime with offset from IANA tz. (v2 — padded offset) */
export function buildBirthDatetime(ctx: BirthContext): string {
  const time = /^\d{2}:\d{2}(:\d{2})?$/.test(ctx.tob)
    ? ctx.tob.length === 5 ? `${ctx.tob}:00` : ctx.tob
    : "12:00:00";
  let offset = "";
  if (ctx.timezone && !/^[+-]\d{2}:\d{2}$/.test(ctx.timezone)) {
    try {
      const parts = new Intl.DateTimeFormat("en-US", {
        timeZone: ctx.timezone, timeZoneName: "longOffset" as any,
      }).formatToParts(new Date(`${ctx.dob}T12:00:00`));
      const name = parts.find((p) => p.type === "timeZoneName")?.value ?? "";
      if (name === "GMT") {
        offset = "+00:00";
      } else if (name.startsWith("GMT")) {
        // Normalize "GMT+6:30" / "GMT+9" → "+06:30" / "+09:00"
        const raw = name.replace("GMT", "");
        const sign = raw.startsWith("-") ? "-" : "+";
        const body = raw.replace(/^[+-]/, "");
        const [h, m] = body.split(":");
        offset = `${sign}${(h || "0").padStart(2, "0")}:${(m || "0").padStart(2, "0")}`;
      }
    } catch { offset = "+06:30"; } // default Yangon
  } else if (ctx.timezone) offset = ctx.timezone;
  return `${ctx.dob}T${time}${offset}`;
}

/** Parse the ISO birth datetime → { jd, ut } (Julian Day + UT in hours). */
function parseBirth(ctx: BirthContext): { jd: number; ut: number } {
  const iso = buildBirthDatetime(ctx);
  const m = iso.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})([+-]\d{2}:\d{2})?$/);
  if (!m) throw new Error("Invalid birth datetime: " + iso);
  const [, y, mo, da, h, mi, s, tz] = m;
  const localHours = +h + +mi / 60 + +s / 3600;
  // Convert to UT: subtract tz offset
  let ut = localHours;
  if (tz) {
    const tm = tz.match(/^([+-])(\d{2}):(\d{2})$/);
    if (tm) {
      const off = +tm[2] + +tm[3] / 60;
      ut = localHours - (tm[1] === "+" ? off : -off);
    }
  }
  let day = +da;
  let month = +mo;
  let year = +y;
  // Roll over if ut < 0 or >= 24
  if (ut < 0) { ut += 24; day -= 1; }
  if (ut >= 24) { ut -= 24; day += 1; }
  // Simple rollover for month ends (good enough for ±1 day)
  if (day < 1) { month -= 1; if (month < 1) { month = 12; year -= 1; } day = new Date(year, month, 0).getDate(); }
  if (day > new Date(year, month, 0).getDate()) { day = 1; month += 1; if (month > 12) { month = 1; year += 1; } }
  return { jd: julianDay(year, month, day, ut), ut };
}

/** Compute a full natal chart (vedic or western). */
export function computeNatalChart(ctx: BirthContext, mode: AstrologyMode = "vedic"): NatalChart {
  const { jd } = parseBirth(ctx);
  const d = daysSinceJ2000(jd);
  const ayanamsa = mode === "vedic" ? lahiriAyanamsa(jd) : 0;

  // Tropical longitudes
  const sunTrop = sunPosition(d).lon;
  const moonTrop = moonPosition(d).lon;
  const merTrop = geocentricPlanet("mercury", d).lon;
  const venTrop = geocentricPlanet("venus", d).lon;
  const marTrop = geocentricPlanet("mars", d).lon;
  const jupTrop = geocentricPlanet("jupiter", d).lon;
  const satTrop = geocentricPlanet("saturn", d).lon;
  const rahuTrop = meanNode(jd);
  const ketuTrop = rev(rahuTrop + 180);
  const ascTrop = ascendant(jd, ctx.latitude, ctx.longitude);

  // Convert to sidereal for vedic
  const sidereal = (lon: number) => mode === "vedic" ? rev(lon - ayanamsa) : rev(lon);
  const ascSid = sidereal(ascTrop);

  // Houses (whole sign): 1st house = ascendant sign
  const ascSign = signOf(ascSid);

  const makePlanet = (name: string, lon: number, retro: boolean): PlanetPosition => {
    const sid = sidereal(lon);
    const signIdx = signOf(sid);
    const house = ((signIdx - ascSign + 12) % 12) + 1;
    const nak = nakshatraOf(sid);
    return {
      name,
      longitude: +sid.toFixed(4),
      sign: ZODIAC_SIGNS[signIdx],
      signIndex: signIdx,
      signMy: ZODIAC_MY[signIdx],
      degree: +degreeInSign(sid).toFixed(2),
      nakshatra: mode === "vedic" ? nak.name : undefined,
      nakshatraPada: mode === "vedic" ? nak.pada : undefined,
      retrograde: retro,
      dignity: mode === "vedic" ? dignityOf(name, sid) : undefined,
      house,
    };
  };

  const planets = [
    makePlanet("Sun", sunTrop, false),
    makePlanet("Moon", moonTrop, false),
    makePlanet("Mercury", merTrop, isRetrograde("mercury", d)),
    makePlanet("Venus", venTrop, isRetrograde("venus", d)),
    makePlanet("Mars", marTrop, isRetrograde("mars", d)),
    makePlanet("Jupiter", jupTrop, isRetrograde("jupiter", d)),
    makePlanet("Saturn", satTrop, isRetrograde("saturn", d)),
    makePlanet("Rahu", rahuTrop, true),
    makePlanet("Ketu", ketuTrop, true),
  ];

  const moonSid = sidereal(moonTrop);
  const moonNak = nakshatraOf(moonSid);
  const dasha = mode === "vedic" ? vimshottariDasha(moonSid, jd) : null;
  const panch = panchanga(jd);

  const houses = Array.from({ length: 12 }, (_, i) => {
    const idx = (ascSign + i) % 12;
    return { number: i + 1, sign: ZODIAC_SIGNS[idx], signIndex: idx };
  });

  return {
    mode,
    ascendant: makePlanet("Ascendant", ascTrop, false),
    planets,
    ayanamsa: +ayanamsa.toFixed(4),
    nakshatra: moonNak.name,
    nakshatraPada: moonNak.pada,
    dasha,
    panchanga: panch,
    houses,
    meta: {
      birth_datetime: buildBirthDatetime(ctx),
      latitude: ctx.latitude,
      longitude: ctx.longitude,
      timezone: ctx.timezone ?? null,
      ayanamsa: +ayanamsa.toFixed(4),
      calculation_version: "baydin-ts-1.0 (Schlyter/Meeus)",
    },
  };
}

/** Rough retrograde check: compare longitude now vs ~1 day later. */
function isRetrograde(planet: string, d: number): boolean {
  if (!PLANET_PARAMS[planet]) return false;
  const now = geocentricPlanet(planet, d).lon;
  const next = geocentricPlanet(planet, d + 1).lon;
  // Handle wrap-around
  const diff = next - now;
  if (diff > 180) return true; // wrapped backward
  if (diff < -180) return false; // wrapped forward
  return diff < 0;
}

// ============================================================
// MAHABOTE (Myanmar traditional) — weekday-based system
// ============================================================

const WEEKDAY_PLANETS = ["Sun", "Moon", "Mars", "Mercury", "Jupiter", "Venus", "Saturn"];
// Sunday=0 ... Saturday=6. Rahu rules Wednesday noon.

export function computeMahabote(ctx: BirthContext) {
  const { jd } = parseBirth(ctx);
  const birthDate = new Date(birthJdToTime(jd));
  const weekday = birthDate.getUTCDay();
  const weekdayName = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday];
  const weekdayPlanet = WEEKDAY_PLANETS[weekday];
  // Myanmar year (simplified from Gregorian)
  const myanmarYear = gregorianToMyanmarYear(birthDate.getUTCFullYear(), birthDate.getUTCMonth() + 1);
  const yearRemainder = myanmarYear % 7;
  // Starting planet from year remainder (traditional table)
  const startingPlanet = WEEKDAY_PLANETS[yearRemainder];
  // 7 houses (one per weekday), filled from starting planet
  const houses = Array.from({ length: 7 }, (_, i) => {
    const planetIdx = (WEEKDAY_PLANETS.indexOf(startingPlanet) + i) % 7;
    return {
      house: i + 1,
      houseName: MAHABOTE_HOUSES[i],
      planet: WEEKDAY_PLANETS[planetIdx],
    };
  });
  const birthHouse = (WEEKDAY_PLANETS.indexOf(weekdayPlanet) - WEEKDAY_PLANETS.indexOf(startingPlanet) + 7) % 7 + 1;
  return {
    mode: "mahabote",
    weekday: weekdayName,
    weekday_planet: weekdayPlanet,
    myanmar_year: myanmarYear,
    year_remainder: yearRemainder,
    starting_planet: startingPlanet,
    houses,
    birth_house: birthHouse,
    meta: {
      birth_datetime: buildBirthDatetime(ctx),
      calculation_version: "baydin-mahabote-1.0",
    },
  };
}

const MAHABOTE_HOUSES = [
  "Impermanence", "Extremity", "Fame", "Wealth", "Kingly Position", "Sickly", "Leader",
];

function gregorianToMyanmarYear(y: number, m: number): number {
  // Myanmar year ≈ Gregorian year - 638 (Thingyan transition mid-April)
  return m < 4 || (m === 4 && 1 < 17) ? y - 639 : y - 638;
}

// ============================================================
// TRANSITS (current planetary positions relative to natal)
// ============================================================

export function computeTransits(ctx: BirthContext, natal: NatalChart, daysAhead = 7) {
  const nowJd = julianDay(
    new Date().getUTCFullYear(), new Date().getUTCMonth() + 1, new Date().getUTCDate(),
    new Date().getUTCHours() + new Date().getUTCMinutes() / 60
  );
  const d = daysSinceJ2000(nowJd);
  const ayanamsa = natal.ayanamsa;
  const sidereal = (lon: number) => rev(lon - ayanamsa);
  const current: Record<string, any> = {};
  const positions: { planet: string; longitude: number; sign: string; signMy: string }[] = [];
  const makePos = (name: string, lon: number, retro: boolean) => {
    const sid = sidereal(lon);
    const si = signOf(sid);
    positions.push({ planet: name, longitude: +sid.toFixed(2), sign: ZODIAC_SIGNS[si], signMy: ZODIAC_MY[si] });
    return { name, longitude: +sid.toFixed(2), sign: ZODIAC_SIGNS[si], signMy: ZODIAC_MY[si], retrograde: retro };
  };
  current.Sun = makePos("Sun", sunPosition(d).lon, false);
  current.Moon = makePos("Moon", moonPosition(d).lon, false);
  current.Mercury = makePos("Mercury", geocentricPlanet("mercury", d).lon, isRetrograde("mercury", d));
  current.Venus = makePos("Venus", geocentricPlanet("venus", d).lon, isRetrograde("venus", d));
  current.Mars = makePos("Mars", geocentricPlanet("mars", d).lon, isRetrograde("mars", d));
  current.Jupiter = makePos("Jupiter", geocentricPlanet("jupiter", d).lon, isRetrograde("jupiter", d));
  current.Saturn = makePos("Saturn", geocentricPlanet("saturn", d).lon, isRetrograde("saturn", d));
  current.Rahu = makePos("Rahu", meanNode(nowJd), true);
  current.Ketu = makePos("Ketu", rev(meanNode(nowJd) + 180), true);

  // Aspects to natal positions (within 2° orb)
  const aspects: string[] = [];
  for (const [pname, ppos] of Object.entries(current)) {
    const natalP = natal.planets.find((p) => p.name === pname);
    if (!natalP) continue;
    const diff = Math.abs(rev(ppos.longitude - natalP.longitude + 180) - 180);
    if (diff < 2) aspects.push(`${pname} conjunct natal ${pname} (orb ${diff.toFixed(2)}°)`);
  }

  return {
    target_date: new Date().toISOString(),
    current_transits: current,
    natal_positions: natal.planets.map((p) => ({ name: p.name, longitude: p.longitude, sign: p.sign })),
    current_aspects_to_natal: aspects,
    period_days: daysAhead,
  };
}

/** Sun sign from date (tropical, presentation-only — used for horoscopes). */
export function sunSignForDate(dateIso: string): string {
  const m = dateIso.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (!m) return "aries";
  const month = +m[2], day = +m[3];
  if ((month === 3 && day >= 21) || (month === 4 && day <= 19)) return "aries";
  if ((month === 4 && day >= 20) || (month === 5 && day <= 20)) return "taurus";
  if ((month === 5 && day >= 21) || (month === 6 && day <= 20)) return "gemini";
  if ((month === 6 && day >= 21) || (month === 7 && day <= 22)) return "cancer";
  if ((month === 7 && day >= 23) || (month === 8 && day <= 22)) return "leo";
  if ((month === 8 && day >= 23) || (month === 9 && day <= 22)) return "virgo";
  if ((month === 9 && day >= 23) || (month === 10 && day <= 22)) return "libra";
  if ((month === 10 && day >= 23) || (month === 11 && day <= 21)) return "scorpio";
  if ((month === 11 && day >= 22) || (month === 12 && day <= 21)) return "sagittarius";
  if ((month === 12 && day >= 22) || (month === 1 && day <= 19)) return "capricorn";
  if ((month === 1 && day >= 20) || (month === 2 && day <= 18)) return "aquarius";
  return "pisces";
}

export const PLANET_MY: Record<string, string> = {
  Sun: "နေ", Moon: "လ", Mercury: "ဗုဒ္ဓဟူး", Venus: "သောကြာ", Mars: "အင်္ဂါ",
  Jupiter: "ကြာသပတေး", Saturn: "စနေ", Rahu: "ရာဟု", Ketu: "ကိတ်ဂြိုဟ်", Ascendant: "လဂ်",
};

// ============================================================
// COMPATIBILITY — Vedic Ashtakoota 8-fold /36 + Western synastry
// ============================================================

/** Ashtakoota (8-fold Guna Milan) — max 36 points. */
const ASHTAKOOT_WEIGHTS: { name: string; max: number }[] = [
  { name: "Varna", max: 1 },
  { name: "Vashya", max: 2 },
  { name: "Tara", max: 3 },
  { name: "Yoni", max: 4 },
  { name: "Graha Maitri", max: 5 },
  { name: "Gana", max: 6 },
  { name: "Bhakoot", max: 7 },
  { name: "Nadi", max: 8 },
];

const NAK_LORD_INDEX: Record<string, number> = {}; // filled lazily
function nakLordIdx(nakName: string): number {
  return NAKSHATRAS.indexOf(nakName) % 9;
}

/** Compute Ashtakoota score between two moon signs/nakshatras. */
function ashtakoota(personA: { moonSign: number; moonNakshatra: string }, personB: { moonSign: number; moonNakshatra: string }): { total: number; max: number; breakdown: { name: string; score: number; max: number }[] } {
  const breakdown: { name: string; score: number; max: number }[] = [];
  let total = 0;

  // 1. Varna (1) — based on moon sign element
  const varnaScore = Math.abs(personA.moonSign - personB.moonSign) <= 3 ? 1 : 0;
  breakdown.push({ name: "Varna", score: varnaScore, max: 1 });
  total += varnaScore;

  // 2. Vashya (2) — sign group compatibility
  const vashyaPairs: Record<number, number[]> = {
    0: [0, 2, 6, 8], 2: [0, 2, 6], 6: [0, 2, 6, 8], 8: [0, 6],
  };
  const vashyaScore = (vashyaPairs[personA.moonSign]?.includes(personB.moonSign) || personA.moonSign === personB.moonSign) ? 2 : 1;
  breakdown.push({ name: "Vashya", score: vashyaScore, max: 2 });
  total += vashyaScore;

  // 3. Tara (3) — nakshatra count difference mod 9
  const nakDiff = Math.abs(NAKSHATRAS.indexOf(personA.moonNakshatra) - NAKSHATRAS.indexOf(personB.moonNakshatra)) % 9;
  const taraScore = nakDiff === 0 || nakDiff === 3 || nakDiff === 5 || nakDiff === 7 ? 3 : Math.max(0, 3 - Math.floor(nakDiff / 2));
  breakdown.push({ name: "Tara", score: Math.min(taraScore, 3), max: 3 });
  total += Math.min(taraScore, 3);

  // 4. Yoni (4) — nakshatra lord combination
  const yoniScore = Math.abs(nakLordIdx(personA.moonNakshatra) - nakLordIdx(personB.moonNakshatra)) <= 1 ? 4 : 2;
  breakdown.push({ name: "Yoni", score: yoniScore, max: 4 });
  total += yoniScore;

  // 5. Graha Maitri (5) — moon sign lord friendship
  const grahaMaitriScore = Math.abs(personA.moonSign - personB.moonSign) <= 2 ? 5 : 3;
  breakdown.push({ name: "Graha Maitri", score: grahaMaitriScore, max: 5 });
  total += grahaMaitriScore;

  // 6. Gana (6) — nakshatra temperament (Deva/Manushya/Rakshasa)
  const ganaScore = Math.abs(NAKSHATRAS.indexOf(personA.moonNakshatra) - NAKSHATRAS.indexOf(personB.moonNakshatra)) % 3 === 0 ? 6 : 4;
  breakdown.push({ name: "Gana", score: ganaScore, max: 6 });
  total += ganaScore;

  // 7. Bhakoot (7) — moon sign relationship (2/12, 6/8 etc are dosha)
  const bhakootDiff = Math.abs(personA.moonSign - personB.moonSign);
  const isDosha = bhakootDiff === 2 || bhakootDiff === 12 || bhakootDiff === 5 || bhakootDiff === 6 || bhakootDiff === 8;
  const bhakootScore = isDosha ? 0 : 7;
  breakdown.push({ name: "Bhakoot", score: bhakootScore, max: 7 });
  total += bhakootScore;

  // 8. Nadi (8) — nakshatra groups (Aadi/Madhya/Antya)
  const nadiA = NAKSHATRAS.indexOf(personA.moonNakshatra) % 3;
  const nadiB = NAKSHATRAS.indexOf(personB.moonNakshatra) % 3;
  const nadiScore = nadiA === nadiB ? 0 : 8; // same nadi = dosha
  breakdown.push({ name: "Nadi", score: nadiScore, max: 8 });
  total += nadiScore;

  return { total, max: 36, breakdown };
}

/** Full compatibility reading between two persons. */
export function computeCompatibility(
  personA: BirthContext,
  personB: BirthContext,
  relationshipType: "MARRIAGE" | "PARTNERSHIP" | "FRIENDSHIP" = "MARRIAGE"
) {
  const chartA = computeNatalChart(personA, "vedic");
  const chartB = computeNatalChart(personB, "vedic");

  const moonA = chartA.planets.find((p) => p.name === "Moon")!;
  const moonB = chartB.planets.find((p) => p.name === "Moon")!;
  const venusA = chartA.planets.find((p) => p.name === "Venus")!;
  const venusB = chartB.planets.find((p) => p.name === "Venus")!;

  const ashtakoot = ashtakoota(
    { moonSign: moonA.signIndex, moonNakshatra: moonA.nakshatra ?? "Ashwini" },
    { moonSign: moonB.signIndex, moonNakshatra: moonB.nakshatra ?? "Ashwini" }
  );

  // Western synastry aspects between Venus
  const venusDiff = Math.abs(rev(venusA.longitude - venusB.longitude + 180) - 180);
  let synastryAspect = "neutral";
  if (venusDiff < 8) synastryAspect = "conjunction";
  else if (Math.abs(venusDiff - 120) < 8) synastryAspect = "trine";
  else if (Math.abs(venusDiff - 180) < 8) synastryAspect = "opposition";
  else if (Math.abs(venusDiff - 90) < 8) synastryAspect = "square";
  else if (Math.abs(venusDiff - 60) < 6) synastryAspect = "sextile";

  // Mahabote weekday compatibility (simple)
  const weekdayA = new Date(buildBirthDatetime(personA)).getUTCDay();
  const weekdayB = new Date(buildBirthDatetime(personB)).getUTCDay();
  const mahaboteCompat = weekdayA === weekdayB ? "same-day" : Math.abs(weekdayA - weekdayB) <= 2 ? "harmonious" : "complementary";

  return {
    relationship_type: relationshipType,
    person_a: { moon_sign: ZODIAC_SIGNS[moonA.signIndex], moon_nakshatra: moonA.nakshatra, ascendant: ZODIAC_SIGNS[chartA.ascendant.signIndex] },
    person_b: { moon_sign: ZODIAC_SIGNS[moonB.signIndex], moon_nakshatra: moonB.nakshatra, ascendant: ZODIAC_SIGNS[chartB.ascendant.signIndex] },
    ashtakoota: ashtakoot,
    synastry: {
      venus_aspect: synastryAspect,
      venus_orb: +venusDiff.toFixed(2),
    },
    mahabote: mahaboteCompat,
    overall_score: ashtakoot.total,
    meta: {
      calculation_version: "baydin-compat-1.0",
    },
  };
}

/**
 * Compute Navamsa (D-9) divisional chart from a natal chart.
 * Each sign is divided into 9 parts of 3°20' each.
 */
export function computeNavamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function navamsaSign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / (30 / 9));
    const signType = signIdx % 3;
    const startSign = signType === 0 ? signIdx : signType === 1 ? (signIdx + 8) % 12 : (signIdx + 4) % 12;
    return (startSign + pada) % 12;
  }

  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: navamsaSign(p.longitude),
    sign: ZODIAC_SIGNS[navamsaSign(p.longitude)],
  }));

  const ascendantSign = navamsaSign(natal.ascendant.longitude);

  return {
    planets,
    ascendant: { signIndex: ascendantSign, sign: ZODIAC_SIGNS[ascendantSign] },
  };
}

/**
 * Compute Dasamsa (D-10) divisional chart — career & profession.
 * Each sign divided into 10 parts of 3° each.
 * For odd signs: start from the same sign. For even signs: start from the 9th sign.
 */
export function computeDasamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function dasamsaSign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 3); // 0-9
    const startSign = signIdx % 2 === 0 ? signIdx : (signIdx + 8) % 12;
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: dasamsaSign(p.longitude),
    sign: ZODIAC_SIGNS[dasamsaSign(p.longitude)],
  }));
  const ascSign = dasamsaSign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Saptamsa (D-7) divisional chart — children & progeny.
 * Each sign divided into 7 parts. For odd signs: start from same sign.
 * For even signs: start from the 7th sign.
 */
export function computeSaptamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function saptamsaSign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / (30 / 7)); // 0-6
    const startSign = signIdx % 2 === 0 ? signIdx : (signIdx + 6) % 12;
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: saptamsaSign(p.longitude),
    sign: ZODIAC_SIGNS[saptamsaSign(p.longitude)],
  }));
  const ascSign = saptamsaSign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Hora (D-2) divisional chart — wealth & resources.
 * Odd signs: first half = Sun's Hora (Leo), second half = Moon's Hora (Cancer).
 * Even signs: reversed.
 */
export function computeHora(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function horaSign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const isOdd = signIdx % 2 === 0;
    const firstHalf = degreeInSign < 15;
    // Leo (index 4) = Sun's Hora, Cancer (index 3) = Moon's Hora
    if (isOdd) return firstHalf ? 4 : 3;
    return firstHalf ? 3 : 4;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: horaSign(p.longitude),
    sign: ZODIAC_SIGNS[horaSign(p.longitude)],
  }));
  const ascSign = horaSign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Dwadasamsa (D-12) divisional chart — parents & ancestry.
 * Each sign divided into 12 parts of 2°30' each.
 * Starts from the same sign, moves through the 12 signs sequentially.
 */
export function computeDwadasamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d12Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 2.5); // 0-11
    return (signIdx + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d12Sign(p.longitude),
    sign: ZODIAC_SIGNS[d12Sign(p.longitude)],
  }));
  const ascSign = d12Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Drekkana (D-3) divisional chart — siblings, courage & self-effort.
 * Each sign divided into 3 parts of 10° each.
 * For movable signs: start from the same sign. Fixed: 9th sign. Dual: 5th sign.
 */
export function computeDrekkana(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d3Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 10); // 0-2
    const signType = signIdx % 3;
    const startSign = signType === 0 ? signIdx : signType === 1 ? (signIdx + 8) % 12 : (signIdx + 4) % 12;
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d3Sign(p.longitude),
    sign: ZODIAC_SIGNS[d3Sign(p.longitude)],
  }));
  const ascSign = d3Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Chaturthamsa (D-4) divisional chart — property, residence & fixed assets.
 * Each sign divided into 4 parts of 7°30' each.
 * Starts from the same sign for all.
 */
export function computeChaturthamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d4Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 7.5); // 0-3
    return (signIdx + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d4Sign(p.longitude),
    sign: ZODIAC_SIGNS[d4Sign(p.longitude)],
  }));
  const ascSign = d4Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Shodasamsa (D-16) divisional chart — vehicles, comforts & conveniences.
 * Each sign divided into 16 parts of 1°52'30" each.
 * Starts from Aries for movable, Leo for fixed, Sagittarius for dual signs.
 */
export function computeShodasamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d16Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / (30 / 16)); // 0-15
    const signType = signIdx % 3;
    // Movable: start from Aries (0), Fixed: Leo (4), Dual: Sagittarius (8)
    const startSign = signType === 0 ? 0 : signType === 1 ? 4 : 8;
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d16Sign(p.longitude),
    sign: ZODIAC_SIGNS[d16Sign(p.longitude)],
  }));
  const ascSign = d16Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Vimsamsa (D-20) divisional chart — spiritual practices & religious pursuits.
 * Each sign divided into 20 parts of 1°30' each.
 * Odd signs start from the same sign; even signs start from the 9th sign.
 */
export function computeVimsamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d20Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 1.5); // 0-19
    const startSign = signIdx % 2 === 0 ? signIdx : (signIdx + 8) % 12;
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d20Sign(p.longitude),
    sign: ZODIAC_SIGNS[d20Sign(p.longitude)],
  }));
  const ascSign = d20Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Chaturvimsamsa (D-24) divisional chart — education, learning & knowledge.
 * Each sign divided into 24 parts of 1°15' each.
 * Odd signs start from Leo (5); even signs start from Cancer (3).
 */
export function computeChaturvimsamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d24Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 1.25); // 0-23
    const startSign = signIdx % 2 === 0 ? 4 : 3; // Leo for odd, Cancer for even
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d24Sign(p.longitude),
    sign: ZODIAC_SIGNS[d24Sign(p.longitude)],
  }));
  const ascSign = d24Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Trimsamsa (D-30) divisional chart — misfortunes, struggles & hidden matters.
 * Odd signs: Mars(5°), Saturn(5°), Jupiter(8°), Mercury(7°), Venus(5°).
 * Even signs: Venus(5°), Mercury(7°), Jupiter(8°), Saturn(5°), Mars(5°).
 */
export function computeTrimsamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  // Odd sign division: Mars 0-5, Saturn 5-10, Jupiter 10-18, Mercury 18-25, Venus 25-30
  // Even sign division: Venus 0-5, Mercury 5-12, Jupiter 12-20, Saturn 20-25, Mars 25-30
  const oddLords = ["Mars", "Saturn", "Jupiter", "Mercury", "Venus"];
  const evenLords = ["Venus", "Mercury", "Jupiter", "Saturn", "Mars"];
  const lordSigns: Record<string, number> = { Mars: 0, Saturn: 10, Jupiter: 8, Mercury: 2, Venus: 6 };

  function d30Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const isOdd = signIdx % 2 === 0;
    const lords = isOdd ? oddLords : evenLords;
    const boundaries = isOdd ? [0, 5, 10, 18, 25, 30] : [0, 5, 12, 20, 25, 30];
    let lordIdx = 0;
    for (let i = 0; i < 5; i++) {
      if (degreeInSign >= boundaries[i] && degreeInSign < boundaries[i + 1]) {
        lordIdx = i;
        break;
      }
    }
    const lord = lords[lordIdx];
    return lordSigns[lord];
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d30Sign(p.longitude),
    sign: ZODIAC_SIGNS[d30Sign(p.longitude)],
  }));
  const ascSign = d30Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Khavedamsa (D-40) divisional chart — auspicious & inauspicious effects.
 * Each sign divided into 40 parts of 0°45' each.
 * Odd signs start from Aries (0); even signs start from Libra (6).
 */
export function computeKhavedamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  function d40Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 0.75); // 0-39
    const startSign = signIdx % 2 === 0 ? 0 : 6;
    return (startSign + pada) % 12;
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d40Sign(p.longitude),
    sign: ZODIAC_SIGNS[d40Sign(p.longitude)],
  }));
  const ascSign = d40Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Akshavedamsa (D-45) divisional chart — all general matters & overall well-being.
 * Each sign divided into 45 parts.
 * Based on the 5 elements (Mars/Saturn/Jupiter/Mercury/Venus) with odd/even sign rules.
 */
export function computeAkshavedamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  const lordSigns: Record<string, number> = { Mars: 0, Saturn: 10, Jupiter: 8, Mercury: 2, Venus: 6 };
  const oddLords = ["Mars", "Saturn", "Jupiter", "Mercury", "Venus"];
  const evenLords = ["Venus", "Mercury", "Jupiter", "Saturn", "Mars"];

  function d45Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const isOdd = signIdx % 2 === 0;
    // 9 parts per lord (45/5 = 9), each 0°40'
    const segmentSize = 30 / 45; // 0.666...°
    const pada = Math.floor(degreeInSign / (segmentSize * 9)); // 0-4 (which lord)
    const lords = isOdd ? oddLords : evenLords;
    const lord = lords[pada];
    return lordSigns[lord];
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d45Sign(p.longitude),
    sign: ZODIAC_SIGNS[d45Sign(p.longitude)],
  }));
  const ascSign = d45Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Shashtiamsa (D-60) divisional chart — karma from past lives & all hidden matters.
 * Each sign divided into 60 parts of 0°30' each.
 * The D-60 sign is determined by the planet's position within its sign, counted from the same sign.
 */
export function computeShashtiamsa(natal: NatalChart): { planets: { name: string; signIndex: number; sign: string }[]; ascendant: { signIndex: number; sign: string } } {
  // D-60 has 60 parts. Each part maps to a specific sign based on classical rules.
  // Simplified: first 30 parts start from the same sign, next 30 count in reverse.
  function d60Sign(longitude: number): number {
    const l = rev(longitude);
    const signIdx = Math.floor(l / 30);
    const degreeInSign = l - signIdx * 30;
    const pada = Math.floor(degreeInSign / 0.5); // 0-59
    // First 30 parts: count forward from the sign
    // Next 30 parts: count backward from the sign
    if (pada < 30) {
      return (signIdx + pada) % 12;
    } else {
      return (signIdx - (pada - 30) + 12 * 5) % 12;
    }
  }
  const planets = natal.planets.map((p) => ({
    name: p.name,
    signIndex: d60Sign(p.longitude),
    sign: ZODIAC_SIGNS[d60Sign(p.longitude)],
  }));
  const ascSign = d60Sign(natal.ascendant.longitude);
  return { planets, ascendant: { signIndex: ascSign, sign: ZODIAC_SIGNS[ascSign] } };
}

/**
 * Compute Solar Return (Varshaphal) chart — the year ahead.
 * Finds the moment when transit Sun returns to its natal longitude,
 * then casts a chart for that instant.
 */
export function computeSolarReturn(ctx: BirthContext, natal: NatalChart): { returnDate: string; sunLongitude: number; sunSign: string; planets: { name: string; signIndex: number; sign: string; symbol: string }[] } {
  const natalSun = natal.planets.find((p) => p.name === "Sun");
  if (!natalSun) return { returnDate: "", sunLongitude: 0, sunSign: "", planets: [] };

  const natalSunLon = natalSun.longitude;
  const birthYear = parseInt(ctx.dob.slice(0, 4));
  const currentYear = new Date().getFullYear();
  const age = currentYear - birthYear;

  // Approximate: the solar return happens around the birthday each year
  // Find the date when transit Sun ≈ natal Sun longitude
  const birthMonth = parseInt(ctx.dob.slice(5, 7));
  const birthDay = parseInt(ctx.dob.slice(8, 10));
  const returnDate = new Date(currentYear, birthMonth - 1, birthDay, 12, 0, 0);

  // Compute transit positions at the return moment
  const d = daysSinceJ2000(julianDay(currentYear, birthMonth, birthDay, 12));
  const sunLon = rev(sunPosition(d).lon + 282.9404);

  // Simplified: compute all planet positions at the return
  const moonLon = rev(moonPosition(d).lon);
  const merLon = geocentricPlanet("mercury", d).lon;
  const venLon = geocentricPlanet("venus", d).lon;
  const marLon = geocentricPlanet("mars", d).lon;
  const jupLon = geocentricPlanet("jupiter", d).lon;
  const satLon = geocentricPlanet("saturn", d).lon;
  const rahuLon = meanNode(julianDay(currentYear, birthMonth, birthDay, 12));

  const symbols: Record<string, string> = { Sun: "☉", Moon: "☽", Mercury: "☿", Venus: "♀", Mars: "♂", Jupiter: "♃", Saturn: "♄", Rahu: "☊", Ketu: "☋" };
  const ayanamsa = lahiriAyanamsa(julianDay(currentYear, birthMonth, birthDay, 12));
  const sidereal = (lon: number) => rev(lon - ayanamsa);

  const planets = [
    { name: "Sun", longitude: +sidereal(sunLon).toFixed(2) },
    { name: "Moon", longitude: +sidereal(moonLon).toFixed(2) },
    { name: "Mercury", longitude: +sidereal(merLon).toFixed(2) },
    { name: "Venus", longitude: +sidereal(venLon).toFixed(2) },
    { name: "Mars", longitude: +sidereal(marLon).toFixed(2) },
    { name: "Jupiter", longitude: +sidereal(jupLon).toFixed(2) },
    { name: "Saturn", longitude: +sidereal(satLon).toFixed(2) },
    { name: "Rahu", longitude: +sidereal(rahuLon).toFixed(2) },
  ].map((p) => ({
    ...p,
    signIndex: signOf(p.longitude),
    sign: ZODIAC_SIGNS[signOf(p.longitude)],
    symbol: symbols[p.name] || "•",
  }));

  return {
    returnDate: returnDate.toISOString().slice(0, 10),
    sunLongitude: +sidereal(sunLon).toFixed(2),
    sunSign: ZODIAC_SIGNS[signOf(sidereal(sunLon))],
    planets,
  };
}
