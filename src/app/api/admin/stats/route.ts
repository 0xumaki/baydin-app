import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const GET = withAuth(async () => {
  await requireAdmin();
  const [totalUsers, totalPurchases, totalMmk, totalLuckSold, totalLuckSpent] = await Promise.all([
    db.user.count(),
    db.luckPurchase.count({ where: { status: "completed" } }),
    db.luckPurchase.aggregate({ where: { status: "completed" }, _sum: { mmkAmount: true } }),
    db.luckPurchase.aggregate({ where: { status: "completed" }, _sum: { totalLuck: true } }),
    db.luckTransaction.aggregate({ where: { type: "spend" }, _sum: { amount: true } }),
  ]);
  const resellers = await db.user.count({ where: { role: "reseller" } });
  return NextResponse.json({
    stats: {
      totalUsers,
      resellers,
      totalPurchases,
      totalMmk: totalMmk._sum.mmkAmount ?? 0,
      totalLuckSold: totalLuckSold._sum.totalLuck ?? 0,
      totalLuckSpent: Math.abs(totalLuckSpent._sum.amount ?? 0),
    },
  });
});
