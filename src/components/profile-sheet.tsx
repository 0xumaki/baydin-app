"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GhostButton, Pill, SectionTitle } from "@/components/lumina/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { X, Copy, LogOut, Globe, Heart, MapPin } from "lucide-react";
import { toast } from "sonner";
import { useMe } from "@/lib/api-client";

const LANGUAGES = [
  { code: "my", name: "Myanmar (မြန်မာ)" },
  { code: "en", name: "English" },
  { code: "th", name: "Thai (ไทย)" },
  { code: "kh", name: "Khmer (ខ្មែរ)" },
  { code: "lo", name: "Lao (ລາວ)" },
];

export function ProfileSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const { data } = useMe();
  const user = data?.user;
  const qc = useQueryClient();
  const [birthData, setBirthData] = React.useState<any>(null);
  const [language, setLanguage] = React.useState("my");

  React.useEffect(() => {
    if (user) {
      setBirthData(user.birthData || { dob: "", tob: "12:00", latitude: 16.84, longitude: 96.17, timezone: "Asia/Yangon", gender: null, place: "Yangon" });
      setLanguage(user.language || "my");
    }
  }, [user]);

  if (!open || !user) return null;

  async function saveBirthData() {
    if (birthData && !birthData.dob) {
      toast.error("Birth date is required for astrology readings");
      return;
    }
    const res = await fetch("/api/me", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify({ birthData, language }),
    });
    if (res.ok) {
      toast.success("Birth details saved");
      qc.invalidateQueries({ queryKey: ["me"] });
    } else toast.error("Could not save");
  }

  async function logout() {
    await fetch("/api/auth/logout", { method: "POST" });
    qc.invalidateQueries({ queryKey: ["me"] });
    qc.invalidateQueries({ queryKey: ["conversations"] });
    onOpenChange(false);
    toast.success("Signed out");
  }

  async function copyReferral() {
    await navigator.clipboard.writeText(user.referralCode);
    const link = `${window.location.origin}/?ref=${user.referralCode}`;
    await navigator.clipboard.writeText(link);
    toast.success("Referral link copied — share & earn 10 Luck per signup");
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-black/70 backdrop-blur-md">
      <GlassCard float className="w-full max-w-lg max-h-[92dvh] overflow-y-auto lumina-scroll p-6 rounded-t-3xl sm:rounded-2xl lum-anim-float-up">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-[18px] font-light text-ink">Profile & Birth Details</h2>
          <button onClick={() => onOpenChange(false)} aria-label="Close profile sheet" className="text-ink-muted hover:text-ink transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Referral */}
        <div className="mb-5 p-3 rounded-xl border border-gold/15 bg-gold/[0.05]">
          <div className="flex items-center justify-between mb-1.5">
            <span className="text-[12px] text-gold font-medium">Your referral code</span>
            <button onClick={copyReferral} className="text-[11px] text-leaf flex items-center gap-1 hover:underline">
              <Copy className="w-3 h-3" /> Copy link
            </button>
          </div>
          <div className="text-[15px] text-ink font-mono tracking-wide">{user.referralCode}</div>
          <div className="text-[11px] text-ink-muted mt-1">Earn 10 Luck for every friend who signs up with your link.</div>
        </div>

        <SectionTitle eyebrow="Astrology" title="Birth details" subtitle="Needed for natal charts, astrologer chat & personalized horoscopes." className="mb-3" />

        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted">Birth date</Label>
            <Input type="date" value={birthData.dob} onChange={(e) => setBirthData({ ...birthData, dob: e.target.value })} className="bg-white/[0.03] border-white/10 text-ink" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted">Birth time</Label>
            <Input type="time" value={birthData.tob} onChange={(e) => setBirthData({ ...birthData, tob: e.target.value })} className="bg-white/[0.03] border-white/10 text-ink" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted flex items-center gap-1"><MapPin className="w-3 h-3" /> Birth place</Label>
            <Input value={birthData.place || ""} onChange={(e) => setBirthData({ ...birthData, place: e.target.value })} className="bg-white/[0.03] border-white/10 text-ink" placeholder="Yangon" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted">Gender</Label>
            <Select value={birthData.gender || ""} onValueChange={(v) => setBirthData({ ...birthData, gender: v || null })}>
              <SelectTrigger className="bg-white/[0.03] border-white/10 text-ink"><SelectValue placeholder="Prefer not to say" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Male</SelectItem>
                <SelectItem value="female">Female</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted">Latitude</Label>
            <Input type="number" step="0.0001" value={birthData.latitude} onChange={(e) => setBirthData({ ...birthData, latitude: parseFloat(e.target.value) || 0 })} className="bg-white/[0.03] border-white/10 text-ink" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted">Longitude</Label>
            <Input type="number" step="0.0001" value={birthData.longitude} onChange={(e) => setBirthData({ ...birthData, longitude: parseFloat(e.target.value) || 0 })} className="bg-white/[0.03] border-white/10 text-ink" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted flex items-center gap-1"><Globe className="w-3 h-3" /> Timezone</Label>
            <Input value={birthData.timezone || ""} onChange={(e) => setBirthData({ ...birthData, timezone: e.target.value })} className="bg-white/[0.03] border-white/10 text-ink" placeholder="Asia/Yangon" />
          </div>
          <div className="space-y-1.5">
            <Label className="text-[12px] text-ink-muted">Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-white/[0.03] border-white/10 text-ink"><SelectValue /></SelectTrigger>
              <SelectContent>
                {LANGUAGES.map((l) => <SelectItem key={l.code} value={l.code}>{l.name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <GoldButton onClick={saveBirthData} className="flex-1">Save details</GoldButton>
          <GhostButton onClick={logout} className="px-4">
            <LogOut className="w-4 h-4" />
          </GhostButton>
        </div>

        <div className="mt-4 flex items-center justify-between text-[11px] text-ink-muted">
          <span>{user.email}</span>
          <span className="flex items-center gap-1.5"><Heart className="w-3 h-3 text-gold" /> {user.luckBalance} Luck · streak {user.streak}</span>
        </div>
      </GlassCard>
    </div>
  );
}
