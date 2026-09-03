import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildLunarMonth, buildLunarDay, NAKSHATRA_DETAILS } from "@/lib/lunar-calendar";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/**
 * GET /api/lunar-calendar?year=2026&month=9         → full month
 * GET /api/lunar-calendar?date=2026-09-03           → single day detail
 * GET /api/lunar-calendar?nakshata=Rohini            → nakshatra metadata
 *
 * FREE feature — no Luck cost. The lunar calendar is daily-use engagement.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const yearParam = searchParams.get("year");
  const monthParam = searchParams.get("month");
  const dateParam = searchParams.get("date");
  const nakshatraParam = searchParams.get("nakshatra");

  // Nakshatra detail lookup
  if (nakshatraParam) {
    const detail = NAKSHATRA_DETAILS[nakshatraParam];
    if (!detail) {
      return NextResponse.json({ error: "Unknown nakshatra" }, { status: 400 });
    }
    return NextResponse.json({ nakshatra: nakshatraParam, ...detail });
  }

  // Single day detail
  if (dateParam) {
    const m = dateParam.match(/^(\d{4})-(\d{2})-(\d{2})$/);
    if (!m) return NextResponse.json({ error: "Invalid date. Use YYYY-MM-DD." }, { status: 400 });
    const y = +m[1], mo = +m[2], d = +m[3];
    const today = {
      y: new Date().getFullYear(),
      m: new Date().getMonth() + 1,
      d: new Date().getDate(),
    };
    const day = buildLunarDay(y, mo, d, today);
    const nakDetail = NAKSHATRA_DETAILS[day.panchanga.nakshatra];
    return NextResponse.json({
      day,
      nakshatraDetail: nakDetail
        ? { nakshatra: day.panchanga.nakshatra, ...nakDetail }
        : null,
    });
  }

  // Full month
  const now = new Date();
  const year = yearParam ? parseInt(yearParam, 10) : now.getFullYear();
  const month = monthParam ? parseInt(monthParam, 10) : now.getMonth() + 1;
  if (month < 1 || month > 12) {
    return NextResponse.json({ error: "Month must be 1-12." }, { status: 400 });
  }
  if (year < 1900 || year > 2100) {
    return NextResponse.json({ error: "Year must be 1900-2100." }, { status: 400 });
  }

  const lunarMonth = buildLunarMonth(year, month);
  return NextResponse.json({
    month: lunarMonth,
    // Summary stats for the month
    summary: {
      festivals: lunarMonth.days
        .filter((d) => d.isFestival)
        .map((d) => ({ date: d.date, name: d.festivalName })),
      purnima: lunarMonth.days.filter((d) => d.isPurnima).map((d) => d.date),
      amavasya: lunarMonth.days.filter((d) => d.isAmavasya).map((d) => d.date),
      ekadashi: lunarMonth.days.filter((d) => d.isEkadashi).map((d) => d.date),
    },
  });
}
