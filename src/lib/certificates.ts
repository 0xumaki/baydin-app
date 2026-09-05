import "server-only";
import { db } from "@/lib/db";

/**
 * BAYDIN — Reseller certificate issuance helper.
 *
 * Generates an SVG branded image (returned as a string) and persists a
 * ResellerCertificate row in the database. Used by:
 *   - /api/admin/certificate/reseller       (single)
 *   - /api/admin/certificate/reseller/bulk  (≤50)
 *   - /api/reseller/certificate             (self-service)
 */

export type CertKind = "promotion" | "tier_upgrade" | "welcome";

export type IssueCertParams = {
  userId: string;
  tier: string;
  kind: CertKind;
  issuedById: string;
  campaignId?: string | null;
  metadata?: Record<string, any> | null;
};

export type IssuedCert = {
  id: string;
  userId: string;
  tier: string;
  kind: CertKind;
  brandedImageSvg: string;
  campaignId: string | null;
  createdAt: Date;
};

/** Build a branded SVG certificate for the given user + tier. */
export function buildCertificateSvg(params: {
  userName: string | null;
  userEmail: string;
  tier: string;
  kind: CertKind;
  language?: string;
}): string {
  const { userName, userEmail, tier, kind } = params;
  const displayName = (userName && userName.trim()) || userEmail.split("@")[0];
  const tierLabel = tier.charAt(0).toUpperCase() + tier.slice(1);
  const kindLabel = kind
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  // Baydin brand palette (matches lumina/premium-ui.tsx)
  const gold = "#C5A87C";
  const goldLight = "#E7D2A8";
  const parchment = "#F5E6C2";
  const ink = "#E8EBE9";
  const surface = "#121815";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="800" height="500" viewBox="0 0 800 500" role="img" aria-label="Baydin Reseller Certificate">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${surface}"/>
      <stop offset="100%" stop-color="#1a221d"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${goldLight}"/>
      <stop offset="50%" stop-color="${gold}"/>
      <stop offset="100%" stop-color="${goldLight}"/>
    </linearGradient>
    <pattern id="clover" x="0" y="0" width="40" height="40" patternUnits="userSpaceOnUse">
      <path d="M20 14 a4 4 0 0 1 4 4 a4 4 0 0 1-4 4 a4 4 0 0 1-4-4 a4 4 0 0 1 4-4 z" fill="${gold}" opacity="0.06"/>
    </pattern>
  </defs>
  <rect width="800" height="500" fill="url(#bg)"/>
  <rect width="800" height="500" fill="url(#clover)"/>
  <rect x="20" y="20" width="760" height="460" fill="none" stroke="url(#gold)" stroke-width="2" rx="8"/>
  <rect x="32" y="32" width="736" height="436" fill="none" stroke="${gold}" stroke-width="0.5" opacity="0.4" rx="6"/>

  <g transform="translate(60,80)">
    <g transform="translate(0,0)">
      <path d="M24 12 a6 6 0 0 1 6 6 a6 6 0 0 1-6 6 a6 6 0 0 1-6-6 a6 6 0 0 1 6-6 z M12 24 a6 6 0 0 1 6 6 a6 6 0 0 1-6 6 a6 6 0 0 1-6-6 a6 6 0 0 1 6-6 z M36 24 a6 6 0 0 1 6 6 a6 6 0 0 1-6 6 a6 6 0 0 1-6-6 a6 6 0 0 1 6-6 z M24 36 a6 6 0 0 1 6 6 a6 6 0 0 1-6 6 a6 6 0 0 1-6-6 a6 6 0 0 1 6-6 z M24 42 q-2 8-6 12" fill="none" stroke="${gold}" stroke-width="1.5" stroke-linecap="round"/>
    </g>
    <text x="60" y="34" font-family="Georgia, serif" font-size="22" fill="${parchment}">Baydin</text>
  </g>

  <text x="400" y="170" font-family="Georgia, serif" font-size="34" font-weight="700" fill="${parchment}" text-anchor="middle">Reseller Certificate</text>
  <text x="400" y="200" font-family="Inter, Arial, sans-serif" font-size="14" fill="${gold}" text-anchor="middle" letter-spacing="3">${kindLabel.toUpperCase()}</text>

  <line x1="200" y1="220" x2="600" y2="220" stroke="url(#gold)" stroke-width="1"/>

  <text x="400" y="270" font-family="Georgia, serif" font-size="26" font-weight="600" fill="${ink}" text-anchor="middle">${escapeXml(displayName)}</text>
  <text x="400" y="300" font-family="Inter, Arial, sans-serif" font-size="13" fill="${ink}" opacity="0.6" text-anchor="middle">${escapeXml(userEmail)}</text>

  <text x="400" y="350" font-family="Inter, Arial, sans-serif" font-size="12" fill="${ink}" opacity="0.7" text-anchor="middle" letter-spacing="2">TIER</text>
  <text x="400" y="380" font-family="Georgia, serif" font-size="22" font-weight="600" fill="${gold}" text-anchor="middle">${escapeXml(tierLabel)}</text>

  <text x="400" y="440" font-family="Inter, Arial, sans-serif" font-size="11" fill="${ink}" opacity="0.5" text-anchor="middle">Issued ${escapeXml(date)} · Powered by Baydin</text>
</svg>`;
}

function escapeXml(s: string): string {
  return s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

/** Issue a single reseller certificate (creates the DB row + returns it). */
export async function issueCertificate(params: IssueCertParams): Promise<IssuedCert> {
  const { userId, tier, kind, issuedById, campaignId, metadata } = params;
  const user = await db.user.findUnique({
    where: { id: userId },
    select: { email: true, name: true, language: true },
  });
  if (!user) throw new Error("User not found");

  const svg = buildCertificateSvg({
    userName: user.name,
    userEmail: user.email,
    tier,
    kind,
    language: user.language,
  });

  const created = await db.resellerCertificate.create({
    data: {
      userId,
      tier,
      kind,
      issuedById,
      brandedImageSvg: svg,
      campaignId: campaignId ?? null,
      metadata: metadata ? JSON.stringify(metadata) : null,
    },
  });

  return {
    id: created.id,
    userId: created.userId,
    tier: created.tier,
    kind: created.kind as CertKind,
    brandedImageSvg: created.brandedImageSvg,
    campaignId: created.campaignId,
    createdAt: created.createdAt,
  };
}
