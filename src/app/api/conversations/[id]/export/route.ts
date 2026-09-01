import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET: download a conversation as markdown. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const conv = await db.conversation.findFirst({
    where: { id, userId: user.id },
    select: { id: true, title: true, mode: true, astrologyMode: true, createdAt: true },
  });
  if (!conv) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const messages = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
  });

  let md = `# ${conv.title}\n\n`;
  md += `> Baydin consultation · ${conv.mode}${conv.astrologyMode ? ` (${conv.astrologyMode})` : ""} · ${new Date(conv.createdAt).toLocaleString()}\n\n---\n\n`;
  for (const m of messages) {
    const role = m.role === "user" ? "🧑 You" : "✦ Baydin Astrologer";
    md += `### ${role}\n\n${m.content}\n\n`;
    if (m.metadata) {
      try {
        const meta = JSON.parse(m.metadata);
        if (meta.highlights?.length) {
          md += `**Highlights:** ${meta.highlights.join(", ")}\n\n`;
        }
        if (meta.luckCost) {
          md += `*Luck spent: ${meta.luckCost}*\n\n`;
        }
      } catch {}
    }
    md += `---\n\n`;
  }
  md += `\n*Exported from Baydin · ${new Date().toISOString()}*\n`;

  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="baydin-${conv.title.replace(/[^a-z0-9]/gi, "-").toLowerCase().slice(0, 40)}.md"`,
    },
  });
}
