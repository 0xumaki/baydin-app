"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, Pill, SectionTitle, GradientButton } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { useStore } from "@/lib/store";
import { Store, Wallet, Send, TrendingUp, Package } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

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

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-2 mb-1">
          <Store className="w-5 h-5 text-[#7A8B6F]" />
          <Pill variant="leaf">Reseller Portal</Pill>
          {user.resellerTier && <Pill variant="gold" className="capitalize">{user.resellerTier}</Pill>}
        </div>
        <SectionTitle eyebrow="Wholesale" title="Reseller Dashboard" subtitle="Buy Luck at wholesale rates and resell to your clients at your own price." className="mb-6" />

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
          <GlassCard className="p-5">
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
      </div>
    </div>
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
