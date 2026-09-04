"use client";

import * as React from "react";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { Shield, Users, Wallet, TrendingUp, Store, Gift } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";

export function AdminView() {
  const { data } = useMe();
  const user = data?.user;
  const [stats, setStats] = React.useState<any>(null);
  const [users, setUsers] = React.useState<any[]>([]);
  const [grantEmail, setGrantEmail] = React.useState("");
  const [grantAmount, setGrantAmount] = React.useState("");
  const [whitelistEmail, setWhitelistEmail] = React.useState("");
  const [whitelistTier, setWhitelistTier] = React.useState("bronze");

  async function load() {
    try {
      const [s, u] = await Promise.all([
        api<{ stats: any }>("/api/admin/stats"),
        api<{ users: any[] }>("/api/admin/users"),
      ]);
      setStats(s.stats); setUsers(u.users);
    } catch {}
  }
  React.useEffect(() => { if (user?.role === "admin") load(); }, [user]);

  if (!user) return <Gate title="Sign in" />;
  if (user.role !== "admin") return <Gate title="Admin access required" desc="This area is restricted to administrators." />;

  async function grant() {
    try {
      await api("/api/admin/grant", { method: "POST", json: { userEmail: grantEmail, amount: parseInt(grantAmount) } });
      toast.success(`Granted ${grantAmount} Luck to ${grantEmail}`);
      setGrantEmail(""); setGrantAmount("");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  async function whitelist() {
    try {
      await api("/api/admin/whitelist", { method: "POST", json: { userEmail: whitelistEmail, tier: whitelistTier } });
      toast.success(`${whitelistEmail} is now a reseller (${whitelistTier})`);
      setWhitelistEmail("");
      load();
    } catch (e: any) { toast.error(e.message); }
  }

  return (
    <div className="h-full overflow-y-auto lumina-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        <div className="flex items-center gap-2 mb-1">
          <Shield className="w-5 h-5 text-[#C5A572]" />
          <Pill variant="gold">Admin</Pill>
        </div>
        <SectionTitle eyebrow="Internal" title="Admin Panel" subtitle="Manage users, Luck grants, and reseller whitelisting." className="mb-6" />

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
          <StatCard icon={Users} label="Total users" value={String(stats?.totalUsers ?? 0)} sub="registered" />
          <StatCard icon={Store} label="Resellers" value={String(stats?.resellers ?? 0)} sub="whitelisted" />
          <StatCard icon={Wallet} label="Revenue" value={`${(stats?.totalMmk ?? 0).toLocaleString()}`} sub="MMK total" />
          <StatCard icon={TrendingUp} label="Luck sold" value={String(stats?.totalLuckSold ?? 0)} sub="credits" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Grant Luck */}
          <GlassCard className="p-5">
            <div className="text-[13px] text-[#E8E2D5] mb-3 flex items-center gap-2"><Gift className="w-4 h-4 text-[#C5A572]" /> Grant Luck</div>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">User email</Label>
                <Input value={grantEmail} onChange={(e) => setGrantEmail(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="user@example.com" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Luck amount</Label>
                <Input type="number" value={grantAmount} onChange={(e) => setGrantAmount(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="100" />
              </div>
              <GoldButton onClick={grant} disabled={!grantEmail || !grantAmount} className="w-full">Grant Luck</GoldButton>
            </div>
          </GlassCard>

          {/* Whitelist reseller */}
          <GlassCard className="p-5">
            <div className="text-[13px] text-[#E8E2D5] mb-3 flex items-center gap-2"><Store className="w-4 h-4 text-[#7A8B6F]" /> Whitelist reseller</div>
            <div className="space-y-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">User email</Label>
                <Input value={whitelistEmail} onChange={(e) => setWhitelistEmail(e.target.value)} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5" placeholder="reseller@example.com" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Tier</Label>
                <Select value={whitelistTier} onValueChange={setWhitelistTier}>
                  <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="bronze">Bronze</SelectItem>
                    <SelectItem value="silver">Silver</SelectItem>
                    <SelectItem value="gold">Gold</SelectItem>
                    <SelectItem value="platinum">Platinum</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <GradientButton onClick={whitelist} disabled={!whitelistEmail} className="w-full">Whitelist as reseller</GradientButton>
            </div>
          </GlassCard>
        </div>

        {/* Users table */}
        <GlassCard className="p-5">
          <div className="text-[13px] text-[#E8E2D5] mb-3 flex items-center gap-2"><Users className="w-4 h-4 text-[#C5A572]" /> Users ({users.length})</div>
          <div className="max-h-96 overflow-y-auto lumina-scroll">
            <table className="w-full text-[12px]">
              <thead className="text-[10px] text-[#9C9489] uppercase tracking-wide sticky top-0 bg-[#121815]">
                <tr>
                  <th className="text-left py-2 px-1">Email</th>
                  <th className="text-right py-2 px-1">Luck</th>
                  <th className="text-center py-2 px-1">Role</th>
                  <th className="text-center py-2 px-1">Streak</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-t border-[#2A2722]">
                    <td className="py-2 px-1 text-[#E8E2D5]">{u.email}</td>
                    <td className="py-2 px-1 text-right text-[#C5A572]">{u.luckBalance}</td>
                    <td className="py-2 px-1 text-center">
                      <Pill variant={u.role === "admin" ? "gold" : u.role === "reseller" ? "leaf" : "default"} className="text-[9px]">{u.role}</Pill>
                    </td>
                    <td className="py-2 px-1 text-center text-[#9C9489]">{u.streak}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </GlassCard>
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
