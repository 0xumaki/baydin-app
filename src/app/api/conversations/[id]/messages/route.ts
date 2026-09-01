import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ messages: [] });
  const { id } = await params;
  const conv = await db.conversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true, mode: true, astrologyMode: true, title: true, birthContext: true, chartData: true },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 200,
  });
  return NextResponse.json({ conversation: conv, messages });
}
