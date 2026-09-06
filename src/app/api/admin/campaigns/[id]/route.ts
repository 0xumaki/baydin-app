import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH update an existing seasonal campaign (status, dates, overrides). */
export const PATCH = withAuth(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const data: Record<string, any> = {};
  if (typeof body.name === "string") data.name = body.name;
  if (typeof body.kind === "string" && (body.kind === "user" || body.kind === "reseller")) data.kind = body.kind;
  if (typeof body.tierId === "string") data.tierId = body.tierId;
  if (typeof body.mmkOverride === "number" || body.mmkOverride === null) data.mmkOverride = body.mmkOverride ?? null;
  if (typeof body.bonusPctOverride === "number" || body.bonusPctOverride === null) data.bonusPctOverride = body.bonusPctOverride ?? null;
  if (typeof body.active === "boolean") data.active = body.active;
  if (typeof body.description === "string") data.description = body.description;
  if (body.validFrom) {
    const d = new Date(body.validFrom);
    if (!isNaN(d.getTime())) data.validFrom = d;
  }
  if (body.validUntil) {
    const d = new Date(body.validUntil);
    if (!isNaN(d.getTime())) data.validUntil = d;
  }
  if (Object.keys(data).length === 0) {
    return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
  }
  const updated = await db.seasonalCampaign.update({ where: { id }, data });
  return NextResponse.json({ campaign: updated });
});

/** DELETE soft-deletes a campaign by setting active=false. */
export const DELETE = withAuth(async (_req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const updated = await db.seasonalCampaign.update({
    where: { id },
    data: { active: false },
  });
  return NextResponse.json({ ok: true, campaign: updated });
});
