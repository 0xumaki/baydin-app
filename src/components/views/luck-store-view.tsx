"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { Wallet, Sparkles, Check, TrendingUp, Gift } from "lucide-react";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const PAYMENT_METHODS = [
  { id: "kbz", name: "KBZ Pay" },
  { id: "wave", name: "Wave Money" },
  { id: "aya", name: "AYA Pay" },
  { id: "cb", name: "CB Pay" },
  { id: "cash", name: "Cash / Bank" },
];

export function LuckStoreView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const [tiers, setTiers] = React.useState<{ regular: any[]; reseller: any[] | null }>({ regular: [], reseller: null });
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
      toast.success(`Luck added to your account! ✦`);
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["luck", "transactions"] });
      setSelected(null);
      setPaymentRef("");
    } catch (e: any) { toast.error(e.message); }
    finally { setBuying(false); }
  }

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Pay-as-you-go" title="Buy Luck" subtitle="Spend Luck on astrology, tarot & rituals. 99% cheaper than real-life fortune telling." className="mb-6" />

        {/* Margin explainer */}
        <GlassCard className="p-4 mb-6 flex items-center gap-4">
          <div className="w-12 h-12 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 flex items-center justify-center shrink-0">
            <TrendingUp className="w-6 h-6 text-leaf" />
          </div>
          <div className="text-[12px] text-ink-muted leading-relaxed">
            <span className="text-ink">Real-life fortune telling costs 30,000–250,000 MMK.</span> A Baydin reading costs ~2 Luck (from 134 MMK). Bulk Luck drops the per-reading price further. <span className="text-leaf">Win-win.</span>
          </div>
        </GlassCard>

        {/* Tiers */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-6">
          {tiers.regular.map((t) => (
            <TierCard key={t.id} tier={t} selected={selected === t.id} onSelect={() => setSelected(selected === t.id ? null : t.id)} />
          ))}
        </div>

        {/* Reseller tiers (hidden unless whitelisted) */}
        {tiers.reseller && (
          <div className="mb-6">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles className="w-4 h-4 text-leaf" />
              <h3 className="text-[15px] font-light text-ink">Reseller Wholesale Tiers</h3>
              <Pill variant="leaf" className="text-[10px]">Whitelisted</Pill>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {tiers.reseller.map((t) => (
                <TierCard key={t.id} tier={t} selected={selected === t.id} onSelect={() => setSelected(selected === t.id ? null : t.id)} reseller />
              ))}
            </div>
          </div>
        )}

        {/* Payment panel */}
        {selected && (
          <ShellCard className="p-5 lum-anim-float-up">
            <div className="text-[13px] text-ink-muted mb-1">Complete your purchase</div>
            <div className="text-[18px] text-ink mb-4">
              {tiers.regular.find(t => t.id === selected)?.name || tiers.reseller?.find(t => t.id === selected)?.name}
              <span className="text-gold ml-2">{tiers.regular.find(t => t.id === selected)?.total || tiers.reseller?.find(t => t.id === selected)?.total} Luck</span>
              <span className="text-ink-muted text-[13px] ml-2">· {tiers.regular.find(t => t.id === selected)?.mmk || tiers.reseller?.find(t => t.id === selected)?.mmk} MMK</span>
            </div>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px] text-ink-muted">Payment method</Label>
                <div className="grid grid-cols-5 gap-1.5 mt-1.5">
                  {PAYMENT_METHODS.map((m) => (
                    <button key={m.id} onClick={() => setPaymentMethod(m.id)} className={cn("px-2 py-2 rounded-lg text-[11px] border transition", paymentMethod === m.id ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-ink-muted hover:text-ink")}>
                      {m.name}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label className="text-[12px] text-ink-muted">Transaction reference (from your payment app)</Label>
                <Input value={paymentRef} onChange={(e) => setPaymentRef(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink mt-1.5" placeholder="e.g. TXN123456789 or transfer screenshot ref" />
              </div>
              <div className="text-[11px] text-ink-muted leading-relaxed">
                Transfer {tiers.regular.find(t => t.id === selected)?.mmk || tiers.reseller?.find(t => t.id === selected)?.mmk} MMK to our {PAYMENT_METHODS.find(m => m.id === paymentMethod)?.name} account, then enter the reference above. Luck is credited instantly.
              </div>
              <GradientButton onClick={() => buy(selected)} disabled={buying} className="w-full">
                {buying ? "Processing…" : <><Wallet className="w-4 h-4" /> Confirm & credit Luck</>}
              </GradientButton>
            </div>
          </ShellCard>
        )}

        {/* Referral share */}
        {user && (
          <GlassCard className="p-4 mt-6 flex items-center gap-4">
            <Gift className="w-8 h-8 text-leaf shrink-0" />
            <div className="flex-1">
              <div className="text-[13px] text-ink">Share & earn 10 Luck per signup</div>
              <div className="text-[11px] text-ink-muted">Your code: <span className="text-gold font-mono">{user.referralCode}</span></div>
            </div>
            <GoldButton onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.referralCode}`); toast.success("Link copied"); }} className="px-4 py-2 text-[12px]">Copy link</GoldButton>
          </GlassCard>
        )}
      </div>
    </div>
  );
}

function TierCard({ tier, selected, onSelect, reseller }: { tier: any; selected: boolean; onSelect: () => void; reseller?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative text-left p-4 rounded-2xl border transition-all",
        selected ? "border-gold/40 bg-gold/[0.06] shadow-[0_0_30px_-8px_rgba(197,168,124,0.3)]" : "border-white/8 bg-white/[0.02] hover:border-white/15",
        tier.popular && !selected && "border-leaf/20"
      )}
    >
      {tier.popular && <div className="absolute -top-2 left-1/2 -translate-x-1/2"><Pill variant="leaf" className="text-[9px]">Most popular</Pill></div>}
      {reseller && <div className="absolute -top-2 right-3"><Pill variant="gold" className="text-[9px]">Wholesale</Pill></div>}
      <div className="text-[15px] font-light text-ink mb-1">{tier.name}</div>
      <div className="flex items-baseline gap-1 mb-2">
        <span className="text-[22px] font-light text-gold">{tier.total}</span>
        <span className="text-[11px] text-ink-muted">Luck</span>
      </div>
      {tier.bonus > 0 && <div className="text-[10px] text-leaf mb-2">+{tier.bonusPct}% bonus</div>}
      <div className="text-[16px] text-ink mb-1">{tier.mmk.toLocaleString()} MMK</div>
      <div className="text-[10px] text-ink-muted">{tier.perLuck} MMK / Luck</div>
      <div className="text-[10px] text-ink-muted/70 mt-2 leading-tight">{tier.tagline}</div>
      {selected && <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-gold flex items-center justify-center"><Check className="w-3 h-3 text-black" /></div>}
    </button>
  );
}
