import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET deep analytics for a single user. Query: ?id=userId */
export const GET = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const url = new URL(req.url);
  const id = url.searchParams.get("id");
  if (!id) return NextResponse.json({ error: "id is required." }, { status: 400 });

  const user = await db.user.findUnique({
    where: { id },
    select: {
      id: true, email: true, name: true, role: true, language: true,
      luckBalance: true, totalLuckEarned: true, totalLuckSpent: true,
      resellerTier: true, resellerPool: true, resellerSince: true,
      specialRank: true, specialRankSince: true, stipendLuck: true, stipendLastAt: true,
      lifetimeMmkSpent: true, lifetimeResellerMmk: true,
      streak: true, lastDailyAt: true,
      referralCode: true, referredById: true,
      createdAt: true, updatedAt: true,
    },
  });
  if (!user) return NextResponse.json({ error: "User not found." }, { status: 404 });

  const [
    purchases, transactions, dailyRewards, transfersOut, transfersIn, referrals, certificates,
  ] = await Promise.all([
    db.luckPurchase.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.luckTransaction.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 100 }),
    db.dailyReward.findMany({ where: { userId: id }, orderBy: { date: "desc" }, take: 60 }),
    db.luckTransfer.findMany({ where: { fromUserId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.luckTransfer.findMany({ where: { toUserId: id }, orderBy: { createdAt: "desc" }, take: 50 }),
    db.user.findMany({ where: { referredById: id }, select: { id: true, email: true, name: true, createdAt: true }, take: 100 }),
    db.resellerCertificate.findMany({ where: { userId: id }, orderBy: { createdAt: "desc" }, take: 20, select: { id: true, tier: true, kind: true, createdAt: true } }),
  ]);

  // Aggregate purchase totals
  const purchaseSummary = purchases.reduce(
    (acc, p) => {
      acc.totalMmk += p.mmkAmount;
      acc.totalLuck += p.totalLuck;
      if (p.tierKind === "reseller") acc.resellerPurchases += 1;
      else acc.regularPurchases += 1;
      return acc;
    },
    { totalMmk: 0, totalLuck: 0, regularPurchases: 0, resellerPurchases: 0 },
  );

  // Spend by feature
  const spendByFeature: Record<string, { count: number; totalLuck: number }> = {};
  for (const t of transactions) {
    if (t.type !== "spend" || !t.feature) continue;
    if (!spendByFeature[t.feature]) spendByFeature[t.feature] = { count: 0, totalLuck: 0 };
    spendByFeature[t.feature].count += 1;
    spendByFeature[t.feature].totalLuck += Math.abs(t.amount);
  }

  return NextResponse.json({
    user,
    analytics: {
      purchaseSummary,
      spendByFeature: Object.entries(spendByFeature).map(([feature, v]) => ({ feature, ...v })),
      transferStats: {
        sent: transfersOut.reduce((s, t) => s + t.amount, 0),
        received: transfersIn.reduce((s, t) => s + t.amount, 0),
        sentCount: transfersOut.length,
        receivedCount: transfersIn.length,
      },
      referralCount: referrals.length,
      certificateCount: certificates.length,
      dailyRewardStreak: user.streak,
      lastDailyAt: user.lastDailyAt,
    },
    activity: {
      purchases,
      transactions: transactions.slice(0, 30),
      dailyRewards,
      transfersOut,
      transfersIn,
      referrals,
      certificates,
    },
  });
});
