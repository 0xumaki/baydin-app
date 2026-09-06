import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET leaderboard snapshots and live top-N.
 *  Query: ?kind=user|reseller&top=N&metric=totalLuckSpent|lifetimeMmkSpent|... */
export const GET = withAuth(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const url = new URL(req.url);
  const kind = url.searchParams.get("kind") === "reseller" ? "reseller" : "user";
  const topN = Math.min(Math.max(parseInt(url.searchParams.get("top") ?? "10", 10) || 10, 1), 100);
  const metric = url.searchParams.get("metric") || (kind === "reseller" ? "lifetimeResellerMmk" : "totalLuckSpent");

  const where = kind === "reseller" ? { role: { in: ["reseller", "admin"] } } : {};
  const users = await db.user.findMany({
    where,
    orderBy: { [metric]: "desc" } as any,
    take: topN,
    select: {
      id: true, email: true, name: true, role: true,
      luckBalance: true, totalLuckEarned: true, totalLuckSpent: true,
      resellerTier: true, resellerPool: true,
      lifetimeMmkSpent: true, lifetimeResellerMmk: true,
      streak: true, createdAt: true,
    },
  });

  const entries = users.map((u, i) => ({
    rank: i + 1,
    userId: u.id,
    email: u.email,
    name: u.name,
    role: u.role,
    metric: (u as any)[metric] ?? 0,
    metricName: metric,
    luckBalance: u.luckBalance,
    totalLuckEarned: u.totalLuckEarned,
    totalLuckSpent: u.totalLuckSpent,
    resellerTier: u.resellerTier,
    resellerPool: u.resellerPool,
    streak: u.streak,
  }));

  // Persist a snapshot for audit (best-effort)
  let snapshot: any = null;
  try {
    snapshot = await db.leaderboardSnapshot.create({
      data: {
        kind,
        topN,
        metric,
        generatedById: admin.id,
        payloadJson: JSON.stringify(entries),
      },
    });
  } catch (e) {
    console.error("[leaderboard] snapshot persist failed:", e);
  }

  return NextResponse.json({
    kind, topN, metric, entries, snapshotId: snapshot?.id ?? null,
  });
});
