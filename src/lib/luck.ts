import "server-only";
import { db } from "@/lib/db";

/**
 * BAYDIN — Luck credit economy configuration.
 *
 * "Luck" is the in-app credit. Users earn Luck through daily rewards,
 * referrals, and purchases, and spend it per feature. Lumina freebies
 * (basic tarot, manifest, mood) stay free; GURU astrology features and
 * premium Lumina features cost Luck.
 *
 * Per-feature costs are listed in FEATURE_COSTS below. Each cost is
 * surfaced to the user in the UI before they confirm a purchase.
 */

export type LuckTier = {
  id: string;
  name: string;
  mmk: number;
  luck: number; // base luck
  bonusPct: number; // bonus percentage
  bonus: number; // bonus luck (computed)
  total: number; // luck + bonus
  perLuck: number; // MMK per Luck (effective)
  popular?: boolean;
  kind: "regular" | "reseller";
  // Reseller-only: whether luck goes to resellerPool (to resell) or balance (self).
  allocationTarget?: "balance" | "pool";
  minMmk?: number; // minimum purchase (reseller enforcement)
  tagline: string;
};

export const LUCK_TIERS: LuckTier[] = [
  {
    id: "spark",
    name: "Spark",
    mmk: 5000,
    luck: 50,
    bonusPct: 0,
    bonus: 0,
    total: 50,
    perLuck: 100,
    kind: "regular",
    tagline: "Try the stars — a single reading or a week of daily guidance.",
  },
  {
    id: "basic",
    name: "Basic",
    mmk: 10000,
    luck: 100,
    bonusPct: 10,
    bonus: 10,
    total: 110,
    perLuck: 91,
    kind: "regular",
    tagline: "10% bonus — a few deep consultations with the astrologer.",
  },
  {
    id: "popular",
    name: "Seeker",
    mmk: 25000,
    luck: 250,
    bonusPct: 20,
    bonus: 50,
    total: 300,
    perLuck: 83,
    kind: "regular",
    popular: true,
    tagline: "20% bonus — the sweet spot for regular spiritual practice.",
  },
  {
    id: "value",
    name: "Adept",
    mmk: 50000,
    luck: 500,
    bonusPct: 30,
    bonus: 150,
    total: 650,
    perLuck: 77,
    kind: "regular",
    tagline: "30% bonus — daily horoscopes + monthly life reports.",
  },
  {
    id: "premium",
    name: "Sage",
    mmk: 100000,
    luck: 1000,
    bonusPct: 40,
    bonus: 400,
    total: 1400,
    perLuck: 71,
    kind: "regular",
    tagline: "40% bonus — for the devoted seeker. Deep weekly consultations.",
  },
  {
    id: "luminary",
    name: "Luminary",
    mmk: 150000,
    luck: 1500,
    bonusPct: 50,
    bonus: 750,
    total: 2250,
    perLuck: 67,
    kind: "regular",
    tagline: "50% bonus — unlimited access. Best per-Luck value.",
  },
];

export const RESELLER_TIERS: LuckTier[] = [
  {
    id: "reseller_bronze",
    name: "Reseller · Bronze",
    mmk: 50000,
    luck: 500,
    bonusPct: 50,
    bonus: 250,
    total: 750,
    perLuck: 67,
    kind: "reseller",
    allocationTarget: "pool",
    minMmk: 50000,
    tagline: "Wholesale entry — 50% bonus. Resell at your own price.",
  },
  {
    id: "reseller_silver",
    name: "Reseller · Silver",
    mmk: 100000,
    luck: 1000,
    bonusPct: 60,
    bonus: 600,
    total: 1600,
    perLuck: 63,
    kind: "reseller",
    allocationTarget: "pool",
    minMmk: 50000,
    tagline: "60% bonus — better margin for active resellers.",
  },
  {
    id: "reseller_gold",
    name: "Reseller · Gold",
    mmk: 250000,
    luck: 2500,
    bonusPct: 80,
    bonus: 2000,
    total: 4500,
    perLuck: 56,
    kind: "reseller",
    allocationTarget: "pool",
    minMmk: 50000,
    tagline: "80% bonus — high-volume wholesale tier.",
  },
  {
    id: "reseller_platinum",
    name: "Reseller · Platinum",
    mmk: 500000,
    luck: 5000,
    bonusPct: 100,
    bonus: 5000,
    total: 10000,
    perLuck: 50,
    kind: "reseller",
    allocationTarget: "pool",
    minMmk: 50000,
    tagline: "100% bonus — the best wholesale rate. Double your inventory.",
  },
];

export const ALL_TIERS = [...LUCK_TIERS, ...RESELLER_TIERS];

export function getTier(id: string): LuckTier | undefined {
  return ALL_TIERS.find((t) => t.id === id);
}

// ============================================================
// FEATURE COSTS (in Luck)
// ============================================================

export type FeatureId =
  | "astrologer_chat"
  | "birth_chart"
  | "insight"
  | "life_report"
  | "compatibility"
  | "mahabote"
  | "horoscope_personal"
  | "tarot_premium"
  | "numerology"
  | "positivity"
  | "dream_interpretation";

export const FEATURE_COSTS: Record<FeatureId, number> = {
  astrologer_chat: 2, // per message
  birth_chart: 3,
  insight: 3,
  life_report: 15,
  compatibility: 5,
  mahabote: 3,
  horoscope_personal: 2,
  tarot_premium: 1,
  numerology: 3,
  positivity: 1, // positivity script after free daily
  dream_interpretation: 2,
};

/** Free daily limits for freebie features. */
export const FREE_LIMITS = {
  tarot_per_day: 2, // 2 free tarot readings/day, then 1 Luck each
};

// ============================================================
// LUCK LEDGER OPERATIONS (server-only, transactional)
// ============================================================

/** Credit Luck to a user and record the ledger entry. */
export async function creditLuck(params: {
  userId: string;
  amount: number;
  type: string;
  feature?: string;
  description?: string;
  referenceId?: string;
}): Promise<number> {
  const { userId, amount, type, feature, description, referenceId } = params;
  if (amount === 0) return 0;
  // Atomic increment + read in a transaction
  const updated = await db.user.update({
    where: { id: userId },
    data: {
      luckBalance: { increment: amount },
      totalLuckEarned: amount > 0 ? { increment: amount } : undefined,
      totalLuckSpent: amount < 0 ? { increment: -amount } : undefined,
    },
    select: { luckBalance: true },
  });
  await db.luckTransaction.create({
    data: {
      userId,
      amount,
      balanceAfter: updated.luckBalance,
      type,
      feature: feature ?? null,
      description: description ?? null,
      referenceId: referenceId ?? null,
    },
  });
  return updated.luckBalance;
}

/** Debit Luck atomically. Returns false if insufficient balance.
 *
 * Uses a conditional update (WHERE balance >= amount) so two concurrent
 * requests cannot both pass the check and double-spend. This is the
 * standard pattern for preventing overdrafts in a single-SQL-statement
 * transaction.
 */
export async function debitLuck(params: {
  userId: string;
  amount: number;
  feature: FeatureId;
  description?: string;
  referenceId?: string;
}): Promise<{ ok: boolean; balance: number; reason?: string }> {
  const { userId, amount, feature, description, referenceId } = params;
  if (amount <= 0) return { ok: false, balance: 0, reason: "invalid_amount" };

  try {
    // Atomic conditional update — only decrements if balance is sufficient.
    // Prisma translates this to: UPDATE users SET balance = balance - :amount
    //   WHERE id = :userId AND balance >= :amount
    const updated = await db.user.updateMany({
      where: { id: userId, luckBalance: { gte: amount } },
      data: { luckBalance: { decrement: amount } },
    });

    if (updated.count === 0) {
      // Either user doesn't exist, or balance was insufficient.
      // Fetch the actual balance to disambiguate.
      const user = await db.user.findUnique({
        where: { id: userId },
        select: { luckBalance: true },
      });
      if (!user) return { ok: false, balance: 0, reason: "user_not_found" };
      return { ok: false, balance: user.luckBalance, reason: "insufficient_luck" };
    }

    // Fetch the new balance to return it to the caller
    const after = await db.user.findUnique({
      where: { id: userId },
      select: { luckBalance: true },
    });
    const newBalance = after?.luckBalance ?? 0;

    // Record the ledger entry
    await db.luckTransaction.create({
      data: {
        userId,
        amount: -amount,
        balanceAfter: newBalance,
        type: "spend",
        feature,
        description: description ?? `Spent ${amount} Luck on ${feature}`,
        referenceId: referenceId ?? null,
      },
    });

    return { ok: true, balance: newBalance };
  } catch (err) {
    console.error("debitLuck failed:", err);
    // Fetch current balance for the error response
    const user = await db.user.findUnique({
      where: { id: userId },
      select: { luckBalance: true },
    });
    return { ok: false, balance: user?.luckBalance ?? 0, reason: "db_error" };
  }
}

/** Check + debit in one call. Used by feature API routes.
 *
 * ADMIN BYPASS: users with role "admin" skip Luck charges entirely.
 * The function returns ok=true with their current balance, debits nothing,
 * and records no ledger entry. This lets admins/demo accounts exercise every
 * feature without buying Luck. Set BAYDIN_DISABLE_ADMIN_BYPASS=1 to disable.
 */
export async function spendForFeature(params: {
  userId: string;
  feature: FeatureId;
  referenceId?: string;
  description?: string;
}): Promise<{ ok: boolean; balance: number; cost: number; reason?: string }> {
  const cost = FEATURE_COSTS[params.feature];

  // Admin bypass — load user, check role
  if (process.env.BAYDIN_DISABLE_ADMIN_BYPASS !== "1") {
    const adminUser = await db.user.findUnique({
      where: { id: params.userId },
      select: { role: true, luckBalance: true },
    });
    if (adminUser?.role === "admin") {
      return { ok: true, balance: adminUser.luckBalance, cost: 0, reason: "admin_bypass" };
    }
  }

  const res = await debitLuck({
    userId: params.userId,
    amount: cost,
    feature: params.feature,
    description: params.description,
    referenceId: params.referenceId,
  });
  return { ...res, cost };
}

/** Reseller: transfer Luck from pool to a recipient's balance (the resell action).
 *
 * Uses a conditional updateMany inside a transaction so the pool debit
 * only succeeds if the reseller has sufficient pool — preventing the
 * race condition where two concurrent transfers could both pass the
 * pre-check and overdraft the pool.
 */
export async function resellerTransfer(params: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  saleMmk?: number;
  note?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const { fromUserId, toUserId, amount, saleMmk, note } = params;
  if (amount <= 0 || !Number.isFinite(amount)) return { ok: false, reason: "invalid_amount" };
  if (amount > 1_000_000) return { ok: false, reason: "invalid_amount" }; // sanity cap
  if (fromUserId === toUserId) return { ok: false, reason: "self_transfer" };

  try {
    const result = await db.$transaction(async (tx) => {
      // Verify reseller status
      const reseller = await tx.user.findUnique({
        where: { id: fromUserId },
        select: { resellerPool: true, role: true },
      });
      if (!reseller || (reseller.role !== "reseller" && reseller.role !== "admin")) {
        return { ok: false, reason: "not_reseller" as const };
      }

      // Atomic conditional debit — only succeeds if pool >= amount.
      // This prevents the race where two concurrent transfers both
      // pass the pre-check and overdraft the pool.
      const debit = await tx.user.updateMany({
        where: { id: fromUserId, resellerPool: { gte: amount } },
        data: { resellerPool: { decrement: amount } },
      });
      if (debit.count === 0) {
        return { ok: false, reason: "insufficient_pool" as const };
      }

      // Credit recipient
      const recipient = await tx.user.update({
        where: { id: toUserId },
        data: {
          luckBalance: { increment: amount },
          totalLuckEarned: { increment: amount },
        },
        select: { luckBalance: true },
      });

      // Record transfer + ledger entries
      await tx.luckTransfer.create({
        data: { fromUserId, toUserId, amount, saleMmk: saleMmk ?? null, note: note ?? null },
      });
      await tx.luckTransaction.create({
        data: {
          userId: toUserId,
          amount,
          balanceAfter: recipient.luckBalance,
          type: "reseller_transfer_in",
          description: `Luck received from reseller`,
        },
      });

      return { ok: true, recipientBalance: recipient.luckBalance };
    });

    return { ok: result.ok, reason: "reason" in result ? result.reason : undefined };
  } catch (err) {
    console.error("resellerTransfer failed:", err);
    return { ok: false, reason: "db_error" };
  }
}

// ============================================================
// DAILY REWARD (virality — 1 free Luck/day streak)
// ============================================================

export const DAILY_REWARD_BASE = 1; // base Luck per day
export const DAILY_REWARD_STREAK_BONUS = [0, 0, 1, 1, 2, 2, 3]; // bonus on day 3,5,7...
export const DAILY_REWARD_MAX = 5; // cap

export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}

export function getDailyRewardAmount(streakDay: number): number {
  const bonus = DAILY_REWARD_STREAK_BONUS[Math.min(streakDay - 1, DAILY_REWARD_STREAK_BONUS.length - 1)] ?? 0;
  return Math.min(DAILY_REWARD_BASE + bonus, DAILY_REWARD_MAX);
}

// ============================================================
// SIGNUP BONUS + REFERRAL
// ============================================================

export const SIGNUP_BONUS = 5; // free Luck on signup
export const REFERRAL_BONUS = 10; // referrer gets Luck when referee signs up + first purchase


/** Refund Luck to a user (e.g. when an LLM call fails after charging). */
export async function refundLuck({ userId, feature, amount, referenceId }: { userId: string; feature: string; amount: number; referenceId?: string }) {
  if (amount <= 0) return;
  try {
    await db.user.update({ where: { id: userId }, data: { luckBalance: { increment: amount } } });
    await db.luckTransaction.create({ data: { userId, type: "refund", feature, amount, referenceId, description: `Refund: ${feature}` } });
  } catch (e) { console.error("refundLuck error:", e); }
}
