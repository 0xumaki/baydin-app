import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { parseBirthData } from "@/lib/validate";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ messages: [] });
    const { id } = await params;
    if (!id || typeof id !== "string" || id.length < 10) {
      return NextResponse.json({ error: "Invalid conversation id." }, { status: 400 });
    }
    const conv = await db.conversation.findFirst({
      where: { id, userId: user.id },
      select: { id: true, mode: true, astrologyMode: true, title: true, birthContext: true, chartData: true },
    });
    if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // Safely parse chartData + birthContext
    let chartData: any = null;
    if (conv.chartData) {
      try { chartData = JSON.parse(conv.chartData); } catch { chartData = null; }
    }
    const birthContext = parseBirthData(conv.birthContext);

    const messages = await db.message.findMany({
      where: { conversationId: id },
      orderBy: { createdAt: "asc" },
      take: 200,
    });
    return NextResponse.json({
      conversation: { ...conv, chartData, birthContext },
      messages,
    });
  } catch (err) {
    console.error("Fetch messages failed:", err);
    return NextResponse.json({ error: "Failed to load messages." }, { status: 500 });
  }
}
