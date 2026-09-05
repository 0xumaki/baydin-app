import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { getEffectiveTiers } from "@/lib/luck";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET the live Luck tier catalog (regular + reseller) merged with DB
 *  overrides, custom tiers, and active seasonal campaign overlays. */
export async function GET() {
  const user = await getCurrentUser();
  const isReseller = user && (user.role === "reseller" || user.role === "admin");
  const { regular, reseller } = await getEffectiveTiers();

  // Overlay active seasonal campaigns (override mmk + bonusPct for matching tierId)
  const now = new Date();
  let campaigns: any[] = [];
  try {
    campaigns = await db.seasonalCampaign.findMany({
      where: {
        active: true,
        validFrom: { lte: now },
        validUntil: { gte: now },
      },
    });
  } catch (e) {
    // Tolerate missing/just-pushed schema — campaigns overlay is non-critical
    console.error("[luck/tiers] campaign overlay failed:", e);
  }
  const applyCampaign = (t: any) => {
    const c = campaigns.find(
      (c) =>
        c.tierId === t.id &&
        (c.kind === (t.kind === "reseller" ? "reseller" : "user")),
    );
    if (!c) return t;
    const mmk = c.mmkOverride ?? t.mmk;
    const bonusPct = c.bonusPctOverride ?? t.bonusPct;
    const bonus = Math.round((t.luck * bonusPct) / 100);
    const total = t.luck + bonus;
    const perLuck = total > 0 ? Math.round((mmk / total) * 100) / 100 : 0;
    return {
      ...t,
      mmk,
      bonusPct,
      bonus,
      total,
      perLuck,
      campaign: { id: c.id, name: c.name, kind: c.kind },
    };
  };
  const regularOverlay = regular.map(applyCampaign);
  const resellerOverlay = isReseller ? reseller.map(applyCampaign) : null;

  return NextResponse.json({
    regular: regularOverlay,
    reseller: resellerOverlay,
    campaigns: campaigns.map((c) => ({
      id: c.id, name: c.name, kind: c.kind, tierId: c.tierId,
      mmkOverride: c.mmkOverride, bonusPctOverride: c.bonusPctOverride,
      validFrom: c.validFrom, validUntil: c.validUntil,
    })),
  });
}
