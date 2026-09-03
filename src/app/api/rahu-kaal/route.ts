import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, rev, lahiriAyanamsa } from "@/lib/astrology";
import { parseBirthData } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/rahu-kaal — returns today's timings with color-coded quality.
 *
 * Color system:
 *   gold  = best time (auspicious — no inauspicious period active)
 *   green = okay time (minor inauspicious period active — Gulika/Yamaganda)
 *   red   = bad time (Rahu Kaal active — avoid new ventures)
 *
 * Also computes real sunrise/sunset using the user's birth location if available.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ rahuKaal: null });

  const now = new Date();
  const weekday = now.getDay();
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Compute sunrise/sunset — use user's lat/lon if available, else default 6am/6pm
  const birthData = parseBirthData(user.birthData);
  let sunrise = new Date(now);
  let sunset = new Date(now);

  if (birthData && birthData.latitude && birthData.longitude) {
    // Simple sunrise/sunset approximation using solar declination
    const lat = birthData.latitude;
    const dayOfYear = Math.floor((now.getTime() - new Date(now.getFullYear(), 0, 0).getTime()) / 86400000);
    const decl = 23.45 * Math.sin((360 / 365) * (dayOfYear - 81) * Math.PI / 180);
    const latRad = lat * Math.PI / 180;
    const declRad = decl * Math.PI / 180;
    const cosHourAngle = -Math.tan(latRad) * Math.tan(declRad);
    const hourAngle = Math.acos(Math.max(-1, Math.min(1, cosHourAngle))) * 180 / Math.PI;
    const dayLengthHours = (2 * hourAngle) / 15;
    const sunriseHour = 12 - dayLengthHours / 2;
    const sunsetHour = 12 + dayLengthHours / 2;

    sunrise.setHours(Math.floor(sunriseHour), Math.round((sunriseHour % 1) * 60), 0, 0);
    sunset.setHours(Math.floor(sunsetHour), Math.round((sunsetHour % 1) * 60), 0, 0);
  } else {
    sunrise.setHours(6, 0, 0, 0);
    sunset.setHours(18, 0, 0, 0);
  }

  const dayDuration = (sunset.getTime() - sunrise.getTime()) / 1000 / 60;
  const periodDuration = dayDuration / 8;

  const rahukalaSchedule = [8, 2, 7, 5, 6, 4, 3];
  const gulikaSchedule = [7, 6, 5, 4, 3, 2, 1];
  const yamagandaSchedule = [5, 4, 3, 2, 1, 7, 6];

  function periodTimes(periodIdx: number) {
    const start = new Date(sunrise);
    start.setMinutes(start.getMinutes() + (periodIdx - 1) * periodDuration);
    const end = new Date(start);
    end.setMinutes(end.getMinutes() + periodDuration);
    return { start, end };
  }

  function fmtTime(date: Date): string {
    let h = date.getHours();
    const m = date.getMinutes();
    const ampm = h >= 12 ? "PM" : "AM";
    h = h % 12 || 12;
    return `${h}:${m.toString().padStart(2, "0")} ${ampm}`;
  }

  const rahuPeriod = rahukalaSchedule[weekday];
  const gulikaPeriod = gulikaSchedule[weekday];
  const yamaPeriod = yamagandaSchedule[weekday];

  const rahuTimes = periodTimes(rahuPeriod);
  const gulikaTimes = periodTimes(gulikaPeriod);
  const yamaTimes = periodTimes(yamaPeriod);

  const nowTime = now.getTime();
  const inRahu = nowTime >= rahuTimes.start.getTime() && nowTime < rahuTimes.end.getTime();
  const inGulika = nowTime >= gulikaTimes.start.getTime() && nowTime < gulikaTimes.end.getTime();
  const inYama = nowTime >= yamaTimes.start.getTime() && nowTime < yamaTimes.end.getTime();

  // Build all 8 periods of the day with color coding
  const allPeriods: any[] = [];
  for (let i = 1; i <= 8; i++) {
    const times = periodTimes(i);
    const isRahu = i === rahuPeriod;
    const isGulika = i === gulikaPeriod;
    const isYama = i === yamaPeriod;
    const isActive = nowTime >= times.start.getTime() && nowTime < times.end.getTime();

    let color: "gold" | "green" | "red";
    let quality: string;
    let label: string;

    if (isRahu) {
      color = "red";
      quality = "bad";
      label = `Rahu Kaal ${fmtTime(times.start)}–${fmtTime(times.end)}`;
    } else if (isGulika || isYama) {
      color = "green";
      quality = "okay";
      label = `${isGulika ? "Gulika" : "Yamaganda"} ${fmtTime(times.start)}–${fmtTime(times.end)}`;
    } else {
      color = "gold";
      quality = "best";
      label = `${fmtTime(times.start)}–${fmtTime(times.end)}`;
    }

    allPeriods.push({
      period: i,
      start: fmtTime(times.start),
      end: fmtTime(times.end),
      startISO: times.start.toISOString(),
      endISO: times.end.toISOString(),
      active: isActive,
      color,
      quality,
      label,
      type: isRahu ? "Rahu Kaal" : isGulika ? "Gulika Kaal" : isYama ? "Yamaganda" : "Auspicious",
    });
  }

  // Current status
  const currentPeriod = allPeriods.find(p => p.active);
  const currentColor = currentPeriod?.color ?? "gold";
  const currentQuality = currentPeriod?.quality ?? "best";
  const currentType = currentPeriod?.type ?? "Auspicious";

  // Inauspicious periods (for backward compat)
  const inauspiciousPeriods = [
    { name: "Rahu Kaal", start: fmtTime(rahuTimes.start), end: fmtTime(rahuTimes.end), active: inRahu, color: "red", icon: "⚠️" },
    { name: "Gulika Kaal", start: fmtTime(gulikaTimes.start), end: fmtTime(gulikaTimes.end), active: inGulika, color: "green", icon: "⏸" },
    { name: "Yamaganda", start: fmtTime(yamaTimes.start), end: fmtTime(yamaTimes.end), active: inYama, color: "green", icon: "⊘" },
  ];

  // Next inauspicious period
  const nextStarting = inauspiciousPeriods.find((p) => {
    const times = p.name === "Rahu Kaal" ? rahuTimes : p.name === "Gulika Kaal" ? gulikaTimes : yamaTimes;
    return times.start.getTime() > nowTime;
  });

  return NextResponse.json({
    rahuKaal: {
      weekday: dayNames[weekday],
      sunrise: fmtTime(sunrise),
      sunset: fmtTime(sunset),
      // Color-coded periods for the full day
      timeline: allPeriods,
      // Current status
      currentColor,
      currentQuality,
      currentType,
      currentLabel: currentPeriod?.label ?? null,
      // Backward-compatible inauspicious periods
      periods: inauspiciousPeriods,
      currentlyInauspicious: inRahu || inGulika || inYama,
      nextStarting: nextStarting ? `${nextStarting.name} at ${nextStarting.start}` : "All inauspicious periods have passed today",
    },
  });
}
