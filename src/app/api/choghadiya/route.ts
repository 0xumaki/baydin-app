import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/choghadiya — returns today's Choghadiya (auspicious/inauspicious periods).
 * Each day is divided into day Choghadiya (sunrise to sunset, ~8 periods) and
 * night Choghadiya (sunset to next sunrise, ~8 periods).
 * Each period is ruled by one of 7 types: Amrit, Shubh, Labh, Char, Rog, Udveg, Kaal.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ choghadiya: null });

  const now = new Date();
  const weekday = now.getDay();

  // Simplified sunrise/sunset
  const sunrise = new Date(now); sunrise.setHours(6, 0, 0, 0);
  const sunset = new Date(now); sunset.setHours(18, 0, 0, 0);

  const dayDuration = (sunset.getTime() - sunrise.getTime()) / 8; // 8 periods
  const nightDuration = dayDuration; // simplified: equal

  // Choghadiya types
  const TYPES = {
    Amrit: { nature: "auspicious", effect: "Most auspicious — excellent for all activities", color: "#B5CD7E", icon: "✦" },
    Shubh: { nature: "auspicious", effect: "Auspicious — favorable for new beginnings", color: "#B5CD7E", icon: "✓" },
    Labh: { nature: "auspicious", effect: "Beneficial — good for business and trade", color: "#C5A87C", icon: "📈" },
    Char: { nature: "auspicious", effect: "Moving — favorable for travel and movement", color: "#C5A87C", icon: "→" },
    Rog: { nature: "inauspicious", effect: "Illness — avoid health-related activities", color: "#b5463a", icon: "✕" },
    Udveg: { nature: "inauspicious", effect: "Anxiety — avoid important decisions", color: "#b5463a", icon: "⚠" },
    Kaal: { nature: "inauspicious", effect: "Death — avoid all auspicious activities", color: "#b5463a", icon: "✕" },
  };

  // Day Choghadiya order by weekday (starting from sunrise)
  const DAY_ORDER = [
    ["Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh", "Amrit"], // Sunday
    ["Udveg", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char", "Labh"], // Monday
    ["Rog", "Udveg", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"], // Tuesday
    ["Shubh", "Rog", "Udveg", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"], // Wednesday
    ["Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg", "Char"], // Thursday
    ["Labh", "Char", "Labh", "Amrit", "Kaal", "Shubh", "Rog", "Udveg"], // Friday
    ["Kaal", "Shubh", "Rog", "Udveg", "Amrit", "Kaal", "Shubh", "Rog"], // Saturday
  ];

  // Night Choghadiya is reverse of day
  const nightOrder = [...DAY_ORDER[weekday]].reverse();

  function fmtTime(date: Date): string {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  function buildPeriods(order: string[], start: Date, duration: number, isDay: boolean) {
    return order.map((typeName, i) => {
      const periodStart = new Date(start);
      periodStart.setMinutes(periodStart.getMinutes() + i * (duration / 60000));
      const periodEnd = new Date(periodStart);
      periodEnd.setMinutes(periodEnd.getMinutes() + duration / 60000);
      const type = (TYPES as any)[typeName] || TYPES.Amrit;
      const nowTime = now.getTime();
      const isActive = nowTime >= periodStart.getTime() && nowTime < periodEnd.getTime();
      return {
        name: typeName,
        nature: type.nature,
        effect: type.effect,
        color: type.color,
        icon: type.icon,
        start: fmtTime(periodStart),
        end: fmtTime(periodEnd),
        active: isActive,
        period: isDay ? "day" : "night",
      };
    });
  }

  const dayPeriods = buildPeriods(DAY_ORDER[weekday], sunrise, dayDuration, true);
  const nightPeriods = buildPeriods(nightOrder, sunset, nightDuration, false);
  const allPeriods = [...dayPeriods, ...nightPeriods];

  const currentPeriod = allPeriods.find((p) => p.active);
  const nextAuspicious = allPeriods.find((p) => p.nature === "auspicious" && !p.active && now.getTime() < new Date(sunset.getTime() + nightDuration * 8).getTime());

  return NextResponse.json({
    choghadiya: {
      weekday: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][weekday],
      sunrise: fmtTime(sunrise),
      sunset: fmtTime(sunset),
      dayPeriods,
      nightPeriods,
      current: currentPeriod || null,
      nextAuspicious: nextAuspicious ? `${nextAuspicious.name} at ${nextAuspicious.start}` : "No more auspicious periods today",
    },
  });
}
