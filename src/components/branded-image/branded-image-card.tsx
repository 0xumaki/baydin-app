"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import {
  renderCertificateSvg,
  renderLeaderboardSvg,
  renderCampaignFlyerSvg,
  renderReferralShareSvg,
  type CertificateKind,
  type LeaderboardEntry,
} from "@/lib/branded-image";

/**
 * BrandedImageCard — 7 variants of branded image previews for download.
 *
 * Variants:
 *  - leaderboard-user       — top-N user leaderboard (PNG)
 *  - leaderboard-reseller   — top-N reseller leaderboard (PNG)
 *  - certificate-promotion  — reseller promotion certificate
 *  - certificate-tier-upgrade — reseller tier-upgrade certificate
 *  - certificate-welcome    — reseller welcome certificate
 *  - campaign-flyer         — seasonal campaign promo flyer
 *  - referral-share         — referral code share card
 *
 * Renders an SVG (server-style mirror) inside a fixed-size container
 * for both display + html-to-image PNG download.
 */

export type BrandedImageVariant =
  | "leaderboard-user"
  | "leaderboard-reseller"
  | "certificate-promotion"
  | "certificate-tier-upgrade"
  | "certificate-welcome"
  | "campaign-flyer"
  | "referral-share";

type CertificateProps = {
  userName: string | null;
  userEmail: string;
  tier: string;
  language?: string;
};

type LeaderboardProps = {
  kind: "user" | "reseller";
  metric: string;
  entries: LeaderboardEntry[];
  topN: number;
  generatedAt?: Date;
};

type CampaignFlyerProps = {
  name: string;
  tierId: string;
  kind: "user" | "reseller";
  mmkOverride?: number | null;
  bonusPctOverride?: number | null;
  validFrom?: Date | string | null;
  validUntil?: Date | string | null;
  description?: string | null;
  language?: string;
};

type ReferralShareProps = {
  userName: string | null;
  userEmail: string;
  referralCode: string;
  signupBonusLuck: number;
  referralUrl?: string;
};

export type BrandedImageCardProps = {
  variant: BrandedImageVariant;
  className?: string;
  certificate?: CertificateProps;
  leaderboard?: LeaderboardProps;
  campaign?: CampaignFlyerProps;
  referral?: ReferralShareProps;
  /** Optional caption override for the pulsing green "live preview" dot. */
  caption?: string;
};

const LIVE_CAPTIONS: Record<BrandedImageVariant, string> = {
  "leaderboard-user": "Live user leaderboard",
  "leaderboard-reseller": "Live reseller leaderboard",
  "certificate-promotion": "Promotion certificate",
  "certificate-tier-upgrade": "Tier upgrade certificate",
  "certificate-welcome": "Welcome certificate",
  "campaign-flyer": "Live campaign flyer",
  "referral-share": "Shareable referral card",
};

export function BrandedImageCard({
  variant,
  className,
  certificate,
  leaderboard,
  campaign,
  referral,
  caption,
}: BrandedImageCardProps) {
  const svg = React.useMemo(() => {
    switch (variant) {
      case "certificate-promotion":
      case "certificate-tier-upgrade":
      case "certificate-welcome": {
        if (!certificate) return "";
        const kindMap: Partial<Record<BrandedImageVariant, CertificateKind>> = {
          "certificate-promotion": "promotion",
          "certificate-tier-upgrade": "tier_upgrade",
          "certificate-welcome": "welcome",
        };
        const kind = kindMap[variant] ?? "welcome";
        return renderCertificateSvg({
          userName: certificate.userName,
          userEmail: certificate.userEmail,
          tier: certificate.tier,
          kind,
          language: certificate.language,
        });
      }
      case "leaderboard-user":
      case "leaderboard-reseller": {
        if (!leaderboard) return "";
        return renderLeaderboardSvg({
          kind: leaderboard.kind,
          metric: leaderboard.metric,
          entries: leaderboard.entries,
          topN: leaderboard.topN,
          generatedAt: leaderboard.generatedAt,
        });
      }
      case "campaign-flyer": {
        if (!campaign) return "";
        return renderCampaignFlyerSvg(campaign);
      }
      case "referral-share": {
        if (!referral) return "";
        return renderReferralShareSvg(referral);
      }
      default:
        return "";
    }
  }, [variant, certificate, leaderboard, campaign, referral]);

  // Compute aspect ratio from the SVG's viewBox for responsive scaling.
  const aspectStyle = React.useMemo<React.CSSProperties>(() => {
    const m = svg.match(/viewBox="0 0 ([\d.]+) ([\d.]+)"/);
    if (m) {
      const w = parseFloat(m[1]);
      const h = parseFloat(m[2]);
      if (w > 0 && h > 0) {
        return { aspectRatio: `${w} / ${h}`, width: "100%", maxHeight: "70vh" };
      }
    }
    return { width: "100%" };
  }, [svg]);

  const liveLabel = caption ?? LIVE_CAPTIONS[variant];

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md border border-[#2A2722] bg-[#0A0908]",
        className
      )}
    >
      {/* Live preview pulse */}
      <div className="absolute top-3 left-3 z-10 flex items-center gap-1.5 rounded-full bg-[#0A0908]/80 px-2.5 py-1 backdrop-blur">
        <span className="relative flex h-2 w-2">
          <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-[#7A8B6F] opacity-75" />
          <span className="relative inline-flex h-2 w-2 rounded-full bg-[#7A8B6F]" />
        </span>
        <span className="text-[10px] font-medium uppercase tracking-wider text-[#9CA8A3]">
          {liveLabel}
        </span>
      </div>

      {/* SVG content */}
      <div
        className="flex items-center justify-center p-4"
        style={{ background: "radial-gradient(circle at 50% 30%, #121815 0%, #0A0908 70%)" }}
      >
        {svg ? (
          <div
            style={aspectStyle}
            dangerouslySetInnerHTML={{ __html: svg }}
          />
        ) : (
          <div className="py-12 text-center text-[12px] text-[#6B6358]">
            No data to preview
          </div>
        )}
      </div>
    </div>
  );
}

export { brandedFilename } from "@/lib/use-branded-image-download";
