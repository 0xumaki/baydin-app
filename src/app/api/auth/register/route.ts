import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, generateReferralCode } from "@/lib/auth";
import { creditLuck, SIGNUP_BONUS, REFERRAL_BONUS } from "@/lib/luck";
import { checkRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Simple but robust email validation (RFC 5322 simplified)
const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const NAME_RE = /^[\p{L}\p{M}\s.'-]{0,80}$/u;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 5 registrations per IP per 15 min
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (!checkRateLimit(`register:${ip}`, 5, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many signup attempts. Please try again later." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password, name, referralCode, language } = body;
    if (!email || typeof email !== "string" || !EMAIL_RE.test(email)) {
      return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
    }
    if (!password || typeof password !== "string") {
      return NextResponse.json({ error: "Password is required." }, { status: 400 });
    }
    if (password.length < 6 || password.length > 200) {
      return NextResponse.json({ error: "Password must be 6-200 characters." }, { status: 400 });
    }
    if (name !== undefined && name !== null && (typeof name !== "string" || !NAME_RE.test(name))) {
      return NextResponse.json({ error: "Name contains invalid characters." }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (normalizedEmail.length > 320) {
      return NextResponse.json({ error: "Email address is too long." }, { status: 400 });
    }
    const existing = await db.user.findUnique({ where: { email: normalizedEmail } });
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
        email: normalizedEmail,
        hashedPassword,
        name: name?.trim() || null,
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
      // Upsert ReferralEarning so future first-purchase attribution has a row
      try {
        await db.referralEarning.create({
          data: {
            referrerId,
            refereeId: user.id,
            signupBonusLuck: REFERRAL_BONUS,
            totalLuck: REFERRAL_BONUS,
          },
        });
      } catch (e: any) {
        // If the row already exists (shouldn't for a brand-new user), fall back to update
        if (e?.code === "P2002") {
          await db.referralEarning.update({
            where: { referrerId_refereeId: { referrerId, refereeId: user.id } },
            data: { signupBonusLuck: { increment: REFERRAL_BONUS }, totalLuck: { increment: REFERRAL_BONUS } },
          });
        } else {
          console.error("[register] ReferralEarning upsert failed:", e);
        }
      }
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
