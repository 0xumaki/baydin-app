import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { issueCertificate, type CertKind } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Admin issues a single reseller certificate to a user. */
export const POST = withAuth(async (req: NextRequest) => {
  const admin = await requireAdmin();
  const body = await req.json().catch(() => ({}));
  const { userId, tier, kind, campaignId, metadata } = body;
  if (!userId || typeof userId !== "string") {
    return NextResponse.json({ error: "userId is required." }, { status: 400 });
  }
  if (!tier || typeof tier !== "string") {
    return NextResponse.json({ error: "tier is required." }, { status: 400 });
  }
  const validKinds: CertKind[] = ["promotion", "tier_upgrade", "welcome"];
  const certKind: CertKind = validKinds.includes(kind) ? kind : "promotion";
  const cert = await issueCertificate({
    userId,
    tier,
    kind: certKind,
    issuedById: admin.id,
    campaignId: campaignId ?? null,
    metadata: metadata ?? null,
  });
  return NextResponse.json({ certificate: cert });
});
