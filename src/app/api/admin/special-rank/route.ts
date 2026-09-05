import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { SPECIAL_RANKS, type SpecialRank } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin sets or clears a user's special rank (vip | ambassador | partner).
 *  Pass rank: null to clear. */
export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { userId, rank } = body;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }

  let rankValue: SpecialRank | null = null;
  if (rank !== null && rank !== undefined) {
    const found = SPECIAL_RANKS.find((r) => r.id === rank);
    if (!found) {
      return NextResponse.json({ error: "Invalid rank. Use one of: vip, ambassador, partner, null." }, { status: 400 });
    }
    rankValue = found.id;
  }

  const target = await db.user.findUnique({ where: { id: userId }, select: { id: true, email: true } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const updated = await db.user.update({
    where: { id: userId },
    data: {
      specialRank: rankValue,
      specialRankSince: rankValue ? new Date() : null,
    },
    select: {
      id: true, email: true, specialRank: true, specialRankSince: true,
    },
  });
  return NextResponse.json({ ok: true, user: updated });
});
