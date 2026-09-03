import "server-only";

/**
 * BAYDIN — Simple in-memory rate limiter (sliding window).
 *
 * For production with multiple instances, swap this for Redis. For our
 * single-instance deployment it's sufficient.
 *
 * Usage:
 *   if (!checkRateLimit(`login:${ip}`, 10, 15 * 60 * 1000)) {
 *     return NextResponse.json({ error: "Too many attempts" }, { status: 429 });
 *   }
 *
 * The key namespaces the bucket (e.g. "login:1.2.3.4", "register:1.2.3.4").
 * Returns true if the request is allowed, false if rate-limited.
 */

type Bucket = { timestamps: number[] };

// Persist across hot reloads via global
const globalForRL = globalThis as unknown as { __baydinRL?: Map<string, Bucket> };
const buckets: Map<string, Bucket> = globalForRL.__baydinRL ?? new Map();
if (!globalForRL.__baydinRL) globalForRL.__baydinRL = buckets;

// Cleanup stale entries every 5 minutes to prevent unbounded growth
let lastCleanup = Date.now();
function cleanupIfNeeded() {
  const now = Date.now();
  if (now - lastCleanup < 5 * 60 * 1000) return;
  lastCleanup = now;
  const cutoff = now - 60 * 60 * 1000; // drop buckets idle for 1hr+
  for (const [key, bucket] of buckets) {
    const recent = bucket.timestamps.filter((t) => t > cutoff);
    if (recent.length === 0) {
      buckets.delete(key);
    } else {
      bucket.timestamps = recent;
    }
  }
}

export function checkRateLimit(key: string, max: number, windowMs: number): boolean {
  cleanupIfNeeded();
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key) ?? { timestamps: [] };
  // Drop expired entries
  bucket.timestamps = bucket.timestamps.filter((t) => t > cutoff);
  if (bucket.timestamps.length >= max) {
    return false;
  }
  bucket.timestamps.push(now);
  buckets.set(key, bucket);
  return true;
}

/** Get remaining attempts for a key (useful for debugging / headers). */
export function getRemainingAttempts(key: string, max: number, windowMs: number): number {
  const now = Date.now();
  const cutoff = now - windowMs;
  const bucket = buckets.get(key);
  if (!bucket) return max;
  const recent = bucket.timestamps.filter((t) => t > cutoff);
  return Math.max(0, max - recent.length);
}

/** Extract client IP from request (handles X-Forwarded-For chain). */
export function getClientIp(req: Request): string {
  const xff = req.headers.get("x-forwarded-for");
  if (xff) {
    const ip = xff.split(",")[0]?.trim();
    if (ip) return ip;
  }
  return req.headers.get("x-real-ip") || "unknown";
}
