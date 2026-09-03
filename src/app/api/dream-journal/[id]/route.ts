import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET /api/dream-journal/[id] — fetch a single dream entry. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const entry = await db.dreamJournal.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    entry: {
      id: entry.id,
      dreamDate: entry.dreamDate,
      title: entry.title,
      content: entry.content,
      mood: entry.mood,
      isRecurring: entry.isRecurring,
      isFavorite: entry.isFavorite,
      symbols: entry.symbols ? JSON.parse(entry.symbols) : [],
      lunarContext: entry.lunarContext ? JSON.parse(entry.lunarContext) : null,
      interpretation: entry.interpretation,
      createdAt: entry.createdAt,
    },
  });
}

/** PATCH /api/dream-journal/[id] — update fields (title, content, mood, isFavorite, isRecurring). */
export async function PATCH(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await db.dreamJournal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const body = await req.json();
  const update: any = {};
  if (typeof body.title === "string" && body.title.trim().length >= 3) update.title = body.title.trim();
  if (typeof body.content === "string" && body.content.trim().length >= 10) update.content = body.content.trim();
  if (typeof body.mood === "string") update.mood = body.mood;
  if (typeof body.isFavorite === "boolean") update.isFavorite = body.isFavorite;
  if (typeof body.isRecurring === "boolean") update.isRecurring = body.isRecurring;

  const updated = await db.dreamJournal.update({ where: { id }, data: update });
  return NextResponse.json({
    entry: {
      id: updated.id,
      dreamDate: updated.dreamDate,
      title: updated.title,
      content: updated.content,
      mood: updated.mood,
      isRecurring: updated.isRecurring,
      isFavorite: updated.isFavorite,
      symbols: updated.symbols ? JSON.parse(updated.symbols) : [],
      lunarContext: updated.lunarContext ? JSON.parse(updated.lunarContext) : null,
      interpretation: updated.interpretation,
      createdAt: updated.createdAt,
    },
  });
}

/** DELETE /api/dream-journal/[id] */
export async function DELETE(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await db.dreamJournal.findUnique({ where: { id } });
  if (!existing || existing.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  await db.dreamJournal.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
