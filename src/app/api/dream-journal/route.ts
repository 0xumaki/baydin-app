import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { buildLunarDay } from "@/lib/lunar-calendar";
import { detectSymbols, DREAM_MOODS } from "@/lib/dream-symbols";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 30;

/**
 * GET /api/dream-journal
 *   ?date=YYYY-MM-DD    → entries on that date
 *   ?month=YYYY-MM      → entries in that month
 *   ?favorites=true     → only favorites
 *
 * FREE feature — daily-use engagement.
 */
export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const dateParam = searchParams.get("date");
  const monthParam = searchParams.get("month");
  const favoritesOnly = searchParams.get("favorites") === "true";

  const where: any = { userId: user.id };
  if (dateParam) where.dreamDate = dateParam;
  if (monthParam) where.dreamDate = { startsWith: monthParam };
  if (favoritesOnly) where.isFavorite = true;

  const entries = await db.dreamJournal.findMany({
    where,
    orderBy: { dreamDate: "desc" },
    take: 100,
  });

  return NextResponse.json({
    entries: entries.map((e) => ({
      id: e.id,
      dreamDate: e.dreamDate,
      title: e.title,
      content: e.content,
      mood: e.mood,
      isRecurring: e.isRecurring,
      isFavorite: e.isFavorite,
      symbols: e.symbols ? JSON.parse(e.symbols) : [],
      lunarContext: e.lunarContext ? JSON.parse(e.lunarContext) : null,
      interpretation: e.interpretation,
      createdAt: e.createdAt,
    })),
    moods: DREAM_MOODS,
  });
}

/**
 * POST /api/dream-journal
 * Body: { title, content, mood, isRecurring, dreamDate }
 * Auto-detects symbols from content and computes lunar context from dreamDate.
 */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  const { title, content, mood, isRecurring, dreamDate } = body;
  if (!title || typeof title !== "string" || title.trim().length < 3 || title.length > 200) {
    return NextResponse.json({ error: "Please give your dream a title (3-200 characters)." }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length < 10 || content.length > 20000) {
    return NextResponse.json({ error: "Please describe your dream (10-20000 characters)." }, { status: 400 });
  }
  if (!dreamDate || typeof dreamDate !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(dreamDate)) {
    return NextResponse.json({ error: "Dream date must be YYYY-MM-DD." }, { status: 400 });
  }
  // Validate the date is real
  const dateCheck = new Date(dreamDate + "T12:00:00Z");
  if (isNaN(dateCheck.getTime()) || dateCheck.toISOString().slice(0, 10) !== dreamDate) {
    return NextResponse.json({ error: "Please enter a valid dream date." }, { status: 400 });
  }
  if (dateCheck.getTime() > Date.now() + 86400000) {
    return NextResponse.json({ error: "Dream date cannot be in the future." }, { status: 400 });
  }
  const validMoods = DREAM_MOODS.map((m) => m.id);
  const moodId = validMoods.includes(mood) ? mood : "neutral";

  // Auto-detect symbols
  const symbols = detectSymbols(content);
  const symbolKeywords = symbols.map((s) => s.keyword);

  // Compute lunar context for the dream date
  let lunarContext: any = null;
  try {
    const [y, m, d] = dreamDate.split("-").map(Number);
    const lunar = buildLunarDay(y, m, d);
    lunarContext = {
      moonPhase: lunar.moonPhase.name,
      moonPhaseFrac: lunar.moonPhase.phaseFrac,
      illumination: lunar.moonPhase.illumination,
      emoji: lunar.moonPhase.emoji,
      nakshatra: lunar.panchanga.nakshatra,
      nakshatraPada: lunar.panchanga.nakshatra_pada,
      tithi: lunar.panchanga.tithi,
      yoga: lunar.panchanga.yoga,
      isPurnima: lunar.isPurnima,
      isAmavasya: lunar.isAmavasya,
      isEkadashi: lunar.isEkadashi,
    };
  } catch { /* non-fatal */ }

  const entry = await db.dreamJournal.create({
    data: {
      userId: user.id,
      dreamDate,
      title: title.trim(),
      content: content.trim(),
      mood: moodId,
      isRecurring: !!isRecurring,
      symbols: JSON.stringify(symbolKeywords),
      lunarContext: lunarContext ? JSON.stringify(lunarContext) : null,
    },
  });

  return NextResponse.json({
    entry: {
      id: entry.id,
      dreamDate: entry.dreamDate,
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      isRecurring: entry.isRecurring,
      isFavorite: entry.isFavorite,
      symbols: symbolKeywords,
      lunarContext,
      interpretation: null,
      createdAt: entry.createdAt,
    },
    detectedSymbols: symbols.map((s) => ({ keyword: s.keyword, vedic: s.vedic, jungian: s.jungian, polarity: s.polarity, category: s.category })),
  });
}

/** DELETE /api/dream-journal?id=... */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  const existing = await db.dreamJournal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.dreamJournal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
