import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * GET /api/insights/save — list saved insights (bookmarked deep readings).
 * POST /api/insights/save — save a new insight. Body: { skill, skillName, content, highlights, guidance }
 * DELETE /api/insights/save?id=... — remove a saved insight.
 */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ insights: [] });
  const saved: any[] = JSON.parse(user.savedInsights || "[]");
  return NextResponse.json({ insights: saved });
}

export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { skill, skillName, content, highlights, guidance } = await req.json();
  if (!skill || !content) return NextResponse.json({ error: "skill and content required" }, { status: 400 });
  const saved: any[] = JSON.parse(user.savedInsights || "[]");
  const entry = {
    id: `insight_${Date.now()}`,
    skill, skillName, content, highlights: highlights || [], guidance: guidance || null,
    savedAt: new Date().toISOString(),
  };
  saved.unshift(entry);
  // Keep max 50 saved insights
  const trimmed = saved.slice(0, 50);
  await db.user.update({ where: { id: user.id }, data: { savedInsights: JSON.stringify(trimmed) } });
  return NextResponse.json({ insight: entry });
}

export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const saved: any[] = JSON.parse(user.savedInsights || "[]");
  const filtered = saved.filter((s) => s.id !== id);
  await db.user.update({ where: { id: user.id }, data: { savedInsights: JSON.stringify(filtered) } });
  return NextResponse.json({ ok: true });
}
