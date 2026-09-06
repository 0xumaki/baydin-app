import { NextResponse } from "next/server";
import { requireUser } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET referral earnings + share-card data for the current user.
 *  Returns:
 *    - referrer's referralCode, totalLuck earned, totalReferrals
 *    - list of ReferralEarning rows (with referee basic info)
 *    - shareCard: { url, text } for the user to copy/paste */
export const GET = withAuth(async () => {
  const me = await requireUser();
  const [referees, aggReferrals, aggLuck] = await Promise.all([
    db.referralEarning.findMany({
      where: { referrerId: me.id },
      orderBy: { createdAt: "desc" },
      take: 200,
      select: {
        id: true, refereeId: true, signupBonusLuck: true,
        firstPurchaseBonusLuck: true, firstPurchaseMmk: true,
        firstPurchaseAt: true, totalLuck: true, createdAt: true,
      },
    }),
    db.user.count({ where: { referredById: me.id } }),
    db.referralEarning.aggregate({
      where: { referrerId: me.id },
      _sum: { totalLuck: true, signupBonusLuck: true, firstPurchaseBonusLuck: true },
      _count: true,
    }),
  ]);
  const refereeIds = referees.map((r) => r.refereeId);
  const refereeUsers = await db.user.findMany({
    where: { id: { in: refereeIds } },
    select: { id: true, email: true, name: true, createdAt: true },
  });

  const shareText = `Join me on Baydin — Myanmar's smartest astrology companion. Get free Luck on signup with my code: ${me.referralCode}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://baydin.app";
  const shareUrl = `${baseUrl}/?ref=${encodeURIComponent(me.referralCode)}`;

  return NextResponse.json({
    referralCode: me.referralCode,
    stats: {
      totalReferrals: aggReferrals,
      totalLuckEarned: aggLuck._sum.totalLuck ?? 0,
      signupBonusTotal: aggLuck._sum.signupBonusLuck ?? 0,
      firstPurchaseBonusTotal: aggLuck._sum.firstPurchaseBonusLuck ?? 0,
    },
    shareCard: {
      text: shareText,
      url: shareUrl,
      qrSource: `https://api.qrserver.com/v1/create-qr-code/?size=240x240&data=${encodeURIComponent(shareUrl)}`,
    },
    referrals: referees.map((r) => ({
      ...r,
      referee: refereeUsers.find((u) => u.id === r.refereeId),
    })),
  });
});
