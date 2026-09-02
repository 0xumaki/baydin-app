import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser, destroySession, verifyPassword } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DELETE /api/account — permanently delete the user's account and all data.
 * Requires password confirmation for security.
 */
export async function DELETE(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { password } = await req.json();
  if (!password) return NextResponse.json({ error: "Password confirmation required." }, { status: 400 });

  // Verify password
  const ok = await verifyPassword(password, user.hashedPassword);
  if (!ok) return NextResponse.json({ error: "Incorrect password." }, { status: 403 });

  // Cascade delete — Prisma onDelete: Cascade on all relations will handle cleanup
  await db.user.delete({ where: { id: user.id } });
  await destroySession();
  return NextResponse.json({ ok: true });
}
