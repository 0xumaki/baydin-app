import { NextRequest, NextResponse } from "next/server";
import { parseBirthData, sanitizeString } from "@/lib/validate";
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
      birthData: parseBirthData(user.birthData),
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
  try {
    const user = await getCurrentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    const body = await req.json().catch(() => ({}));
    const data: any = {};

    if (typeof body.name === "string") {
      data.name = sanitizeString(body.name, 80, null);
    }
    if (typeof body.language === "string") {
      const validLangs = ["en", "my", "th", "kh", "lo"];
      data.language = validLangs.includes(body.language) ? body.language : "my";
    }
    if (body.birthData !== undefined) {
      // Store as JSON string; validate it parses
      const json = typeof body.birthData === "string" ? body.birthData : JSON.stringify(body.birthData);
      // Verify it parses before storing
      try { JSON.parse(json); } catch {
        return NextResponse.json({ error: "Invalid birth data format." }, { status: 400 });
      }
      data.birthData = json;
    }

    if (Object.keys(data).length === 0) {
      return NextResponse.json({ error: "Nothing to update." }, { status: 400 });
    }

    const updated = await db.user.update({ where: { id: user.id }, data });
    return NextResponse.json({
      user: {
        id: updated.id, email: updated.email, name: updated.name,
        luckBalance: updated.luckBalance, referralCode: updated.referralCode,
        role: updated.role, language: updated.language,
        birthData: parseBirthData(updated.birthData),
      },
    });
  } catch (err) {
    console.error("Update me failed:", err);
    return NextResponse.json({ error: "Failed to update profile." }, { status: 500 });
  }
}
