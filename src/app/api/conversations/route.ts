import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ conversations: [] });
  const search = req.nextUrl.searchParams.get("q")?.trim();
  const conversations = await db.conversation.findMany({
    where: {
      userId: user.id,
      ...(search ? { title: { contains: search } } : {}),
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

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { mode, astrologyMode, title } = await req.json();
  const conv = await db.conversation.create({
    data: {
      userId: user.id,
      mode: mode || "astrologer",
      astrologyMode: astrologyMode || "vedic",
      title: title || "New consultation",
      birthContext: user.birthData,
    },
  });
  return NextResponse.json({ conversation: conv });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id, title, pinned } = await req.json();
  const conv = await db.conversation.update({
    where: { id, userId: user.id },
    data: {
      ...(title !== undefined ? { title } : {}),
      ...(pinned !== undefined ? { pinned } : {}),
    },
  });
  return NextResponse.json({ conversation: conv });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "Missing id" }, { status: 400 });
  await db.conversation.delete({ where: { id, userId: user.id } });
  return NextResponse.json({ ok: true });
}
