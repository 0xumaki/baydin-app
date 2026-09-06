import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { issueCertificate, type CertKind } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_BULK = 50;

type BulkItem = {
  userId: string;
  tier: string;
  kind?: string;
  campaignId?: string;
  metadata?: Record<string, any>;
};

/** Admin issues up to 50 reseller certificates in one request. */
export const POST = withAuth(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const items: BulkItem[] = Array.isArray(body.items) ? body.items : [];
  if (items.length === 0) {
    return NextResponse.json({ error: "items[] is required." }, { status: 400 });
  }
  if (items.length > MAX_BULK) {
    return NextResponse.json({ error: `Maximum ${MAX_BULK} certificates per request.` }, { status: 400 });
  }

  const validKinds: CertKind[] = ["promotion", "tier_upgrade", "welcome"];
  const results: { ok: boolean; userId: string; certificate?: any; error?: string }[] = [];
  for (const item of items) {
    if (!item.userId || !item.tier) {
      results.push({ ok: false, userId: item.userId ?? "", error: "userId and tier required." });
      continue;
    }
    try {
      const kind: CertKind = validKinds.includes(item.kind as CertKind)
        ? (item.kind as CertKind)
        : "promotion";
      const cert = await issueCertificate({
        userId: item.userId,
        tier: item.tier,
        kind,
        issuedById: admin.id,
        campaignId: item.campaignId ?? null,
        metadata: item.metadata ?? null,
      });
      results.push({ ok: true, userId: item.userId, certificate: cert });
    } catch (e: any) {
      results.push({ ok: false, userId: item.userId, error: e?.message ?? "issue failed" });
    }
  }
  const ok = results.filter((r) => r.ok).length;
  const failed = results.length - ok;
  return NextResponse.json({ ok: true, issued: ok, failed, results });
});
