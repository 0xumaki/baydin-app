import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { creditLuck } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin grants Luck to any user. */
export const POST = withAuth(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const { userEmail, amount, description } = await req.json();
  if (!userEmail || !amount) {
    return NextResponse.json({ error: "userEmail and amount are required." }, { status: 400 });
  }
  const target = await db.user.findUnique({ where: { email: (userEmail as string).toLowerCase() } });
  if (!target) return NextResponse.json({ error: "User not found." }, { status: 404 });
  const balance = await creditLuck({
    userId: target.id,
    amount,
    type: "admin_grant",
    description: description ?? `Admin grant by ${admin.email}`,
  });
  return NextResponse.json({ ok: true, user: target.email, newBalance: balance });
});
