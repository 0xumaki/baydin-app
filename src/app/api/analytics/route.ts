import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { buildAnalytics } from "@/lib/analytics";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 15;

/** GET /api/analytics — aggregated user insights. FREE feature. */
export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const payload = await buildAnalytics(user.id);
  return NextResponse.json(payload);
}
