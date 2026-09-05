"use client";

import * as React from "react";
import {
  GlassCard,
  GoldButton,
  GradientButton,
  Pill,
  SectionTitle,
} from "@/components/lumina/primitives";
import {
  ShimmerButton,
  AuroraGlowCard,
  GlowPill,
  NumberTicker,
} from "@/components/lumina/premium-ui";
import { BrandedImageCard, brandedFilename } from "@/components/branded-image";
import { useBrandedImageDownload } from "@/lib/use-branded-image-download";
import { useMe, api } from "@/lib/api-client";
import {
  Shield,
  Users,
  Wallet,
  TrendingUp,
  Store,
  Gift,
  UserCog,
  Crown,
  Ban,
  Eye,
  Download,
  Plus,
  Pencil,
  Trash2,
  Check,
  X,
  Sparkles,
  Layers,
  BarChart3,
  Activity,
  Trophy,
  Award,
  Image as ImageIcon,
  Filter,
  Send,
  Package,
  CalendarClock,
  Target,
  PieChart as PieIcon,
  LineChart as LineIcon,
  Users as UsersIcon,
  ChevronRight,
  Star,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  ResponsiveContainer,
  Treemap,
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ZAxis,
  CartesianGrid,
  Tooltip as RTooltip,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  AreaChart,
  Area,
  Legend,
} from "recharts";

// ============================================================
// Types & Constants
// ============================================================

type SubTab = "users" | "resellers" | "campaigns" | "luck-packs" | "system-viz";

const RESELLER_TIER_DEFS = [
  { id: "bronze", name: "Bronze", color: "#A57142" },
  { id: "silver", name: "Silver", color: "#BFC8CC" },
  { id: "gold", name: "Gold", color: "#C5A572" },
  { id: "platinum", name: "Platinum", color: "#B9F2FF" },
  { id: "diamond", name: "Diamond", color: "#9E8AC9" },
  { id: "elite", name: "Elite", color: "#7A8B6F" },
  { id: "legend", name: "Legend", color: "#E7A264" },
] as const;

const REGULAR_TIER_DEFS = [
  { id: "spark", name: "Spark", color: "#9CA8A3" },
  { id: "basic", name: "Basic", color: "#7A8B6F" },
  { id: "popular", name: "Seeker", color: "#C5A572" },
  { id: "value", name: "Adept", color: "#E7A264" },
  { id: "premium", name: "Sage", color: "#D8788A" },
  { id: "luminary", name: "Luminary", color: "#9E8AC9" },
] as const;

const SPECIAL_RANK_DEFS = [
  { id: "vip", name: "VIP", color: "#C5A572" },
  { id: "ambassador", name: "Ambassador", color: "#9E8AC9" },
  { id: "partner", name: "Partner", color: "#B9F2FF" },
] as const;

function tierColor(tier: string | null | undefined): string {
  if (!tier) return "#6B6358";
  const all = [...RESELLER_TIER_DEFS, ...REGULAR_TIER_DEFS];
  return all.find((t) => t.id === tier || `reseller_${t.id}` === tier)?.color ?? "#9CA8A3";
}

function tierName(tier: string | null | undefined): string {
  if (!tier) return "—";
  return tier.replace(/^reseller_/, "").replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

// ============================================================
// Shared small components
// ============================================================

function StatCard({
  icon: Icon,
  label,
  value,
  sub,
}: {
  icon: any;
  label: string;
  value: number;
  sub: string;
}) {
  return (
    <GlassCard className="p-4">
      <div className="flex items-center gap-1.5 mb-2 text-[10px] text-[#9C9489] uppercase tracking-wide">
        <Icon className="w-3 h-3 text-[#C5A572]" /> {label}
      </div>
      <div className="text-[24px] font-light text-[#E8E2D5]">
        <NumberTicker value={value} />
      </div>
      <div className="text-[10px] text-[#9C9489]">{sub}</div>
    </GlassCard>
  );
}

function Gate({ title, desc }: { title: string; desc?: string }) {
  return (
    <div className="h-full flex items-center justify-center px-6 text-center">
      <div>
        <Shield className="w-10 h-10 text-[#9C9489] mx-auto mb-3" />
        <div className="text-[16px] text-[#E8E2D5] mb-1">{title}</div>
        {desc && <div className="text-[12px] text-[#9C9489] max-w-sm">{desc}</div>}
      </div>
    </div>
  );
}

function EmptyState({ icon: Icon, title, desc }: { icon: any; title: string; desc?: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
      <Icon className="w-8 h-8 text-[#6B6358] mb-3" />
      <div className="text-[14px] text-[#E8E2D5] mb-1">{title}</div>
      {desc && <div className="text-[12px] text-[#9C9489] max-w-xs">{desc}</div>}
    </div>
  );
}

function SectionLabel({ icon: Icon, children }: { icon: any; children: React.ReactNode }) {
  return (
    <div className="text-[13px] text-[#E8E2D5] mb-3 flex items-center gap-2">
      <Icon className="w-4 h-4 text-[#C5A572]" /> {children}
    </div>
  );
}

// ============================================================
// SubTabNav
// ============================================================

function SubTabNav({ value, onChange }: { value: SubTab; onChange: (v: SubTab) => void }) {
  const tabs: { id: SubTab; label: string; icon: any }[] = [
    { id: "users", label: "Users", icon: Users },
    { id: "resellers", label: "Resellers", icon: Store },
    { id: "campaigns", label: "Campaigns", icon: CalendarClock },
    { id: "luck-packs", label: "Luck Packs", icon: Package },
    { id: "system-viz", label: "System Viz", icon: BarChart3 },
  ];
  return (
    <div className="flex flex-wrap gap-1.5 mb-6 border-b border-[#2A2722] pb-3">
      {tabs.map((t) => {
        const Icon = t.icon;
        const active = value === t.id;
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={`inline-flex items-center gap-1.5 rounded-sm px-3 py-1.5 text-[12px] font-medium transition-all ${
              active
                ? "bg-[#1A1714] text-[#C5A572] border border-[#C5A572]/30"
                : "text-[#9C9489] border border-transparent hover:text-[#E8E2D5] hover:border-[#2A2722]"
            }`}
          >
            <Icon className="w-3.5 h-3.5" />
            {t.label}
          </button>
        );
      })}
    </div>
  );
}

// ============================================================
// FeatureAdoptionTreemap — tile size = usage count, color = adoption rate
// ============================================================

type FeatureDatum = {
  feature: string;
  usageCount: number;
  adoptionRate: number; // 0..1
};

function FeatureAdoptionTreemap({ data }: { data: FeatureDatum[] }) {
  const treemapData = React.useMemo(
    () =>
      data.map((d) => ({
        name: d.feature,
        size: Math.max(d.usageCount, 1),
        adoption: d.adoptionRate,
        fill: adoptionColor(d.adoptionRate),
      })),
    [data]
  );

  if (data.length === 0) {
    return <EmptyState icon={Layers} title="No feature data yet" desc="Adoption heatmap will appear once users start spending Luck." />;
  }

  return (
    <div className="h-72 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <Treemap
          data={treemapData}
          dataKey="size"
          stroke="#0A0908"
          content={<TreemapCell />}
        >
          <RTooltip
            content={({ payload }) => {
              const d = payload?.[0]?.payload as any;
              if (!d) return null;
              return (
                <div className="rounded-sm border border-[#2A2722] bg-[#0A0908] px-3 py-2 text-[11px] text-[#E8E2D5] shadow-lg">
                  <div className="font-medium">{d.name}</div>
                  <div className="text-[#9C9489]">
                    Usage: {d.size} · Adoption: {Math.round((d.adoption ?? 0) * 100)}%
                  </div>
                </div>
              );
            }}
          />
        </Treemap>
      </ResponsiveContainer>
    </div>
  );
}

function adoptionColor(rate: number): string {
  if (rate >= 0.75) return "#B5CD7E";
  if (rate >= 0.5) return "#C5A572";
  if (rate >= 0.25) return "#E7A264";
  return "#5A3E2E";
}

class TreemapCell extends React.Component<any> {
  render() {
    const { x, y, width, height, name, fill, adoption } = this.props;
    if (width < 0 || height < 0) return null;
    return (
      <g>
        <rect x={x} y={y} width={width} height={height} fill={fill} stroke="#0A0908" />
        {width > 60 && height > 28 && (
          <>
            <text
              x={x + 6}
              y={y + 18}
              fill="#0A0908"
              fontSize={11}
              fontWeight={600}
            >
              {name.slice(0, 14)}
            </text>
            <text
              x={x + 6}
              y={y + 32}
              fill="#0A0908"
              fontSize={9}
              opacity={0.85}
            >
              {Math.round((adoption ?? 0) * 100)}% adopt
            </text>
          </>
        )}
      </g>
    );
  }
}

// ============================================================
// Activity Distribution Chart — 640×240, rotation -45°, font 10px, truncate 12
// ============================================================

function ActivityDistributionChart({ data }: { data: { name: string; value: number }[] }) {
  const chartData = data.map((d) => ({ ...d, label: d.name.length > 12 ? d.name.slice(0, 11) + "…" : d.name }));
  return (
    <div className="h-60 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 8, right: 16, bottom: 32, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#2A2722" />
          <XAxis
            dataKey="label"
            tick={{ fill: "#9C9489", fontSize: 10, angle: -45, textAnchor: "end" } as any}
            interval={0}
            height={48}
            stroke="#2A2722"
          />
          <YAxis tick={{ fill: "#9C9489", fontSize: 10 } as any} stroke="#2A2722" />
          <RTooltip
            contentStyle={{
              background: "#0A0908",
              border: "1px solid #2A2722",
              borderRadius: "2px",
              fontSize: 11,
              color: "#E8E2D5",
            }}
            cursor={{ fill: "rgba(197,165,114,0.08)" }}
          />
          <Bar dataKey="value" fill="#C5A572" radius={[2, 2, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// Engagement Scatter Chart — 520×320, separate PADB1/PADB2 ticks/title, compact formatter, clamped dots
// ============================================================

type ScatterDatum = { x: number; y: number; z: number; label: string };

function EngagementScatterChart({ data }: { data: ScatterDatum[] }) {
  const padded = React.useMemo(() => {
    if (data.length === 0) return { data: [], xMax: 100, yMax: 100, zMax: 100 };
    const xMax = Math.max(...data.map((d) => d.x)) * 1.15;
    const yMax = Math.max(...data.map((d) => d.y)) * 1.15;
    const zMax = Math.max(...data.map((d) => d.z));
    return {
      data: data.map((d) => ({ ...d, xClamped: Math.min(d.x, xMax * 0.98), yClamped: Math.min(d.y, yMax * 0.98) })),
      xMax,
      yMax,
      zMax,
    };
  }, [data]);

  if (data.length === 0) {
    return <EmptyState icon={Activity} title="No engagement data yet" desc="Scatter chart of Luck earned vs Luck spent will appear here." />;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart margin={{ top: 16, right: 24, bottom: 28, left: 0 }}>
          <CartesianGrid strokeDasharray="2 4" stroke="#2A2722" />
          <XAxis
            type="number"
            dataKey="xClamped"
            name="Luck earned"
            domain={[0, Math.ceil(padded.xMax)]}
            tick={{ fill: "#9C9489", fontSize: 10 }}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
            stroke="#2A2722"
            label={{ value: "Luck earned", position: "insideBottom", dy: 14, fill: "#9C9489", fontSize: 10 }}
          />
          <YAxis
            type="number"
            dataKey="yClamped"
            name="Luck spent"
            domain={[0, Math.ceil(padded.yMax)]}
            tick={{ fill: "#9C9489", fontSize: 10 }}
            tickFormatter={(v: number) => (v >= 1000 ? `${(v / 1000).toFixed(1)}k` : `${v}`)}
            stroke="#2A2722"
            label={{ value: "Luck spent", angle: -90, position: "insideLeft", fill: "#9C9489", fontSize: 10 }}
          />
          <ZAxis type="number" dataKey="z" name="Activity count" domain={[0, Math.ceil(padded.zMax)]} range={[40, 360]} />
          <RTooltip
            cursor={{ strokeDasharray: "2 4", stroke: "#2A2722" }}
            contentStyle={{ background: "#0A0908", border: "1px solid #2A2722", borderRadius: "2px", fontSize: 11, color: "#E8E2D5" }}
            formatter={(value: any, name: any) => [value, name]}
            labelFormatter={() => ""}
            content={({ payload }) => {
              const d = payload?.[0]?.payload as ScatterDatum | undefined;
              if (!d) return null;
              return (
                <div className="rounded-sm border border-[#2A2722] bg-[#0A0908] px-3 py-2 text-[11px] text-[#E8E2D5] shadow-lg">
                  <div className="font-medium mb-1">{d.label}</div>
                  <div className="text-[#9C9489]">Earned: {d.x}</div>
                  <div className="text-[#9C9489]">Spent: {d.y}</div>
                  <div className="text-[#9C9489]">Actions: {d.z}</div>
                </div>
              );
            }}
          />
          <Scatter data={padded.data} fill="#C5A572" fillOpacity={0.7} stroke="#E7D2A8" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// Leaderboard component — with N-picker + Download PNG
// ============================================================

function Leaderboard({
  kind,
  onRefresh,
}: {
  kind: "user" | "reseller";
  onRefresh?: () => void;
}) {
  const [topN, setTopN] = React.useState(10);
  const [metric, setMetric] = React.useState<string>(kind === "reseller" ? "lifetimeResellerMmk" : "totalLuckSpent");
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const downloadRef = React.useRef<HTMLDivElement>(null);
  const hiddenCardRef = React.useRef<HTMLDivElement>(null);
  const { download, downloading } = useBrandedImageDownload();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ kind: string; topN: number; metric: string; entries: any[] }>(
        `/api/admin/leaderboard?kind=${kind}&top=${topN}&metric=${metric}`
      );
      setData(res);
      onRefresh?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to load leaderboard");
    } finally {
      setLoading(false);
    }
  }, [kind, topN, metric, onRefresh]);

  React.useEffect(() => {
    load();
  }, [kind, topN, metric]);

  const entries = data?.entries ?? [];

  const metricOptions =
    kind === "reseller"
      ? [
          { id: "lifetimeResellerMmk", label: "Lifetime MMK (reseller)" },
          { id: "totalLuckEarned", label: "Total Luck earned" },
          { id: "luckBalance", label: "Current Luck balance" },
        ]
      : [
          { id: "totalLuckSpent", label: "Total Luck spent" },
          { id: "totalLuckEarned", label: "Total Luck earned" },
          { id: "luckBalance", label: "Current Luck balance" },
          { id: "lifetimeMmkSpent", label: "Lifetime MMK spent" },
        ];

  const leaderboardProps = {
    kind,
    metric,
    entries: entries.map((e: any) => ({
      rank: e.rank,
      email: e.email,
      name: e.name,
      metric: e.metric,
      metricLabel: metricOptions.find((m) => m.id === metric)?.label ?? metric,
      luckBalance: e.luckBalance,
      tier: e.resellerTier,
    })),
    topN,
    generatedAt: new Date(),
  };

  return (
    <AuroraGlowCard className="p-5">
      <div className="flex items-start justify-between mb-4 gap-2 flex-wrap">
        <SectionLabel icon={Trophy}>
          {kind === "reseller" ? "Reseller leaderboard" : "User leaderboard"}
        </SectionLabel>
        <div className="flex items-center gap-2">
          <Select value={String(topN)} onValueChange={(v) => setTopN(parseInt(v, 10))}>
            <SelectTrigger className="h-8 w-[80px] bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="5">Top 5</SelectItem>
              <SelectItem value="10">Top 10</SelectItem>
              <SelectItem value="25">Top 25</SelectItem>
              <SelectItem value="50">Top 50</SelectItem>
            </SelectContent>
          </Select>
          <Select value={metric} onValueChange={setMetric}>
            <SelectTrigger className="h-8 w-[160px] bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {metricOptions.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <ShimmerButton
            tone="gold"
            className="h-8 px-3 py-1.5 text-[12px]"
            onClick={() => download(hiddenCardRef.current, brandedFilename(`leaderboard-${kind}`))}
            disabled={downloading || entries.length === 0}
          >
            <Download className="w-3.5 h-3.5" />
            {downloading ? "Exporting…" : "PNG"}
          </ShimmerButton>
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[12px] text-[#9C9489]">Loading leaderboard…</div>
      ) : entries.length === 0 ? (
        <EmptyState icon={Trophy} title="No entries" desc="No users match the selected metric." />
      ) : (
        <div className="max-h-96 overflow-y-auto lumina-scroll">
          <table className="w-full text-[12px]">
            <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide sticky top-0 bg-[#0A0908]">
              <tr>
                <th className="text-left py-2 px-2 w-10">#</th>
                <th className="text-left py-2 px-2">User</th>
                {kind === "reseller" && <th className="text-center py-2 px-2">Tier</th>}
                <th className="text-right py-2 px-2">Metric</th>
                <th className="text-right py-2 px-2">Luck</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e: any) => (
                <tr key={e.userId} className="border-t border-[#2A2722]">
                  <td className="py-2 px-2">
                    {e.rank <= 3 ? (
                      <GlowPill color={e.rank === 1 ? "#C5A572" : e.rank === 2 ? "#BFC8CC" : "#A57142"}>
                        {e.rank}
                      </GlowPill>
                    ) : (
                      <span className="text-[#9C9489]">{e.rank}</span>
                    )}
                  </td>
                  <td className="py-2 px-2">
                    <div className="text-[#E8E2D5] truncate max-w-[200px]">{e.name || e.email}</div>
                    <div className="text-[10px] text-[#9C9489] truncate max-w-[200px]">{e.email}</div>
                  </td>
                  {kind === "reseller" && (
                    <td className="py-2 px-2 text-center">
                      {e.resellerTier ? (
                        <Pill variant="gold" className="text-[9px]">
                          {tierName(e.resellerTier)}
                        </Pill>
                      ) : (
                        <span className="text-[#6B6358]">—</span>
                      )}
                    </td>
                  )}
                  <td className="py-2 px-2 text-right text-[#C5A572]">{(e.metric ?? 0).toLocaleString()}</td>
                  <td className="py-2 px-2 text-right text-[#E8E2D5]">{e.luckBalance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Hidden BrandedImageCard mount for PNG download */}
      <div
        ref={hiddenCardRef}
        aria-hidden
        style={{
          position: "fixed",
          left: -10000,
          top: 0,
          width: 900,
          pointerEvents: "none",
          opacity: 1,
        }}
      >
        <BrandedImageCard variant={`leaderboard-${kind}`} leaderboard={leaderboardProps} />
      </div>
    </AuroraGlowCard>
  );
}

// ============================================================
// UserDetailSheet — right-side sheet fetching /api/admin/analytics/users?id=
// ============================================================

function UserDetailSheet({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; email: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    setData(null);
    api(`/api/admin/analytics/users?id=${user.id}`)
      .then((d) => setData(d))
      .catch((e) => toast.error(e.message || "Failed to load analytics"))
      .finally(() => setLoading(false));
  }, [open, user]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto lumina-scroll bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
        <SheetHeader>
          <SheetTitle className="text-[#E8E2D5] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#C5A572]" />
            {user?.email}
          </SheetTitle>
          <SheetDescription className="text-[#9C9489]">Deep analytics + activity feed</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#9C9489]">Loading…</div>
        ) : !data ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#9C9489]">No data</div>
        ) : (
          <div className="px-4 pb-8 space-y-4 text-[12px]">
            {/* User summary */}
            <GlassCard className="p-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <KV label="Role">{data.user?.role}</KV>
                <KV label="Language">{data.user?.language}</KV>
                <KV label="Luck balance">{data.user?.luckBalance}</KV>
                <KV label="Total earned">{data.user?.totalLuckEarned}</KV>
                <KV label="Total spent">{data.user?.totalLuckSpent}</KV>
                <KV label="Streak">{data.user?.streak}</KV>
                <KV label="Lifetime MMK">{data.user?.lifetimeMmkSpent}</KV>
                <KV label="Reseller MMK">{data.user?.lifetimeResellerMmk}</KV>
                <KV label="Special rank">{data.user?.specialRank ?? "—"}</KV>
                <KV label="Reseller tier">{data.user?.resellerTier ?? "—"}</KV>
              </div>
            </GlassCard>

            {/* Purchase summary */}
            {data.analytics?.purchaseSummary && (
              <GlassCard className="p-3">
                <SectionLabel icon={Wallet}>Purchase summary</SectionLabel>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <KV label="Total MMK">{data.analytics.purchaseSummary.totalMmk.toLocaleString()}</KV>
                  <KV label="Total Luck">{data.analytics.purchaseSummary.totalLuck}</KV>
                  <KV label="Regular">{data.analytics.purchaseSummary.regularPurchases}</KV>
                  <KV label="Reseller">{data.analytics.purchaseSummary.resellerPurchases}</KV>
                </div>
              </GlassCard>
            )}

            {/* Spend by feature */}
            {data.analytics?.spendByFeature && (
              <GlassCard className="p-3">
                <SectionLabel icon={BarChart3}>Spend by feature</SectionLabel>
                {data.analytics.spendByFeature.length === 0 ? (
                  <div className="text-[11px] text-[#9C9489]">No spend yet</div>
                ) : (
                  <div className="space-y-1.5">
                    {data.analytics.spendByFeature.map((f: any) => (
                      <div key={f.feature} className="flex items-center justify-between text-[11px]">
                        <span className="text-[#E8E2D5]">{f.feature}</span>
                        <span className="text-[#C5A572]">
                          {f.count}× · {f.totalLuck} Luck
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </GlassCard>
            )}

            {/* Recent transactions */}
            {data.activity?.transactions && (
              <GlassCard className="p-3">
                <SectionLabel icon={Activity}>Recent transactions</SectionLabel>
                <div className="max-h-48 overflow-y-auto lumina-scroll space-y-1">
                  {data.activity.transactions.slice(0, 20).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-[11px] border-b border-[#2A2722] pb-1">
                      <span className="text-[#9C9489]">{t.type}</span>
                      <span className={t.amount >= 0 ? "text-[#7A8B6F]" : "text-[#D8788A]"}>
                        {t.amount > 0 ? "+" : ""}
                        {t.amount}
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {/* Referral count */}
            {data.analytics && (
              <GlassCard className="p-3">
                <SectionLabel icon={UsersIcon}>Referrals & certificates</SectionLabel>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <KV label="Referrals">{data.analytics.referralCount}</KV>
                  <KV label="Certificates">{data.analytics.certificateCount}</KV>
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

function KV({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-wide text-[#6B6358]">{label}</div>
      <div className="text-[#E8E2D5]">{children}</div>
    </div>
  );
}

// ============================================================
// CertificateModal — shows issued certs for a user
// ============================================================

function CertificateModal({
  user,
  open,
  onOpenChange,
}: {
  user: { id: string; email: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !user) return;
    setLoading(true);
    api(`/api/admin/analytics/users?id=${user.id}`)
      .then((d) => setData(d))
      .catch((e) => toast.error(e.message || "Failed to load certs"))
      .finally(() => setLoading(false));
  }, [open, user]);

  const certs = data?.activity?.certificates ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5] max-w-2xl max-h-[80vh] overflow-y-auto lumina-scroll">
        <DialogHeader>
          <DialogTitle className="text-[#E8E2D5] flex items-center gap-2">
            <Award className="w-4 h-4 text-[#C5A572]" />
            Certificates — {user?.email}
          </DialogTitle>
          <DialogDescription className="text-[#9C9489]">
            Issued branded-image certificates for this user
          </DialogDescription>
        </DialogHeader>

        {loading ? (
          <div className="py-8 text-center text-[12px] text-[#9C9489]">Loading…</div>
        ) : certs.length === 0 ? (
          <EmptyState icon={Award} title="No certificates yet" desc="Issue one via the reseller actions menu." />
        ) : (
          <div className="space-y-3">
            {certs.map((c: any) => (
              <div key={c.id} className="rounded-sm border border-[#2A2722] bg-[#121815] p-3">
                <div className="flex items-center justify-between text-[11px] mb-2">
                  <div className="flex items-center gap-2">
                    <Pill variant="gold" className="text-[9px]">{tierName(c.tier)}</Pill>
                    <Pill className="text-[9px]">{c.kind}</Pill>
                  </div>
                  <span className="text-[#9C9489]">
                    {new Date(c.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {c.brandedImageSvg ? (
                  <div
                    className="w-full overflow-hidden rounded-sm"
                    dangerouslySetInnerHTML={{ __html: c.brandedImageSvg }}
                  />
                ) : (
                  <div className="text-[11px] text-[#9C9489]">SVG unavailable</div>
                )}
              </div>
            ))}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ============================================================
// SpecialRankMenu — dropdown-like selector for granting special rank
// ============================================================

function SpecialRankMenu({
  userId,
  onGranted,
}: {
  userId: string;
  onGranted?: () => void;
}) {
  const [open, setOpen] = React.useState(false);
  const [busy, setBusy] = React.useState(false);

  async function setRank(rank: string | null) {
    setBusy(true);
    try {
      await api("/api/admin/special-rank", {
        method: "POST",
        json: { userId, rank },
      });
      toast.success(rank ? `Granted ${rank} rank` : "Cleared special rank");
      setOpen(false);
      onGranted?.();
    } catch (e: any) {
      toast.error(e.message || "Failed to set rank");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="relative inline-block">
      <button
        onClick={() => setOpen((v) => !v)}
        disabled={busy}
        className="inline-flex items-center gap-1 rounded-sm border border-[#2A2722] px-2 py-1 text-[11px] text-[#C5A572] hover:border-[#C5A572]/40 disabled:opacity-40"
        title="Special rank"
      >
        <Crown className="w-3 h-3" />
        Rank
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-1 z-20 w-40 rounded-sm border border-[#2A2722] bg-[#0A0908] py-1 shadow-xl">
            {SPECIAL_RANK_DEFS.map((r) => (
              <button
                key={r.id}
                onClick={() => setRank(r.id)}
                disabled={busy}
                className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-[#E8E2D5] hover:bg-[#1A1714] disabled:opacity-40"
              >
                <span className="w-2 h-2 rounded-full" style={{ background: r.color }} />
                {r.name}
              </button>
            ))}
            <div className="my-1 border-t border-[#2A2722]" />
            <button
              onClick={() => setRank(null)}
              disabled={busy}
              className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-[#9C9489] hover:bg-[#1A1714] disabled:opacity-40"
            >
              <X className="w-3 h-3" />
              Clear
            </button>
          </div>
        </>
      )}
    </div>
  );
}

// ============================================================
// BulkActionBar — bulk Luck grant to selected users
// ============================================================

function BulkActionBar({
  selected,
  onClear,
  onDone,
}: {
  selected: { id: string; email: string }[];
  onClear: () => void;
  onDone: () => void;
}) {
  const [amount, setAmount] = React.useState("");
  const [reason, setReason] = React.useState("");
  const [busy, setBusy] = React.useState(false);

  if (selected.length === 0) return null;

  async function grantBulk() {
    const n = parseInt(amount, 10);
    if (!n || n <= 0) {
      toast.error("Enter a positive Luck amount");
      return;
    }
    setBusy(true);
    let ok = 0;
    let failed = 0;
    await Promise.all(
      selected.map(async (u) => {
        try {
          await api("/api/admin/grant", {
            method: "POST",
            json: { userEmail: u.email, amount: n, reason: reason || "bulk_grant" },
          });
          ok += 1;
        } catch {
          failed += 1;
        }
      })
    );
    setBusy(false);
    setAmount("");
    setReason("");
    toast.success(`Granted ${n} Luck to ${ok} user(s)${failed ? `, ${failed} failed` : ""}`);
    onDone();
  }

  return (
    <div className="sticky bottom-0 left-0 right-0 z-20 border-t border-[#C5A572]/30 bg-[#0A0908]/95 backdrop-blur px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <GlowPill color="#C5A572">{selected.length} selected</GlowPill>
        <Input
          type="number"
          placeholder="Luck amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          className="h-8 w-32 bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]"
        />
        <Input
          placeholder="Reason (optional)"
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          className="h-8 flex-1 min-w-[160px] bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]"
        />
        <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={grantBulk} disabled={busy}>
          <Send className="w-3.5 h-3.5" />
          {busy ? "Granting…" : "Grant Luck"}
        </ShimmerButton>
        <button
          onClick={onClear}
          className="h-8 px-2 py-1 text-[12px] text-[#9C9489] hover:text-[#E8E2D5]"
        >
          Clear
        </button>
      </div>
    </div>
  );
}

// ============================================================
// UserRow — table row with action menu
// ============================================================

function UserRow({
  user,
  selected,
  onToggleSelect,
  onPromote,
  onView,
  onShowCert,
  onRefresh,
}: {
  user: any;
  selected: boolean;
  onToggleSelect: () => void;
  onPromote: (u: any) => void;
  onView: (u: any) => void;
  onShowCert: (u: any) => void;
  onRefresh?: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <tr className="border-t border-[#2A2722] hover:bg-[#121815]">
      <td className="py-2 px-2">
        <input
          type="checkbox"
          checked={selected}
          onChange={onToggleSelect}
          className="accent-[#C5A572]"
        />
      </td>
      <td className="py-2 px-2 text-[#E8E2D5]">
        <div className="truncate max-w-[200px]">{user.email}</div>
        {user.name && <div className="text-[10px] text-[#9C9489] truncate max-w-[200px]">{user.name}</div>}
      </td>
      <td className="py-2 px-2 text-right text-[#C5A572]">{user.luckBalance}</td>
      <td className="py-2 px-2 text-center">
        <Pill variant={user.role === "admin" ? "gold" : user.role === "reseller" ? "leaf" : "default"} className="text-[9px]">
          {user.role}
        </Pill>
        {user.specialRank && (
          <GlowPill color={tierColor(user.specialRank)} className="ml-1 text-[9px]">
            {user.specialRank}
          </GlowPill>
        )}
      </td>
      <td className="py-2 px-2 text-center text-[#9C9489]">{user.streak}</td>
      <td className="py-2 px-2 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-sm border border-[#2A2722] px-2 py-1 text-[11px] text-[#E8E2D5] hover:border-[#C5A572]/40"
          >
            Actions <ChevronRight className="w-3 h-3 inline -rotate-90" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-48 rounded-sm border border-[#2A2722] bg-[#0A0908] py-1 shadow-xl">
                <MenuButton icon={UserCog} label="Promote to reseller" onClick={() => { onPromote(user); setMenuOpen(false); }} />
                <MenuButton icon={Eye} label="View details" onClick={() => { onView(user); setMenuOpen(false); }} />
                <MenuButton icon={Award} label="Certificates" onClick={() => { onShowCert(user); setMenuOpen(false); }} />
                <div className="my-1 border-t border-[#2A2722]" />
                <div className="px-2 py-1">
                  <SpecialRankMenu userId={user.id} onGranted={onRefresh} />
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

function MenuButton({ icon: Icon, label, onClick }: { icon: any; label: string; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-2 px-3 py-1.5 text-[11px] text-[#E8E2D5] hover:bg-[#1A1714]"
    >
      <Icon className="w-3 h-3 text-[#C5A572]" />
      {label}
    </button>
  );
}

// ============================================================
// UsersTab
// ============================================================

function UsersTab() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [search, setSearch] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [selected, setSelected] = React.useState<Set<string>>(new Set());
  const [detailUser, setDetailUser] = React.useState<{ id: string; email: string } | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [certUser, setCertUser] = React.useState<{ id: string; email: string } | null>(null);
  const [certOpen, setCertOpen] = React.useState(false);
  const [promoteTarget, setPromoteTarget] = React.useState<any | null>(null);
  const [promoteTier, setPromoteTier] = React.useState("bronze");

  // Analytics aggregation state
  const [analytics, setAnalytics] = React.useState<any>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const u = await api<{ users: any[] }>("/api/admin/users");
      setUsers(u.users);
      const sys = await api<any>("/api/admin/system-viz");
      setAnalytics(sys);
    } catch (e: any) {
      toast.error(e.message || "Failed to load users");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function promoteToReseller() {
    if (!promoteTarget) return;
    try {
      await api("/api/admin/whitelist", {
        method: "POST",
        json: { userEmail: promoteTarget.email, tier: promoteTier },
      });
      toast.success(`${promoteTarget.email} promoted to reseller (${promoteTier})`);
      setPromoteTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to promote");
    }
  }

  const filtered = users.filter((u) =>
    !search ? true : u.email.toLowerCase().includes(search.toLowerCase()) || (u.name || "").toLowerCase().includes(search.toLowerCase())
  );

  // Compute FeatureAdoption data from analytics.distributions.byPurchaseTier
  const featureData: FeatureDatum[] = React.useMemo(() => {
    if (!analytics?.distributions?.byPurchaseTier) return [];
    return analytics.distributions.byPurchaseTier.map((t: any) => ({
      feature: t.tierId,
      usageCount: t.count,
      adoptionRate: Math.min((t.count / Math.max(analytics.summary.totalUsers, 1)) * 4, 1),
    }));
  }, [analytics]);

  // Compute activity distribution by role
  const activityData: { name: string; value: number }[] = React.useMemo(() => {
    if (!analytics?.distributions?.byRole) return [];
    return analytics.distributions.byRole.map((r: any) => ({ name: r.role, value: r.count }));
  }, [analytics]);

  // Compute scatter data: x=Luck earned, y=Luck spent, z=activity count
  const scatterData: ScatterDatum[] = React.useMemo(() => {
    return users.map((u) => ({
      x: u.totalLuckEarned ?? 0,
      y: u.totalLuckSpent ?? 0,
      z: Math.max(u.totalLuckEarned + u.totalLuckSpent, 1),
      label: u.email,
    }));
  }, [users]);

  function toggleSelect(id: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const selectedArr = users.filter((u) => selected.has(u.id)).map((u) => ({ id: u.id, email: u.email }));

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total users" value={users.length} sub="registered" />
        <StatCard icon={Activity} label="Active today" value={users.filter((u) => u.lastDailyAt && Date.now() - new Date(u.lastDailyAt).getTime() < 86400000).length} sub="last 24h" />
        <StatCard icon={Wallet} label="Total Luck" value={users.reduce((s, u) => s + (u.luckBalance || 0), 0)} sub="in wallets" />
        <StatCard icon={Crown} label="Special ranks" value={users.filter((u) => u.specialRank).length} sub="vip+ambassador+partner" />
      </div>

      {/* Feature Adoption Treemap */}
      <AuroraGlowCard className="p-5">
        <SectionLabel icon={Layers}>Feature adoption heatmap</SectionLabel>
        <FeatureAdoptionTreemap data={featureData} />
      </AuroraGlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Activity Distribution */}
        <GlassCard className="p-5">
          <SectionLabel icon={BarChart3}>Activity distribution</SectionLabel>
          <ActivityDistributionChart data={activityData} />
        </GlassCard>

        {/* Engagement Scatter */}
        <GlassCard className="p-5">
          <SectionLabel icon={Activity}>Engagement scatter</SectionLabel>
          <EngagementScatterChart data={scatterData} />
        </GlassCard>
      </div>

      {/* Leaderboard */}
      <Leaderboard kind="user" onRefresh={load} />

      {/* Users table */}
      <GlassCard className="p-5">
        <div className="flex items-center justify-between mb-3 gap-2 flex-wrap">
          <SectionLabel icon={Users}>Users ({filtered.length})</SectionLabel>
          <div className="flex items-center gap-2">
            <Input
              placeholder="Search email…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="h-8 w-48 bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]"
            />
            <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={load} disabled={loading}>
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? "Loading…" : "Refresh"}
            </ShimmerButton>
          </div>
        </div>
        <div className="max-h-96 overflow-y-auto lumina-scroll">
          <table className="w-full text-[12px]">
            <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide sticky top-0 bg-[#0A0908]">
              <tr>
                <th className="text-left py-2 px-2 w-8"></th>
                <th className="text-left py-2 px-2">Email</th>
                <th className="text-right py-2 px-2">Luck</th>
                <th className="text-center py-2 px-2">Role</th>
                <th className="text-center py-2 px-2">Streak</th>
                <th className="text-right py-2 px-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((u) => (
                <UserRow
                  key={u.id}
                  user={u}
                  selected={selected.has(u.id)}
                  onToggleSelect={() => toggleSelect(u.id)}
                  onPromote={(usr) => {
                    setPromoteTarget(usr);
                    setPromoteTier("bronze");
                  }}
                  onView={(usr) => {
                    setDetailUser({ id: usr.id, email: usr.email });
                    setDetailOpen(true);
                  }}
                  onShowCert={(usr) => {
                    setCertUser({ id: usr.id, email: usr.email });
                    setCertOpen(true);
                  }}
                  onRefresh={load}
                />
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Promote-to-reseller dialog */}
      <Dialog open={!!promoteTarget} onOpenChange={(v) => !v && setPromoteTarget(null)}>
        <DialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
          <DialogHeader>
            <DialogTitle className="text-[#E8E2D5] flex items-center gap-2">
              <UserCog className="w-4 h-4 text-[#C5A572]" />
              Promote to reseller
            </DialogTitle>
            <DialogDescription className="text-[#9C9489]">
              {promoteTarget?.email} will gain reseller tier and access to wholesale pricing.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-[12px] text-[#9C9489]">Tier</Label>
            <Select value={promoteTier} onValueChange={setPromoteTier}>
              <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESELLER_TIER_DEFS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <GoldButton onClick={() => setPromoteTarget(null)} className="bg-transparent border border-[#2A2722] text-[#9C9489]">
              Cancel
            </GoldButton>
            <GoldButton onClick={promoteToReseller}>Promote</GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User detail sheet */}
      <UserDetailSheet user={detailUser} open={detailOpen} onOpenChange={setDetailOpen} />

      {/* Cert modal */}
      <CertificateModal user={certUser} open={certOpen} onOpenChange={setCertOpen} />

      {/* Bulk action bar */}
      <BulkActionBar
        selected={selectedArr}
        onClear={() => setSelected(new Set())}
        onDone={() => {
          setSelected(new Set());
          load();
        }}
      />
    </div>
  );
}

// ============================================================
// ResellerRow
// ============================================================

function ResellerRow({
  reseller,
  onAdjustPool,
  onPromoteDemote,
  onBan,
  onView,
  onRefresh,
}: {
  reseller: any;
  onAdjustPool: (r: any) => void;
  onPromoteDemote: (r: any) => void;
  onBan: (r: any) => void;
  onView: (r: any) => void;
  onRefresh?: () => void;
}) {
  const [menuOpen, setMenuOpen] = React.useState(false);
  return (
    <tr className="border-t border-[#2A2722] hover:bg-[#121815]">
      <td className="py-2 px-2 text-[#E8E2D5]">
        <div className="truncate max-w-[180px]">{reseller.email}</div>
        {reseller.name && <div className="text-[10px] text-[#9C9489] truncate max-w-[180px]">{reseller.name}</div>}
      </td>
      <td className="py-2 px-2 text-center">
        {reseller.resellerTier ? (
          <Pill variant="gold" className="text-[9px]">
            {tierName(reseller.resellerTier)}
          </Pill>
        ) : (
          <span className="text-[#6B6358]">—</span>
        )}
        {reseller.specialRank && (
          <GlowPill color={tierColor(reseller.specialRank)} className="ml-1 text-[9px]">
            {reseller.specialRank}
          </GlowPill>
        )}
      </td>
      <td className="py-2 px-2 text-right text-[#C5A572]">{reseller.resellerPool}</td>
      <td className="py-2 px-2 text-right text-[#E8E2D5]">{reseller.lifetimeResellerMmk?.toLocaleString() ?? 0}</td>
      <td className="py-2 px-2 text-right">
        <div className="relative inline-block">
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="rounded-sm border border-[#2A2722] px-2 py-1 text-[11px] text-[#E8E2D5] hover:border-[#C5A572]/40"
          >
            Actions <ChevronRight className="w-3 h-3 inline -rotate-90" />
          </button>
          {menuOpen && (
            <>
              <div className="fixed inset-0 z-10" onClick={() => setMenuOpen(false)} />
              <div className="absolute right-0 top-full mt-1 z-20 w-52 rounded-sm border border-[#2A2722] bg-[#0A0908] py-1 shadow-xl">
                <MenuButton icon={Wallet} label="Adjust pool" onClick={() => { onAdjustPool(reseller); setMenuOpen(false); }} />
                <MenuButton icon={UserCog} label="Promote / Demote" onClick={() => { onPromoteDemote(reseller); setMenuOpen(false); }} />
                <MenuButton icon={Ban} label="Ban reseller" onClick={() => { onBan(reseller); setMenuOpen(false); }} />
                <MenuButton icon={Eye} label="View details" onClick={() => { onView(reseller); setMenuOpen(false); }} />
                <div className="my-1 border-t border-[#2A2722]" />
                <div className="px-2 py-1">
                  <SpecialRankMenu userId={reseller.id} onGranted={onRefresh} />
                </div>
              </div>
            </>
          )}
        </div>
      </td>
    </tr>
  );
}

// ============================================================
// ResellerDetailSheet — right-side sheet fetching /api/admin/analytics/resellers?id=
// ============================================================

function ResellerDetailSheet({
  reseller,
  open,
  onOpenChange,
}: {
  reseller: { id: string; email: string } | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!open || !reseller) return;
    setLoading(true);
    setData(null);
    api(`/api/admin/analytics/resellers?id=${reseller.id}`)
      .then((d) => setData(d))
      .catch((e) => toast.error(e.message || "Failed to load reseller analytics"))
      .finally(() => setLoading(false));
  }, [open, reseller]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" className="w-full sm:max-w-lg overflow-y-auto lumina-scroll bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
        <SheetHeader>
          <SheetTitle className="text-[#E8E2D5] flex items-center gap-2">
            <Eye className="w-4 h-4 text-[#C5A572]" />
            {reseller?.email}
          </SheetTitle>
          <SheetDescription className="text-[#9C9489]">Reseller analytics + transfer history</SheetDescription>
        </SheetHeader>

        {loading ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#9C9489]">Loading…</div>
        ) : !data ? (
          <div className="px-4 py-8 text-center text-[12px] text-[#9C9489]">No data</div>
        ) : (
          <div className="px-4 pb-8 space-y-4 text-[12px]">
            <GlassCard className="p-3">
              <div className="grid grid-cols-2 gap-2 text-[11px]">
                <KV label="Tier">{tierName(data.reseller?.resellerTier)}</KV>
                <KV label="Pool">{data.reseller?.resellerPool}</KV>
                <KV label="Luck balance">{data.reseller?.luckBalance}</KV>
                <KV label="Special rank">{data.reseller?.specialRank ?? "—"}</KV>
              </div>
            </GlassCard>

            {data.analytics && (
              <GlassCard className="p-3">
                <SectionLabel icon={TrendingUp}>Performance</SectionLabel>
                <div className="grid grid-cols-2 gap-2 text-[11px]">
                  <KV label="Luck sold">{data.analytics.totalLuckSold}</KV>
                  <KV label="MMK earned">{data.analytics.totalMmkEarned?.toLocaleString()}</KV>
                  <KV label="Avg / Luck">{data.analytics.avgPricePerLuck}</KV>
                  <KV label="Inventory MMK">{data.analytics.totalInventoryMmk?.toLocaleString()}</KV>
                  <KV label="Margin">{data.analytics.margin?.toLocaleString()}</KV>
                  <KV label="Transfers">{data.analytics.transfersCount}</KV>
                </div>
              </GlassCard>
            )}

            {data.recipients && data.recipients.length > 0 && (
              <GlassCard className="p-3">
                <SectionLabel icon={UsersIcon}>Top recipients</SectionLabel>
                <div className="space-y-1.5">
                  {data.recipients.map((r: any, i: number) => (
                    <div key={i} className="flex items-center justify-between text-[11px]">
                      <span className="text-[#E8E2D5] truncate max-w-[160px]">
                        {r.user?.email ?? "—"}
                      </span>
                      <span className="text-[#C5A572]">
                        {r.totalLuck} Luck · {r.totalMmk?.toLocaleString()} MMK
                      </span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}

            {data.transfersOut && data.transfersOut.length > 0 && (
              <GlassCard className="p-3">
                <SectionLabel icon={Activity}>Recent transfers</SectionLabel>
                <div className="max-h-48 overflow-y-auto lumina-scroll space-y-1">
                  {data.transfersOut.slice(0, 20).map((t: any) => (
                    <div key={t.id} className="flex items-center justify-between text-[11px] border-b border-[#2A2722] pb-1">
                      <span className="text-[#9C9489]">{t.amount} Luck</span>
                      <span className="text-[#C5A572]">{t.saleMmk?.toLocaleString() ?? 0} MMK</span>
                    </div>
                  ))}
                </div>
              </GlassCard>
            )}
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}

// ============================================================
// TierDistributionDonut — 7-tier reseller distribution
// ============================================================

function TierDistributionDonut({ data }: { data: { tier: string; count: number }[] }) {
  const chartData = React.useMemo(() => {
    return RESELLER_TIER_DEFS.map((t) => {
      const row = data.find((d) => d.tier === t.id || d.tier === `reseller_${t.id}`);
      return { name: t.name, value: row?.count ?? 0, color: t.color };
    }).filter((d) => d.value > 0);
  }, [data]);

  if (chartData.length === 0) {
    return <EmptyState icon={PieIcon} title="No reseller tiers" desc="No resellers in the system yet." />;
  }

  return (
    <div className="h-64 w-full">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            dataKey="value"
            nameKey="name"
            innerRadius={48}
            outerRadius={84}
            paddingAngle={2}
            stroke="#0A0908"
          >
            {chartData.map((d, i) => (
              <Cell key={i} fill={d.color} />
            ))}
          </Pie>
          <RTooltip
            contentStyle={{
              background: "#0A0908",
              border: "1px solid #2A2722",
              borderRadius: "2px",
              fontSize: 11,
              color: "#E8E2D5",
            }}
          />
          <Legend
            wrapperStyle={{ fontSize: 10, color: "#9C9489" }}
            iconType="circle"
            layout="horizontal"
            verticalAlign="bottom"
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

// ============================================================
// ResellerFilters
// ============================================================

type ResellerFiltersState = {
  tier: string | "__none__";
  search: string;
};

function ResellerFilters({
  state,
  onChange,
}: {
  state: ResellerFiltersState;
  onChange: (s: ResellerFiltersState) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2 mb-3">
      <Filter className="w-3.5 h-3.5 text-[#C5A572]" />
      <Input
        placeholder="Search email…"
        value={state.search}
        onChange={(e) => onChange({ ...state, search: e.target.value })}
        className="h-8 w-44 bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]"
      />
      <Select
        value={state.tier}
        onValueChange={(v) => onChange({ ...state, tier: v })}
      >
        <SelectTrigger className="h-8 w-40 bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]">
          <SelectValue placeholder="All tiers" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="__none__">All tiers</SelectItem>
          {RESELLER_TIER_DEFS.map((t) => (
            <SelectItem key={t.id} value={t.id}>
              {t.name}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

// ============================================================
// ResellersTab
// ============================================================

function ResellersTab() {
  const [users, setUsers] = React.useState<any[]>([]);
  const [systemViz, setSystemViz] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [filters, setFilters] = React.useState<ResellerFiltersState>({ tier: "__none__", search: "" });
  const [detailReseller, setDetailReseller] = React.useState<{ id: string; email: string } | null>(null);
  const [detailOpen, setDetailOpen] = React.useState(false);
  const [poolTarget, setPoolTarget] = React.useState<any | null>(null);
  const [poolAmount, setPoolAmount] = React.useState("");
  const [tierTarget, setTierTarget] = React.useState<any | null>(null);
  const [tierValue, setTierValue] = React.useState("bronze");
  const [banTarget, setBanTarget] = React.useState<any | null>(null);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const [u, sys] = await Promise.all([
        api<{ users: any[] }>("/api/admin/users"),
        api<any>("/api/admin/system-viz").catch(() => null),
      ]);
      setUsers(u.users.filter((x) => x.role === "reseller" || x.role === "admin"));
      setSystemViz(sys);
    } catch (e: any) {
      toast.error(e.message || "Failed to load resellers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  const filtered = users.filter((r) => {
    if (filters.tier !== "__none__" && r.resellerTier !== filters.tier && r.resellerTier !== `reseller_${filters.tier}`) return false;
    if (filters.search && !r.email.toLowerCase().includes(filters.search.toLowerCase())) return false;
    return true;
  });

  async function adjustPool() {
    if (!poolTarget) return;
    const n = parseInt(poolAmount, 10);
    if (isNaN(n)) {
      toast.error("Enter a valid number");
      return;
    }
    try {
      // Use admin grant to credit pool — backend supports positive/negative via admin grant
      await api("/api/admin/grant", {
        method: "POST",
        json: { userEmail: poolTarget.email, amount: n, reason: "pool_adjustment", target: "pool" },
      });
      toast.success(`Adjusted ${poolTarget.email} pool by ${n > 0 ? "+" : ""}${n}`);
      setPoolTarget(null);
      setPoolAmount("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to adjust pool");
    }
  }

  async function promoteDemote() {
    if (!tierTarget) return;
    try {
      await api("/api/admin/whitelist", {
        method: "POST",
        json: { userEmail: tierTarget.email, tier: tierValue },
      });
      toast.success(`${tierTarget.email} set to ${tierValue} tier`);
      setTierTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to update tier");
    }
  }

  async function banReseller() {
    if (!banTarget) return;
    try {
      await api("/api/admin/ban", {
        method: "POST",
        json: { userId: banTarget.id },
      });
      toast.success(`${banTarget.email} has been banned`);
      setBanTarget(null);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to ban");
    }
  }

  const tierDistribution = React.useMemo(() => {
    if (!systemViz?.distributions?.byResellerTier) return [];
    return systemViz.distributions.byResellerTier.map((t: any) => ({ tier: t.tier, count: t._count ?? t.count ?? 0 }));
  }, [systemViz]);

  return (
    <div className="space-y-4">
      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Store} label="Resellers" value={users.length} sub="active" />
        <StatCard icon={Wallet} label="Total pool" value={users.reduce((s, r) => s + (r.resellerPool || 0), 0)} sub="Luck in pools" />
        <StatCard icon={TrendingUp} label="Reseller MMK" value={users.reduce((s, r) => s + (r.lifetimeResellerMmk || 0), 0)} sub="lifetime" />
        <StatCard icon={Crown} label="Special ranks" value={users.filter((u) => u.specialRank).length} sub="vip+ambassador+partner" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Tier distribution donut */}
        <GlassCard className="p-5 lg:col-span-1">
          <SectionLabel icon={PieIcon}>Tier distribution</SectionLabel>
          <TierDistributionDonut data={tierDistribution} />
        </GlassCard>

        {/* Resellers table */}
        <GlassCard className="p-5 lg:col-span-2">
          <div className="flex items-center justify-between mb-3">
            <SectionLabel icon={Store}>Resellers ({filtered.length})</SectionLabel>
            <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={load} disabled={loading}>
              <Sparkles className="w-3.5 h-3.5" />
              {loading ? "Loading…" : "Refresh"}
            </ShimmerButton>
          </div>
          <ResellerFilters state={filters} onChange={setFilters} />
          <div className="max-h-96 overflow-y-auto lumina-scroll">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide sticky top-0 bg-[#0A0908]">
                <tr>
                  <th className="text-left py-2 px-2">Email</th>
                  <th className="text-center py-2 px-2">Tier</th>
                  <th className="text-right py-2 px-2">Pool</th>
                  <th className="text-right py-2 px-2">MMK</th>
                  <th className="text-right py-2 px-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((r) => (
                  <ResellerRow
                    key={r.id}
                    reseller={r}
                    onAdjustPool={(rr) => {
                      setPoolTarget(rr);
                      setPoolAmount("");
                    }}
                    onPromoteDemote={(rr) => {
                      setTierTarget(rr);
                      setTierValue(rr.resellerTier?.replace(/^reseller_/, "") ?? "bronze");
                    }}
                    onBan={(rr) => setBanTarget(rr)}
                    onView={(rr) => {
                      setDetailReseller({ id: rr.id, email: rr.email });
                      setDetailOpen(true);
                    }}
                    onRefresh={load}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
      </div>

      {/* Leaderboard */}
      <Leaderboard kind="reseller" onRefresh={load} />

      {/* Adjust pool dialog */}
      <Dialog open={!!poolTarget} onOpenChange={(v) => !v && setPoolTarget(null)}>
        <DialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
          <DialogHeader>
            <DialogTitle className="text-[#E8E2D5] flex items-center gap-2">
              <Wallet className="w-4 h-4 text-[#C5A572]" />
              Adjust reseller pool
            </DialogTitle>
            <DialogDescription className="text-[#9C9489]">
              {poolTarget?.email} · current pool: {poolTarget?.resellerPool}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-[12px] text-[#9C9489]">Amount (use negative to debit)</Label>
            <Input
              type="number"
              value={poolAmount}
              onChange={(e) => setPoolAmount(e.target.value)}
              className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5"
              placeholder="e.g. 500 or -200"
            />
          </div>
          <DialogFooter>
            <GoldButton onClick={() => setPoolTarget(null)} className="bg-transparent border border-[#2A2722] text-[#9C9489]">
              Cancel
            </GoldButton>
            <GoldButton onClick={adjustPool}>Apply</GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Promote/demote dialog */}
      <Dialog open={!!tierTarget} onOpenChange={(v) => !v && setTierTarget(null)}>
        <DialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
          <DialogHeader>
            <DialogTitle className="text-[#E8E2D5] flex items-center gap-2">
              <UserCog className="w-4 h-4 text-[#C5A572]" />
              Set reseller tier
            </DialogTitle>
            <DialogDescription className="text-[#9C9489]">
              {tierTarget?.email} · current tier: {tierTarget ? tierName(tierTarget.resellerTier) : "—"}
            </DialogDescription>
          </DialogHeader>
          <div className="py-2">
            <Label className="text-[12px] text-[#9C9489]">Tier</Label>
            <Select value={tierValue} onValueChange={setTierValue}>
              <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {RESELLER_TIER_DEFS.map((t) => (
                  <SelectItem key={t.id} value={t.id}>
                    {t.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <GoldButton onClick={() => setTierTarget(null)} className="bg-transparent border border-[#2A2722] text-[#9C9489]">
              Cancel
            </GoldButton>
            <GoldButton onClick={promoteDemote}>Apply</GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Ban confirm */}
      <AlertDialog open={!!banTarget} onOpenChange={(v) => !v && setBanTarget(null)}>
        <AlertDialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5]">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-[#E8E2D5] flex items-center gap-2">
              <Ban className="w-4 h-4 text-[#D8788A]" />
              Ban reseller
            </AlertDialogTitle>
            <AlertDialogDescription className="text-[#9C9489]">
              {banTarget?.email} will be demoted to user, lose their reseller tier, and have their pool reset to 0. Their personal Luck balance is preserved. Special rank will also be cleared.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel className="bg-transparent border border-[#2A2722] text-[#9C9489]">
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={banReseller}
              className="bg-[#D8788A] text-white hover:bg-[#C66772]"
            >
              Ban reseller
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reseller detail sheet */}
      <ResellerDetailSheet reseller={detailReseller} open={detailOpen} onOpenChange={setDetailOpen} />
    </div>
  );
}

// ============================================================
// CampaignsTab — CRUD form + table + live flyer preview
// ============================================================

function CampaignsTab() {
  const [campaigns, setCampaigns] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [editing, setEditing] = React.useState<any | null>(null);
  const [showForm, setShowForm] = React.useState(false);

  // Form state
  const [formName, setFormName] = React.useState("");
  const [formKind, setFormKind] = React.useState<"user" | "reseller">("user");
  const [formTierId, setFormTierId] = React.useState("");
  const [formMmkOverride, setFormMmkOverride] = React.useState("");
  const [formBonusPctOverride, setFormBonusPctOverride] = React.useState("");
  const [formValidFrom, setFormValidFrom] = React.useState("");
  const [formValidUntil, setFormValidUntil] = React.useState("");
  const [formDescription, setFormDescription] = React.useState("");
  const [formActive, setFormActive] = React.useState(true);
  const [saving, setSaving] = React.useState(false);

  // Live preview state
  const [previewCampaign, setPreviewCampaign] = React.useState<any | null>(null);
  const previewRef = React.useRef<HTMLDivElement>(null);
  const { download, downloading } = useBrandedImageDownload();

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<{ campaigns: any[] }>("/api/admin/campaigns");
      setCampaigns(res.campaigns);
      if (res.campaigns.length > 0 && !previewCampaign) {
        setPreviewCampaign(res.campaigns[0]);
      }
    } catch (e: any) {
      toast.error(e.message || "Failed to load campaigns");
    } finally {
      setLoading(false);
    }
  }, [previewCampaign]);

  React.useEffect(() => {
    load();
  }, []);

  function resetForm() {
    setFormName("");
    setFormKind("user");
    setFormTierId("");
    setFormMmkOverride("");
    setFormBonusPctOverride("");
    setFormValidFrom("");
    setFormValidUntil("");
    setFormDescription("");
    setFormActive(true);
    setEditing(null);
  }

  function startEdit(c: any) {
    setEditing(c);
    setFormName(c.name || "");
    setFormKind(c.kind || "user");
    setFormTierId(c.tierId || "");
    setFormMmkOverride(c.mmkOverride?.toString() ?? "");
    setFormBonusPctOverride(c.bonusPctOverride?.toString() ?? "");
    setFormValidFrom(c.validFrom ? new Date(c.validFrom).toISOString().slice(0, 10) : "");
    setFormValidUntil(c.validUntil ? new Date(c.validUntil).toISOString().slice(0, 10) : "");
    setFormDescription(c.description ?? "");
    setFormActive(!!c.active);
    setShowForm(true);
  }

  async function saveCampaign() {
    if (!formName.trim()) {
      toast.error("Name is required");
      return;
    }
    if (!formTierId.trim()) {
      toast.error("Tier ID is required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        name: formName.trim(),
        kind: formKind,
        tierId: formTierId.trim(),
        mmkOverride: formMmkOverride ? parseInt(formMmkOverride, 10) : null,
        bonusPctOverride: formBonusPctOverride ? parseInt(formBonusPctOverride, 10) : null,
        validFrom: formValidFrom || undefined,
        validUntil: formValidUntil || undefined,
        description: formDescription.trim() || null,
        active: formActive,
      };
      if (editing) {
        await api(`/api/admin/campaigns/${editing.id}`, {
          method: "PATCH",
          json: payload,
        });
        toast.success("Campaign updated");
      } else {
        await api("/api/admin/campaigns", {
          method: "POST",
          json: payload,
        });
        toast.success("Campaign created");
      }
      setShowForm(false);
      resetForm();
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to save campaign");
    } finally {
      setSaving(false);
    }
  }

  async function toggleActive(c: any) {
    try {
      await api(`/api/admin/campaigns/${c.id}`, {
        method: "PATCH",
        json: { active: !c.active },
      });
      toast.success(`${c.name} ${c.active ? "deactivated" : "activated"}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle");
    }
  }

  async function deleteCampaign(c: any) {
    if (!confirm(`Delete campaign "${c.name}"? This deactivates it.`)) return;
    try {
      await api(`/api/admin/campaigns/${c.id}`, { method: "DELETE" });
      toast.success(`${c.name} deleted`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  function campaignStatus(c: any): { label: string; color: string } {
    const now = Date.now();
    const from = new Date(c.validFrom).getTime();
    const until = new Date(c.validUntil).getTime();
    if (!c.active) return { label: "Inactive", color: "#6B6358" };
    if (now < from) return { label: "Scheduled", color: "#9E8AC9" };
    if (now > until) return { label: "Expired", color: "#D8788A" };
    return { label: "Active", color: "#7A8B6F" };
  }

  const tierOptions = formKind === "reseller"
    ? RESELLER_TIER_DEFS.map((t) => ({ id: `reseller_${t.id}`, name: t.name }))
    : REGULAR_TIER_DEFS.map((t) => ({ id: t.id, name: t.name }));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-2">
        <SectionLabel icon={CalendarClock}>Seasonal campaigns</SectionLabel>
        <ShimmerButton
          tone="gold"
          className="h-8 px-3 py-1.5 text-[12px]"
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
        >
          <Plus className="w-3.5 h-3.5" />
          New campaign
        </ShimmerButton>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Table */}
        <GlassCard className="p-5 lg:col-span-2">
          {loading ? (
            <div className="py-8 text-center text-[12px] text-[#9C9489]">Loading…</div>
          ) : campaigns.length === 0 ? (
            <EmptyState icon={CalendarClock} title="No campaigns yet" desc="Create your first seasonal campaign." />
          ) : (
            <div className="max-h-[480px] overflow-y-auto lumina-scroll">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide sticky top-0 bg-[#0A0908]">
                  <tr>
                    <th className="text-left py-2 px-2">Name</th>
                    <th className="text-left py-2 px-2">Tier</th>
                    <th className="text-center py-2 px-2">Status</th>
                    <th className="text-right py-2 px-2">Window</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {campaigns.map((c) => {
                    const st = campaignStatus(c);
                    return (
                      <tr key={c.id} className="border-t border-[#2A2722] hover:bg-[#121815]">
                        <td className="py-2 px-2">
                          <button
                            onClick={() => setPreviewCampaign(c)}
                            className="text-[#E8E2D5] hover:text-[#C5A572] truncate max-w-[160px] block"
                          >
                            {c.name}
                          </button>
                          {c.description && (
                            <div className="text-[10px] text-[#9C9489] truncate max-w-[160px]">{c.description}</div>
                          )}
                        </td>
                        <td className="py-2 px-2">
                          <Pill variant="gold" className="text-[9px]">{tierName(c.tierId)}</Pill>
                        </td>
                        <td className="py-2 px-2 text-center">
                          <GlowPill color={st.color}>{st.label}</GlowPill>
                        </td>
                        <td className="py-2 px-2 text-right text-[10px] text-[#9C9489]">
                          {new Date(c.validFrom).toLocaleDateString()} → {new Date(c.validUntil).toLocaleDateString()}
                        </td>
                        <td className="py-2 px-2 text-right">
                          <div className="inline-flex gap-1">
                            <button
                              onClick={() => startEdit(c)}
                              className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#C5A572]"
                              title="Edit"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={() => toggleActive(c)}
                              className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#7A8B6F]"
                              title={c.active ? "Deactivate" : "Activate"}
                            >
                              {c.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                            </button>
                            <button
                              onClick={() => deleteCampaign(c)}
                              className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#D8788A]"
                              title="Delete"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>

        {/* Live flyer preview */}
        <AuroraGlowCard className="p-5 lg:col-span-1">
          <div className="flex items-center gap-2 mb-2">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[#7A8B6F] animate-pulse" aria-hidden />
            <SectionLabel icon={ImageIcon}>Live flyer preview</SectionLabel>
          </div>
          {previewCampaign ? (
            <>
              <div ref={previewRef}>
                <BrandedImageCard
                  variant="campaign-flyer"
                  campaign={{
                    name: previewCampaign.name,
                    tierId: previewCampaign.tierId,
                    kind: previewCampaign.kind,
                    mmkOverride: previewCampaign.mmkOverride,
                    bonusPctOverride: previewCampaign.bonusPctOverride,
                    validFrom: previewCampaign.validFrom,
                    validUntil: previewCampaign.validUntil,
                    description: previewCampaign.description,
                  }}
                  caption={`Live flyer · ${previewCampaign.name}`}
                />
              </div>
              <div className="mt-3 flex items-center justify-between gap-2">
                <span className="text-[10px] text-[#9C9489] truncate">
                  {previewCampaign.name}
                </span>
                <ShimmerButton
                  tone="gold"
                  className="h-7 px-2 py-1 text-[11px]"
                  onClick={() => download(previewRef.current, brandedFilename("campaign-flyer"))}
                  disabled={downloading}
                >
                  <Download className="w-3 h-3" />
                  {downloading ? "…" : "PNG"}
                </ShimmerButton>
              </div>
            </>
          ) : (
            <EmptyState icon={ImageIcon} title="No campaign selected" desc="Click a campaign name to preview its flyer." />
          )}
        </AuroraGlowCard>
      </div>

      {/* Form dialog */}
      <Dialog open={showForm} onOpenChange={(v) => { setShowForm(v); if (!v) resetForm(); }}>
        <DialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5] max-w-2xl max-h-[85vh] overflow-y-auto lumina-scroll">
          <DialogHeader>
            <DialogTitle className="text-[#E8E2D5] flex items-center gap-2">
              <CalendarClock className="w-4 h-4 text-[#C5A572]" />
              {editing ? "Edit campaign" : "New campaign"}
            </DialogTitle>
            <DialogDescription className="text-[#9C9489]">
              Define a temporary tier override campaign.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div>
              <Label className="text-[12px] text-[#9C9489]">Name *</Label>
              <Input value={formName} onChange={(e) => setFormName(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. Thingyan Festival" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">Kind</Label>
                <Select value={formKind} onValueChange={(v: any) => setFormKind(v)}>
                  <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="user">User</SelectItem>
                    <SelectItem value="reseller">Reseller</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Tier ID *</Label>
                <Select value={formTierId} onValueChange={setFormTierId}>
                  <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5">
                    <SelectValue placeholder="Select tier" />
                  </SelectTrigger>
                  <SelectContent>
                    {tierOptions.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">MMK override (optional)</Label>
                <Input type="number" value={formMmkOverride} onChange={(e) => setFormMmkOverride(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. 8000" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Bonus % override (optional)</Label>
                <Input type="number" value={formBonusPctOverride} onChange={(e) => setFormBonusPctOverride(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. 15" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">Valid from</Label>
                <Input type="date" value={formValidFrom} onChange={(e) => setFormValidFrom(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Valid until</Label>
                <Input type="date" value={formValidUntil} onChange={(e) => setFormValidUntil(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-[12px] text-[#9C9489]">Description</Label>
              <Textarea value={formDescription} onChange={(e) => setFormDescription(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 min-h-[64px]" placeholder="Short flyer description…" />
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={formActive} onCheckedChange={setFormActive} />
              <Label className="text-[12px] text-[#E8E2D5]">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <GoldButton onClick={() => { setShowForm(false); resetForm(); }} className="bg-transparent border border-[#2A2722] text-[#9C9489]">
              Cancel
            </GoldButton>
            <GoldButton onClick={saveCampaign} disabled={saving}>
              {saving ? "Saving…" : editing ? "Update" : "Create"}
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// LuckPacksTab
// ============================================================

function LuckPacksTab() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  // Create custom tier form
  const [cTierId, setCTierId] = React.useState("");
  const [cName, setCName] = React.useState("");
  const [cKind, setCKind] = React.useState<"regular" | "reseller">("regular");
  const [cMmk, setCMmk] = React.useState("");
  const [cLuck, setCLuck] = React.useState("");
  const [cBonusPct, setCBonusPct] = React.useState("");
  const [cTagline, setCTagline] = React.useState("");
  const [saving, setSaving] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>("/api/admin/tiers");
      setData(res);
    } catch (e: any) {
      toast.error(e.message || "Failed to load tiers");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  async function saveCustomTier() {
    if (!cTierId.trim() || !cName.trim() || !cMmk || !cLuck || !cBonusPct) {
      toast.error("All required fields must be filled");
      return;
    }
    setSaving(true);
    try {
      await api("/api/admin/tiers", {
        method: "POST",
        json: {
          tierId: cTierId.trim(),
          name: cName.trim(),
          kind: cKind,
          mmk: parseInt(cMmk, 10),
          luck: parseInt(cLuck, 10),
          bonusPct: parseInt(cBonusPct, 10),
          tagline: cTagline.trim() || null,
          active: true,
          action: "custom",
        },
      });
      toast.success(`Custom tier ${cName} created`);
      setShowCreate(false);
      setCTierId(""); setCName(""); setCKind("regular"); setCMmk(""); setCLuck(""); setCBonusPct(""); setCTagline("");
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to create tier");
    } finally {
      setSaving(false);
    }
  }

  async function toggleTierActive(t: any, kind: "override" | "custom") {
    try {
      await api(`/api/admin/tiers/${t.tierId}`, {
        method: "PATCH",
        json: { active: !t.active },
      });
      toast.success(`${t.tierId} ${t.active ? "deactivated" : "activated"}`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to toggle");
    }
  }

  async function deleteTier(t: any) {
    if (!confirm(`Delete tier "${t.tierId}"?`)) return;
    try {
      await api(`/api/admin/tiers/${t.tierId}`, { method: "DELETE" });
      toast.success(`${t.tierId} removed`);
      load();
    } catch (e: any) {
      toast.error(e.message || "Failed to delete");
    }
  }

  const regular = data?.staticTiers?.regular ?? [];
  const reseller = data?.staticTiers?.reseller ?? [];
  const overrides = data?.overrides ?? [];
  const customs = data?.customs ?? [];
  const customRegular = customs.filter((c: any) => c.kind === "regular");
  const customReseller = customs.filter((c: any) => c.kind === "reseller");

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <SectionLabel icon={Package}>Luck packs & tiers</SectionLabel>
        <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={() => setShowCreate(true)}>
          <Plus className="w-3.5 h-3.5" />
          Create custom tier
        </ShimmerButton>
      </div>

      {loading ? (
        <div className="py-8 text-center text-[12px] text-[#9C9489]">Loading…</div>
      ) : (
        <>
          {/* Regular User Packs (6 base tiers + custom) */}
          <GlassCard className="p-5">
            <SectionLabel icon={Users}>Regular user packs ({regular.length + customRegular.length})</SectionLabel>
            <div className="overflow-x-auto lumina-scroll">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-2 px-2">Tier</th>
                    <th className="text-right py-2 px-2">MMK</th>
                    <th className="text-right py-2 px-2">Luck</th>
                    <th className="text-right py-2 px-2">Bonus %</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-center py-2 px-2">Type</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...regular, ...customRegular].map((t: any, i: number) => {
                    const isCustom = i >= regular.length;
                    return (
                      <tr key={t.id} className="border-t border-[#2A2722]">
                        <td className="py-2 px-2 text-[#E8E2D5]">
                          {t.name}
                          {t.popular && <GlowPill color="#C5A572" className="ml-2 text-[9px]">popular</GlowPill>}
                        </td>
                        <td className="py-2 px-2 text-right text-[#9C9489]">{t.mmk.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-[#E8E2D5]">{t.luck}</td>
                        <td className="py-2 px-2 text-right text-[#C5A572]">{t.bonusPct}%</td>
                        <td className="py-2 px-2 text-right text-[#E8E2D5]">{t.total}</td>
                        <td className="py-2 px-2 text-center">
                          <Pill variant={isCustom ? "gold" : "default"} className="text-[9px]">
                            {isCustom ? "custom" : "base"}
                          </Pill>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {isCustom && (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => toggleTierActive(customRegular[i - regular.length], "custom")}
                                className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#7A8B6F]"
                                title={t.active ? "Deactivate" : "Activate"}
                              >
                                {t.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => deleteTier(customRegular[i - regular.length])}
                                className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#D8788A]"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Reseller Packs (7 base tiers + custom) */}
          <GlassCard className="p-5">
            <SectionLabel icon={Store}>Reseller packs ({reseller.length + customReseller.length})</SectionLabel>
            <div className="overflow-x-auto lumina-scroll">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-2 px-2">Tier</th>
                    <th className="text-right py-2 px-2">MMK</th>
                    <th className="text-right py-2 px-2">Luck</th>
                    <th className="text-right py-2 px-2">Bonus %</th>
                    <th className="text-right py-2 px-2">Total</th>
                    <th className="text-center py-2 px-2">Type</th>
                    <th className="text-right py-2 px-2">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[...reseller, ...customReseller].map((t: any, i: number) => {
                    const isCustom = i >= reseller.length;
                    return (
                      <tr key={t.id} className="border-t border-[#2A2722]">
                        <td className="py-2 px-2 text-[#E8E2D5]">{t.name}</td>
                        <td className="py-2 px-2 text-right text-[#9C9489]">{t.mmk.toLocaleString()}</td>
                        <td className="py-2 px-2 text-right text-[#E8E2D5]">{t.luck}</td>
                        <td className="py-2 px-2 text-right text-[#C5A572]">{t.bonusPct}%</td>
                        <td className="py-2 px-2 text-right text-[#E8E2D5]">{t.total}</td>
                        <td className="py-2 px-2 text-center">
                          <Pill variant={isCustom ? "gold" : "default"} className="text-[9px]">
                            {isCustom ? "custom" : "base"}
                          </Pill>
                        </td>
                        <td className="py-2 px-2 text-right">
                          {isCustom && (
                            <div className="inline-flex gap-1">
                              <button
                                onClick={() => toggleTierActive(customReseller[i - reseller.length], "custom")}
                                className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#7A8B6F]"
                                title={t.active ? "Deactivate" : "Activate"}
                              >
                                {t.active ? <Check className="w-3 h-3" /> : <X className="w-3 h-3" />}
                              </button>
                              <button
                                onClick={() => deleteTier(customReseller[i - reseller.length])}
                                className="rounded-sm border border-[#2A2722] p-1 text-[#9C9489] hover:text-[#D8788A]"
                                title="Delete"
                              >
                                <Trash2 className="w-3 h-3" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Special Ranks (read-only table) */}
          <GlassCard className="p-5">
            <SectionLabel icon={Crown}>Special ranks (admin-granted)</SectionLabel>
            <div className="overflow-x-auto lumina-scroll">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide">
                  <tr>
                    <th className="text-left py-2 px-2">Rank</th>
                    <th className="text-right py-2 px-2">Bonus %</th>
                    <th className="text-right py-2 px-2">Stipend Luck</th>
                    <th className="text-right py-2 px-2">Period (days)</th>
                  </tr>
                </thead>
                <tbody>
                  {SPECIAL_RANK_DEFS.map((r) => {
                    const def = [
                      { id: "vip", bonusPct: 10, stipendLuck: 5, periodDays: 7 },
                      { id: "ambassador", bonusPct: 25, stipendLuck: 10, periodDays: 7 },
                      { id: "partner", bonusPct: 50, stipendLuck: 20, periodDays: 1 },
                    ].find((d) => d.id === r.id)!;
                    return (
                      <tr key={r.id} className="border-t border-[#2A2722]">
                        <td className="py-2 px-2">
                          <GlowPill color={r.color}>{r.name}</GlowPill>
                        </td>
                        <td className="py-2 px-2 text-right text-[#C5A572]">+{def.bonusPct}%</td>
                        <td className="py-2 px-2 text-right text-[#E8E2D5]">{def.stipendLuck} Luck</td>
                        <td className="py-2 px-2 text-right text-[#9C9489]">{def.periodDays}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </GlassCard>

          {/* Overrides (read-only summary) */}
          {overrides.length > 0 && (
            <GlassCard className="p-5">
              <SectionLabel icon={Pencil}>Active overrides ({overrides.length})</SectionLabel>
              <div className="overflow-x-auto lumina-scroll">
                <table className="w-full text-[12px]">
                  <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide">
                    <tr>
                      <th className="text-left py-2 px-2">Tier</th>
                      <th className="text-right py-2 px-2">MMK</th>
                      <th className="text-right py-2 px-2">Luck</th>
                      <th className="text-right py-2 px-2">Bonus %</th>
                      <th className="text-center py-2 px-2">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {overrides.map((o: any) => (
                      <tr key={o.id} className="border-t border-[#2A2722]">
                        <td className="py-2 px-2 text-[#E8E2D5]">{o.tierId}</td>
                        <td className="py-2 px-2 text-right text-[#9C9489]">{o.mmkOverride ?? "—"}</td>
                        <td className="py-2 px-2 text-right text-[#9C9489]">{o.luckOverride ?? "—"}</td>
                        <td className="py-2 px-2 text-right text-[#9C9489]">{o.bonusPctOverride ?? "—"}</td>
                        <td className="py-2 px-2 text-center">
                          <Pill variant={o.active ? "leaf" : "default"} className="text-[9px]">
                            {o.active ? "active" : "inactive"}
                          </Pill>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </GlassCard>
          )}
        </>
      )}

      {/* Create custom tier dialog */}
      <Dialog open={showCreate} onOpenChange={setShowCreate}>
        <DialogContent className="bg-[#0A0908] border-[#2A2722] text-[#E8E2D5] max-w-xl max-h-[85vh] overflow-y-auto lumina-scroll">
          <DialogHeader>
            <DialogTitle className="text-[#E8E2D5] flex items-center gap-2">
              <Package className="w-4 h-4 text-[#C5A572]" />
              Create custom tier
            </DialogTitle>
            <DialogDescription className="text-[#9C9489]">
              Add a new tier beyond the standard 6 regular / 7 reseller tiers.
            </DialogDescription>
          </DialogHeader>
          <div className="py-2 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">Tier ID *</Label>
                <Input value={cTierId} onChange={(e) => setCTierId(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. founder_special" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Display name *</Label>
                <Input value={cName} onChange={(e) => setCName(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="e.g. Founder Special" />
              </div>
            </div>
            <div>
              <Label className="text-[12px] text-[#9C9489]">Kind</Label>
              <Select value={cKind} onValueChange={(v: any) => setCKind(v)}>
                <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="regular">Regular (user)</SelectItem>
                  <SelectItem value="reseller">Reseller</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">MMK *</Label>
                <Input type="number" value={cMmk} onChange={(e) => setCMmk(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Luck *</Label>
                <Input type="number" value={cLuck} onChange={(e) => setCLuck(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Bonus % *</Label>
                <Input type="number" value={cBonusPct} onChange={(e) => setCBonusPct(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
              </div>
            </div>
            <div>
              <Label className="text-[12px] text-[#9C9489]">Tagline</Label>
              <Input value={cTagline} onChange={(e) => setCTagline(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" />
            </div>
          </div>
          <DialogFooter>
            <GoldButton onClick={() => setShowCreate(false)} className="bg-transparent border border-[#2A2722] text-[#9C9489]">
              Cancel
            </GoldButton>
            <GoldButton onClick={saveCustomTier} disabled={saving}>
              {saving ? "Saving…" : "Create"}
            </GoldButton>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============================================================
// SystemVizTab — 5 charts
// ============================================================

function SystemVizTab() {
  const [data, setData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const res = await api<any>("/api/admin/system-viz");
      setData(res);
    } catch (e: any) {
      toast.error(e.message || "Failed to load system viz");
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    load();
  }, [load]);

  // Cohort retention heatmap (mock 6 cohorts × 4 weeks based on trend7d)
  const cohortData = React.useMemo(() => {
    // Build pseudo-cohort from 7-day trend
    const trend = data?.trend7d ?? [];
    return trend.slice(0, 7).map((t: any) => ({
      cohort: t.day,
      w1: t.count,
      w2: Math.max(1, Math.round(t.count * 0.7)),
      w3: Math.max(1, Math.round(t.count * 0.5)),
      w4: Math.max(1, Math.round(t.count * 0.35)),
    }));
  }, [data]);

  // Revenue by tier donut
  const revenueByTier = React.useMemo(() => {
    const tiers = data?.distributions?.byPurchaseTier ?? [];
    return tiers.map((t: any, i: number) => ({
      name: tierName(t.tierId),
      value: t.totalMmk ?? 0,
      color: [REGULAR_TIER_DEFS, RESELLER_TIER_DEFS].flat()[i % 13]?.color ?? "#9CA8A3",
    })).filter((d: any) => d.value > 0);
  }, [data]);

  // Feature revenue stacked bar (purchase tier → totalLuck/totalMmk)
  const featureRevenue = React.useMemo(() => {
    const tiers = data?.distributions?.byPurchaseTier ?? [];
    return tiers.map((t: any) => ({
      name: tierName(t.tierId),
      luck: t.totalLuck ?? 0,
      mmk: t.totalMmk ?? 0,
    }));
  }, [data]);

  // Monthly active area chart (use luckBuckets as proxy)
  const monthlyActive = React.useMemo(() => {
    const buckets = data?.distributions?.luckBuckets ?? {};
    return Object.entries(buckets).map(([k, v]: any) => ({ name: k, value: v as number }));
  }, [data]);

  // Campaign performance table (from recentPurchases — proxy by tier)
  const campaignTable = React.useMemo(() => {
    const byTier: Record<string, { count: number; mmk: number; luck: number }> = {};
    for (const p of data?.recentPurchases ?? []) {
      if (!byTier[p.tierId]) byTier[p.tierId] = { count: 0, mmk: 0, luck: 0 };
      byTier[p.tierId].count += 1;
      byTier[p.tierId].mmk += p.mmkAmount;
      byTier[p.tierId].luck += p.totalLuck;
    }
    return Object.entries(byTier).map(([tier, v]) => ({ tier, ...v }));
  }, [data]);

  if (loading && !data) {
    return <div className="py-12 text-center text-[12px] text-[#9C9489]">Loading system analytics…</div>;
  }
  if (!data) {
    return <EmptyState icon={BarChart3} title="No data" desc="Failed to load system viz." />;
  }

  return (
    <div className="space-y-4">
      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <StatCard icon={Users} label="Total users" value={data.summary?.totalUsers ?? 0} sub="all time" />
        <StatCard icon={Wallet} label="Total MMK" value={data.summary?.totalMmk ?? 0} sub="lifetime revenue" />
        <StatCard icon={TrendingUp} label="Total Luck" value={data.summary?.totalLuck ?? 0} sub="credits sold" />
        <StatCard icon={Gift} label="Bonus Luck" value={data.summary?.totalBonus ?? 0} sub="credits granted" />
      </div>

      {/* Cohort Retention Heatmap */}
      <AuroraGlowCard className="p-5">
        <SectionLabel icon={Layers}>Cohort retention heatmap</SectionLabel>
        <div className="overflow-x-auto lumina-scroll">
          <table className="w-full text-[11px]">
            <thead>
              <tr className="text-[10px] text-[#9C9489] uppercase tracking-wide">
                <th className="text-left py-2 px-2">Cohort</th>
                <th className="text-center py-2 px-2">W1</th>
                <th className="text-center py-2 px-2">W2</th>
                <th className="text-center py-2 px-2">W3</th>
                <th className="text-center py-2 px-2">W4</th>
              </tr>
            </thead>
            <tbody>
              {cohortData.map((c: any) => {
                const max = Math.max(c.w1, c.w2, c.w3, c.w4, 1);
                return (
                  <tr key={c.cohort} className="border-t border-[#2A2722]">
                    <td className="py-2 px-2 text-[#E8E2D5]">{c.cohort}</td>
                    {[c.w1, c.w2, c.w3, c.w4].map((v, i) => {
                      const intensity = v / max;
                      const bg = intensity > 0.7 ? "rgba(197,165,114,0.7)" : intensity > 0.4 ? "rgba(197,165,114,0.4)" : intensity > 0.1 ? "rgba(197,165,114,0.2)" : "rgba(197,165,114,0.05)";
                      return (
                        <td key={i} className="py-1 px-1">
                          <div className="mx-auto flex h-9 w-full items-center justify-center rounded-sm text-[11px] font-medium text-[#0A0908]" style={{ background: bg }}>
                            {v}
                          </div>
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </AuroraGlowCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Revenue by Tier Donut */}
        <GlassCard className="p-5">
          <SectionLabel icon={PieIcon}>Revenue by tier</SectionLabel>
          {revenueByTier.length === 0 ? (
            <EmptyState icon={PieIcon} title="No revenue data" desc="Purchases will appear here." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={revenueByTier} dataKey="value" nameKey="name" innerRadius={48} outerRadius={84} paddingAngle={2} stroke="#0A0908">
                    {revenueByTier.map((d: any, i: number) => (
                      <Cell key={i} fill={d.color} />
                    ))}
                  </Pie>
                  <RTooltip contentStyle={{ background: "#0A0908", border: "1px solid #2A2722", borderRadius: "2px", fontSize: 11, color: "#E8E2D5" }} formatter={(v: any) => `${Number(v).toLocaleString()} MMK`} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#9C9489" }} iconType="circle" />
                </PieChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Feature Revenue Stacked Bar */}
        <GlassCard className="p-5">
          <SectionLabel icon={BarChart3}>Feature revenue</SectionLabel>
          {featureRevenue.length === 0 ? (
            <EmptyState icon={BarChart3} title="No data" desc="Purchase tier breakdown will appear here." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={featureRevenue} margin={{ top: 8, right: 16, bottom: 32, left: 0 }}>
                  <CartesianGrid strokeDasharray="2 4" stroke="#2A2722" />
                  <XAxis dataKey="name" tick={{ fill: "#9C9489", fontSize: 10, angle: -45, textAnchor: "end" } as any} interval={0} height={48} stroke="#2A2722" />
                  <YAxis tick={{ fill: "#9C9489", fontSize: 10 } as any} stroke="#2A2722" />
                  <RTooltip contentStyle={{ background: "#0A0908", border: "1px solid #2A2722", borderRadius: "2px", fontSize: 11, color: "#E8E2D5" }} cursor={{ fill: "rgba(197,165,114,0.08)" }} />
                  <Legend wrapperStyle={{ fontSize: 10, color: "#9C9489" }} iconType="circle" />
                  <Bar dataKey="luck" name="Luck" stackId="a" fill="#C5A572" />
                  <Bar dataKey="mmk" name="MMK" stackId="a" fill="#7A8B6F" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Monthly Active Area Chart */}
        <GlassCard className="p-5">
          <SectionLabel icon={LineIcon}>User distribution by Luck bucket</SectionLabel>
          {monthlyActive.length === 0 ? (
            <EmptyState icon={LineIcon} title="No data" desc="User buckets will appear here." />
          ) : (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={monthlyActive} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
                  <defs>
                    <linearGradient id="luckGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#C5A572" stopOpacity={0.6} />
                      <stop offset="100%" stopColor="#C5A572" stopOpacity={0.05} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="2 4" stroke="#2A2722" />
                  <XAxis dataKey="name" tick={{ fill: "#9C9489", fontSize: 10 }} stroke="#2A2722" />
                  <YAxis tick={{ fill: "#9C9489", fontSize: 10 }} stroke="#2A2722" />
                  <RTooltip contentStyle={{ background: "#0A0908", border: "1px solid #2A2722", borderRadius: "2px", fontSize: 11, color: "#E8E2D5" }} />
                  <Area type="monotone" dataKey="value" stroke="#C5A572" strokeWidth={2} fill="url(#luckGrad)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          )}
        </GlassCard>

        {/* Campaign Performance Table */}
        <GlassCard className="p-5">
          <SectionLabel icon={Trophy}>Recent campaign performance</SectionLabel>
          {campaignTable.length === 0 ? (
            <EmptyState icon={Trophy} title="No purchases yet" desc="Recent purchase performance by tier will appear here." />
          ) : (
            <div className="max-h-64 overflow-y-auto lumina-scroll">
              <table className="w-full text-[12px]">
                <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide sticky top-0 bg-[#0A0908]">
                  <tr>
                    <th className="text-left py-2 px-2">Tier</th>
                    <th className="text-right py-2 px-2">Purchases</th>
                    <th className="text-right py-2 px-2">MMK</th>
                    <th className="text-right py-2 px-2">Luck</th>
                  </tr>
                </thead>
                <tbody>
                  {campaignTable.map((c: any) => (
                    <tr key={c.tier} className="border-t border-[#2A2722]">
                      <td className="py-2 px-2 text-[#E8E2D5]">{tierName(c.tier)}</td>
                      <td className="py-2 px-2 text-right text-[#9C9489]">{c.count}</td>
                      <td className="py-2 px-2 text-right text-[#C5A572]">{c.mmk.toLocaleString()}</td>
                      <td className="py-2 px-2 text-right text-[#E8E2D5]">{c.luck}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </GlassCard>
      </div>

      <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={load} disabled={loading}>
        <Sparkles className="w-3.5 h-3.5" />
        {loading ? "Refreshing…" : "Refresh analytics"}
      </ShimmerButton>
    </div>
  );
}

// ============================================================
// Main AdminView
// ============================================================

export function AdminView() {
  const { data } = useMe();
  const user = data?.user;
  const [stats, setStats] = React.useState<any>(null);
  const [grantEmail, setGrantEmail] = React.useState("");
  const [grantAmount, setGrantAmount] = React.useState("");
  const [subTab, setSubTab] = React.useState<SubTab>("users");

  async function loadStats() {
    try {
      const s = await api<{ stats: any }>("/api/admin/stats");
      setStats(s.stats);
    } catch {}
  }

  React.useEffect(() => {
    if (user?.role === "admin") loadStats();
  }, [user]);

  async function grant() {
    try {
      await api("/api/admin/grant", {
        method: "POST",
        json: { userEmail: grantEmail, amount: parseInt(grantAmount) },
      });
      toast.success(`Granted ${grantAmount} Luck to ${grantEmail}`);
      setGrantEmail(""); setGrantAmount("");
    } catch (e: any) {
      toast.error(e.message);
    }
  }

  if (!user) return <Gate title="Sign in" />;
  if (user.role !== "admin") return <Gate title="Admin access required" desc="This area is restricted to administrators." />;

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-6xl mx-auto px-4 py-6 lg:py-8 pb-20">
        {/* Header */}
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#C5A572]" />
          <Pill variant="gold">Admin</Pill>
        </div>
        <SectionTitle
          eyebrow="Internal"
          title="Admin Panel"
          subtitle="Manage users, resellers, campaigns, tier packs, and visualize system-wide analytics."
          className="mb-6"
        />

        {/* Quick stats (top-level) */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="Total users" value={stats?.totalUsers ?? 0} sub="registered" />
          <StatCard icon={Store} label="Resellers" value={stats?.resellers ?? 0} sub="whitelisted" />
          <StatCard icon={Wallet} label="Revenue" value={stats?.totalMmk ?? 0} sub="MMK total" />
          <StatCard icon={TrendingUp} label="Luck sold" value={stats?.totalLuckSold ?? 0} sub="credits" />
        </div>

        {/* Quick grant (compact) */}
        <GlassCard className="p-4 mb-6">
          <div className="flex flex-wrap items-center gap-2">
            <Gift className="w-4 h-4 text-[#C5A572]" />
            <span className="text-[12px] text-[#E8E2D5]">Quick grant:</span>
            <Input
              value={grantEmail}
              onChange={(e) => setGrantEmail(e.target.value)}
              placeholder="user email"
              className="h-8 w-48 bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]"
            />
            <Input
              type="number"
              value={grantAmount}
              onChange={(e) => setGrantAmount(e.target.value)}
              placeholder="Luck"
              className="h-8 w-24 bg-white/[0.03] border-[#2A2722] text-[12px] text-[#E8E2D5]"
            />
            <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={grant} disabled={!grantEmail || !grantAmount}>
              <Send className="w-3.5 h-3.5" />
              Grant
            </ShimmerButton>
            <div className="ml-auto">
              <ShimmerButton tone="gold" className="h-8 px-3 py-1.5 text-[12px]" onClick={loadStats}>
                <Sparkles className="w-3.5 h-3.5" />
                Refresh stats
              </ShimmerButton>
            </div>
          </div>
        </GlassCard>

        {/* Sub-tab navigation */}
        <SubTabNav value={subTab} onChange={setSubTab} />

        {/* Active tab */}
        {subTab === "users" && <UsersTab />}
        {subTab === "resellers" && <ResellersTab />}
        {subTab === "campaigns" && <CampaignsTab />}
        {subTab === "luck-packs" && <LuckPacksTab />}
        {subTab === "system-viz" && <SystemVizTab />}
      </div>
    </div>
  );
}
