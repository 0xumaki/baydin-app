import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/muhurta — returns today's auspicious and inauspicious time periods.
 * Based on Vedic Panchanga calculations (Rahu Kala, Gulika Kala, Yamaganda).
 * Free feature (no Luck cost).
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ muhurta: null });

  const now = new Date();
  const weekday = now.getDay(); // 0=Sun, 1=Mon, ..., 6=Sat
  const dayNames = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  // Approximate sunrise/sunset (6:00 AM / 6:00 PM — simplified, no geo computation)
  const dayDuration = 12 * 60; // 720 minutes (day to night)
  const periodDuration = dayDuration / 8; // 8 periods of 90 minutes each

  // Rahu Kala schedule (in day periods, 1-indexed) — varies by weekday
  const rahukalaSchedule = [8, 2, 7, 5, 6, 4, 3]; // Sun=8th, Mon=2nd, etc.
  const gulikaSchedule = [7, 6, 5, 4, 3, 2, 1];
  const yamagandaSchedule = [5, 4, 3, 2, 1, 7, 6];

  function periodToTime(periodIdx: number): string {
    const startMin = 6 * 60 + (periodIdx - 1) * periodDuration;
    const endMin = startMin + periodDuration;
    const fmt = (m: number) => {
      const h = Math.floor(m / 60);
      const min = Math.round(m % 60);
      const ampm = h >= 12 && h < 24 ? "PM" : "AM";
      const h12 = h > 12 ? h - 12 : h === 0 ? 12 : h;
      return `${h12}:${min.toString().padStart(2, "0")} ${ampm}`;
    };
    return `${fmt(startMin)} – ${fmt(endMin)}`;
  }

  const rahuPeriod = rahukalaSchedule[weekday];
  const gulikaPeriod = gulikaSchedule[weekday];
  const yamaPeriod = yamagandaSchedule[weekday];

  // Find the current period
  const currentMinutes = now.getHours() * 60 + now.getMinutes();
  const minutesSinceSunrise = currentMinutes - 6 * 60;
  const currentPeriod = minutesSinceSunrise >= 0 && minutesSinceSunrise < dayDuration
    ? Math.floor(minutesSinceSunrise / periodDuration) + 1
    : null;

  const inauspicious = [
    { name: "Rahu Kala", time: periodToTime(rahuPeriod), active: currentPeriod === rahuPeriod, icon: "⚠️" },
    { name: "Gulika Kala", time: periodToTime(gulikaPeriod), active: currentPeriod === gulikaPeriod, icon: "⏸" },
    { name: "Yamaganda", time: periodToTime(yamaPeriod), active: currentPeriod === yamaPeriod, icon: "⊘" },
  ];

  // Auspicious periods (all non-inauspicious daytime periods)
  const auspicious: { time: string; note: string }[] = [];
  for (let i = 1; i <= 8; i++) {
    if (i !== rahuPeriod && i !== gulikaPeriod && i !== yamaPeriod) {
      const isActive = currentPeriod === i;
      auspicious.push({
        time: periodToTime(i),
        note: isActive ? "Current — favorable" : "Favorable period",
      });
    }
  }
  // Only show the next 2 auspicious periods
  const currentIdx = auspicious.findIndex((a) => a.note.includes("Current"));
  const upcoming = currentIdx >= 0 ? auspicious.slice(currentIdx, currentIdx + 2) : auspicious.slice(0, 2);

  return NextResponse.json({
    muhurta: {
      weekday: dayNames[weekday],
      inauspicious,
      upcoming,
      currentPeriod,
    },
  });
}
