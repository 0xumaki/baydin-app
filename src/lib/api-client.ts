"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/**
 * Baydin API client — fetch wrapper with credentials.
 * All routes are relative (same-origin via Caddy gateway on :3000).
 */

export async function api<T = any>(
  path: string,
  opts?: RequestInit & { json?: any }
): Promise<T> {
  const { json, headers, ...rest } = opts ?? {};
  const res = await fetch(path, {
    ...rest,
    headers: {
      "Content-Type": "application/json",
      ...(headers ?? {}),
    },
    credentials: "include",
    body: json !== undefined ? JSON.stringify(json) : (rest as any).body,
  });
  if (!res.ok) {
    let msg = `Request failed (${res.status})`;
    try {
      const body = await res.json();
      msg = body.error || body.message || msg;
    } catch {}
    const err = new Error(msg) as Error & { status: number };
    err.status = res.status;
    throw err;
  }
  if (res.status === 204) return null as T;
  const ct = res.headers.get("content-type") ?? "";
  if (ct.includes("application/json")) return res.json();
  return (await res.text()) as unknown as T;
}

/** Current authenticated user + luck balance. */
export function useMe() {
  return useQuery({
    queryKey: ["me"],
    queryFn: () => api<{ user: any }>("/api/me"),
    staleTime: 15000,
    retry: false,
  });
}

/** Notification badge counts (pending confirmations, ritual, conversations). */
export function useBadges() {
  return useQuery({
    queryKey: ["badges"],
    queryFn: () => api<{ badges: { unconfirmedGoals: number; ritualIncomplete: boolean; recentConversations: number } }>("/api/notifications"),
    staleTime: 30000,
    retry: false,
  });
}

/** Luck transactions history. */
export function useTransactions() {
  return useQuery({
    queryKey: ["luck", "transactions"],
    queryFn: () => api<{ transactions: any[] }>("/api/luck/transactions"),
  });
}

/** Conversations list. */
export function useConversations() {
  return useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: any[] }>("/api/conversations"),
  });
}
