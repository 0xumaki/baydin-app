import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, email: true, name: true, role: true, language: true,
      luckBalance: true, resellerTier: true, resellerPool: true,
      streak: true, totalLuckEarned: true, totalLuckSpent: true,
      referralCode: true, createdAt: true,
    },
  });
  return NextResponse.json({ users });
}
