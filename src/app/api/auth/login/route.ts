import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { db } from "@/lib/db";
import { verifyPassword, createSession } from "@/lib/auth";
import { checkRateLimit, getClientIp } from "@/lib/rate-limit";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const EMAIL_RE = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;

export async function POST(req: NextRequest) {
  try {
    // Rate limit: 10 login attempts per IP per 15 min
    const ip = getClientIp(req);
    if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
      return NextResponse.json(
        { error: "Too many login attempts. Please try again in 15 minutes." },
        { status: 429, headers: { "Retry-After": "900" } }
      );
    }

    const body = await req.json().catch(() => ({}));
    const { email, password } = body;
    if (!email || typeof email !== "string" || !password || typeof password !== "string") {
      return NextResponse.json({ error: "Email and password are required." }, { status: 400 });
    }
    if (password.length > 1000) {
      return NextResponse.json({ error: "Invalid input." }, { status: 400 });
    }
    const normalizedEmail = email.toLowerCase().trim();
    if (!EMAIL_RE.test(normalizedEmail)) {
      // Don't reveal whether the email format is the issue vs. wrong password —
      // return the same generic message as a failed login
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }

    const user = await db.user.findUnique({ where: { email: normalizedEmail } });
    // Always run a bcrypt compare to keep timing roughly equal whether user exists or not
    const ok = user ? await verifyPassword(password, user.hashedPassword) : await verifyPassword(password, "$2b$10$invalid.invalid.invalid.invalid.invalid.invalid.invalid.invalid.invalid.invalid");
    if (!user || !ok) {
      return NextResponse.json({ error: "Invalid email or password." }, { status: 401 });
    }
    await createSession(user.id);
    return NextResponse.json({
      user: {
        id: user.id, email: user.email, name: user.name,
        luckBalance: user.luckBalance, referralCode: user.referralCode,
        role: user.role, language: user.language,
        birthData: parseBirthData(user.birthData),
        resellerTier: user.resellerTier,
      },
    });
  } catch (err) {
    console.error("Login error:", err);
    return NextResponse.json({ error: "Login failed. Please try again." }, { status: 500 });
  }
}
