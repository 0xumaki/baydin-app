import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET deep analytics for a single reseller. Query: ?id=userId */
export const GET = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const reseller = await db.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true, language: true,
      luckBalance: true, resellerTier: true, resellerPool: true, resellerSince: true,
      lifetimeMmkSpent: true, lifetimeResellerMmk: true,
      specialRank: true, specialRankSince: true,
      createdAt: true,
    },
  });
  if (!reseller) return NextResponse.json({ error: "Reseller not found." }, { status: 404 });

  const [
    transfersOut, resellerPurchases, recipients,
    certificatesIssuedTo, certificatesIssuedBy,
  ] = await Promise.all([
    db.luckTransfer.findMany({ where: { fromUserId: id }, orderBy: { createdAt: "desc" }, take: 200 }),
    db.luckPurchase.findMany({ where: { userId: id, tierKind: "reseller" }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.luckTransfer.groupBy({
      by: ["toUserId"],
      where: { fromUserId: id },
      _sum: { amount: true, saleMmk: true },
      _count: true,
    }),
    db.resellerCertificate.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.resellerCertificate.findMany({ where: { issuedById: id }, orderBy: { createdAt: "desc" }, take: 50 }),
  ]);

  const recipientIds = recipients.map((r) => r.toUserId);
  const recipientUsers = await db.user.findMany({
    where: { id: { in: recipientIds } },
    select: { id: true, email: true, name: true },
  });

  // Aggregate transfer stats
  const totalLuckSold = transfersOut.reduce((s, t) => s + t.amount, 0);
  const totalMmkEarned = transfersOut.reduce((s, t) => s + (t.saleMmk ?? 0), 0);
  const avgPricePerLuck = totalLuckSold > 0 ? totalMmkEarned / totalLuckSold : 0;

  // Margin estimate: totalMmkEarned (resale) - totalMmkPaidForInventory
  const totalInventoryMmk = resellerPurchases.reduce((s, p) => s + p.mmkAmount, 0);
  const margin = totalMmkEarned - totalInventoryMmk;

  // Top recipients
  const topRecipients = recipients
    .map((r) => ({
      user: recipientUsers.find((u) => u.id === r.toUserId),
      totalLuck: r._sum.amount ?? 0,
      totalMmk: r._sum.saleMmk ?? 0,
      count: r._count,
    }))
    .sort((a, b) => b.totalLuck - a.totalLuck)
    .slice(0, 10);

  return NextResponse.json({
    reseller,
    analytics: {
      totalLuckSold,
      totalMmkEarned,
      avgPricePerLuck: Math.round(avgPricePerLuck * 100) / 100,
      totalInventoryMmk,
      margin,
      transfersCount: transfersOut.length,
      resellerPurchaseCount: resellerPurchases.length,
      certsReceived: certificatesIssuedTo.length,
      certsIssued: certificatesIssuedBy.length,
    },
    recipients: topRecipients,
    transfersOut: transfersOut.slice(0, 50),
    purchases: resellerPurchases.slice(0, 50),
    certificates: certificatesIssuedTo,
  });
});
