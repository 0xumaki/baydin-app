import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin whitelists a user as a reseller (sets role + tier). */
export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const { userEmail, tier } = await req.json();
  if (!userEmail) return NextResponse.json({ error: "userEmail required." }, { status: 400 });
  const validTiers = ["bronze", "silver", "gold", "platinum", "diamond", "elite", "legend"];
  if (tier && !validTiers.includes(tier)) {
    return NextResponse.json({ error: "Invalid tier." }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { email: (userEmail as string).toLowerCase() } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  // Don't downgrade admins to reseller — preserve their admin role.
  const newRole = target.role === "admin" ? "admin" : "reseller";
  const updated = await db.user.update({
    where: { id: target.id },
    data: {
      role: newRole,
      resellerTier: tier || "bronze",
      resellerSince: new Date(),
    },
  });
  return NextResponse.json({ ok: true, user: { email: updated.email, role: updated.role, resellerTier: updated.resellerTier } });
});
