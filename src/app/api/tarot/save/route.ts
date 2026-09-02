import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH /api/tarot/save?id=... — toggle bookmark on a tarot reading. */
export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const id = req.nextUrl.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const reading = await db.tarotReading.findFirst({ where: { id, userId: user.id } });
  if (!reading) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const updated = await db.tarotReading.update({
    where: { id },
    data: { saved: !reading.saved },
  });
  return NextResponse.json({ reading: updated, saved: updated.saved });
}
