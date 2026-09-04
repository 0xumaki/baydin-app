"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useMe, api } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { Wallet, Check, Gift, Moon, Star, Sparkles, Heart, Hash } from "lucide-react";
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

// Feature cost reference shown to the user
const FEATURE_COSTS = [
  { feature: "Astrologer chat (per turn)", cost: 2, icon: MessageCircleIcon },
  { feature: "Tarot reading (after 2 free/day)", cost: 1, icon: Sparkles },
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
      toast.success("Luck added to your account");
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["luck", "transactions"] });
      setSelected(null);
      setPaymentRef("");
    } catch (e: any) { toast.error(e.message); }
    finally { setBuying(false); }
  }

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Wallet className="w-10 h-10 text-[#6B6358] mx-auto mb-3" />
          <div className="text-[16px] text-[#E8E2D5] mb-1">{t("luck_earn")}</div>
          <button
            onClick={onAuth}
            className="mt-3 inline-flex items-center gap-2 py-2.5 px-5 bg-[#E8E2D5] text-[#0A0908] text-[13px] font-medium hover:bg-white transition rounded-sm focus-ring"
          >
            {t("sign_in")}
          </button>
        </div>
      </div>
    );
  }

  const selectedTier = [...tiers.regular, ...(tiers.reseller || [])].find((t) => t.id === selected);

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-4xl mx-auto px-6 py-10 lg:py-14">
        {/* Hero */}
        <div className="mb-10 lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">In-app credit</div>
          <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight mb-3">
            {t("luck_earn")}
          </h1>
          <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Luck is the credit you spend on readings, rituals, and reports. Earn it through daily rewards, referrals, or by topping up below.
          </p>
          <div className="mt-4 flex items-baseline gap-3">
            <span className="serif-display text-[2rem] text-[#C5A572] tabular-nums">{user.luckBalance}</span>
            <span className="text-[13px] text-[#6B6358]">Luck in your account</span>
          </div>
        </div>

        {/* What Luck buys — neutral list of per-feature costs */}
        <div className="pt-8 border-t border-[#2A2722] mb-10">
          <div className="text-[12px] text-[#6B6358] font-medium mb-4">{t("luck_what_buys")}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-3">
            {FEATURE_COSTS.map(({ feature, cost, icon: Icon }) => (
              <div key={feature} className="flex items-baseline justify-between py-2 border-b border-[#1A1714]">
                <div className="flex items-center gap-2.5">
                  <Icon className="w-3.5 h-3.5 text-[#6B6358]" />
                  <span className="text-[13px] text-[#9C9489]">{feature}</span>
                </div>
                <span className="serif-display text-[1rem] text-[#E8E2D5] tabular-nums">{cost}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Ways to earn */}
        <div className="pt-8 border-t border-[#2A2722] mb-10">
          <div className="text-[12px] text-[#6B6358] font-medium mb-5">{t("luck_ways_to_earn")}</div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-px bg-[#2A2722] border border-[#2A2722]">
            <EarnMethod
              icon={Gift}
              title="Daily reward"
              body="Claim 1–5 Luck each day. Streaks grow the reward."
              cta="Claim in sidebar"
            />
            <EarnMethod
              icon={Sparkles}
              title="Referrals"
              body="Earn 10 Luck for each friend who signs up with your code."
              cta={user.referralCode}
            />
            <EarnMethod
              icon={Wallet}
              title="Top up"
              body="Purchase a Luck pack below. Bonus Luck on larger packs."
              cta="See tiers below"
            />
          </div>
        </div>

        {/* Referral share */}
        <div className="mb-10 p-5 border border-[#2A2722] flex items-center gap-4">
          <Gift className="w-5 h-5 text-[#C5A572] shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-[13px] text-[#E8E2D5]">Share your referral code</div>
            <div className="text-[11px] text-[#6B6358] mt-0.5">10 Luck for each friend who joins</div>
          </div>
          <div className="serif-display text-[1rem] text-[#C5A572] tabular-nums mr-2">{user.referralCode}</div>
          <button
            onClick={() => {
              navigator.clipboard.writeText(`${window.location.origin}/?ref=${user.referralCode}`);
              toast.success("Link copied");
            }}
            className="text-[12px] text-[#9C9489] hover:text-[#E8E2D5] transition focus-ring rounded-sm px-3 py-2 border border-[#2A2722]"
          >
            Copy link
          </button>
        </div>

        {/* Tiers */}
        <div className="pt-8 border-t border-[#2A2722] mb-10">
          <div className="text-[12px] text-[#6B6358] font-medium mb-5">{t("luck_packs")}</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-px bg-[#2A2722] border border-[#2A2722]">
            {tiers.regular.map((tier) => (
              <TierCard key={tier.id} tier={tier} selected={selected === tier.id} onSelect={() => setSelected(selected === tier.id ? null : tier.id)} />
            ))}
          </div>
        </div>

        {/* Reseller tiers */}
        {tiers.reseller && tiers.reseller.length > 0 && (
          <div className="mb-10">
            <div className="text-[12px] text-[#6B6358] font-medium mb-4">Reseller packs (whitelisted)</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-px bg-[#2A2722] border border-[#2A2722]">
              {tiers.reseller.map((tier) => (
                <TierCard key={tier.id} tier={tier} selected={selected === tier.id} onSelect={() => setSelected(selected === tier.id ? null : tier.id)} reseller />
              ))}
            </div>
          </div>
        )}

        {/* Payment panel */}
        {selectedTier && (
          <div className="p-6 border border-[#2A2722] mb-10">
            <div className="text-[12px] text-[#6B6358] mb-2">Complete your purchase</div>
            <div className="serif-display text-[1.5rem] text-[#E8E2D5] mb-1">{selectedTier.name}</div>
            <div className="flex items-baseline gap-3 mb-5">
              <span className="serif-display text-[1.5rem] text-[#C5A572] tabular-nums">{selectedTier.total}</span>
              <span className="text-[13px] text-[#6B6358]">Luck</span>
              <span className="text-[13px] text-[#6B6358]">·</span>
              <span className="text-[13px] text-[#9C9489] tabular-nums">{selectedTier.mmk.toLocaleString()} MMK</span>
            </div>

            <div className="space-y-4">
              <div>
                <Label className="block text-[12px] text-[#6B6358] font-medium mb-2">Payment method</Label>
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
                <Label className="block text-[12px] text-[#6B6358] font-medium mb-2">Transaction reference</Label>
                <Input
                  value={paymentRef}
                  onChange={(e) => setPaymentRef(e.target.value)}
                  className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
                  placeholder="e.g. TXN123456789"
                />
              </div>
              <div className="text-[12px] text-[#6B6358] leading-relaxed">
                Transfer {selectedTier.mmk.toLocaleString()} MMK to our {PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.name} account, then enter the reference above. Luck is credited to your account.
              </div>
              <button
                onClick={() => buy(selectedTier.id)}
                disabled={buying}
                className="w-full py-3 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring"
              >
                {buying ? "Processing…" : "Confirm purchase"}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function EarnMethod({ icon: Icon, title, body, cta }: { icon: any; title: string; body: string; cta: string }) {
  return (
    <div className="p-5 bg-[#0A0908]">
      <Icon className="w-4 h-4 text-[#C5A572] mb-3" />
      <div className="text-[14px] text-[#E8E2D5] font-medium mb-1.5">{title}</div>
      <div className="text-[12px] text-[#9C9489] leading-[1.6] mb-2">{body}</div>
      <div className="text-[11px] text-[#C5A572] serif-italic">{cta}</div>
    </div>
  );
}

function TierCard({ tier, selected, onSelect, reseller }: { tier: any; selected: boolean; onSelect: () => void; reseller?: boolean }) {
  return (
    <button
      onClick={onSelect}
      className={cn(
        "relative text-left p-5 transition-colors border-0 bg-[#0A0908]",
        selected ? "bg-[#1A1714]" : "hover:bg-[#0F0D0B]"
      )}
    >
      {tier.popular && (
        <div className="absolute top-3 right-3 text-[10px] text-[#C5A572] serif-italic">popular</div>
      )}
      {reseller && (
        <div className="absolute top-3 right-3 text-[10px] text-[#6B6358] serif-italic">wholesale</div>
      )}
      <div className="text-[14px] text-[#E8E2D5] font-medium mb-3">{tier.name}</div>
      <div className="flex items-baseline gap-1.5 mb-1">
        <span className="serif-display text-[2rem] text-[#C5A572] tabular-nums leading-none">{tier.total}</span>
        <span className="text-[12px] text-[#6B6358]">Luck</span>
      </div>
      {tier.bonus > 0 && (
        <div className="text-[11px] text-[#9C9489] mb-2 serif-italic">+{tier.bonusPct}% bonus</div>
      )}
      <div className="text-[13px] text-[#9C9489] tabular-nums mb-1">{tier.mmk.toLocaleString()} MMK</div>
      <div className="text-[11px] text-[#6B6358] leading-[1.5] mt-2">{tier.tagline}</div>
      {selected && (
        <div className="absolute bottom-3 right-3 w-5 h-5 rounded-full bg-[#C5A572] flex items-center justify-center">
          <Check className="w-3 h-3 text-[#0A0908]" />
        </div>
      )}
    </button>
  );
}
