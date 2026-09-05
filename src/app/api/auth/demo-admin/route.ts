import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { hashPassword, createSession, generateReferralCode } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * DEMO ADMIN BYPASS — one-click login as an admin user.
 *
 * SECURITY: This endpoint is GATED to non-production environments only.
 * In production, set BAYDIN_DISABLE_DEMO_ADMIN=1 (or rely on NODE_ENV=production
 * which auto-disables it).
 *
 * Creates (or refreshes) an admin@baydin.app user with role=admin and a
 * generous Luck balance. Admins bypass all Luck charges (see spendForFeature).
 *
 * Rate-limited to 10 calls per IP per hour to prevent abuse.
 */

const DEMO_EMAIL = "admin@baydin.app";
const DEMO_PASSWORD = "baydin-admin-2026";
const DEMO_NAME = "Baydin Admin";
const DEMO_LUCK = 99999;

export async function POST(req: NextRequest) {
  // Auto-disable in production unless explicitly enabled
  if (process.env.NODE_ENV === "production" && process.env.BAYDIN_ENABLE_DEMO_ADMIN !== "1") {
    return NextResponse.json(
      { error: "Demo admin login is disabled in production." },
      { status: 403 }
    );
  }
  if (process.env.BAYDIN_DISABLE_DEMO_ADMIN === "1") {
    return NextResponse.json(
      { error: "Demo admin login is disabled in this environment." },
      { status: 403 }
    );
  }

  // Rate limit: 10 calls per IP per hour
  const ip = getClientIp(req);
  if (!checkRateLimit(`demo-admin:${ip}`, 10, 60 * 60 * 1000)) {
    return NextResponse.json(
      { error: "Too many demo admin attempts. Please try again later." },
      { status: 429, headers: { "Retry-After": "3600" } }
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
