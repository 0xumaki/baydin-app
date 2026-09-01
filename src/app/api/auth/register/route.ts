import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, generateReferralCode } from "@/lib/auth";
import { creditLuck, SIGNUP_BONUS, REFERRAL_BONUS } from "@/lib/luck";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const { email, password, name, referralCode, language } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length < 6) {
      return NextResponse.json({ error: "Password must be at least 6 characters." }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email: email.toLowerCase() } });
    if (existing) {
      return NextResponse.json({ error: "An account with this email already exists." }, { status: 409 });
    }

    const hashedPassword = await hashPassword(password);
    let referrerId: string | null = null;
    if (referralCode) {
      const referrer = await db.user.findUnique({ where: { referralCode } });
      if (referrer) referrerId = referrer.id;
    }

    // Generate a unique referral code
    let code = generateReferralCode();
    while (await db.user.findUnique({ where: { referralCode: code } })) {
      code = generateReferralCode();
    }

    const user = await db.user.create({
      data: {
        email: email.toLowerCase(),
        hashedPassword,
        name: name || null,
        language: language || "my",
        referralCode: code,
        referredById: referrerId,
        luckBalance: SIGNUP_BONUS,
        totalLuckEarned: SIGNUP_BONUS,
      },
    });

    // Signup bonus ledger entry
    await db.luckTransaction.create({
      data: {
        userId: user.id,
        amount: SIGNUP_BONUS,
        balanceAfter: SIGNUP_BONUS,
        type: "signup_bonus",
        description: `Welcome to Baydin — ${SIGNUP_BONUS} Luck gifted`,
      },
    });

    // Referrer bonus (granted on referee's first purchase in production; grant small bonus now)
    if (referrerId) {
      await creditLuck({
        userId: referrerId,
        amount: REFERRAL_BONUS,
        type: "referral_bonus",
        description: `Referral bonus — ${user.email} joined with your code`,
      });
    }

    await createSession(user.id);
    return NextResponse.json({
      user: { id: user.id, email: user.email, name: user.name, luckBalance: user.luckBalance, referralCode: user.referralCode, role: user.role, language: user.language },
    });
  } catch (err: any) {
    console.error("Register error:", err);
    return NextResponse.json({ error: "Registration failed. Please try again." }, { status: 500 });
  }
}
