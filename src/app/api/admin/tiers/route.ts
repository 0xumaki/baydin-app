import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { LUCK_TIERS, RESELLER_TIERS } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET list of all tier overrides + custom tiers + the static catalog
 *  (for admin management). */
export const GET = withAuth(async () => {
  await requireAdmin();
  const [overrides, customs] = await Promise.all([
    db.luckTierOverride.findMany({ orderBy: { tierId: "asc" } }),
    db.luckTierCustom.findMany({ orderBy: { sortOrder: "asc" } }),
  ]);
  return NextResponse.json({
    staticTiers: { regular: LUCK_TIERS, reseller: RESELLER_TIERS },
    overrides,
    customs,
  });
});

/** POST creates a new custom tier OR upserts an override for an existing tier. */
export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));

  // Override case: tierId already in static catalog; create LuckTierOverride row
  const staticIds = new Set([...LUCK_TIERS.map((t) => t.id), ...RESELLER_TIERS.map((t) => t.id)]);
  if (staticIds.has(body.tierId) && body.action !== "custom") {
    const override = await db.luckTierOverride.upsert({
      where: { tierId: body.tierId },
      create: {
        tierId: body.tierId,
        mmkOverride: body.mmkOverride ?? null,
        luckOverride: body.luckOverride ?? null,
        bonusPctOverride: body.bonusPctOverride ?? null,
        taglineOverride: body.taglineOverride ?? null,
        active: body.active ?? true,
      },
      update: {
        mmkOverride: body.mmkOverride ?? undefined,
        luckOverride: body.luckOverride ?? undefined,
        bonusPctOverride: body.bonusPctOverride ?? undefined,
        taglineOverride: body.taglineOverride ?? undefined,
        active: body.active ?? undefined,
      },
    });
    return NextResponse.json({ override });
  }

  // Custom tier: create LuckTierCustom row
  const required = ["tierId", "name", "kind", "mmk", "luck", "bonusPct"];
  for (const k of required) {
    if (body[k] === undefined || body[k] === null || body[k] === "") {
      return NextResponse.json({ error: `${k} is required for a custom tier.` }, { status: 400 });
    }
  }
  if (body.kind !== "regular" && body.kind !== "reseller") {
    return NextResponse.json({ error: "kind must be 'regular' or 'reseller'." }, { status: 400 });
  }
  const custom = await db.luckTierCustom.upsert({
    where: { tierId: body.tierId },
    create: {
      tierId: body.tierId,
      name: String(body.name),
      kind: String(body.kind),
      mmk: Number(body.mmk),
      luck: Number(body.luck),
      bonusPct: Number(body.bonusPct),
      tagline: body.tagline ?? null,
      popular: body.popular ?? false,
      active: body.active ?? true,
      sortOrder: body.sortOrder ?? 100,
    },
    update: {
      name: body.name ?? undefined,
      kind: body.kind ?? undefined,
      mmk: body.mmk ?? undefined,
      luck: body.luck ?? undefined,
      bonusPct: body.bonusPct ?? undefined,
      tagline: body.tagline ?? undefined,
      popular: body.popular ?? undefined,
      active: body.active ?? undefined,
      sortOrder: body.sortOrder ?? undefined,
    },
  });
  return NextResponse.json({ custom });
});
