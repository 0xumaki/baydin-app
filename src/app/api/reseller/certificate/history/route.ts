import { NextResponse } from "next/server";
import { requireReseller } from "@/lib/auth";
import { withAuth } from "@/lib/api-handler";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET the reseller's own certificate history (issued-to + issued-by). */
export const GET = withAuth(async () => {
  const me = await requireReseller();
  const [issuedToMe, issuedByMe] = await Promise.all([
    db.resellerCertificate.findMany({
      where: { userId: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    db.resellerCertificate.findMany({
      where: { issuedById: me.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
  ]);
  return NextResponse.json({ issuedToMe, issuedByMe });
});
