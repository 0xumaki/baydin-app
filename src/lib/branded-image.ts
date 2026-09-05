// NOTE: This module is shared between server and client code.
// Do NOT import "server-only" here — it would break client-side imports
// (e.g. BrandedImageCard imports from this module for SVG data).
// The render functions are pure (no DB, no fs) so they're safe for both.

/**
 * BAYDIN — Branded image SVG renderers (server-side mirror).
 *
 * Premium certificate design: double border, corner ornaments, shield badge,
 * seal of authenticity, signature line. Used by:
 *   - /api/admin/certificate/reseller       (single)
 *   - /api/admin/certificate/reseller/bulk  (≤50)
 *   - /api/reseller/certificate             (self-service)
 *   - /api/leaderboard                      (snapshot download)
 *   - /api/admin/campaigns                  (flyer preview)
 *
 * All functions return raw SVG strings — clients can embed via
 * `dangerouslySetInnerHTML` or rasterize via html-to-image.
 */

const GOLD = "#C5A87C";
const GOLD_LIGHT = "#E7D2A8";
const GOLD_DARK = "#9C7F54";
const PARCHMENT = "#F5E6C2";
const INK = "#E8EBE9";
const INK_DIM = "#9CA8A3";
const SURFACE = "#0A0908";
const SURFACE_2 = "#121815";

// ============================================================
// Helpers
// ============================================================

function escapeXml(s: string): string {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function truncate(s: string, max: number): string {
  if (!s) return "";
  return s.length > max ? s.slice(0, max - 1) + "…" : s;
}

function titleCase(s: string): string {
  return s
    .split(/[_\s-]+/)
    .filter(Boolean)
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
    .join(" ");
}

// Shared defs block — gold gradient, parchment gradient, subtle clover pattern
function sharedDefs(): string {
  return `<defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" stop-color="${SURFACE_2}"/>
      <stop offset="100%" stop-color="${SURFACE}"/>
    </linearGradient>
    <linearGradient id="gold" x1="0%" y1="0%" x2="100%" y2="0%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="50%" stop-color="${GOLD}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </linearGradient>
    <linearGradient id="gold-vertical" x1="0%" y1="0%" x2="0%" y2="100%">
      <stop offset="0%" stop-color="${GOLD_LIGHT}"/>
      <stop offset="100%" stop-color="${GOLD_DARK}"/>
    </linearGradient>
    <radialGradient id="sheen" cx="50%" cy="40%" r="60%">
      <stop offset="0%" stop-color="${PARCHMENT}" stop-opacity="0.08"/>
      <stop offset="100%" stop-color="${PARCHMENT}" stop-opacity="0"/>
    </radialGradient>
    <pattern id="clover-dots" x="0" y="0" width="32" height="32" patternUnits="userSpaceOnUse">
      <circle cx="16" cy="16" r="1.2" fill="${GOLD}" opacity="0.06"/>
    </pattern>
  </defs>`;
}

// Corner ornament — small filigree square placed at each corner
function cornerOrnament(x: number, y: number, size = 24): string {
  return `<g transform="translate(${x},${y})" stroke="${GOLD}" stroke-width="0.8" fill="none" opacity="0.7">
    <path d="M0,${size} L0,0 L${size},0" stroke-linecap="round"/>
    <path d="M4,${size - 4} L4,4 L${size - 4},4" opacity="0.5"/>
    <circle cx="0" cy="0" r="2" fill="${GOLD}" opacity="0.6"/>
    <circle cx="${size}" cy="0" r="1.5" fill="${GOLD}" opacity="0.4"/>
    <circle cx="0" cy="${size}" r="1.5" fill="${GOLD}" opacity="0.4"/>
  </g>`;
}

// Shield badge — small shield icon
function shieldBadge(cx: number, cy: number, scale = 1): string {
  const s = 18 * scale;
  return `<g transform="translate(${cx - s},${cy - s}) scale(${scale})" fill="none" stroke="${GOLD}" stroke-width="1.2">
    <path d="M${s} 2 L${s * 2 - 2} ${s * 0.5} L${s * 2 - 2} ${s * 1.2} Q${s * 2 - 2} ${s * 1.9} ${s} ${s * 2 - 2} Q2 ${s * 1.9} 2 ${s * 1.2} L2 ${s * 0.5} Z" fill="${SURFACE}" opacity="0.95"/>
    <path d="M${s} 6 L${s * 0.7} ${s} L${s} ${s * 1.4} L${s * 1.3} ${s} Z" fill="${GOLD}" opacity="0.8"/>
  </g>`;
}

// Seal of authenticity — circular gold wax-style seal
function sealOfAuthenticity(cx: number, cy: number, r = 36): string {
  return `<g transform="translate(${cx - r},${cy - r})">
    <circle cx="${r}" cy="${r}" r="${r}" fill="${GOLD_DARK}" opacity="0.85"/>
    <circle cx="${r}" cy="${r}" r="${r - 4}" fill="none" stroke="${GOLD_LIGHT}" stroke-width="1.2"/>
    <circle cx="${r}" cy="${r}" r="${r - 10}" fill="none" stroke="${PARCHMENT}" stroke-width="0.5" opacity="0.6"/>
    <text x="${r}" y="${r - 2}" font-family="Georgia, serif" font-size="${r * 0.32}" fill="${SURFACE}" text-anchor="middle" font-weight="700">BAYDIN</text>
    <text x="${r}" y="${r + r * 0.32}" font-family="Georgia, serif" font-size="${r * 0.18}" fill="${SURFACE}" text-anchor="middle" letter-spacing="2">AUTHENTIC</text>
  </g>`;
}

// Clover mark — small four-leaf clover
function cloverMark(cx: number, cy: number, scale = 1): string {
  const s = 8 * scale;
  return `<g transform="translate(${cx},${cy}) scale(${scale})" fill="${GOLD}" opacity="0.9">
    <path d="M0,0 Q${-s},${-s} 0,${-s * 1.5} Q${s},${-s} 0,0 Z"/>
    <path d="M0,0 Q${s},${-s} ${s * 1.5},0 Q${s},${s} 0,0 Z"/>
    <path d="M0,0 Q${s},${s} 0,${s * 1.5} Q${-s},${s} 0,0 Z"/>
    <path d="M0,0 Q${-s},${s} ${-s * 1.5},0 Q${-s},${-s} 0,0 Z"/>
    <circle cx="0" cy="0" r="${s * 0.25}" fill="${GOLD_DARK}"/>
  </g>`;
}

// ============================================================
// renderCertificateSvg — premium certificate
// ============================================================

export type CertificateKind = "promotion" | "tier_upgrade" | "welcome";

export function renderCertificateSvg(params: {
  userName: string | null;
  userEmail: string;
  tier: string;
  kind: CertificateKind;
  language?: string;
}): string {
  const { userName, userEmail, tier, kind } = params;
  const displayName = (userName && userName.trim()) || userEmail.split("@")[0];
  const tierLabel = titleCase(tier.replace(/^reseller_/, ""));
  const kindLabel = titleCase(kind);

  const date = new Date().toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
  const certId = `BAY-${Date.now().toString(36).toUpperCase()}-${Math.floor(Math.random() * 9999)
    .toString(36)
    .toUpperCase()}`;

  const headingText =
    kind === "promotion"
      ? "Reseller Promotion"
      : kind === "tier_upgrade"
      ? "Tier Advancement"
      : "Reseller Welcome";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="560" viewBox="0 0 900 560" role="img" aria-label="Baydin Reseller Certificate">
  ${sharedDefs()}
  <rect width="900" height="560" fill="url(#bg)"/>
  <rect width="900" height="560" fill="url(#clover-dots)"/>
  <rect width="900" height="560" fill="url(#sheen)"/>

  <!-- Double border -->
  <rect x="24" y="24" width="852" height="512" fill="none" stroke="url(#gold)" stroke-width="2.5" rx="6"/>
  <rect x="36" y="36" width="828" height="488" fill="none" stroke="${GOLD}" stroke-width="0.6" opacity="0.5" rx="4"/>

  <!-- Corner ornaments -->
  ${cornerOrnament(48, 48, 28)}
  ${cornerOrnament(824, 48, 28)}
  ${cornerOrnament(48, 484, 28)}
  ${cornerOrnament(824, 484, 28)}

  <!-- Baydin wordmark + clover -->
  <g transform="translate(72,90)">
    ${cloverMark(12, 12, 1.4)}
    <text x="36" y="20" font-family="Georgia, serif" font-size="22" fill="${PARCHMENT}" letter-spacing="1">Baydin</text>
    <text x="36" y="36" font-family="Inter, Arial, sans-serif" font-size="9" fill="${GOLD}" letter-spacing="3">CERTIFIED PARTNER</text>
  </g>

  <!-- Title block -->
  <text x="450" y="160" font-family="Georgia, serif" font-size="36" font-weight="700" fill="${PARCHMENT}" text-anchor="middle">${escapeXml(headingText)}</text>
  <text x="450" y="190" font-family="Inter, Arial, sans-serif" font-size="13" fill="${GOLD}" text-anchor="middle" letter-spacing="6">CERTIFICATE OF ACHIEVEMENT</text>

  <!-- Gold rule -->
  <line x1="260" y1="210" x2="640" y2="210" stroke="url(#gold)" stroke-width="1.2"/>
  ${cloverMark(450, 210, 0.7)}

  <!-- Recipient name -->
  <text x="450" y="270" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="middle" letter-spacing="4">AWARDED TO</text>
  <text x="450" y="312" font-family="Georgia, serif" font-size="32" font-weight="600" fill="${INK}" text-anchor="middle">${escapeXml(truncate(displayName, 36))}</text>
  <text x="450" y="338" font-family="Inter, Arial, sans-serif" font-size="12" fill="${INK_DIM}" text-anchor="middle" opacity="0.7">${escapeXml(userEmail)}</text>

  <!-- Tier block -->
  <text x="450" y="390" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="middle" letter-spacing="4">${escapeXml(kindLabel.toUpperCase())} · TIER</text>
  <text x="450" y="424" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${GOLD}" text-anchor="middle" letter-spacing="2">${escapeXml(tierLabel)}</text>

  <!-- Signature line + seal -->
  <line x1="120" y1="490" x2="320" y2="490" stroke="${GOLD}" stroke-width="0.8" opacity="0.7"/>
  <text x="220" y="508" font-family="Georgia, serif" font-size="13" fill="${INK}" text-anchor="middle">Baydin Astrology Council</text>
  <text x="220" y="524" font-family="Inter, Arial, sans-serif" font-size="10" fill="${INK_DIM}" text-anchor="middle">Authorized Signatory</text>

  ${sealOfAuthenticity(720, 488, 40)}
  ${shieldBadge(560, 484, 1.4)}

  <!-- Footer cert id -->
  <text x="450" y="544" font-family="Inter, Arial, sans-serif" font-size="10" fill="${INK_DIM}" text-anchor="middle" opacity="0.6">Issued ${escapeXml(date)} · ${escapeXml(certId)}</text>
</svg>`;
}

// ============================================================
// renderLeaderboardSvg — leaderboard podium image
// ============================================================

export type LeaderboardEntry = {
  rank: number;
  email: string;
  name?: string | null;
  metric: number;
  metricLabel: string;
  luckBalance?: number;
  tier?: string | null;
};

export function renderLeaderboardSvg(params: {
  kind: "user" | "reseller";
  metric: string;
  entries: LeaderboardEntry[];
  topN: number;
  generatedAt?: Date;
}): string {
  const { kind, metric, entries, topN, generatedAt } = params;
  const title =
    kind === "reseller" ? "Top Resellers" : "Top Seekers";
  const subtitle = `By ${metric.replace(/_/g, " ")} · Top ${topN}`;
  const date = (generatedAt ?? new Date()).toLocaleString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  const rows = entries
    .slice(0, topN)
    .map((e, i) => {
      const y = 180 + i * 32;
      const medal = e.rank === 1 ? "🥇" : e.rank === 2 ? "🥈" : e.rank === 3 ? "🥉" : `${e.rank}.`;
      const name = truncate(e.name || e.email.split("@")[0], 28);
      const value = e.metric.toLocaleString();
      const isTop3 = e.rank <= 3;
      const rowBg = isTop3
        ? `<rect x="60" y="${y - 18}" width="780" height="28" fill="${GOLD}" opacity="0.07" rx="3"/>`
        : "";
      return `${rowBg}
      <text x="76" y="${y}" font-family="Inter, Arial, sans-serif" font-size="14" font-weight="${isTop3 ? 700 : 400}" fill="${isTop3 ? GOLD : INK_DIM}">${medal}</text>
      <text x="120" y="${y}" font-family="Inter, Arial, sans-serif" font-size="13" fill="${INK}">${escapeXml(name)}</text>
      <text x="540" y="${y}" font-family="Inter, Arial, sans-serif" font-size="12" fill="${INK_DIM}">${escapeXml(truncate(e.email, 30))}</text>
      <text x="824" y="${y}" font-family="Georgia, serif" font-size="14" font-weight="${isTop3 ? 700 : 500}" fill="${GOLD}" text-anchor="end">${escapeXml(value)}</text>`;
    })
    .join("\n  ");

  const height = 200 + entries.length * 32 + 60;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="900" height="${height}" viewBox="0 0 900 ${height}" role="img" aria-label="Baydin Leaderboard">
  ${sharedDefs()}
  <rect width="900" height="${height}" fill="url(#bg)"/>
  <rect width="900" height="${height}" fill="url(#clover-dots)"/>
  <rect x="24" y="24" width="852" height="${height - 48}" fill="none" stroke="url(#gold)" stroke-width="2" rx="6"/>
  <rect x="36" y="36" width="828" height="${height - 72}" fill="none" stroke="${GOLD}" stroke-width="0.5" opacity="0.4" rx="4"/>

  ${cornerOrnament(48, 48, 24)}
  ${cornerOrnament(824, 48, 24)}
  ${cornerOrnament(48, height - 72, 24)}
  ${cornerOrnament(824, height - 72, 24)}

  <g transform="translate(60,72)">
    ${cloverMark(12, 12, 1.2)}
    <text x="32" y="18" font-family="Georgia, serif" font-size="20" fill="${PARCHMENT}" letter-spacing="1">Baydin</text>
  </g>

  <text x="450" y="100" font-family="Georgia, serif" font-size="32" font-weight="700" fill="${PARCHMENT}" text-anchor="middle">${escapeXml(title)}</text>
  <text x="450" y="128" font-family="Inter, Arial, sans-serif" font-size="13" fill="${GOLD}" text-anchor="middle" letter-spacing="4">${escapeXml(subtitle.toUpperCase())}</text>
  ${cloverMark(450, 150, 0.8)}

  ${rows}

  <line x1="60" y1="${height - 60}" x2="840" y2="${height - 60}" stroke="${GOLD}" stroke-width="0.4" opacity="0.4"/>
  <text x="60" y="${height - 40}" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}">Generated ${escapeXml(date)}</text>
  <text x="840" y="${height - 40}" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="end">baydin.app/leaderboard</text>
</svg>`;
}

// ============================================================
// renderCampaignFlyerSvg — seasonal campaign promo flyer
// ============================================================

export function renderCampaignFlyerSvg(params: {
  name: string;
  tierId: string;
  kind: "user" | "reseller";
  mmkOverride?: number | null;
  bonusPctOverride?: number | null;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  description?: string | null;
  language?: string;
}): string {
  const {
    name,
    tierId,
    kind,
    mmkOverride,
    bonusPctOverride,
    validFrom,
    validUntil,
    description,
  } = params;

  const tierLabel = titleCase(tierId.replace(/^reseller_/, ""));
  const headline =
    bonusPctOverride != null
      ? `+${bonusPctOverride}% BONUS`
      : mmkOverride != null
      ? `${mmkOverride.toLocaleString()} MMK TIER`
      : "LIMITED TIME";

  const fromDate = validFrom ? new Date(validFrom) : new Date();
  const untilDate = validUntil ? new Date(validUntil) : new Date();
  const fmtDate = (d: Date) =>
    d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  const window =
    validFrom || validUntil
      ? `${fmtDate(fromDate)} – ${fmtDate(untilDate)}`
      : "Active now";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="800" viewBox="0 0 600 800" role="img" aria-label="Baydin Campaign Flyer">
  ${sharedDefs()}
  <rect width="600" height="800" fill="url(#bg)"/>
  <rect width="600" height="800" fill="url(#clover-dots)"/>
  <rect width="600" height="800" fill="url(#sheen)"/>

  <!-- Double border -->
  <rect x="20" y="20" width="560" height="760" fill="none" stroke="url(#gold)" stroke-width="2" rx="6"/>
  <rect x="30" y="30" width="540" height="740" fill="none" stroke="${GOLD}" stroke-width="0.5" opacity="0.4" rx="4"/>

  ${cornerOrnament(40, 40, 22)}
  ${cornerOrnament(538, 40, 22)}
  ${cornerOrnament(40, 738, 22)}
  ${cornerOrnament(538, 738, 22)}

  <!-- Top brand -->
  <g transform="translate(60,80)">
    ${cloverMark(12, 12, 1.2)}
    <text x="32" y="18" font-family="Georgia, serif" font-size="18" fill="${PARCHMENT}">Baydin</text>
  </g>
  <text x="540" y="92" font-family="Inter, Arial, sans-serif" font-size="11" fill="${GOLD}" text-anchor="end" letter-spacing="3">SEASONAL CAMPAIGN</text>

  <!-- Headline -->
  <text x="300" y="200" font-family="Inter, Arial, sans-serif" font-size="13" fill="${INK_DIM}" text-anchor="middle" letter-spacing="4">LIMITED OFFER</text>
  <text x="300" y="260" font-family="Georgia, serif" font-size="46" font-weight="800" fill="${PARCHMENT}" text-anchor="middle">${escapeXml(headline)}</text>

  ${cloverMark(300, 310, 1.5)}

  <!-- Tier block -->
  <text x="300" y="380" font-family="Inter, Arial, sans-serif" font-size="12" fill="${INK_DIM}" text-anchor="middle" letter-spacing="3">${escapeXml(kind.toUpperCase())} TIER</text>
  <text x="300" y="420" font-family="Georgia, serif" font-size="32" font-weight="700" fill="${GOLD}" text-anchor="middle">${escapeXml(tierLabel)}</text>

  <!-- Campaign name -->
  <text x="300" y="478" font-family="Georgia, serif" font-size="22" fill="${INK}" text-anchor="middle">${escapeXml(truncate(name, 32))}</text>

  ${
    description
      ? `<foreignObject x="60" y="500" width="480" height="120"><div xmlns="http://www.w3.org/1999/xhtml" style="font-family:Inter,Arial,sans-serif;font-size:13px;color:#9CA8A3;text-align:center;line-height:1.5;padding:0 20px;">${escapeXml(truncate(description, 240))}</div></foreignObject>`
      : ""
  }

  <!-- Validity window -->
  <line x1="180" y1="660" x2="420" y2="660" stroke="${GOLD}" stroke-width="0.6" opacity="0.5"/>
  <text x="300" y="690" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="middle" letter-spacing="3">VALID</text>
  <text x="300" y="712" font-family="Georgia, serif" font-size="18" fill="${INK}" text-anchor="middle">${escapeXml(window)}</text>

  <!-- Footer -->
  <text x="300" y="752" font-family="Inter, Arial, sans-serif" font-size="10" fill="${INK_DIM}" text-anchor="middle" opacity="0.6">baydin.app · Powered by Baydin Astrology</text>
</svg>`;
}

// ============================================================
// renderReferralShareSvg — referral share card
// ============================================================

export function renderReferralShareSvg(params: {
  userName: string | null;
  userEmail: string;
  referralCode: string;
  signupBonusLuck: number;
  referralUrl?: string;
}): string {
  const { userName, userEmail, referralCode, signupBonusLuck, referralUrl } = params;
  const displayName = (userName && userName.trim()) || userEmail.split("@")[0];
  const url = referralUrl || `https://baydin.app/r/${referralCode}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="600" height="700" viewBox="0 0 600 700" role="img" aria-label="Baydin Referral Card">
  ${sharedDefs()}
  <rect width="600" height="700" fill="url(#bg)"/>
  <rect width="600" height="700" fill="url(#clover-dots)"/>
  <rect width="600" height="700" fill="url(#sheen)"/>

  <rect x="20" y="20" width="560" height="660" fill="none" stroke="url(#gold)" stroke-width="2" rx="6"/>
  <rect x="30" y="30" width="540" height="640" fill="none" stroke="${GOLD}" stroke-width="0.5" opacity="0.4" rx="4"/>

  ${cornerOrnament(40, 40, 22)}
  ${cornerOrnament(538, 40, 22)}
  ${cornerOrnament(40, 638, 22)}
  ${cornerOrnament(538, 638, 22)}

  <!-- Brand -->
  <g transform="translate(60,80)">
    ${cloverMark(12, 12, 1.2)}
    <text x="32" y="18" font-family="Georgia, serif" font-size="18" fill="${PARCHMENT}">Baydin</text>
  </g>
  <text x="540" y="92" font-family="Inter, Arial, sans-serif" font-size="11" fill="${GOLD}" text-anchor="end" letter-spacing="3">INVITATION</text>

  <!-- Headline -->
  <text x="300" y="200" font-family="Inter, Arial, sans-serif" font-size="13" fill="${INK_DIM}" text-anchor="middle" letter-spacing="4">YOUR FRIEND INVITES YOU</text>
  <text x="300" y="252" font-family="Georgia, serif" font-size="34" font-weight="700" fill="${PARCHMENT}" text-anchor="middle">Begin Your Journey</text>

  ${cloverMark(300, 290, 1.4)}

  <text x="300" y="340" font-family="Georgia, serif" font-size="22" fill="${INK}" text-anchor="middle">${escapeXml(truncate(displayName, 28))} invites you</text>
  <text x="300" y="368" font-family="Inter, Arial, sans-serif" font-size="12" fill="${INK_DIM}" text-anchor="middle">Sign up with this code to receive</text>

  <!-- Bonus block -->
  <rect x="180" y="390" width="240" height="80" fill="${GOLD}" opacity="0.08" rx="6"/>
  <text x="300" y="424" font-family="Georgia, serif" font-size="32" font-weight="700" fill="${GOLD}" text-anchor="middle">${signupBonusLuck} Luck</text>
  <text x="300" y="450" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="middle" letter-spacing="3">SIGNUP BONUS</text>

  <!-- Referral code -->
  <text x="300" y="510" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="middle" letter-spacing="3">YOUR CODE</text>
  <text x="300" y="546" font-family="Georgia, serif" font-size="28" font-weight="700" fill="${PARCHMENT}" text-anchor="middle" letter-spacing="4">${escapeXml(referralCode)}</text>

  <line x1="180" y1="580" x2="420" y2="580" stroke="${GOLD}" stroke-width="0.5" opacity="0.4"/>
  <text x="300" y="610" font-family="Inter, Arial, sans-serif" font-size="11" fill="${INK_DIM}" text-anchor="middle">Sign up at</text>
  <text x="300" y="630" font-family="Georgia, serif" font-size="14" fill="${INK}" text-anchor="middle">${escapeXml(truncate(url, 38))}</text>

  ${sealOfAuthenticity(540, 80, 22)}
</svg>`;
}
