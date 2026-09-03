import "server-only";
import bcrypt from "bcryptjs";
import { cookies, headers } from "next/headers";
import { db } from "@/lib/db";
import { createHmac, timingSafeEqual, randomBytes } from "crypto";

/**
 * Baydin auth — email/password with HTTP-only signed session cookie.
 * No JWT lib needed: session token = "<userId>.<hmac>" stored in a cookie.
 */

const SESSION_COOKIE = "baydin_session";
const SESSION_SECRET = process.env.SESSION_SECRET || "baydin-dev-secret-change-me";
const SESSION_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

// Warn at startup if using the default dev secret in production
if (process.env.NODE_ENV === "production" && !process.env.SESSION_SECRET) {
  console.warn("⚠️ WARNING: SESSION_SECRET not set in production. Using insecure default.");
}

/** HMAC-sign a payload so the cookie can't be tampered with. */
function sign(payload: string): string {
  const mac = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  return `${payload}.${mac}`;
}

function verify(token: string): string | null {
  const idx = token.lastIndexOf(".");
  if (idx < 1) return null;
  const payload = token.slice(0, idx);
  const mac = token.slice(idx + 1);
  const expected = createHmac("sha256", SESSION_SECRET).update(payload).digest("hex");
  try {
    const a = Buffer.from(mac, "hex");
    const b = Buffer.from(expected, "hex");
    if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
    return payload;
  } catch {
    return null;
  }
}

// bcrypt cost factor: 12 in production, 10 in dev (faster for testing)
const BCRYPT_ROUNDS = process.env.NODE_ENV === "production" ? 12 : 10;

export async function hashPassword(password: string): Promise<string> {
  // Truncate at 72 bytes (bcrypt limit) to prevent DoS via very long passwords
  const safe = Buffer.from(password, "utf8").subarray(0, 72).toString("utf8");
  return bcrypt.hash(safe, BCRYPT_ROUNDS);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

export async function createSession(userId: string): Promise<void> {
  const token = sign(userId);
  const store = await cookies();
  // Detect if we're being accessed via the preview gateway (HTTPS) or direct
  // dev (HTTP). The preview gateway forwards X-Forwarded-Proto=https.
  // For cross-origin preview access, we need SameSite=None + Secure so the
  // session cookie is sent on fetch() requests from the preview domain.
  const h = await headers();
  const forwardedProto = h.get("x-forwarded-proto") || "";
  const isHttpsProxy = forwardedProto.includes("https") || process.env.NODE_ENV === "production";
  store.set(SESSION_COOKIE, token, {
    httpOnly: true,
    secure: isHttpsProxy,
    sameSite: isHttpsProxy ? "none" : "lax",
    path: "/",
    maxAge: SESSION_MAX_AGE,
  });
}

export async function destroySession(): Promise<void> {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** Returns the current user id from the session cookie, or null. */
export async function getSessionUserId(): Promise<string | null> {
  const store = await cookies();
  const token = store.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  const payload = verify(token);
  if (!payload) return null;
  return payload;
}

/** Returns the current User row, or null. */
export async function getCurrentUser() {
  const userId = await getSessionUserId();
  if (!userId) return null;
  return db.user.findUnique({ where: { id: userId } });
}

/** Require auth — throws a structured error if not authenticated. */
export async function requireUser() {
  const user = await getCurrentUser();
  if (!user) {
    const err = new Error("Unauthorized") as Error & { status: number };
    err.status = 401;
    throw err;
  }
  return user;
}

export async function requireAdmin() {
  const user = await requireUser();
  if (user.role !== "admin") {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return user;
}

export async function requireReseller() {
  const user = await requireUser();
  if (user.role !== "reseller" && user.role !== "admin") {
    const err = new Error("Forbidden") as Error & { status: number };
    err.status = 403;
    throw err;
  }
  return user;
}

/** Generate a unique human-friendly referral code like "BAYDIN-7F3K2". */
export function generateReferralCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 6; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return `BAYDIN-${code}`;
}

export { randomBytes };
