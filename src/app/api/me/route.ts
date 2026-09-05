import { NextRequest, NextResponse } from "next/server";
import { parseBirthData, sanitizeString } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { computeStipendDue, getSpecialRank } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ user: null }, { status: 200 });

  // Auto-grant special rank stipend if due (idempotent — only fires once per period)
  let stipendGranted = 0;
  let newBalance = user.luckBalance;
  let stipendLastAt = user.stipendLastAt;
  const due = computeStipendDue(user.specialRank, user.stipendLastAt);
  if (due > 0) {
    try {
      const updated = await db.user.update({
        where: { id: user.id },
        data: {
          stipendLuck: { increment: due },
          stipendLastAt: new Date(),
          luckBalance: { increment: due },
          totalLuckEarned: { increment: due },
        },
        select: { luckBalance: true, stipendLuck: true, stipendLastAt: true },
      });
      stipendGranted = due;
      newBalance = updated.luckBalance;
      stipendLastAt = updated.stipendLastAt;
      await db.luckTransaction.create({
        data: {
          userId: user.id,
          amount: due,
          balanceAfter: newBalance,
          type: "admin_grant",
          description: `Special rank stipend (${user.specialRank})`,
        },
      });
    } catch (e) {
      console.error("[me] stipend grant failed:", e);
    }
  }

  const rank = getSpecialRank(user.specialRank);
  return NextResponse.json({
    user: {
      id: user.id, email: user.email, name: user.name,
      luckBalance: newBalance, referralCode: user.referralCode,
      role: user.role, language: user.language,
      birthData: parseBirthData(user.birthData),
      resellerTier: user.resellerTier,
      resellerPool: user.resellerPool,
      streak: user.streak,
      totalLuckEarned: user.totalLuckEarned,
      totalLuckSpent: user.totalLuckSpent,
      createdAt: user.createdAt,
      specialRank: user.specialRank,
      specialRankSince: user.specialRankSince,
      specialRankInfo: rank ? {
        name: rank.name, color: rank.color, bonusPct: rank.bonusPct,
        stipendLuck: rank.stipendLuck, stipendPeriodDays: rank.stipendPeriodDays,
        description: rank.description,
      } : null,
      stipendLuck: user.stipendLuck,
      stipendLastAt,
      stipendGrantedThisRequest: stipendGranted,
      lifetimeMmkSpent: user.lifetimeMmkSpent,
      lifetimeResellerMmk: user.lifetimeResellerMmk,
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
      data.name = sanitizeString(body.name, 80, "");
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
