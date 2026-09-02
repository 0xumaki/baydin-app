import { NextRequest, NextResponse } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });
  return NextResponse.json({
    user: {
      id: user.id, email: user.email, name: user.name,
      luckBalance: user.luckBalance, referralCode: user.referralCode,
      role: user.role, language: user.language,
      birthData: user.birthData ? JSON.parse(user.birthData) : null,
      resellerTier: user.resellerTier,
      resellerPool: user.resellerPool,
      streak: user.streak,
      totalLuckEarned: user.totalLuckEarned,
      totalLuckSpent: user.totalLuckSpent,
      createdAt: user.createdAt,
    },
  });
}

export async function PATCH(req: NextRequest) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const data: any = {};
  if (body.name !== undefined) data.name = body.name;
  if (body.language !== undefined) data.language = body.language;
  if (body.birthData !== undefined) {
    data.birthData = typeof body.birthData === "string" ? body.birthData : JSON.stringify(body.birthData);
  }
  const updated = await db.user.update({ where: { id: user.id }, data });
  return NextResponse.json({
    user: {
      id: updated.id, email: updated.email, name: updated.name,
      luckBalance: updated.luckBalance, referralCode: updated.referralCode,
      role: updated.role, language: updated.language,
      birthData: updated.birthData ? JSON.parse(updated.birthData) : null,
    },
  });
}
