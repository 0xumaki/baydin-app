import { NextRequest, NextResponse } from "next/server";
import { requireReseller } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { issueCertificate, type CertKind } from "@/lib/certificates";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** Self-service: a reseller generates their own branded certificate.
 *  Body: { kind?: "promotion"|"tier_upgrade"|"welcome" }
 *  The tier is taken from the user's resellerTier (cannot forge a higher tier). */
export const POST = withAuth(async (req: NextRequest) => {
  const me = await requireReseller();
  if (!me.resellerTier) {
    return NextResponse.json({ error: "No reseller tier assigned." }, { status: 400 });
  }
  const body = await req.json().catch(() => ({}));
  const validKinds: CertKind[] = ["promotion", "tier_upgrade", "welcome"];
  if (body.kind && !validKinds.includes(body.kind)) {
    return NextResponse.json({ error: `kind must be one of: ${validKinds.join(", ")}` }, { status: 400 });
  }
  const kind: CertKind = body.kind || "welcome";

  const cert = await issueCertificate({
    userId: me.id,
    tier: me.resellerTier,
    kind,
    issuedById: me.id, // self-issued; admin can later issue authoritative ones
    metadata: { selfService: true },
  });
  return NextResponse.json({ certificate: cert });
});
