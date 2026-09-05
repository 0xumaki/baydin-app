import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { computeStipendDue, creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin manually grants a stipend (Luck) to a user with a special rank.
 *  Bypasses the time-window check (useful for testing or compensating). */
export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { userId, amount } = body;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  const target = await db.user.findUnique({
    where: { id: userId },
    select: { id: true, email: true, specialRank: true, stipendLastAt: true, stipendLuck: true },
  });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });

  // If amount not specified, use the rank's stipend amount if due.
  let grant = typeof amount === "number" && amount > 0 ? amount : computeStipendDue(target.specialRank, target.stipendLastAt);
  if (grant <= 0) {
    if (!target.specialRank) {
      return NextResponse.json({ error: "User has no special rank." }, { status: 400 });
    }
    return NextResponse.json({ ok: false, reason: "not_due", message: "Stipend is not yet due; pass an explicit amount to override." });
  }

  const balance = await creditLuck({
    userId: target.id,
    amount: grant,
    type: "admin_grant",
    description: `Special rank stipend (${target.specialRank})`,
  });
  const updated = await db.user.update({
    where: { id: target.id },
    data: {
      stipendLuck: { increment: grant },
      stipendLastAt: new Date(),
    },
    select: { stipendLuck: true, stipendLastAt: true },
  });
  return NextResponse.json({ ok: true, granted: grant, balance, user: { id: target.id, stipendLuck: updated.stipendLuck, stipendLastAt: updated.stipendLastAt } });
});
