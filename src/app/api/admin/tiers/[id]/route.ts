import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** PATCH updates an existing override or custom tier. */
export const PATCH = withAuth(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));

  // Try override first
  const override = await db.luckTierOverride.findUnique({ where: { tierId: id } }).catch(() => null);
  if (override) {
    const data: Record<string, any> = {};
    if (body.mmkOverride !== undefined) data.mmkOverride = body.mmkOverride;
    if (body.luckOverride !== undefined) data.luckOverride = body.luckOverride;
    if (body.bonusPctOverride !== undefined) data.bonusPctOverride = body.bonusPctOverride;
    if (body.taglineOverride !== undefined) data.taglineOverride = body.taglineOverride;
    if (typeof body.active === "boolean") data.active = body.active;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const updated = await db.luckTierOverride.update({ where: { tierId: id }, data });
    return NextResponse.json({ override: updated });
  }

  // Try custom
  const custom = await db.luckTierCustom.findUnique({ where: { tierId: id } }).catch(() => null);
  if (custom) {
    const data: Record<string, any> = {};
    if (typeof body.name === "string") data.name = body.name;
    if (body.kind === "regular" || body.kind === "reseller") data.kind = body.kind;
    if (typeof body.mmk === "number") data.mmk = body.mmk;
    if (typeof body.luck === "number") data.luck = body.luck;
    if (typeof body.bonusPct === "number") data.bonusPct = body.bonusPct;
    if (body.tagline !== undefined) data.tagline = body.tagline;
    if (typeof body.popular === "boolean") data.popular = body.popular;
    if (typeof body.active === "boolean") data.active = body.active;
    if (typeof body.sortOrder === "number") data.sortOrder = body.sortOrder;
    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }
    const updated = await db.luckTierCustom.update({ where: { tierId: id }, data });
    return NextResponse.json({ custom: updated });
  }

  return NextResponse.json({ error: "Tier not found." }, { status: 404 });
});

/** DELETE removes an override or soft-deletes a custom tier (active=false). */
export const DELETE = withAuth(async (req: NextRequest, ctx: { params: Promise<{ id: string }> }) => {
  await requireAdmin();
  const { id } = await ctx.params;

  const override = await db.luckTierOverride.findUnique({ where: { tierId: id } }).catch(() => null);
  if (override) {
    await db.luckTierOverride.delete({ where: { tierId: id } });
    return NextResponse.json({ ok: true, deleted: "override" });
  }

  const custom = await db.luckTierCustom.findUnique({ where: { tierId: id } }).catch(() => null);
  if (custom) {
    // Soft delete: mark inactive so historical purchases still resolve
    const updated = await db.luckTierCustom.update({ where: { tierId: id }, data: { active: false } });
    return NextResponse.json({ ok: true, deleted: "custom", custom: updated });
  }

  return NextResponse.json({ error: "Tier not found." }, { status: 404 });
});
