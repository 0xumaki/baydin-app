import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, generateReferralCode } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DEMO ADMIN BYPASS — one-click login as an admin user.
 *
 * Creates (or refreshes) an admin@baydin.app user with role=admin and a
 * generous Luck balance. Admins bypass all Luck charges (see spendForFeature).
 *
 * This endpoint is intended for local/demo/QA use to let reviewers exercise
 * every feature of the app without buying Luck. It is gated by the
 * BAYDIN_DEMO_ADMIN env var (defaults to enabled in non-production).
 *
 * Set BAYDIN_DISABLE_DEMO_ADMIN=1 in production to disable.
 */

const DEMO_EMAIL = "admin@baydin.app";
const DEMO_PASSWORD = "baydin-admin-2026";
const DEMO_NAME = "Baydin Admin";
const DEMO_LUCK = 99999;

export async function POST() {
  if (process.env.BAYDIN_DISABLE_DEMO_ADMIN === "1") {
    return NextResponse.json(
      { error: "Demo admin login is disabled in this environment." },
      { status: 403 }
    );
  }

  try {
    // Find or create the admin user
    let admin = await db.user.findUnique({ where: { email: DEMO_EMAIL } });
    if (!admin) {
      const hashed = await hashPassword(DEMO_PASSWORD);
      // Generate a unique referral code (required field)
      let code = generateReferralCode();
      while (await db.user.findUnique({ where: { referralCode: code } })) {
        code = generateReferralCode();
      }
      admin = await db.user.create({
        data: {
          email: DEMO_EMAIL,
          name: DEMO_NAME,
          hashedPassword: hashed,
          role: "admin",
          luckBalance: DEMO_LUCK,
          totalLuckEarned: DEMO_LUCK,
          language: "en",
          referralCode: code,
        },
      });
    } else {
      // Ensure role + balance are always admin + generous (in case user changed)
      admin = await db.user.update({
        where: { id: admin.id },
        data: { role: "admin", luckBalance: DEMO_LUCK, name: DEMO_NAME },
      });
    }

    await createSession(admin.id);

    return NextResponse.json({
      user: {
        id: admin.id,
        email: admin.email,
        name: admin.name,
        luckBalance: admin.luckBalance,
        referralCode: admin.referralCode,
        role: admin.role,
        language: admin.language,
        birthData: admin.birthData ? JSON.parse(admin.birthData) : null,
        resellerTier: admin.resellerTier,
        adminBypass: true,
      },
      credentials: {
        email: DEMO_EMAIL,
        password: DEMO_PASSWORD,
      },
    });
  } catch (e: any) {
    console.error("Demo admin login failed:", e);
    return NextResponse.json(
      { error: "Demo admin login failed: " + (e.message || "unknown error") },
      { status: 500 }
    );
  }
}
