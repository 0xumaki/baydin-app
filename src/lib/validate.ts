import "server-only";
import type { BirthContext } from "@/lib/astrology";

/**
 * Safely parse the user's birthData JSON column.
 *
 * Returns null if the data is missing, malformed, or fails validation.
 * Use this everywhere instead of raw `JSON.parse(user.birthData)` —
 * a single corrupt row should never crash an entire API route.
 */
export function parseBirthData(raw: string | null | undefined): BirthContext | null {
  if (!raw || typeof raw !== "string") return null;
  try {
    const parsed = JSON.parse(raw);
    // Validate required fields exist with correct types
    if (
      typeof parsed !== "object" ||
      parsed === null ||
      typeof parsed.dob !== "string" ||
      typeof parsed.tob !== "string" ||
      typeof parsed.latitude !== "number" ||
      typeof parsed.longitude !== "number" ||
      (parsed.timezone !== undefined && typeof parsed.timezone !== "string")
    ) {
      return null;
    }
    return parsed as BirthContext;
  } catch {
    return null;
  }
}

/**
 * Validate a YYYY-MM-DD string is a real calendar date between 1800 and today.
 */
export function isValidDateString(s: string, opts?: { minYear?: number; allowFuture?: boolean }): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const d = new Date(s + "T12:00:00Z");
  if (isNaN(d.getTime())) return false;
  if (d.toISOString().slice(0, 10) !== s) return false; // catches 2026-02-30
  const minYear = opts?.minYear ?? 1800;
  if (d.getUTCFullYear() < minYear) return false;
  if (!opts?.allowFuture && d.getTime() > Date.now() + 86400000) return false;
  return true;
}

/**
 * Clamp + coerce a string to a max length, returning a safe default.
 */
export function sanitizeString(s: unknown, maxLen: number, fallback = ""): string {
  if (typeof s !== "string") return fallback;
  const trimmed = s.trim();
  if (trimmed.length === 0) return fallback;
  return trimmed.length > maxLen ? trimmed.slice(0, maxLen) : trimmed;
}

/**
 * Validate that a value is one of an allowed set of strings.
 */
export function oneOf<T extends string>(value: unknown, allowed: readonly T[], fallback: T): T {
  return typeof value === "string" && (allowed as readonly string[]).includes(value)
    ? (value as T)
    : fallback;
}

/**
 * Get the previous day's YYYY-MM-DD string.
 */
export function prevDay(iso: string): string {
  const d = new Date(iso + "T00:00:00");
  d.setDate(d.getDate() - 1);
  return d.toISOString().slice(0, 10);
}

/**
 * Get today's YYYY-MM-DD string in the server's local time.
 */
export function todayKey(): string {
  return new Date().toISOString().slice(0, 10);
}
