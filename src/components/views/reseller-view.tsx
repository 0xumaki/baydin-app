"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, Pill, SectionTitle, GradientButton, ShellCard, StarField } from "@/components/lumina/primitives";
import {
  ShimmerButton,
  IconBgCard,
  GlowPill,
  NumberTicker,
  LiquidMetalText,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { BrandedImageCard, brandedFilename } from "@/components/branded-image";
import { useBrandedImageDownload } from "@/lib/use-branded-image-download";
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
import { cn } from "@/lib/utils";
import { CloverIcon, CloverPNG, BaydinStore, BaydinWallet, BaydinSend, BaydinTrending, BaydinStar, BaydinDownload, BaydinCalendar, BaydinUsers, BaydinClock, BaydinChevronRight, BaydinGift } from "@/components/lumina/baydin-icons";
import { BaydinStore as Package, BaydinStar as Award, BaydinShare as Megaphone, BaydinLifeReport as FileText, BaydinHelp as LifeBuoy, BaydinWallet as DollarSign, BaydinTrending as ArrowUpRight, BaydinTrending as ArrowDownRight, BaydinTrending as BarChart3, BaydinStar as Crown, BaydinTrending as Activity } from "@/components/lumina/baydin-icons";
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

// ============================================================
// Local sales-analytics helpers
// ============================================================

type ResellerTransfer = {
  id: string;
  amount: number;
  saleMmk?: number | null;
  toUserId: string;
  createdAt: string;
};

type ResellerRecipient = {
  toUserId: string;
  user?: { email?: string; name?: string | null };
};

type ResellerInventory = {
  reseller?: {
    pool: number;
    balance: number;
    tier: string | null;
    totalSold: number;
    totalMmk: number;
    totalTransfers: number;
    totalClients: number;
  } | null;
  transfersOut: ResellerTransfer[];
  recipients: ResellerRecipient[];
  recentSales?: Array<{ id: string; amount: number; saleMmk?: number | null; createdAt: string; client?: string }>;
};

// Build a 6-month series of monthly sales for the chart.
function buildMonthlySales(transfers: ResellerTransfer[]): { key: string; label: string; total: number; mmk: number; count: number }[] {
  const map = new Map<string, { total: number; mmk: number; count: number }>();
  const now = new Date();
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    map.set(k, { total: 0, mmk: 0, count: 0 });
  }
  for (const t of transfers ?? []) {
    const d = new Date(t.createdAt);
    const k = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    const cur = map.get(k);
    if (cur) {
      cur.total += t.amount ?? 0;
      cur.mmk += t.saleMmk ?? 0;
      cur.count += 1;
    }
  }
  return Array.from(map.entries()).map(([k, v]) => {
    const [y, m] = k.split("-");
    const label = new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-US", { month: "short" });
    return { key: k, label, ...v };
  });
}

// ============================================================
// Main view
// ============================================================

export function ResellerView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const { setView } = useStore();
  const [inventory, setInventory] = React.useState<ResellerInventory | null>(null);
  const [toEmail, setToEmail] = React.useState("");
  const [amount, setAmount] = React.useState("");
  const [saleMmk, setSaleMmk] = React.useState("");
  const [transferring, setTransferring] = React.useState(false);

  async function loadInv() {
    try {
      const inv = await api<ResellerInventory>("/api/reseller/inventory");
      setInventory(inv);
    } catch {
      setInventory(null);
    }
  }
  React.useEffect(() => {
    if (user && (user.role === "reseller" || user.role === "admin")) loadInv();
  }, [user]);

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
  const resellerStats = inventory?.reseller;
  const totalSold = resellerStats?.totalSold ?? inventory?.transfersOut?.reduce((a, t) => a + (t.amount ?? 0), 0) ?? 0;
  const totalMmk = resellerStats?.totalMmk ?? inventory?.transfersOut?.reduce((a, t) => a + (t.saleMmk ?? 0), 0) ?? 0;
  const totalClients = resellerStats?.totalClients ?? inventory?.recipients?.length ?? 0;
  const totalTransfers = resellerStats?.totalTransfers ?? inventory?.transfersOut?.length ?? 0;
  const monthlySales = buildMonthlySales(inventory?.transfersOut ?? []);

  return (
    <div className="relative min-h-screen flex flex-col">
      {/* Backdrop: AnimatedGradientBackground (warm) + StarField (36) */}
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={36} />
      </div>

      <div className="relative z-10 min-w-0 overflow-hidden flex-1">
        <div className="max-w-5xl mx-auto px-4 py-6 lg:py-10 pb-20">
          {/* Hero */}
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-2 flex-wrap">
              <BaydinStore className="w-5 h-5 text-[#C5A572]" />
              <GlowPill color="#C5A572" className="!text-[10px] uppercase tracking-wide">
                Reseller Portal
              </GlowPill>
              {user.resellerTier && (
                <GlowPill color={tierColorStr}>
                  <BaydinGift className="w-3 h-3" /> {resellerTierName(user.resellerTier)}
                </GlowPill>
              )}
              <GlowPill color="#7A8B6F" className="!text-[10px]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7A8B6F] inline-block" /> Active
              </GlowPill>
            </div>
            <LiquidMetalText as="h1" className="text-[28px] sm:text-[32px] lg:text-[40px] font-light leading-tight block">
              Reseller Portal
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mt-2 max-w-2xl leading-relaxed">
              Buy Luck at wholesale rates and resell to your clients at your own price. Track inventory, manage transfers, and access branded certificates — all from one dashboard.
            </p>
          </div>

          {/* TopUpBalanceBanner */}
          <TopUpBalanceBanner
            poolBalance={poolBalance}
            tier={user.resellerTier}
            tierColor={tierColorStr}
            onTopUp={() => setView("luck-store")}
          />

          {/* Stats — 4 AuroraGlowCards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 mb-6">
            <StatCard
              icon={Package}
              label="Wholesale Pool"
              value={poolBalance}
              sub="Luck to resell"
              accent="#C5A572"
              showClover
            />
            <StatCard
              icon={BaydinWallet}
              label="Your Balance"
              value={user.luckBalance}
              sub="Spendable Luck"
              accent="#7A8B6F"
              showClover
            />
            <StatCard
              icon={BaydinTrending}
              label="Total Sold"
              value={totalSold}
              sub="Luck transferred"
              accent="#9E8AC9"
              showClover
            />
            <StatCard
              icon={BaydinUsers}
              label="Active Clients"
              value={totalClients}
              sub={`${totalTransfers} transfers`}
              accent="#B5CD7E"
            />
          </div>

          {/* Sales analytics — 2-col grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
            {/* 6-month sales chart (2 cols) */}
            <IconBgCard icon={BaydinTrending} className="p-5 lg:col-span-2" glowColor="#C5A572" glowIntensity={0.16} iconSize={180} iconOpacity={0.06} iconPosition="top-right">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <BaydinTrending className="w-4 h-4 text-[#C5A572]" />
                  <span className="text-[12px] text-[#E8E2D5] font-medium">6-Month Sales Trend</span>
                </div>
                <GlowPill color="#C5A572" className="text-[10px]">
                  {totalSold.toLocaleString()} sold
                </GlowPill>
              </div>
              <SalesTrendChart data={monthlySales} />
            </IconBgCard>

            {/* Revenue + average */}
            <IconBgCard icon={BaydinWallet} className="p-5" glowColor="#7A8B6F" glowIntensity={0.18} iconSize={140} iconOpacity={0.06} iconPosition="top-right">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489] mb-3">Revenue</div>
              <div className="flex items-baseline gap-2 mb-3">
                <NumberTicker
                  value={totalMmk}
                  className="serif-display text-[1.75rem] text-[#C5A572] tabular-nums leading-none"
                />
                <span className="text-[11px] text-[#9C9489]">MMK</span>
              </div>
              <div className="space-y-2 pt-3 border-t border-[#2A2722]">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9C9489]">Avg. sale size</span>
                  <span className="text-[#E8E2D5] tabular-nums">
                    {totalTransfers > 0 ? Math.round(totalMmk / totalTransfers).toLocaleString() : "—"} MMK
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9C9489]">Avg. Luck / sale</span>
                  <span className="text-[#E8E2D5] tabular-nums">
                    {totalTransfers > 0 ? Math.round(totalSold / totalTransfers).toLocaleString() : "—"}
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-[#9C9489]">Markup rate</span>
                  <span className="text-[#7A8B6F] tabular-nums">
                    {totalSold > 0 && totalMmk > 0
                      ? `${(((totalMmk / totalSold) / 1000) * 100).toFixed(0)}%`
                      : "—"}
                  </span>
                </div>
              </div>
            </IconBgCard>
          </div>

          {/* Buy more + Transfer (2-col grid) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
            {/* Buy more (wholesale) */}
            <IconBgCard icon={BaydinStore} className="p-5" glowColor="#C5A572" glowIntensity={0.18} iconSize={150} iconOpacity={0.06} iconPosition="top-right">
              <div className="flex items-center gap-2 mb-2">
                <Package className="w-4 h-4 text-[#C5A572]" />
                <span className="text-[13px] text-[#E8E2D5] font-medium">Need more inventory?</span>
              </div>
              <div className="text-[12px] text-[#9C9489] leading-relaxed mb-4">
                Top up your wholesale inventory from the <span className="text-[#C5A572]">Earn Luck</span> tab — reseller packs start at 50,000 MMK with up to 54% bonus.
              </div>
              <div className="flex items-center gap-2 mb-3 text-[11px] text-[#9C9489]">
                <CloverIcon className="w-3.5 h-3.5 text-[#C5A572]" />
                <span>Wholesale rate: ~1 MMK ≈ 1 Luck + tier bonus</span>
              </div>
              <ShimmerButton
                tone="gold"
                onClick={() => setView("luck-store")}
                className="w-full py-2.5"
              >
                <BaydinWallet className="w-4 h-4" /> Browse Wholesale Packs
                <BaydinChevronRight className="w-3 h-3" />
              </ShimmerButton>
            </IconBgCard>

            {/* Sell Luck to a client */}
            <IconBgCard icon={BaydinSend} className="p-5" glowColor="#9E8AC9" glowIntensity={0.18} iconSize={150} iconOpacity={0.06} iconPosition="top-right">
              <div className="flex items-center gap-2 mb-3">
                <BaydinSend className="w-4 h-4 text-[#C5A572]" />
                <span className="text-[13px] text-[#E8E2D5] font-medium">Sell Luck to a client</span>
              </div>
              <div className="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <Label className="text-[11px] text-[#9C9489] uppercase tracking-wide">Recipient email</Label>
                  <Input
                    value={toEmail}
                    onChange={(e) => setToEmail(e.target.value)}
                    className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 text-[12px]"
                    placeholder="client@example.com"
                  />
                </div>
                <div>
                  <Label className="text-[11px] text-[#9C9489] uppercase tracking-wide">Luck amount</Label>
                  <Input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 text-[12px]"
                    placeholder="100"
                  />
                </div>
              </div>
              <div className="mb-4">
                <Label className="text-[11px] text-[#9C9489] uppercase tracking-wide">Sale price (MMK, optional)</Label>
                <Input
                  type="number"
                  value={saleMmk}
                  onChange={(e) => setSaleMmk(e.target.value)}
                  className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 text-[12px]"
                  placeholder="e.g. 80000"
                />
              </div>
              <ShimmerButton
                tone="gold"
                onClick={transfer}
                disabled={transferring || !toEmail || !amount}
                className="w-full py-2.5"
              >
                <BaydinSend className="w-4 h-4" />
                {transferring ? "Transferring…" : `Transfer ${amount || ""} Luck`}
              </ShimmerButton>
            </IconBgCard>
          </div>

          {/* Transfer history (premium) */}
          {(inventory?.transfersOut?.length ?? 0) > 0 && (
            <IconBgCard icon={Activity} className="p-5 mb-6" glowColor="#7A8B6F" glowIntensity={0.14} iconSize={150} iconOpacity={0.06} iconPosition="top-right">
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-[#C5A572]" />
                  <span className="text-[12px] text-[#9C9489]">Recent transfers</span>
                </div>
                <span className="text-[11px] text-[#6B6358]">
                  Last {Math.min(8, inventory?.transfersOut?.length ?? 0)} of {inventory?.transfersOut?.length ?? 0}
                </span>
              </div>
              <div className="max-h-72 overflow-y-auto lumina-scroll space-y-1">
                {inventory!.transfersOut!.slice(0, 8).map((t: ResellerTransfer) => {
                  const recipient = inventory!.recipients.find((r) => r.toUserId === t.toUserId);
                  const email = recipient?.user?.email ?? "—";
                  return (
                    <div
                      key={t.id}
                      className="flex items-center justify-between py-2 border-b border-[#2A2722] last:border-0 text-[12px]"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="w-6 h-6 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/20 flex items-center justify-center shrink-0">
                          <ArrowUpRight className="w-3 h-3 text-[#C5A572]" />
                        </div>
                        <div className="min-w-0">
                          <div className="text-[#E8E2D5] flex items-center gap-1.5">
                            <NumberTicker value={t.amount} className="tabular-nums" />
                            <span>Luck</span>
                          </div>
                          <div className="text-[#9C9489] text-[10px] truncate">to {email}</div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-[#7A8B6F] tabular-nums text-[11px]">
                          {t.saleMmk ? `${t.saleMmk.toLocaleString()} MMK` : "—"}
                        </div>
                        <div className="text-[#9C9489] text-[10px] flex items-center gap-1 justify-end">
                          <BaydinClock className="w-2.5 h-2.5" />
                          {new Date(t.createdAt).toLocaleDateString()}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </IconBgCard>
          )}

          {/* Branded Certificates */}
          <BrandedCertificatesSection user={user} />

          {/* Partner Resources */}
          <PartnerResources user={user} />

          {/* Recent Certificates */}
          <RecentCertificates />
        </div>
      </div>
    </div>
  );
}

// ============================================================
// StatCard — premium AuroraGlowCard with NumberTicker.
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
  accent,
  showClover,
}: {
  icon: any;
  label: string;
  value: number;
  sub: string;
  accent: string;
  showClover?: boolean;
}) {
  return (
    <IconBgCard icon={Icon} glowColor={accent} glowIntensity={0.16} iconSize={130} iconOpacity={0.07} iconPosition="top-right" className="p-5">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] uppercase tracking-wide text-[#9C9489]">
        <Icon className="w-3 h-3" style={{ color: accent }} /> {label}
      </div>
      <div className="flex items-baseline gap-1.5">
        {showClover && <CloverIcon className="w-4 h-4 text-[#C5A572] shrink-0" strokeWidth={1.6} aria-label="Luck" />}
        <NumberTicker
          value={value}
          className="serif-display text-[2rem] text-[#E8E2D5] tabular-nums leading-none"
        />
      </div>
      <div className="text-[10px] text-[#9C9489] mt-1">{sub}</div>
    </IconBgCard>
  );
}

// ============================================================
// SalesTrendChart — hand-rolled SVG bar chart (no recharts).
// ============================================================

function SalesTrendChart({
  data,
}: {
  data: { key: string; label: string; total: number; mmk: number; count: number }[];
}) {
  const maxTotal = Math.max(1, ...data.map((d) => d.total));
  const W = 80; // viewBox per bar slot
  const H = 120;
  const barW = 30;
  const gap = (W * data.length - barW * data.length) / (data.length + 1);

  return (
    <svg
      viewBox={`0 0 ${W * data.length} ${H + 22}`}
      className="w-full h-32"
      role="img"
      aria-label="Luck sold per month over the last 6 months"
    >
      <defs>
        <linearGradient id="reseller-sales-gold" x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor="#E7D2A8" />
          <stop offset="60%" stopColor="#C5A87C" />
          <stop offset="100%" stopColor="#9C7F54" />
        </linearGradient>
      </defs>
      <line x1="0" y1={H} x2={W * data.length} y2={H} stroke="#2A2722" strokeWidth="0.5" />
      {data.map((d, i) => {
        const h = (d.total / maxTotal) * (H - 12);
        const x = gap + i * (barW + gap);
        const y = H - h;
        return (
          <g key={d.key}>
            <rect
              x={x}
              y={y}
              width={barW}
              height={Math.max(0.5, h)}
              rx="1.5"
              fill="url(#reseller-sales-gold)"
              opacity={d.total > 0 ? 1 : 0.18}
            />
            {d.total > 0 && (
              <text
                x={x + barW / 2}
                y={y - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#E8E2D5"
                fontFamily="Inter, Arial, sans-serif"
              >
                {d.total}
              </text>
            )}
            <text
              x={x + barW / 2}
              y={H + 12}
              textAnchor="middle"
              fontSize="9"
              fill="#9C9489"
              fontFamily="Inter, Arial, sans-serif"
            >
              {d.label}
            </text>
            <text
              x={x + barW / 2}
              y={H + 20}
              textAnchor="middle"
              fontSize="8"
              fill="#6B6358"
              fontFamily="Inter, Arial, sans-serif"
            >
              {d.count} sale{d.count === 1 ? "" : "s"}
            </text>
          </g>
        );
      })}
    </svg>
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
    <IconBgCard
      icon={BaydinWallet}
      glowColor="#C5A572"
      glowIntensity={isEmpty ? 0.3 : 0.2}
      iconSize={220}
      iconOpacity={0.07}
      iconPosition="top-right"
      className="mb-6 p-5 lg:p-6 relative overflow-hidden"
    >
      {/* CloverPNG watermark */}
      <CloverPNG
        aria-hidden
        className="absolute -right-6 -bottom-6 w-32 h-32 opacity-[0.06] pointer-events-none"
      />
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between relative z-10">
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
            <div className="mt-3 rounded-sm border border-[#C5A572]/20 bg-[#C5A572]/5 px-3 py-2 text-[11px] text-[#C5A572] leading-relaxed flex items-start gap-2">
              <BaydinStar className="w-3 h-3 shrink-0 mt-0.5" />
              <span>
                Top up required to start reselling. Reseller packs start at 50,000 MMK with up to 54% bonus.
              </span>
            </div>
          )}
        </div>
        <div className="shrink-0 sm:self-center">
          <ShimmerButton onClick={onTopUp} tone="gold" className="px-6 py-3 text-[14px]">
            <BaydinWallet className="w-4 h-4" /> Top Up More Luck
          </ShimmerButton>
        </div>
      </div>
    </IconBgCard>
  );
}

// ============================================================
// PartnerResources — three wired-up CTAs (marketing kit download, terms sheet, mailto).
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
    <IconBgCard icon={BaydinGift} className="p-5 mb-6" glowColor="#7A8B6F" glowIntensity={0.16} iconSize={150} iconOpacity={0.06} iconPosition="top-right">
      <div className="flex items-center justify-between mb-1">
        <div className="text-[12px] text-[#9C9489] uppercase tracking-wide">Partner resources</div>
        <GlowPill color="#7A8B6F" className="text-[10px]">Baydin Partner</GlowPill>
      </div>
      <div className="text-[14px] text-[#E8E2D5] mb-4 font-medium">
        Marketing materials, agreement, and direct support.
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        <button
          onClick={downloadMarketingKit}
          disabled={downloading}
          className="flex items-start gap-3 p-3.5 rounded-sm border border-[#2A2722] bg-[#0F0D0B] hover:border-[#C5A572]/30 hover:bg-[#1A1714] transition text-left disabled:opacity-50"
        >
          <BaydinDownload className="w-4 h-4 text-[#C5A572] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[12px] text-[#E8E2D5] font-medium">Marketing kit</div>
            <div className="text-[10px] text-[#9C9489] mt-0.5">
              {downloading ? "Preparing PNG…" : "Download welcome card"}
            </div>
          </div>
        </button>
        <button
          onClick={() => setTermsOpen(true)}
          className="flex items-start gap-3 p-3.5 rounded-sm border border-[#2A2722] bg-[#0F0D0B] hover:border-[#C5A572]/30 hover:bg-[#1A1714] transition text-left"
        >
          <FileText className="w-4 h-4 text-[#C5A572] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[12px] text-[#E8E2D5] font-medium">Terms &amp; Policies</div>
            <div className="text-[10px] text-[#9C9489] mt-0.5">Reseller agreement</div>
          </div>
        </button>
        <a
          href="mailto:partners@baydin.app?subject=Baydin%20Reseller%20Support"
          className="flex items-start gap-3 p-3.5 rounded-sm border border-[#2A2722] bg-[#0F0D0B] hover:border-[#C5A572]/30 hover:bg-[#1A1714] transition text-left"
        >
          <LifeBuoy className="w-4 h-4 text-[#C5A572] shrink-0 mt-0.5" />
          <div className="min-w-0">
            <div className="text-[12px] text-[#E8E2D5] font-medium">Partner support</div>
            <div className="text-[10px] text-[#9C9489] mt-0.5">Email partners@baydin.app</div>
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
    </IconBgCard>
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
    icon: BaydinStar,
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
  const [certBusy, setCertBusy] = React.useState(false);
  const [activeCert, setActiveCert] = React.useState<{ svg: string; kind: CertKind; tier: string; variant: CertCardDef["variant"] } | null>(null);
  const { download, downloading } = useBrandedImageDownload();
  const hiddenCardRef = React.useRef<HTMLDivElement>(null);

  async function generate(kind: CertKind, def: CertCardDef) {
    setGenerating(kind);
    setCertBusy(true);
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
      setCertBusy(false);
    }
  }

  async function downloadPng() {
    if (!hiddenCardRef.current) return;
    setCertBusy(true);
    try {
      await download(hiddenCardRef.current, brandedFilename(activeCert!.variant));
    } finally {
      setCertBusy(false);
    }
  }

  return (
    <div className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <SectionTitle
          eyebrow="Branded assets"
          title="Branded Certificates"
          subtitle="Self-service branded certificates for your clients and milestones."
        />
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {CERT_CARDS.map((c) => {
          const Icon = c.icon;
          const isTierCard = c.kind === "tier_upgrade";
          return (
            <IconBgCard
              key={c.kind}
              icon={Icon}
              glowColor={c.color}
              glowIntensity={0.22}
              iconSize={130}
              iconOpacity={0.07}
              iconPosition="top-right"
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
                disabled={certBusy}
                className="w-full py-2 text-[12px]"
              >
                {generating === c.kind ? (
                  <>
                    <BaydinStar className="w-3 h-3 animate-pulse" /> Generating…
                  </>
                ) : (
                  <>
                    <BaydinStar className="w-3 h-3" /> Generate &amp; Download
                  </>
                )}
              </ShimmerButton>
            </IconBgCard>
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
              disabled={certBusy || !activeCert}
              className="px-5 py-2.5"
            >
              <BaydinDownload className="w-4 h-4" />
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
      <IconBgCard icon={Award} className="p-5" glowColor="#C5A572" glowIntensity={0.12} iconSize={130} iconOpacity={0.06} iconPosition="top-right">
        <div className="text-[12px] text-[#9C9489] flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-[#C5A572] animate-pulse" />
          Loading recent certificates…
        </div>
      </IconBgCard>
    );
  }

  if (history.length === 0) return null;

  return (
    <IconBgCard icon={Award} className="p-5" glowColor="#C5A572" glowIntensity={0.14} iconSize={150} iconOpacity={0.06} iconPosition="top-right">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Award className="w-3.5 h-3.5 text-[#C5A572]" />
          <span className="text-[12px] text-[#E8E2D5] font-medium">Recent certificates</span>
        </div>
        <GlowPill color="#C5A572" className="text-[10px]">Last 5</GlowPill>
      </div>
      <div className="space-y-1.5">
        {history.map((c) => (
          <div
            key={c.id}
            className="flex items-center justify-between py-2 border-b border-[#2A2722] last:border-0 text-[12px]"
          >
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-6 h-6 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/20 flex items-center justify-center shrink-0">
                {c.kind === "welcome" && <BaydinStar className="w-3 h-3 text-[#7A8B6F]" />}
                {c.kind === "tier_upgrade" && <Award className="w-3 h-3 text-[#C5A572]" />}
                {c.kind === "promotion" && <Megaphone className="w-3 h-3 text-[#9E8AC9]" />}
              </div>
              <span className="text-[#E8E2D5] capitalize">
                {String(c.kind).replace(/_/g, " ")}
              </span>
              {c.tier && (
                <GlowPill color={resellerTierColor(c.tier)} className="text-[9px]">
                  {resellerTierName(c.tier)}
                </GlowPill>
              )}
            </div>
            <div className="text-[10px] text-[#9C9489] shrink-0 flex items-center gap-1">
              <BaydinClock className="w-2.5 h-2.5" />
              {new Date(c.createdAt).toLocaleString()}
            </div>
          </div>
        ))}
      </div>
    </IconBgCard>
  );
}

// ============================================================
// Gate — auth/access guard
// ============================================================

function Gate({ onAuth, title, desc }: { onAuth: () => void; title: string; desc?: string }) {
  return (
    <div className="relative min-h-screen flex flex-col">
      <div className="fixed inset-0 z-0 pointer-events-none">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={24} />
      </div>
      <div className="relative z-10 min-w-0 flex-1 flex items-center justify-center px-6 text-center">
        <div>
          <div className="w-14 h-14 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/20 flex items-center justify-center mx-auto mb-4">
            <BaydinStore className="w-7 h-7 text-[#C5A572]" />
          </div>
          <div className="text-[16px] text-[#E8E2D5] mb-1 font-medium">{title}</div>
          {desc && <div className="text-[12px] text-[#9C9489] max-w-sm">{desc}</div>}
          <GoldButton onClick={onAuth} className="mt-4">Sign in</GoldButton>
        </div>
      </div>
    </div>
  );
}
