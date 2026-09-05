import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin bans a reseller: demotes role to user, clears reseller tier,
 *  sets reseller pool to 0. Luck balance is preserved (user keeps what they
 *  bought). */
export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { userId } = body;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, role: true, email: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  if (target.role === "admin") {
    return NextResponse.json({ error: "Cannot ban an admin." }, { status: 400 });
  }

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      role: "user",
      resellerTier: null,
      resellerPool: 0,
      // Strip any special rank too
      specialRank: null,
      specialRankSince: null,
    },
    select: {
      id: true, email: true, role: true, resellerTier: true, resellerPool: true,
      specialRank: true,
    },
  });
  return NextResponse.json({ ok: true, user: updated });
});
