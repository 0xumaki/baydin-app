"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { StarField } from "@/components/lumina/primitives";
import {
  GlowPill,
  ShimmerButton,
  AuroraGlowCard,
  LiquidMetalText,
  NumberTicker,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, CloverPNG } from "@/components/lumina/baydin-icons";
import { Wallet, Check, Gift, Moon, Star, Sparkles, Heart, Hash, CalendarClock, Copy, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================================
// Campaign helpers (client-side)
// ============================================================

type Campaign = {
  id: string;
  name: string;
  kind: "user" | "reseller";
  tierId: string;
  mmkOverride?: number | null;
  bonusPctOverride?: number | null;
  validFrom?: string | null;
  validUntil?: string | null;
};

/** Returns the days remaining until a campaign's validUntil date
 *  (negative if already expired, 0 if same-day). */
function daysUntilExpiry(validUntil: string | null | undefined): number | null {
  if (!validUntil) return null;
  const end = new Date(validUntil).getTime();
  if (Number.isNaN(end)) return null;
  const now = Date.now();
  return Math.ceil((end - now) / (1000 * 60 * 60 * 24));
}

function formatExpiryDate(validUntil: string | null | undefined): string {
  if (!validUntil) return "";
  try {
    return new Date(validUntil).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  } catch {
    return String(validUntil);
  }
}

/** Find the active campaign for a tier (looking it up in the top-level
 *  campaigns list, since the per-tier `campaign` object only has id/name/kind). */
function findCampaignForTier(
  tier: any,
  campaigns: Campaign[] | undefined,
): Campaign | null {
  if (!campaigns || campaigns.length === 0) return null;
  // Per-tier campaign object from /api/luck/tiers has { id, name, kind }.
  const campaignId = tier?.campaign?.id;
  if (campaignId) {
    const c = campaigns.find((cc) => cc.id === campaignId);
    if (c) return c;
  }
  // Fallback: match by tierId + kind.
  const kind = tier?.kind === "reseller" ? "reseller" : "user";
  return campaigns.find(
    (c) => c.tierId === tier.id && c.kind === kind,
  ) ?? null;
}

const PAYMENT_METHODS = [
  { id: "kbz", name: "KBZ Pay" },
  { id: "wave", name: "Wave Money" },
  { id: "aya", name: "AYA Pay" },
  { id: "cb", name: "CB Pay" },
  { id: "cash", name: "Cash / Bank" },
];

// Feature cost reference shown to the user
const FEATURE_COSTS = [
  { feature: "Astrologer chat (per turn)", cost: 2, icon: Sparkles },
  { feature: "Tarot reading (after 2 free/day)", cost: 1, icon: Star },
  { feature: "Birth chart", cost: 3, icon: Star },
  { feature: "Numerology report", cost: 3, icon: Hash },
  { feature: "Personal horoscope", cost: 2, icon: Moon },
  { feature: "Compatibility", cost: 5, icon: Heart },
  { feature: "Dream interpretation", cost: 2, icon: Moon },
  { feature: "Life report", cost: 15, icon: Star },
];

function MessageCircleIcon(props: any) {
  // Local stub to avoid importing the chat icon name clash
  return <Sparkles {...props} />;
}

export function LuckStoreView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const t = useT();
  const [tiers, setTiers] = React.useState<{ regular: any[]; reseller: any[] | null; campaigns?: Campaign[] }>({ regular: [], reseller: null });
  const [selected, setSelected] = React.useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = React.useState("kbz");
  const [paymentRef, setPaymentRef] = React.useState("");
  const [buying, setBuying] = React.useState(false);

  React.useEffect(() => {
    fetch("/api/luck/tiers").then((r) => r.json()).then(setTiers).catch(() => {});
  }, []);

  async function buy(tierId: string) {
    if (!user) { onAuth(); return; }
    if (!paymentRef.trim()) { toast.error("Enter your payment transaction reference"); return; }
    setBuying(true);
    try {
      const res = await api<{ ok: boolean; error?: string }>("/api/luck/purchase", {
        method: "POST", json: { tierId, paymentMethod, paymentRef },
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success("Luck added to your account");
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["luck", "transactions"] });
      setSelected(null);
      setPaymentRef("");
    } catch (e: any) { toast.error(e.message); }
    finally { setBuying(false); }
  }

  async function copyReferralLink() {
    if (!user) return;
    try {
      await navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.referralCode}`);
      toast.success("Referral link copied");
    } catch { toast.error("Could not copy link"); }
  }

  async function shareReferral() {
    if (!user) return;
    const url = `${window.location.origin}/?ref=${user.referralCode}`;
    const shareText = `Join me on Baydin — get free Luck on signup with my code: ${user.referralCode}`;
    if (navigator.share) {
      try {
        await navigator.share({ title: "Baydin", text: shareText, url });
      } catch { /* user dismissed */ }
    } else {
      await copyReferralLink();
    }
  }

  if (!user) {
    return (
      <div className="relative min-h-screen flex flex-col">
        <div className="fixed inset-0 z-0 pointer-events-none">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={24} />
        </div>
        <div className="relative z-10 min-w-0 flex-1 flex items-center justify-center px-6 text-center">
          <div>
            <div className="w-14 h-14 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/20 flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-7 h-7 text-[#C5A572]" />
            </div>
            <div className="text-[16px] text-[#E8E2D5] mb-1">{t("luck_earn")}</div>
            <ShimmerButton tone="gold" onClick={onAuth} className="mt-4">
              {t("sign_in")}
            </ShimmerButton>
          </div>
        </div>
      </div>
    );
  }

  const selectedTier = [...tiers.regular, ...(tiers.reseller || [])].find((t) => t.id === selected);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Backdrop: AnimatedGradientBackground (cosmic) + StarField */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>

      <div className="relative z-10 min-w-0 overflow-hidden flex-1">
        <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 pb-20">
          {/* Hero */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <Wallet className="w-5 h-5 text-[#C5A572]" />
              <GlowPill color="#C5A572" className="!text-[10px] uppercase tracking-wide">
                In-app credit
              </GlowPill>
            </div>
            <LiquidMetalText as="h1" className="text-[28px] sm:text-[32px] lg:text-[40px] font-light leading-tight block">
              {t("luck_earn")}
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mt-2 max-w-2xl leading-relaxed">
              Luck is the credit you spend on readings, rituals, and reports. Earn it through daily rewards, referrals, or by topping up below.
            </p>
            {/* Luck balance display */}
            <AuroraGlowCard
              glowColor="#C5A572"
              glowIntensity={0.15}
              className="mt-4 p-4 inline-flex items-center gap-3 relative overflow-hidden"
            >
              <CloverPNG
                aria-hidden
                className="absolute -right-2 -bottom-2 w-16 h-16 opacity-[0.08] pointer-events-none"
              />
              <div className="flex items-center gap-2 relative z-10">
                <CloverIcon className="w-6 h-6 text-[#C5A87C]" strokeWidth={1.6} aria-label="Luck" />
                <div className="flex items-baseline gap-2">
                  <NumberTicker
                    value={user.luckBalance}
                    className="serif-display text-[1.75rem] text-[#C5A572] tabular-nums leading-none"
                  />
                  <span className="text-[12px] text-[#9C9489]">Luck in your account</span>
                </div>
              </div>
            </AuroraGlowCard>
          </div>

          {/* Ways to Earn — 3 AuroraGlowCards */}
          <div className="mb-6">
            <div className="text-[12px] text-[#9C9489] font-medium mb-3 uppercase tracking-wide">{t("luck_ways_to_earn")}</div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <EarnMethodCard
                icon={Gift}
                title="Daily reward"
                body="Claim 1–5 Luck each day. Streaks grow the reward."
                cta="Claim in sidebar"
                color="#C5A572"
              />
              <EarnMethodCard
                icon={MessageCircleIcon}
                title="Refer friends"
                body="Earn 10 Luck for each friend who signs up with your code."
                cta={user.referralCode}
                color="#7A8B6F"
              />
              <EarnMethodCard
                icon={Sparkles}
                title="Practice daily"
                body="Complete rituals, mood checks, and frequency sessions for streak Luck."
                cta="See practices"
                color="#9E8AC9"
              />
            </div>
          </div>

          {/* What Luck buys — premium list with AuroraGlowCard per feature */}
          <div className="mb-6">
            <div className="text-[12px] text-[#9C9489] font-medium mb-3 uppercase tracking-wide">{t("luck_what_buys")}</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {FEATURE_COSTS.map(({ feature, cost, icon: Icon }) => (
                <AuroraGlowCard key={feature} glowColor="#C5A572" glowIntensity={0.06} className="p-3">
                  <div className="flex items-baseline justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Icon className="w-3.5 h-3.5 text-[#6B6358] shrink-0" />
                      <span className="text-[12px] text-[#9C9489] truncate">{feature}</span>
                    </div>
                    <span className="flex items-center gap-1 serif-display text-[1.1rem] text-[#E8E2D5] tabular-nums shrink-0">
                      <CloverIcon className="w-3 h-3 text-[#C5A572]" aria-label="Luck" />
                      {cost}
                    </span>
                  </div>
                </AuroraGlowCard>
              ))}
            </div>
          </div>

          {/* Referral Program — AuroraGlowCard with CloverPNG watermark */}
          <AuroraGlowCard
            glowColor="#7A8B6F"
            glowIntensity={0.12}
            className="p-5 mb-6 relative overflow-hidden"
          >
            <CloverPNG
              aria-hidden
              className="absolute -right-4 -bottom-4 w-28 h-28 opacity-[0.06] pointer-events-none"
            />
            <div className="relative z-10 flex items-center gap-4">
              <Gift className="w-5 h-5 text-[#C5A572] shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="text-[13px] text-[#E8E2D5] font-medium">Share your referral code</div>
                <div className="text-[11px] text-[#9C9489] mt-0.5">10 Luck for each friend who joins</div>
              </div>
              <div className="serif-display text-[1rem] text-[#C5A572] tabular-nums mr-2 tracking-[0.2em]">
                {user.referralCode}
              </div>
              <button
                onClick={copyReferralLink}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-[12px] border border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5] hover:border-[#4A4540] transition"
              >
                <Copy className="w-3.5 h-3.5" /> Copy link
              </button>
              <button
                onClick={shareReferral}
                className="inline-flex items-center gap-1.5 px-3 py-2 rounded-sm text-[12px] border border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5] hover:border-[#4A4540] transition"
              >
                <Share2 className="w-3.5 h-3.5" /> Share
              </button>
            </div>
          </AuroraGlowCard>

          {/* Luck Packs — regular tiers */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <div className="text-[12px] text-[#9C9489] font-medium uppercase tracking-wide">{t("luck_packs")}</div>
              <GlowPill color="#C5A572" className="text-[10px]">{tiers.regular.length} tiers</GlowPill>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {tiers.regular.map((tier) => (
                <TierCard
                  key={tier.id}
                  tier={tier}
                  campaign={findCampaignForTier(tier, tiers.campaigns)}
                  selected={selected === tier.id}
                  onSelect={() => setSelected(selected === tier.id ? null : tier.id)}
                />
              ))}
            </div>
          </div>

          {/* Reseller packs (only if user is reseller/admin) */}
          {tiers.reseller && tiers.reseller.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] text-[#9C9489] font-medium uppercase tracking-wide">Reseller packs (whitelisted)</div>
                <GlowPill color="#9E8AC9" className="text-[10px]">Wholesale</GlowPill>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {tiers.reseller.map((tier) => (
                  <TierCard
                    key={tier.id}
                    tier={tier}
                    campaign={findCampaignForTier(tier, tiers.campaigns)}
                    selected={selected === tier.id}
                    onSelect={() => setSelected(selected === tier.id ? null : tier.id)}
                    reseller
                  />
                ))}
              </div>
            </div>
          )}

          {/* Payment panel — AuroraGlowCard */}
          {selectedTier && (() => {
            const selectedCampaign = findCampaignForTier(selectedTier, tiers.campaigns);
            const expiryDays = daysUntilExpiry(selectedCampaign?.validUntil);
            const expiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 3;
            return (
            <AuroraGlowCard
              glowColor={expiringSoon ? "#D8788A" : "#C5A572"}
              glowIntensity={0.14}
              className="p-5 mb-6"
            >
              <div className="flex items-center justify-between mb-3">
                <div className="text-[12px] text-[#9C9489] font-medium uppercase tracking-wide">Complete your purchase</div>
                <GlowPill color="#C5A572" className="text-[10px]">Selected</GlowPill>
              </div>
              <div className="serif-display text-[1.5rem] text-[#E8E2D5] mb-1">{selectedTier.name}</div>
              <div className="flex items-baseline gap-3 mb-5">
                <span className="flex items-center gap-1 serif-display text-[1.5rem] text-[#C5A572] tabular-nums">
                  <CloverIcon className="w-4 h-4" aria-label="Luck" />
                  <NumberTicker value={selectedTier.total} />
                </span>
                <span className="text-[13px] text-[#9C9489]">Luck</span>
                <span className="text-[13px] text-[#9C9489]">·</span>
                <span className="text-[13px] text-[#9C9489] tabular-nums">{selectedTier.mmk.toLocaleString()} MMK</span>
              </div>

              {/* Campaign info banner */}
              {selectedCampaign && (
                <div
                  className={cn(
                    "mb-5 p-3 rounded-sm border flex items-start gap-2.5",
                    expiringSoon
                      ? "border-[#D8788A]/40 bg-[#D8788A]/5"
                      : "border-[#C5A572]/30 bg-[#C5A572]/5",
                  )}
                >
                  <CalendarClock
                    className={cn(
                      "w-4 h-4 shrink-0 mt-0.5",
                      expiringSoon ? "text-[#D8788A]" : "text-[#C5A572]",
                    )}
                  />
                  <div className="min-w-0">
                    <div className={cn("text-[12px] font-medium", expiringSoon ? "text-[#D8788A]" : "text-[#C5A572]")}>
                      ✦ {selectedCampaign.name}
                    </div>
                    <div className="text-[11px] text-[#9C9489] mt-0.5 leading-relaxed">
                      {selectedCampaign.bonusPctOverride != null && (
                        <>Bonus boosted to {selectedTier.bonusPct}%. {""}</>
                      )}
                      {selectedCampaign.mmkOverride != null && (
                        <>Price overridden to {selectedTier.mmk.toLocaleString()} MMK. {""}</>
                      )}
                      {selectedCampaign.validUntil && (
                        <span className={expiringSoon ? "text-[#D8788A]" : ""}>
                          Campaign valid until {formatExpiryDate(selectedCampaign.validUntil)}
                          {expiryDays !== null && expiryDays >= 0 && expiryDays <= 3
                            ? ` · only ${expiryDays} day${expiryDays === 1 ? "" : "s"} left!`
                            : ""}
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <Label className="block text-[12px] text-[#9C9489] font-medium mb-2 uppercase tracking-wide">Payment method</Label>
                  <div className="grid grid-cols-5 gap-1.5">
                    {PAYMENT_METHODS.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => setPaymentMethod(m.id)}
                        className={cn(
                          "px-2 py-2.5 text-[11px] border transition focus-ring rounded-sm",
                          paymentMethod === m.id
                            ? "border-[#C5A572] bg-[#1A1714] text-[#E8E2D5]"
                            : "border-[#2A2722] text-[#6B6358] hover:border-[#4A4540] hover:text-[#9C9489]"
                        )}
                      >
                        {m.name}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <Label className="block text-[12px] text-[#9C9489] font-medium mb-2 uppercase tracking-wide">Transaction reference</Label>
                  <Input
                    value={paymentRef}
                    onChange={(e) => setPaymentRef(e.target.value)}
                    className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] text-[13px] py-2.5 focus-ring"
                    placeholder="e.g. TXN123456789"
                  />
                </div>
                <div className="text-[12px] text-[#9C9489] leading-relaxed">
                  Transfer {selectedTier.mmk.toLocaleString()} MMK to our {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name} account, then enter the reference above. Luck is credited to your account.
                </div>
                <ShimmerButton
                  tone="gold"
                  onClick={() => buy(selectedTier.id)}
                  disabled={buying}
                  className="w-full py-3 text-[14px]"
                >
                  {buying ? "Processing…" : "Confirm purchase"}
                </ShimmerButton>
              </div>
            </AuroraGlowCard>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ============================================================
// EarnMethodCard — premium AuroraGlowCard
// ============================================================

function EarnMethodCard({
  icon: Icon,
  title,
  body,
  cta,
  color,
}: {
  icon: any;
  title: string;
  body: string;
  cta: string;
  color: string;
}) {
  return (
    <AuroraGlowCard glowColor={color} glowIntensity={0.1} className="p-5 flex flex-col gap-3">
      <div
        className="w-9 h-9 rounded-sm flex items-center justify-center"
        style={{ background: `${color}1A`, border: `1px solid ${color}40` }}
      >
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <div>
        <div className="text-[14px] text-[#E8E2D5] font-medium mb-1.5">{title}</div>
        <div className="text-[12px] text-[#9C9489] leading-[1.6]">{body}</div>
      </div>
      <div className="text-[11px] text-[#C5A572] serif-italic mt-auto">{cta}</div>
    </AuroraGlowCard>
  );
}

// ============================================================
// TierCard — AuroraGlowCard wrapper with all campaign features
// ============================================================

function TierCard({
  tier,
  campaign,
  selected,
  onSelect,
  reseller,
}: {
  tier: any;
  campaign: Campaign | null;
  selected: boolean;
  onSelect: () => void;
  reseller?: boolean;
}) {
  const hasCampaign = !!campaign;
  const expiryDays = daysUntilExpiry(campaign?.validUntil);
  const expiringSoon = expiryDays !== null && expiryDays >= 0 && expiryDays <= 3;
  return (
    <AuroraGlowCard
      glowColor={selected ? "#C5A572" : "#9C9489"}
      glowIntensity={selected ? 0.18 : 0.06}
      className={cn(
        "p-5 relative overflow-hidden cursor-pointer transition",
        selected ? "border-[#C5A572]/60" : "",
      )}
    >
      <button
        onClick={onSelect}
        className="absolute inset-0 z-10 w-full h-full cursor-pointer"
        aria-label={`Select ${tier.name} tier`}
      />
      {/* CloverPNG watermark */}
      <CloverPNG
        aria-hidden
        className="absolute -right-3 -bottom-3 w-20 h-20 opacity-[0.05] pointer-events-none"
      />
      {/* Campaign pill — top-left */}
      {hasCampaign && (
        <div className="absolute top-3 left-3 z-20">
          <GlowPill color="#C5A572" className="text-[9px]">✦ {campaign!.name}</GlowPill>
        </div>
      )}
      {/* Popular / Wholesale badge — top-right */}
      {tier.popular && !reseller && (
        <div className="absolute top-3 right-3 z-20">
          <GlowPill color="#E7A264" className="text-[9px]">Popular</GlowPill>
        </div>
      )}
      {reseller && (
        <div className="absolute top-3 right-3 z-20">
          <GlowPill color="#9E8AC9" className="text-[9px]">Wholesale</GlowPill>
        </div>
      )}

      <div className={cn("relative z-30 pointer-events-none", hasCampaign && "mt-7")}>
        <div className="text-[14px] text-[#E8E2D5] font-medium mb-3">{tier.name}</div>
        <div className="flex items-baseline gap-1.5 mb-1">
          <CloverIcon className="w-4 h-4 text-[#C5A572]" aria-label="Luck" />
          <NumberTicker
            value={tier.total}
            className="serif-display text-[2rem] text-[#C5A572] tabular-nums leading-none"
          />
          <span className="text-[12px] text-[#9C9489]">Luck</span>
        </div>
        {tier.bonus > 0 && (
          <div className="text-[11px] text-[#9C9489] mb-2 serif-italic">
            +{tier.bonusPct}% bonus {hasCampaign ? "✦" : ""}
            {hasCampaign && (
              <span className="block text-[9px] text-[#6B6358] not-italic">incl. campaign bonus</span>
            )}
          </div>
        )}
        <div className="text-[13px] text-[#9C9489] tabular-nums mb-1">{tier.mmk.toLocaleString()} MMK</div>
        <div className="text-[11px] text-[#6B6358] leading-[1.5] mt-2">{tier.tagline}</div>
        {/* Campaign valid-until footnote */}
        {hasCampaign && campaign!.validUntil && (
          <div
            className={cn(
              "text-[10px] mt-2 leading-tight",
              expiringSoon ? "text-[#D8788A]" : "text-[#9C9489]"
            )}
          >
            Campaign valid until {formatExpiryDate(campaign!.validUntil)}
            {expiryDays !== null && expiryDays >= 0 && expiryDays <= 3
              ? ` · ${expiryDays}d left`
              : ""}
          </div>
        )}
        <ShimmerButton
          tone={selected ? "gold" : "parchment"}
          className="w-full mt-4 py-2 text-[12px] pointer-events-auto relative z-40"
          onClick={(e: any) => {
            e?.stopPropagation?.();
            onSelect();
          }}
        >
          {selected ? (
            <>
              <Check className="w-3.5 h-3.5" /> Selected
            </>
          ) : (
            "Purchase"
          )}
        </ShimmerButton>
      </div>
      {selected && (
        <div className="absolute bottom-3 right-3 z-40 w-5 h-5 rounded-full bg-[#C5A572] flex items-center justify-center pointer-events-none">
          <Check className="w-3 h-3 text-[#0A0908]" />
        </div>
      )}
    </AuroraGlowCard>
  );
}
