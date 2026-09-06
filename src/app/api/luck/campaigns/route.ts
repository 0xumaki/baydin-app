import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { withAuth } from "@/lib/api-handler";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/** GET active seasonal campaigns — accessible to any user (signed-in or
 *  not) so the Luck store can show campaign badges before login. */
export const GET = withAuth(async () => {
  const now = new Date();
  const campaigns = await db.seasonalCampaign.findMany({
    where: {
      active: true,
      validFrom: { lte: now },
      validUntil: { gte: now },
    },
    orderBy: { validUntil: "asc" },
  });
  return NextResponse.json({ campaigns, now: now.toISOString() });
});
