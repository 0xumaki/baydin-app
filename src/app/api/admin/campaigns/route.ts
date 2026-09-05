import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";
import { ALL_TIERS } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET list of all seasonal campaigns. */
export const GET = withAuth(async () => {
  await requireAdmin();
  const campaigns = await db.seasonalCampaign.findMany({
    orderBy: { createdAt: "desc" },
    take: 200,
  });
  return NextResponse.json({ campaigns });
});

/** POST create a new seasonal campaign. */
export const POST = withAuth(async (req: NextRequest) => {
  await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { name, kind, tierId, mmkOverride, bonusPctOverride, validFrom, validUntil, description } = body;
  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "name is required." }, { status: 400 });
  }
  if (kind !== "user" && kind !== "reseller") {
    return NextResponse.json({ error: "kind must be 'user' or 'reseller'." }, { status: 400 });
  }
  if (!tierId || typeof tierId !== "string") {
    return NextResponse.json({ error: "tierId is required." }, { status: 400 });
  }
  // Validate tierId is a known tier
  const knownTier = ALL_TIERS.find((t) => t.id === tierId);
  if (!knownTier) {
    return NextResponse.json({ error: `tierId "${tierId}" is not a known tier.` }, { status: 400 });
  }
  // Validate tier kind matches campaign kind
  if (knownTier.kind !== kind) {
    return NextResponse.json({ error: `tier "${tierId}" is a ${knownTier.kind} tier, not a ${kind} tier.` }, { status: 400 });
  }
  const from = validFrom ? new Date(validFrom) : new Date();
  const until = validUntil ? new Date(validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
  if (isNaN(from.getTime()) || isNaN(until.getTime())) {
    return NextResponse.json({ error: "Invalid date range." }, { status: 400 });
  }
  const campaign = await db.seasonalCampaign.create({
    data: {
      name: name.trim(),
      kind,
      tierId,
      mmkOverride: typeof mmkOverride === "number" ? mmkOverride : null,
      bonusPctOverride: typeof bonusPctOverride === "number" ? bonusPctOverride : null,
      validFrom: from,
      validUntil: until,
      active: true,
      description: typeof description === "string" ? description : null,
    },
  });
  return NextResponse.json({ campaign });
});
