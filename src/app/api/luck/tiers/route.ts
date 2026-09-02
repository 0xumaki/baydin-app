import { NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { LUCK_TIERS, RESELLER_TIERS } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  const isReseller = user && (user.role === "reseller" || user.role === "admin");
  return NextResponse.json({
    regular: LUCK_TIERS,
    reseller: isReseller ? RESELLER_TIERS : null,
  });
}
