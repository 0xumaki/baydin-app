import { NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET system-wide visualizations: distribution of users by tier, role,
 *  language, activity buckets, and aggregate Luck/MMK counters. */
export const GET = withAuth(async () => {
  await requireAdmin();

  const [
    totalUsers,
    roleCounts,
    tierCounts,
    languageCounts,
    resellerTierCounts,
    luckBuckets,
    mmkStats,
    specialRankCounts,
    recentPurchases,
  ] = await Promise.all([
    db.user.count(),
    db.user.groupBy({ by: ["role"], _count: true }),
    db.luckPurchase.groupBy({ by: ["tierId"], where: { status: "completed" }, _count: true, _sum: { totalLuck: true, mmkAmount: true } }),
    db.user.groupBy({ by: ["language"], _count: true }),
    db.user.groupBy({ by: ["resellerTier"], where: { role: "reseller" }, _count: true }),
    db.user.groupBy({
      by: ["luckBalance"],
      _count: true,
    }),
    db.luckPurchase.aggregate({
      where: { status: "completed" },
      _sum: { mmkAmount: true, totalLuck: true, bonusLuck: true },
      _avg: { mmkAmount: true },
    }),
    db.user.groupBy({ by: ["specialRank"], _count: true }),
    db.luckPurchase.findMany({
      where: { status: "completed" },
      orderBy: { createdAt: "desc" },
      take: 30,
      select: { id: true, tierId: true, mmkAmount: true, totalLuck: true, createdAt: true },
    }),
  ]);

  // Aggregate Luck balance into buckets
  const buckets = {
    "0": 0, "1-50": 0, "51-200": 0, "201-1000": 0, "1000+": 0,
  };
  for (const row of luckBuckets) {
    const v = row.luckBalance;
    const n = row._count;
    if (v <= 0) buckets["0"] += n;
    else if (v <= 50) buckets["1-50"] += n;
    else if (v <= 200) buckets["51-200"] += n;
    else if (v <= 1000) buckets["201-1000"] += n;
    else buckets["1000+"] += n;
  }

  // Build 7-day purchase trend
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const recentTrend = await db.luckPurchase.findMany({
    where: { status: "completed", createdAt: { gte: sevenDaysAgo } },
    select: { mmkAmount: true, totalLuck: true, createdAt: true },
  });
  const byDay: Record<string, { count: number; mmk: number; luck: number }> = {};
  for (const p of recentTrend) {
    const day = p.createdAt.toISOString().slice(0, 10);
    if (!byDay[day]) byDay[day] = { count: 0, mmk: 0, luck: 0 };
    byDay[day].count += 1;
    byDay[day].mmk += p.mmkAmount;
    byDay[day].luck += p.totalLuck;
  }

  return NextResponse.json({
    summary: {
      totalUsers,
      totalMmk: mmkStats._sum.mmkAmount ?? 0,
      totalLuck: mmkStats._sum.totalLuck ?? 0,
      totalBonus: mmkStats._sum.bonusLuck ?? 0,
      avgMmkPerPurchase: Math.round(mmkStats._avg.mmkAmount ?? 0),
    },
    distributions: {
      byRole: roleCounts.map((r) => ({ role: r.role, count: r._count })),
      byLanguage: languageCounts.map((l) => ({ language: l.language, count: l._count })),
      byResellerTier: resellerTierCounts.map((t) => ({ tier: t.resellerTier ?? "none", count: t._count })),
      bySpecialRank: specialRankCounts.map((s) => ({ rank: s.specialRank ?? "none", count: s._count })),
      byPurchaseTier: tierCounts.map((t) => ({
        tierId: t.tierId, count: t._count,
        totalLuck: t._sum.totalLuck ?? 0, totalMmk: t._sum.mmkAmount ?? 0,
      })),
      luckBuckets: buckets,
    },
    trend7d: Object.entries(byDay).map(([day, v]) => ({ day, ...v })).sort((a, b) => a.day.localeCompare(b.day)),
    recentPurchases,
  });
});
