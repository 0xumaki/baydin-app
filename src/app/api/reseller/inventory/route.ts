import { NextResponse } from "next/server";
import { requireReseller } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Reseller dashboard: pool balance, recent transfers, allocation history. */
export const GET = withAuth(async () => {
  const reseller = await requireReseller();
  const [transfersOut, purchases, recipients] = await Promise.all([
    db.luckTransfer.findMany({
      where: { fromUserId: reseller.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.luckPurchase.findMany({
      where: { userId: reseller.id, tierKind: "reseller" },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.luckTransfer.groupBy({
      by: ["toUserId"],
      where: { fromUserId: reseller.id },
      _sum: { amount: true },
      _count: true,
    }),
  ]);
  const recipientIds = recipients.map((r) => r.toUserId);
  const recipientUsers = await db.user.findMany({
    where: { id: { in: recipientIds } },
    select: { id: true, email: true, name: true },
  });
  return NextResponse.json({
    reseller: {
      tier: reseller.resellerTier,
      pool: reseller.resellerPool,
      balance: reseller.luckBalance,
    },
    transfersOut,
    purchases,
    recipients: recipients.map((r) => ({
      ...r,
      user: recipientUsers.find((u) => u.id === r.toUserId),
    })),
  });
});
