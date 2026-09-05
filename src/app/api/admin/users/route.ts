import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async () => {
  await requireAdmin();
  const users = await db.user.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
    select: {
      id: true, email: true, name: true, role: true, language: true,
      luckBalance: true, resellerTier: true, resellerPool: true,
      streak: true, totalLuckEarned: true, totalLuckSpent: true,
      referralCode: true, createdAt: true,
      specialRank: true, specialRankSince: true,
      lifetimeMmkSpent: true, lifetimeResellerMmk: true,
    },
  });
  return NextResponse.json({ users });
});
