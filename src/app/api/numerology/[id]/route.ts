import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET — fetch a single saved numerology report by id. */
export async function GET(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;
  const reading = await db.numerologyReading.findUnique({ where: { id } });
  if (!reading || reading.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  return NextResponse.json({
    id: reading.id,
    input: JSON.parse(reading.input),
    report: JSON.parse(reading.report),
    system: reading.system,
    createdAt: reading.createdAt,
  });
}
