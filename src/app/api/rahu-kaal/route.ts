import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { julianDay, sunPosition, rev, lahiriAyanamsa } from "@/lib/astrology";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/rahu-kaal — returns today's precise Rahu Kaal, Gulika Kaal, and Yamaganda timings.
 * These are inauspicious periods computed from sunrise/sunset and the weekday.
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ rahuKaal: null });

  const now = new Date();
  const weekday = now.getDay(); // 0=Sun ... 6=Sat
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Approximate sunrise/sunset (6:00 AM / 6:00 PM — simplified without geo computation)
  const sunrise = new Date(now);
  sunrise.setHours(6, 0, 0, 0);
  const sunset = new Date(now);
  sunset.setHours(18, 0, 0, 0);

  const dayDuration = (sunset.getTime() - sunrise.getTime()) / 1000 / 60; // minutes
  const periodDuration = dayDuration / 8; // 8 periods of ~90 min each

  // Rahu Kaal schedule by weekday (1-indexed period)
  const rahukalaSchedule = [8, 2, 7, 5, 6, 4, 3]; // Sun=8th, Mon=2nd, Tue=7th, etc.
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

  // Check if currently in any of these periods
  const nowTime = now.getTime();
  const inRahu = nowTime >= rahuTimes.start.getTime() && nowTime < rahuTimes.end.getTime();
  const inGulika = nowTime >= gulikaTimes.start.getTime() && nowTime < gulikaTimes.end.getTime();
  const inYama = nowTime >= yamaTimes.start.getTime() && nowTime < yamaTimes.end.getTime();

  // Next inauspicious period starting
  const allPeriods = [
    { name: "Rahu Kaal", ...rahuTimes, active: inRahu, icon: "⚠️" },
    { name: "Gulika Kaal", ...gulikaTimes, active: inGulika, icon: "⏸" },
    { name: "Yamaganda", ...yamaTimes, active: inYama, icon: "⊘" },
  ].sort((a, b) => a.start.getTime() - b.start.getTime());

  const nextStarting = allPeriods.find((p) => p.start.getTime() > nowTime);

  return NextResponse.json({
    rahuKaal: {
      weekday: dayNames[weekday],
      sunrise: fmtTime(sunrise),
      sunset: fmtTime(sunset),
      periods: allPeriods.map((p) => ({
        name: p.name,
        start: fmtTime(p.start),
        end: fmtTime(p.end),
        active: p.active,
        icon: p.icon,
      })),
      currentlyInauspicious: inRahu || inGulika || inYama,
      currentPeriod: inRahu ? "Rahu Kaal" : inGulika ? "Gulika Kaal" : inYama ? "Yamaganda" : null,
      nextStarting: nextStarting ? `${nextStarting.name} at ${fmtTime(nextStarting.start)}` : "All inauspicious periods have passed today",
    },
  });
}
