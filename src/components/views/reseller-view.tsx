"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, Pill, SectionTitle, GradientButton } from "@/components/lumina/primitives";
import {
  ShimmerButton,
  AuroraGlowCard,
  GlowPill,
  NumberTicker,
} from "@/components/lumina/premium-ui";
import { BrandedImageCard, brandedFilename } from "@/components/branded-image";
import { useBrandedImageDownload } from "@/lib/use-branded-image-download";
import { CloverIcon } from "@/components/lumina/baydin-icons";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
} from "@/components/ui/sheet";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import {
  Store, Wallet, Send, TrendingUp, Package,
  Sparkles, Award, Megaphone, Download, FileText, LifeBuoy,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

// ============================================================
// Reseller tier color helper (client-safe local mirror of
// the admin-view tierColor — kept local because @/lib/luck is
// server-only).
// ============================================================

const RESELLER_TIER_DEFS = [
  { id: "bronze", name: "Bronze", color: "#A57142" },
  { id: "silver", name: "Silver", color: "#BFC8CC" },
  { id: "gold", name: "Gold", color: "#C5A572" },
  { id: "platinum", name: "Platinum", color: "#B9F2FF" },
  { id: "diamond", name: "Diamond", color: "#9E8AC9" },
  { id: "elite", name: "Elite", color: "#7A8B6F" },
  { id: "legend", name: "Legend", color: "#E7A264" },
] as const;

export function resellerTierColor(tier: string | null | undefined): string {
  if (!tier) return "#9CA8A3";
  const t = RESELLER_TIER_DEFS.find(
    (d) => d.id === tier || `reseller_${d.id}` === tier,
  );
  return t?.color ?? "#9CA8A3";
}

export function resellerTierName(tier: string | null | undefined): string {
  if (!tier) return "—";
  return tier
    .replace(/^reseller_/, "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export function ResellerView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [inventory, setInventory] = React.useState<any>(null);
  const [toEmail, setToEmail] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [saleMmk, setSaleMmk] = React.useState("");
  const [transferring, setTransferring] = React.useState(false);

  async function loadInv() {
    try { setInventory(await api<any>("/api/reseller/inventory")); } catch {}
  }
  React.useEffect(() => { if (user && (user.role === "reseller" || user.role === "admin")) loadInv(); }, [user]);

  async function transfer() {
    setTransferring(true);
    try {
      const res = await api<{ ok: boolean; error?: string }>("/api/reseller/transfer", {
        method: "POST", json: { toEmail, amount: parseInt(amount), saleMmk: saleMmk ? parseInt(saleMmk) : undefined },
      });
      if (res.error) { toast.error(res.error); return; }
      toast.success(`Transferred ${amount} Luck to ${toEmail}`);
      setToEmail(""); setAmount(""); setSaleMmk("");
      loadInv();
      qc.invalidateQueries({ queryKey: ["me"] });
    } catch (e: any) { toast.error(e.message); }
    finally { setTransferring(false); }
  }

  if (!user) return <Gate onAuth={onAuth} title="Sign in to access the reseller portal" />;
  if (user.role !== "reseller" && user.role !== "admin") {
    return <Gate onAuth={() => {}} title="Reseller access required" desc="This area is for whitelisted resellers only. Contact an admin if you'd like to become one." />;
  }

  const poolBalance = inventory?.reseller?.pool ?? user.resellerPool ?? 0;
  const tierColorStr = resellerTierColor(user.resellerTier);

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-5 h-5 text-[#7A8B6F]" />
          <Pill variant="leaf">Reseller Portal</Pill>
          {user.resellerTier && (
            <Pill variant="gold" className="capitalize">{resellerTierName(user.resellerTier)}</Pill>
          )}
        </div>
        <SectionTitle eyebrow="Wholesale" title="Reseller Dashboard" subtitle="Buy Luck at wholesale rates and resell to your clients at your own price." className="mb-6" />

        {/* TopUpBalanceBanner — between Hero and Stats (Earnings Overview) */}
        <TopUpBalanceBanner
          poolBalance={poolBalance}
          tier={user.resellerTier}
          tierColor={tierColorStr}
          onTopUp={() => setView("luck-store")}
        />

        {/* Stats */}
        <div className="grid grid-cols-3 gap-3 mb-6">
          <StatCard icon={Package} label="Wholesale pool" value={`${inventory?.reseller?.pool ?? user.resellerPool}`} sub="Luck to resell" />
          <StatCard icon={Wallet} label="Your balance" value={`${inventory?.reseller?.balance ?? user.luckBalance}`} sub="Spendable Luck" />
          <StatCard icon={TrendingUp} label="Total sold" value={`${inventory?.transfersOut?.reduce((a:number,t:any)=>a+t.amount,0) ?? 0}`} sub="Luck transferred" />
        </div>

        {/* Buy more (wholesale) */}
        <GlassCard className="p-5 mb-4">
          <div className="text-[13px] text-[#E8E2D5] mb-2">Need more inventory?</div>
          <div className="text-[12px] text-[#9C9489] mb-3">Top up your wholesale inventory from the <span className="text-[#C5A572]">Earn Luck</span> tab — reseller packs start at 50,000 MMK with up to 100% bonus.</div>
          <a href="#" onClick={(e) => { e.preventDefault(); setView("luck-store"); }} className="text-[12px] text-[#C5A572] hover:underline">Go to Earn Luck →</a>
        </GlassCard>

        {/* Transfer (resell) */}
        <GlassCard className="p-5 mb-4">
          <div className="text-[13px] text-[#E8E2D5] mb-3 flex items-center gap-2"><Send className="w-4 h-4 text-[#C5A572]" /> Sell Luck to a client</div>
          <div className="grid grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-[12px] text-[#9C9489]">Recipient email</Label>
              <Input value={toEmail} onChange={(e) => setToEmail(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="client@example.com" />
            </div>
            <div>
              <Label className="text-[12px] text-[#9C9489]">Luck amount</Label>
              <Input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="100" />
            </div>
          </div>
          <div className="mb-3">
            <Label className="text-[12px] text-[#9C9489]">Your sale price (MMK, optional — for your records)</Label>
            <Input type="number" value={saleMmk} onChange={(e) => setSaleMmk(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. 80000" />
          </div>
          <GradientButton onClick={transfer} disabled={transferring || !toEmail || !amount} className="w-full">
            {transferring ? "Transferring…" : <>Transfer {amount || ""} Luck</>}
          </GradientButton>
        </GlassCard>

        {/* Transfer history */}
        {inventory?.transfersOut?.length > 0 && (
          <GlassCard className="p-5 mb-6">
            <div className="text-[12px] text-[#9C9489] mb-3">Recent transfers</div>
            <div className="space-y-1.5">
              {inventory.transfersOut.map((t: any) => (
                <div key={t.id} className="flex items-center justify-between py-2 border-b border-[#2A2722] last:border-0 text-[12px]">
                  <div>
                    <div className="text-[#E8E2D5]">{t.amount} Luck</div>
                    <div className="text-[#9C9489] text-[10px]">to {inventory.recipients.find((r:any)=>r.toUserId===t.toUserId)?.user?.email || "—"}</div>
                  </div>
                  <div className="text-right">
                    <div className="text-[#7A8B6F]">{t.saleMmk ? `${t.saleMmk.toLocaleString()} MMK` : "—"}</div>
                    <div className="text-[#9C9489] text-[10px]">{new Date(t.createdAt).toLocaleDateString()}</div>
                  </div>
                </div>
              ))}
            </div>
          </GlassCard>
        )}

        {/* Partner Resources */}
        <PartnerResources user={user} />

        {/* Branded Certificates */}
        <BrandedCertificatesSection user={user} />

        {/* Recent Certificates */}
        <RecentCertificates />
      </div>
    </div>
  );
}

// ============================================================
// TopUpBalanceBanner — prominent gold-glow AuroraGlowCard with
// NumberTicker of the reseller pool balance, contextual message,
// and a large ShimmerButton CTA → navigates to Luck Store.
// ============================================================

function TopUpBalanceBanner({
  poolBalance,
  tier,
  tierColor,
  onTopUp,
}: {
  poolBalance: number;
  tier: string | null | undefined;
  tierColor: string;
  onTopUp: () => void;
}) {
  const isEmpty = poolBalance <= 0;
  return (
    <AuroraGlowCard
      glowColor="#C5A572"
      glowIntensity={isEmpty ? 0.25 : 0.15}
      className="mb-6 p-5 lg:p-6"
    >
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-3 flex-wrap">
            <GlowPill color="#C5A572">Reseller Pool</GlowPill>
            {tier && (
              <GlowPill color={tierColor}>{resellerTierName(tier)}</GlowPill>
            )}
          </div>
          <div className="flex items-center gap-3 mb-2">
            <CloverIcon
              className="w-7 h-7 text-[#C5A87C] shrink-0"
              strokeWidth={1.6}
              aria-label="Luck"
            />
            <div className="flex items-baseline gap-2">
              <NumberTicker
                value={poolBalance}
                className="serif-display text-[2.4rem] text-[#C5A572] tabular-nums leading-none"
              />
              <span className="text-[12px] text-[#9C9489]">Luck available</span>
            </div>
          </div>
          <div className="text-[12px] text-[#9C9489] leading-relaxed max-w-[55ch]">
            {isEmpty
              ? "Your wholesale pool is empty. Top up to start reselling Luck to your clients."
              : "Your wholesale inventory is active — transfer Luck to your clients at your own price."}
          </div>
          {isEmpty && (
            <div className="mt-3 rounded-sm border border-[#C5A572]/20 bg-[#C5A572]/5 px-3 py-2 text-[11px] text-[#C5A572] leading-relaxed">
              Top up required to start reselling. Reseller packs start at 50,000 MMK with up to 54% bonus.
            </div>
          )}
        </div>
        <div className="shrink-0 sm:self-center">
          <ShimmerButton onClick={onTopUp} tone="gold" className="px-6 py-3 text-[14px]">
            <Wallet className="w-4 h-4" /> Top Up More Luck
          </ShimmerButton>
        </div>
      </div>
    </AuroraGlowCard>
  );
}

// ============================================================
// PartnerResources — three wired-up "coming soon" CTAs.
//   • Marketing kit        → downloads branded welcome card PNG
//   • Terms & Policies     → opens Sheet with 6-section agreement
//   • Partner support      → mailto: link
// ============================================================

function PartnerResources({ user }: { user: any }) {
  const { download, downloading } = useBrandedImageDownload();
  const hiddenCardRef = React.useRef<HTMLDivElement>(null);
  const [termsOpen, setTermsOpen] = React.useState(false);

  async function downloadMarketingKit() {
    if (!hiddenCardRef.current) return;
    await download(
      hiddenCardRef.current,
      brandedFilename("certificate-welcome", "marketing-kit"),
    );
  }

  return (
    <GlassCard className="p-5 mb-6">
      <div className="text-[12px] text-[#9C9489] mb-1">Partner resources</div>
      <div className="text-[14px] text-[#E8E2D5] mb-4">
        Marketing materials, agreement, and direct support.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
        <button
          onClick={downloadMarketingKit}
          disabled={downloading}
          className="flex items-center gap-2 p-3 rounded-sm border border-[#2A2722] bg-[#0F0D0B] hover:border-[#C5A572]/30 hover:bg-[#1A1714] transition text-left disabled:opacity-50"
        >
          <Download className="w-4 h-4 text-[#C5A572] shrink-0" />
          <div className="min-w-0">
            <div className="text-[12px] text-[#E8E2D5]">Marketing kit</div>
            <div className="text-[10px] text-[#9C9489]">
              {downloading ? "Preparing PNG…" : "Download welcome card"}
            </div>
          </div>
        </button>
        <button
          onClick={() => setTermsOpen(true)}
          className="flex items-center gap-2 p-3 rounded-sm border border-[#2A2722] bg-[#0F0D0B] hover:border-[#C5A572]/30 hover:bg-[#1A1714] transition text-left"
        >
          <FileText className="w-4 h-4 text-[#C5A572] shrink-0" />
          <div className="min-w-0">
            <div className="text-[12px] text-[#E8E2D5]">Terms &amp; Policies</div>
            <div className="text-[10px] text-[#9C9489]">Reseller agreement</div>
          </div>
        </button>
        <a
          href="mailto:partners@baydin.app?subject=Baydin%20Reseller%20Support"
          className="flex items-center gap-2 p-3 rounded-sm border border-[#2A2722] bg-[#0F0D0B] hover:border-[#C5A572]/30 hover:bg-[#1A1714] transition text-left"
        >
          <LifeBuoy className="w-4 h-4 text-[#C5A572] shrink-0" />
          <div className="min-w-0">
            <div className="text-[12px] text-[#E8E2D5]">Partner support</div>
            <div className="text-[10px] text-[#9C9489]">Email partners@baydin.app</div>
          </div>
        </a>
      </div>

      {/* Hidden BrandedImageCard mount for marketing-kit PNG download */}
      <div
        ref={hiddenCardRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -99999,
          top: 0,
          pointerEvents: "none",
          opacity: 0,
        }}
      >
        <BrandedImageCard
          variant="certificate-welcome"
          certificate={{
            userName: user?.name ?? null,
            userEmail: user?.email ?? "",
            tier: user?.resellerTier ?? "",
            language: user?.language,
          }}
        />
      </div>

      <TermsSheet open={termsOpen} onOpenChange={setTermsOpen} />
    </GlassCard>
  );
}

// ============================================================
// TermsSheet — 6-section reseller agreement in a Sheet.
// ============================================================

const RESELLER_AGREEMENT_SECTIONS = [
  {
    title: "1. Partner role & wholesale access",
    body: "As an approved Baydin Reseller, you purchase Luck at wholesale rates and resell to your clients at your own price. Your reseller tier (Bronze → Legend) determines your wholesale discount and bonus rate. Wholesale purchases credit the Luck to your reseller pool, not your personal balance.",
  },
  {
    title: "2. Pricing & markup policy",
    body: "You set your own resale price. The sale price you record at transfer is for your own bookkeeping — Baydin does not enforce a minimum or maximum markup. We recommend a 10–30% margin over your wholesale Luck cost to remain competitive.",
  },
  {
    title: "3. Payment & settlement terms",
    body: "Wholesale pack purchases are settled via KBZ Pay, Wave Money, AYA Pay, CB Pay, or cash/bank transfer. Luck is credited to your reseller pool once the transaction reference is verified. Refunds are issued only for crediting errors reported within 7 days.",
  },
  {
    title: "4. Client onboarding & support",
    body: "Your clients sign up via your referral code (or any direct signup). You may use the Welcome Certificate and Promotional Certificate to introduce Baydin to your clients. First-line client support is your responsibility; escalate technical issues to partners@baydin.app.",
  },
  {
    title: "5. Branding & marketing guidelines",
    body: "Use the Baydin wordmark, clover mark, and certificate templates only as provided. Do not alter the brand palette, imply endorsement of unrelated products, or use the Baydin name in paid advertising without written approval. Co-branded flyers must be reviewed before distribution.",
  },
  {
    title: "6. Termination & modifications",
    body: "Either party may terminate this agreement with 30 days' written notice. Upon termination, any remaining reseller pool is converted to personal Luck at a 1:1 rate. Baydin reserves the right to update wholesale rates, bonus percentages, and tier thresholds with 14 days' notice.",
  },
];

function TermsSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-full sm:max-w-lg bg-[#0A0908] border-[#2A2722] text-[#E8E2D5] overflow-y-auto lumina-scroll"
      >
        <SheetHeader>
          <SheetTitle className="serif-display text-[1.25rem] text-[#E8E2D5]">
            Reseller Agreement
          </SheetTitle>
          <SheetDescription className="text-[12px] text-[#9C9489]">
            Summary of terms — a full legal agreement accompanies your onboarding email.
          </SheetDescription>
        </SheetHeader>
        <div className="px-4 pb-6 space-y-4">
          {RESELLER_AGREEMENT_SECTIONS.map((s) => (
            <div key={s.title}>
              <div className="text-[12px] font-medium text-[#C5A572] mb-1.5">{s.title}</div>
              <div className="text-[12px] text-[#9C9489] leading-relaxed">{s.body}</div>
            </div>
          ))}
          <div className="pt-3 border-t border-[#2A2722] text-[10px] text-[#6B6358]">
            Baydin · Myanmar Astrology · Last updated {new Date().getFullYear()}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// BrandedCertificatesSection — three AuroraGlowCards:
//  • Welcome Certificate       (Sparkles, green)
//  • Tier Promotion Certificate (Award, gold)
//  • Promotional Certificate     (Megaphone, purple)
// Clicking "Generate & Download" hits /api/reseller/certificate,
// opens a Dialog showing the returned SVG, and a "Download PNG"
// button uses useBrandedImageDownload + hidden BrandedImageCard.
// ============================================================

type CertKind = "welcome" | "tier_upgrade" | "promotion";

type CertCardDef = {
  kind: CertKind;
  title: string;
  desc: string;
  icon: any;
  color: string;
  variant: "certificate-welcome" | "certificate-tier-upgrade" | "certificate-promotion";
};

const CERT_CARDS: CertCardDef[] = [
  {
    kind: "welcome",
    title: "Welcome Certificate",
    desc: "A branded welcome card you can share with new clients to introduce Baydin.",
    icon: Sparkles,
    color: "#7A8B6F",
    variant: "certificate-welcome",
  },
  {
    kind: "tier_upgrade",
    title: "Tier Promotion Certificate",
    desc: "Celebrate your latest tier milestone with a commemorative certificate.",
    icon: Award,
    color: "#C5A572",
    variant: "certificate-tier-upgrade",
  },
  {
    kind: "promotion",
    title: "Promotional Certificate",
    desc: "A promotional flyer to share with prospective clients during sales pushes.",
    icon: Megaphone,
    color: "#9E8AC9",
    variant: "certificate-promotion",
  },
];

function BrandedCertificatesSection({ user }: { user: any }) {
  const [generating, setGenerating] = React.useState<CertKind | null>(null);
  const [activeCert, setActiveCert] = React.useState<{ svg: string; kind: CertKind; tier: string; variant: CertCardDef["variant"] } | null>(null);
  const { download, downloading } = useBrandedImageDownload();
  const hiddenCardRef = React.useRef<HTMLDivElement>(null);

  async function generate(kind: CertKind, def: CertCardDef) {
    setGenerating(kind);
    try {
      const body: any = { kind };
      if (kind === "tier_upgrade" || kind === "promotion") {
        body.metadata = { tier: user.resellerTier };
      }
      const res = await api<{ certificate: { brandedImageSvg: string } }>(
        "/api/reseller/certificate",
        { method: "POST", json: body },
      );
      setActiveCert({
        svg: res.certificate.brandedImageSvg,
        kind,
        tier: user.resellerTier ?? "",
        variant: def.variant,
      });
      toast.success("Certificate generated");
    } catch (e: any) {
      toast.error(e.message ?? "Failed to generate certificate");
    } finally {
      setGenerating(null);
    }
  }

  async function downloadPng() {
    if (!hiddenCardRef.current) return;
    await download(
      hiddenCardRef.current,
      brandedFilename(activeCert!.variant),
    );
  }

  return (
    <div className="mb-6">
      <SectionTitle
        eyebrow="Branded assets"
        title="Branded Certificates"
        subtitle="Self-service branded certificates for your clients and milestones."
        className="mb-4"
      />
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CERT_CARDS.map((c) => {
          const Icon = c.icon;
          const isTierCard = c.kind === "tier_upgrade";
          return (
            <AuroraGlowCard
              key={c.kind}
              glowColor={c.color}
              glowIntensity={0.18}
              className="p-4 flex flex-col gap-3"
            >
              <div className="flex items-center gap-2">
                <div
                  className="w-8 h-8 rounded-sm flex items-center justify-center"
                  style={{ background: `${c.color}1A`, border: `1px solid ${c.color}40` }}
                >
                  <Icon className="w-4 h-4" style={{ color: c.color }} />
                </div>
                <div className="text-[13px] text-[#E8E2D5] font-medium leading-tight">{c.title}</div>
              </div>
              <div className="text-[11px] text-[#9C9489] leading-relaxed flex-1">{c.desc}</div>
              {isTierCard && user.resellerTier && (
                <div>
                  <GlowPill color={resellerTierColor(user.resellerTier)}>
                    {resellerTierName(user.resellerTier)}
                  </GlowPill>
                </div>
              )}
              <ShimmerButton
                tone="gold"
                onClick={() => generate(c.kind, c)}
                disabled={generating === c.kind}
                className="w-full py-2 text-[12px]"
              >
                {generating === c.kind ? "Generating…" : "Generate & Download"}
              </ShimmerButton>
            </AuroraGlowCard>
          );
        })}
      </div>

      {/* Certificate preview Dialog */}
      <Dialog open={!!activeCert} onOpenChange={(o) => !o && setActiveCert(null)}>
        <DialogContent className="max-w-2xl bg-[#0A0908] border-[#2A2722]">
          <DialogHeader>
            <DialogTitle className="serif-display text-[1.25rem] text-[#E8E2D5]">
              {activeCert ? CERT_CARDS.find((c) => c.kind === activeCert.kind)?.title : ""}
            </DialogTitle>
            <DialogDescription className="text-[12px] text-[#9C9489]">
              Preview your branded certificate. Download as PNG to share with clients.
            </DialogDescription>
          </DialogHeader>
          <div
            className="rounded-sm border border-[#2A2722] bg-[#0A0908] overflow-hidden"
            dangerouslySetInnerHTML={{ __html: activeCert?.svg ?? "" }}
          />
          <DialogFooter>
            <ShimmerButton
              tone="gold"
              onClick={downloadPng}
              disabled={downloading || !activeCert}
              className="px-5 py-2.5"
            >
              <Download className="w-4 h-4" />
              {downloading ? "Preparing PNG…" : "Download PNG"}
            </ShimmerButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Hidden BrandedImageCard mount for PNG download */}
      {activeCert && (
        <div
          ref={hiddenCardRef}
          aria-hidden
          style={{
            position: "fixed",
            left: -99999,
            top: 0,
            pointerEvents: "none",
            opacity: 0,
          }}
        >
          <BrandedImageCard
            variant={activeCert.variant}
            certificate={{
              userName: user?.name ?? null,
              userEmail: user?.email ?? "",
              tier: activeCert.tier,
              language: user?.language,
            }}
          />
        </div>
      )}
    </div>
  );
}

// ============================================================
// RecentCertificates — fetches GET /api/reseller/certificate/history
// and shows the last 5 with kind label + tier pill + timestamp.
// ============================================================

function RecentCertificates() {
  const [history, setHistory] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  const load = React.useCallback(async () => {
    try {
      const res = await api<{ issuedToMe: any[]; issuedByMe: any[] }>(
        "/api/reseller/certificate/history",
      );
      // Merge + dedupe by id, sort by createdAt desc, take 5
      const merged = new Map<string, any>();
      for (const c of [...(res.issuedToMe ?? []), ...(res.issuedByMe ?? [])]) {
        if (!merged.has(c.id)) merged.set(c.id, c);
      }
      const sorted = Array.from(merged.values()).sort(
        (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime(),
      );
      setHistory(sorted.slice(0, 5));
    } catch {
      setHistory([]);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <GlassCard className="p-5">
        <div className="text-[12px] text-[#9C9489]">Loading recent certificates…</div>
      </GlassCard>
    );
  }

  if (history.length === 0) return null;

  return (
    <GlassCard className="p-5">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-[#C5A572]" />
          <span className="text-[12px] text-[#9C9489]">Recent certificates</span>
        </div>
        <span className="text-[11px] text-[#6B6358]">Last 5</span>
      </div>
      <div className="space-y-1.5">
        {history.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between py-2 border-b border-[#2A2722] last:border-0 text-[12px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <span className="text-[#E8E2D5] capitalize">
                {String(c.kind).replace(/_/g, " ")}
              </span>
              {c.tier && (
                <GlowPill color={resellerTierColor(c.tier)} className="text-[9px]">
                  {resellerTierName(c.tier)}
                </GlowPill>
              )}
            </div>
            <div className="text-[10px] text-[#9C9489] shrink-0">
              {new Date(c.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </GlassCard>
  );
}

function StatCard({ icon: Icon, label, value, sub }: { icon: any; label: string; value: string; sub: string }) {
  return (
    <GlassCard className="p-3">
      <div className="flex items-center gap-1.5 mb-1 text-[10px] text-[#9C9489] uppercase tracking-wide">
        <Icon className="w-3 h-3 text-[#C5A572]" /> {label}
      </div>
      <div className="text-[18px] font-light text-[#E8E2D5]">{value}</div>
      <div className="text-[10px] text-[#9C9489]">{sub}</div>
    </GlassCard>
  );
}

function Gate({ onAuth, title, desc }: { onAuth: () => void; title: string; desc?: string }) {
  return (
    <div className="h-full flex items-center justify-center px-6 text-center">
      <div>
        <Store className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
        <div className="text-[16px] text-[#E8E2D5] mb-1">{title}</div>
        {desc && <div className="text-[12px] text-[#9C9489] max-w-sm">{desc}</div>}
      </div>
    </div>
  );
}
