import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ conversations: [] });
  const search = req.nextUrl.searchParams.get("q")?.trim();

  if (search) {
    // Single query: conversations whose title matches OR whose messages contain the search.
    // Uses a subquery on Message via Prisma's relation filter (translated to EXISTS).
    const conversations = await db.conversation.findMany({
      where: {
        userId: user.id,
        OR: [
          { title: { contains: search } },
          { messages: { some: { content: { contains: search } } } },
        ],
      },
      orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
      take: 50,
      select: {
        id: true, title: true, mode: true, astrologyMode: true,
        messageCount: true, totalLuckCost: true, pinned: true,
        createdAt: true, updatedAt: true,
      },
    });

    return NextResponse.json({ conversations });
  }

  const conversations = await db.conversation.findMany({
    where: { userId: user.id },
    orderBy: [{ pinned: "desc" }, { updatedAt: "desc" }],
    take: 50,
    select: {
      id: true, title: true, mode: true, astrologyMode: true,
      messageCount: true, totalLuckCost: true, pinned: true,
      createdAt: true, updatedAt: true,
    },
  });
  return NextResponse.json({ conversations });
}

const VALID_MODES = ["astrologer", "tarot", "horoscope", "birth-chart", "insight"] as const;
const VALID_ASTRO_MODES = ["vedic", "western", "mahabote"] as const;

export async function POST(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json().catch(() => ({}));
    const { mode, astrologyMode, title } = body;

    // Validate inputs — only allow known enum values
    const safeMode = VALID_MODES.includes(mode) ? mode : "astrologer";
    const safeAstro = VALID_ASTRO_MODES.includes(astrologyMode) ? astrologyMode : "vedic";
    const safeTitle = typeof title === "string" && title.trim().length > 0 && title.trim().length <= 100
      ? title.trim()
      : "New consultation";

    const conv = await db.conversation.create({
      data: {
        userId: user.id,
        mode: safeMode,
        astrologyMode: safeAstro,
        title: safeTitle,
        birthContext: user.birthData,
      },
    });
    return NextResponse.json({ conversation: conv });
  } catch (err) {
    console.error("Create conversation failed:", err);
    return NextResponse.json({ error: "Failed to create conversation." }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const { id, title, pinned } = body;
    if (typeof id !== "string" || id.length < 10) {
      return NextResponse.json({ error: "Invalid conversation id." }, { status: 400 });
    }
    const update: any = {};
    if (typeof title === "string" && title.trim().length > 0 && title.trim().length <= 100) {
      update.title = title.trim();
    }
    if (typeof pinned === "boolean") {
      update.pinned = pinned;
    }
    if (Object.keys(update).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const conv = await db.conversation.update({
      where: { id, userId: user.id },
      data: update,
    });
    return NextResponse.json({ conversation: conv });
  } catch (err) {
    console.error("Update conversation failed:", err);
    return NextResponse.json({ error: "Failed to update conversation." }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.conversation.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
