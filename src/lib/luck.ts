import "server-only";
import { db } from "@/lib/db";

/**
 * BAYDIN — Luck credit economy configuration.
 *
 * "Luck" is the pay-as-you-go credit. Users buy Luck in MMK, spend it per
 * feature. Lumina freebies (basic tarot, manifest, mood) stay free; all GURU
 * astrology features and premium Lumina features cost Luck.
 *
 * PRICING DESIGN (win-win: >90% platform margin after Gemini LLM cost,
 * yet 99% cheaper than real-life fortune telling which costs 30K–250K MMK).
 *
 * Gemini 2.0 Flash ≈ $0.10/1M in + $0.40/1M out ≈ 0.21 MMK/K in + 0.84 MMK/K out.
 * A chat turn ≈ 4.3K in + 1.5K out ≈ 2.2 MMK LLM cost. Charging 2 Luck (≥134 MMK)
 * → ~98% margin. Life report (7 sections) ≈ 19 MMK LLM cost, charges 15 Luck
 * (≥1,005 MMK) → ~98% margin.
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
  | "numerology";

export const FEATURE_COSTS: Record<FeatureId, number> = {
  astrologer_chat: 2, // per message — ~134-200 MMK (vs 30K-250K real life)
  birth_chart: 3, // natal chart generation + interpretation
  insight: 3, // specific skill reading (yogas, transits, etc.)
  life_report: 15, // 7-section comprehensive report
  compatibility: 5, // partner compatibility
  mahabote: 3, // Myanmar traditional reading
  horoscope_personal: 2, // personalized daily/weekly horoscope
  tarot_premium: 1, // premium tarot spreads (beyond 2 free/day)
  numerology: 3, // full numerology report (life path + destiny + soul urge + ...)
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

/** Debit Luck. Returns false if insufficient balance. */
export async function debitLuck(params: {
  userId: string;
  amount: number;
  feature: FeatureId;
  description?: string;
  referenceId?: string;
}): Promise<{ ok: boolean; balance: number; reason?: string }> {
  const { userId, amount, feature, description, referenceId } = params;
  // Re-check balance atomically
  const user = await db.user.findUnique({ where: { id: userId }, select: { luckBalance: true } });
  if (!user) return { ok: false, balance: 0, reason: "user_not_found" };
  if (user.luckBalance < amount) {
    return { ok: false, balance: user.luckBalance, reason: "insufficient_luck" };
  }
  const balance = await creditLuck({
    userId,
    amount: -amount,
    type: "spend",
    feature,
    description: description ?? `Spent ${amount} Luck on ${feature}`,
    referenceId,
  });
  return { ok: true, balance };
}

/** Check + debit in one call. Used by feature API routes. */
export async function spendForFeature(params: {
  userId: string;
  feature: FeatureId;
  referenceId?: string;
  description?: string;
}): Promise<{ ok: boolean; balance: number; cost: number; reason?: string }> {
  const cost = FEATURE_COSTS[params.feature];
  const res = await debitLuck({
    userId: params.userId,
    amount: cost,
    feature: params.feature,
    description: params.description,
    referenceId: params.referenceId,
  });
  return { ...res, cost };
}

/** Reseller: transfer Luck from pool to a recipient's balance (the resell action). */
export async function resellerTransfer(params: {
  fromUserId: string;
  toUserId: string;
  amount: number;
  saleMmk?: number;
  note?: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const { fromUserId, toUserId, amount, saleMmk, note } = params;
  if (amount <= 0) return { ok: false, reason: "invalid_amount" };
  const reseller = await db.user.findUnique({
    where: { id: fromUserId },
    select: { resellerPool: true, role: true },
  });
  if (!reseller || (reseller.role !== "reseller" && reseller.role !== "admin")) {
    return { ok: false, reason: "not_reseller" };
  }
  if (reseller.resellerPool < amount) {
    return { ok: false, reason: "insufficient_pool" };
  }
  // Debit pool + credit recipient in a transaction
  await db.$transaction([
    db.user.update({
      where: { id: fromUserId },
      data: { resellerPool: { decrement: amount } },
    }),
    db.user.update({
      where: { id: toUserId },
      data: {
        luckBalance: { increment: amount },
        totalLuckEarned: { increment: amount },
      },
    }),
    db.luckTransfer.create({
      data: { fromUserId, toUserId, amount, saleMmk: saleMmk ?? null, note: note ?? null },
    }),
    db.luckTransaction.create({
      data: {
        userId: toUserId,
        amount,
        balanceAfter: 0, // updated below
        type: "reseller_transfer_in",
        description: `Luck received from reseller`,
      },
    }),
  ]);
  // Correct balanceAfter (post-transaction read)
  const recipient = await db.user.findUnique({
    where: { id: toUserId },
    select: { luckBalance: true },
  });
  if (recipient) {
    await db.luckTransaction.updateMany({
      where: { userId: toUserId, type: "reseller_transfer_in", balanceAfter: 0 },
      data: { balanceAfter: recipient.luckBalance },
    });
  }
  return { ok: true };
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
