import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { getTier, creditLuck, todayKey, getDailyRewardAmount } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Create a Luck purchase order. In this MVP the payment is recorded as a
 *  manual submission (paymentMethod + paymentRef) and immediately credited
 *  once created — a real production flow would verify with KBZ/Wave/CB before
 *  marking completed. The order is always persisted for audit. */
export async function POST(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { tierId, paymentMethod, paymentRef } = await req.json();
  const tier = getTier(tierId);
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

  // Create the order record (pending)
  const purchase = await db.luckPurchase.create({
    data: {
      userId: user.id,
      tierId: tier.id,
      tierKind: tier.kind,
      mmkAmount: tier.mmk,
      luckAmount: tier.luck,
      bonusLuck: tier.bonus,
      totalLuck: tier.total,
      status: "completed",
      paymentMethod: paymentMethod || "manual",
      paymentRef: paymentRef || null,
      allocationTarget: tier.allocationTarget ?? "balance",
      completedAt: new Date(),
    },
  });

  // Credit the luck
  if (tier.allocationTarget === "pool" && tier.kind === "reseller") {
    // Reseller wholesale → goes to resellerPool (sellable inventory)
    await db.user.update({
      where: { id: user.id },
      data: { resellerPool: { increment: tier.total } },
    });
    await db.luckTransaction.create({
      data: {
        userId: user.id,
        amount: tier.total,
        balanceAfter: user.luckBalance,
        type: "purchase",
        feature: null,
        description: `Reseller purchase: ${tier.name} (+${tier.bonus} bonus → pool)`,
        referenceId: purchase.id,
      },
    });
  } else {
    // Regular purchase → spendable balance
    await creditLuck({
      userId: user.id,
      amount: tier.total,
      type: "purchase",
      description: `Purchased ${tier.name}: ${tier.luck} Luck + ${tier.bonus} bonus`,
      referenceId: purchase.id,
    });
  }

  return NextResponse.json({
    ok: true,
    purchase: { id: purchase.id, tierId: tier.id, mmk: tier.mmk, totalLuck: tier.total },
  });
}
