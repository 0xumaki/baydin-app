import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getEffectiveTiers, creditLuck, getSpecialRank } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create a Luck purchase order. In this MVP the payment is recorded as a
 *  manual submission (paymentMethod + paymentRef) and immediately credited
 *  once created — a real production flow would verify with KBZ/Wave/CB before
 *  marking completed. The order is always persisted for audit.
 *
 *  Apply special-rank bonus (additive to the tier's bonusPct), increment
 *  lifetimeMmkSpent, and record first-purchase referral attribution. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tierId, paymentMethod, paymentRef } = await req.json();

  const { all } = await getEffectiveTiers();
  const tier = all.find((t) => t.id === tierId);
  if (!tier) return NextResponse.json({ error: "Unknown tier." }, { status: 400 });

  // Reseller tier enforcement
  if (tier.kind === "reseller") {
    if (user.role !== "reseller" && user.role !== "admin") {
      return NextResponse.json({ error: "Reseller access required." }, { status: 403 });
    }
    if (tier.mmk && tier.mmk < (tier.minMmk ?? 50000)) {
      return NextResponse.json({ error: "Minimum purchase not met." }, { status: 400 });
    }
  }

  // Apply special rank bonus (additive on top of base + tier bonus)
  const rank = getSpecialRank(user.specialRank);
  const rankBonusPct = rank?.bonusPct ?? 0;
  const rankBonus = rankBonusPct > 0 ? Math.round((tier.luck * rankBonusPct) / 100) : 0;
  const finalBonus = tier.bonus + rankBonus;
  const finalTotal = tier.luck + finalBonus;

  // Create the order record (pending)
  const purchase = await db.luckPurchase.create({
    data: {
      userId: user.id,
      tierId: tier.id,
      tierKind: tier.kind,
      mmkAmount: tier.mmk,
      luckAmount: tier.luck,
      bonusLuck: finalBonus,
      totalLuck: finalTotal,
      status: "completed",
      paymentMethod: paymentMethod || "manual",
      paymentRef: paymentRef || null,
      allocationTarget: tier.allocationTarget ?? "balance",
      completedAt: new Date(),
    },
  });

  // Credit the luck + bump lifetime MMK counter
  if (tier.allocationTarget === "pool" && tier.kind === "reseller") {
    // Reseller wholesale → goes to resellerPool (sellable inventory)
    await db.user.update({
      where: { id: user.id },
      data: {
        resellerPool: { increment: finalTotal },
        lifetimeMmkSpent: { increment: tier.mmk },
      },
    });
    await db.luckTransaction.create({
      data: {
        userId: user.id,
        amount: finalTotal,
        balanceAfter: user.luckBalance,
        type: "purchase",
        feature: null,
        description: `Reseller purchase: ${tier.name} (+${finalBonus} bonus → pool)${rank ? ` [${rank.name} +${rankBonusPct}%]` : ""}`,
        referenceId: purchase.id,
      },
    });
  } else {
    // Regular purchase → spendable balance
    await creditLuck({
      userId: user.id,
      amount: finalTotal,
      type: "purchase",
      description: `Purchased ${tier.name}: ${tier.luck} Luck + ${finalBonus} bonus${rank ? ` [${rank.name} +${rankBonusPct}%]` : ""}`,
      referenceId: purchase.id,
    });
    await db.user.update({
      where: { id: user.id },
      data: { lifetimeMmkSpent: { increment: tier.mmk } },
    });
  }

  // Referral first-purchase attribution: if the user was referred and has
  // never purchased before, record firstPurchaseMmk + firstPurchaseAt + bonus
  if (user.referredById) {
    try {
      const existing = await db.referralEarning.findUnique({
        where: { referrerId_refereeId: { referrerId: user.referredById, refereeId: user.id } },
      });
      const previousPurchases = await db.luckPurchase.count({
        where: { userId: user.id, status: "completed", id: { not: purchase.id } },
      });
      if (previousPurchases === 0) {
        const FIRST_PURCHASE_BONUS_LUCK = 5;
        const bonusLuck = existing ? 0 : FIRST_PURCHASE_BONUS_LUCK;
        if (existing) {
          await db.referralEarning.update({
            where: { id: existing.id },
            data: {
              firstPurchaseMmk: tier.mmk,
              firstPurchaseAt: new Date(),
              firstPurchaseBonusLuck: FIRST_PURCHASE_BONUS_LUCK,
              totalLuck: { increment: FIRST_PURCHASE_BONUS_LUCK },
            },
          });
          // Credit the referrer too
          await creditLuck({
            userId: user.referredById,
            amount: FIRST_PURCHASE_BONUS_LUCK,
            type: "referral_bonus",
            description: `Referral first-purchase bonus — ${user.email}`,
            referenceId: purchase.id,
          });
        } else {
          // Upsert defensively — signup may have skipped ReferralEarning
          await db.referralEarning.create({
            data: {
              referrerId: user.referredById,
              refereeId: user.id,
              firstPurchaseMmk: tier.mmk,
              firstPurchaseAt: new Date(),
              firstPurchaseBonusLuck: FIRST_PURCHASE_BONUS_LUCK,
              totalLuck: FIRST_PURCHASE_BONUS_LUCK,
            },
          });
          await creditLuck({
            userId: user.referredById,
            amount: FIRST_PURCHASE_BONUS_LUCK,
            type: "referral_bonus",
            description: `Referral first-purchase bonus — ${user.email}`,
            referenceId: purchase.id,
          });
        }
        // bump bonusLuck counter (we used this var; suppress unused)
        void bonusLuck;
      }
    } catch (e) {
      console.error("[luck/purchase] referral attribution failed:", e);
    }
  }

  return NextResponse.json({
    ok: true,
    purchase: { id: purchase.id, tierId: tier.id, mmk: tier.mmk, totalLuck: finalTotal },
    bonus: { base: tier.bonus, rank: rankBonus, total: finalBonus },
    rankApplied: rank ? { id: rank.id, bonusPct: rankBonusPct } : null,
  });
}
