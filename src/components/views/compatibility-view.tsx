"use client";

import * as React from "react";
import { StarField } from "@/components/lumina/primitives";
import {
  AuroraGlowCard,
  GlowPill,
  LiquidMetalText,
  NumberTicker,
  ShimmerButton,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, BaydinUsers, BaydinStar, BaydinMoon, BaydinHeart, BaydinLoader, BaydinChevronRight, BaydinArrowLeft } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const COMPAT_COST = 5;

export function CompatibilityView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [partner, setPartner] = React.useState({ dob: "", tob: "12:00", latitude: 16.84, longitude: 96.17, timezone: "Asia/Yangon", gender: "female" as "male" | "female" | null, place: "Yangon" });
  const [relationshipType, setRelationshipType] = React.useState("MARRIAGE");
  const [loading, setLoading] = React.useState(false);
  const [result, setResult] = React.useState<any>(null);

  async function run() {
    if (!user) { onAuth(); return; }
    if (!user.birthData) { toast.error("Add your birth details in your profile first"); return; }
    if (!partner.dob) { toast.error("Partner's birth date is required"); return; }
    setLoading(true);
    setResult(null);
    try {
      const res = await api<{ compatibility: any; error?: string; balance?: number }>("/api/compatibility", {
        method: "POST", json: { partner, relationshipType },
      });
      if (res.error) { toast.error(res.error); return; }
      setResult(res.compatibility);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  if (!user) {
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <AuroraGlowCard glowColor="#D876A0" glowIntensity={0.18} className="p-8 text-center">
            <div className="w-14 h-14 mx-auto mb-3 rounded-full bg-[#D876A0]/15 border border-[#D876A0]/30 flex items-center justify-center">
              <BaydinUsers className="w-6 h-6 text-[#D876A0]" />
            </div>
            <LiquidMetalText as="h1" className="text-[20px] mb-1">Sign in to check compatibility</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489] mb-4 max-w-sm mx-auto">
              Vedic Ashtakoota (8-fold /36) + Venus synastry + Mahabote weekday.
            </p>
            <ShimmerButton onClick={onAuth}>Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Result view
  if (result) {
    const score = result.overall_score;
    const max = 36;
    const pct = (score / max) * 100;
    const verdict = pct >= 75 ? { label: "Excellent Match", color: "#B5CD7E" } : pct >= 50 ? { label: "Good Match", color: "#C5A87C" } : pct >= 30 ? { label: "Average Match", color: "#F09A3D" } : { label: "Challenging Match", color: "#b5463a" };
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
          <button onClick={() => setResult(null)} className="flex items-center gap-1.5 text-[12px] text-[#9C9489] hover:text-[#C5A572] mb-4 transition">
            <BaydinArrowLeft className="w-3.5 h-3.5" /> New reading
          </button>

          {/* Score card */}
          <AuroraGlowCard glowColor={verdict.color} glowIntensity={0.22} className="p-6 mb-4 relative overflow-hidden">
            <div className="absolute inset-0 opacity-20 pointer-events-none" style={{ background: `radial-gradient(80% 60% at 50% 0%, ${verdict.color}40 0%, transparent 70%)` }} />
            <div className="relative flex items-center gap-6">
              {/* Score ring */}
              <div className="relative w-24 h-24 shrink-0">
                <svg className="w-24 h-24 -rotate-90" viewBox="0 0 100 100">
                  <circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="5" />
                  <circle cx="50" cy="50" r="42" fill="none" stroke={verdict.color} strokeWidth="5" strokeLinecap="round"
                    strokeDasharray={`${(pct / 100) * 264} 264`} style={{ transition: "stroke-dasharray 1s ease" }} />
                </svg>
                <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <div className="text-[24px] font-light tabular-nums" style={{ color: verdict.color }}>
                    <NumberTicker value={score} />
                    <span className="text-[12px] text-[#9C9489]">/{max}</span>
                  </div>
                </div>
              </div>
              <div className="flex-1 min-w-0">
                <GlowPill color={verdict.color} className="text-[10px] mb-2">Ashtakoota Score</GlowPill>
                <div className="text-[20px] font-light mb-1" style={{ color: verdict.color }}>{verdict.label}</div>
                <div className="text-[12px] text-[#9C9489]">{result.person_a.moon_sign} ♡ {result.person_b.moon_sign}</div>
              </div>
            </div>
          </AuroraGlowCard>

          {/* Breakdown */}
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} className="p-5 mb-4">
            <div className="text-[12px] text-[#9C9489] mb-3 flex items-center gap-2"><BaydinStar className="w-3.5 h-3.5 text-[#C5A572]" /> 8-Fold Compatibility Breakdown</div>
            <div className="space-y-2">
              {result.ashtakoota.breakdown.map((b: any, i: number) => {
                const ratio = b.score / b.max;
                const barColor = ratio >= 0.7 ? "#B5CD7E" : ratio >= 0.4 ? "#C5A87C" : "#b5463a";
                return (
                  <div key={i} className="flex items-center gap-3">
                    <span className="w-24 text-[12px] text-[#9C9489] shrink-0 truncate" title={b.name}>{b.name}</span>
                    <div className="flex-1 h-1.5 rounded-full bg-white/5 overflow-hidden">
                      <div className="h-full rounded-full transition-all duration-700" style={{ width: `${ratio * 100}%`, background: barColor }} />
                    </div>
                    <span className="w-12 text-[11px] text-[#E8E2D5] text-right shrink-0 tabular-nums">
                      <NumberTicker value={b.score} />/{b.max}
                    </span>
                  </div>
                );
              })}
            </div>
          </AuroraGlowCard>

          {/* Synastry + Mahabote */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            <AuroraGlowCard glowColor="#D876A0" glowIntensity={0.12} className="p-4">
              <div className="text-[10px] uppercase tracking-wide text-[#9C9489] mb-1">Venus Synastry</div>
              <div className="text-[14px] text-[#C5A572] capitalize">{result.synastry.venus_aspect}</div>
              <div className="text-[11px] text-[#9C9489] tabular-nums">orb {result.synastry.venus_orb}°</div>
            </AuroraGlowCard>
            <AuroraGlowCard glowColor="#9E8AC9" glowIntensity={0.12} className="p-4">
              <div className="text-[10px] uppercase tracking-wide text-[#9C9489] mb-1">Mahabote Weekday</div>
              <div className="text-[14px] text-[#C5A572] capitalize">{result.mahabote.replace("-", " ")}</div>
            </AuroraGlowCard>
          </div>

          {/* Interpretation */}
          <AuroraGlowCard glowColor={verdict.color} glowIntensity={0.18} className="p-6">
            <GlowPill color={verdict.color} className="text-[10px] mb-3"><BaydinHeart className="w-2.5 h-2.5" /> Interpretation</GlowPill>
            <div className="serif prose-editorial text-[14px] text-[#E8E2D5]/90 leading-relaxed">
              <ReactMarkdown>{result.interpretation}</ReactMarkdown>
            </div>
            {result.highlights?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2A2722] flex flex-wrap gap-1.5">
                {result.highlights.map((h: string, i: number) => (
                  <GlowPill key={i} color="#C5A572" className="text-[10px]">{h}</GlowPill>
                ))}
              </div>
            )}
            {result.guidance?.recommendations?.length > 0 && (
              <div className="mt-4 pt-4 border-t border-[#2A2722]">
                <div className="text-[11px] uppercase tracking-wide text-[#9C9489] mb-2">Recommendations</div>
                <ul className="space-y-1 text-[12px] text-[#E8E2D5]/90">
                  {result.guidance.recommendations.map((r: string, i: number) => <li key={i} className="flex gap-1.5"><span className="text-[#C5A572]">•</span> {r}</li>)}
                </ul>
              </div>
            )}
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Loading state
  if (loading) {
    return (
      <div className="h-full overflow-y-auto lumina-scroll relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="cosmic" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden flex items-center justify-center">
          <AuroraGlowCard glowColor="#D876A0" glowIntensity={0.2} className="p-8 text-center">
            <div className="relative w-20 h-20 mx-auto mb-4">
              <BaydinHeart className="w-20 h-20 text-[#D876A0]/20 absolute" />
              <BaydinHeart className="w-20 h-20 text-[#D876A0] absolute animate-pulse" style={{ clipPath: "polygon(0 0, 50% 0, 50% 100%, 0 100%)" }} />
            </div>
            <LiquidMetalText as="div" className="text-[16px] mb-1">Reading your compatibility…</LiquidMetalText>
            <div className="text-[11px] text-[#9C9489] mt-1">Computing Ashtakoota + Venus synastry</div>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  // Form view
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="cosmic" />
        <StarField count={30} />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        {/* Hero */}
        <div className="mb-6">
          <GlowPill color="#D876A0" className="text-[10px] mb-3">
            <BaydinUsers className="w-2.5 h-2.5" /> Partner matching · {COMPAT_COST} Luck
          </GlowPill>
          <LiquidMetalText as="h1" className="text-[28px] lg:text-[32px] mb-2">Compatibility</LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Vedic Ashtakoota (8-fold /36) + Venus synastry + Mahabote weekday.
          </p>
        </div>

        {!user.birthData ? (
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} className="p-6 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-[#C5A572]/10 border border-[#C5A572]/30 flex items-center justify-center">
              <BaydinStar className="w-6 h-6 text-[#C5A572]" />
            </div>
            <LiquidMetalText as="h2" className="text-[16px] mb-2">Your birth details needed</LiquidMetalText>
            <p className="text-[12px] text-[#9C9489]">
              Open your profile (top-right settings icon) and add your birth date, time, and place first.
            </p>
          </AuroraGlowCard>
        ) : (
          <AuroraGlowCard glowColor="#D876A0" glowIntensity={0.15} className="p-5">
            <div className="text-[13px] text-[#E8E2D5] mb-4 flex items-center gap-2">
              <BaydinHeart className="w-4 h-4 text-[#D876A0]" /> Partner's birth details
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">Birth date</Label>
                <Input type="date" value={partner.dob} onChange={(e) => setPartner({ ...partner, dob: e.target.value })} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Birth time</Label>
                <Input type="time" value={partner.tob} onChange={(e) => setPartner({ ...partner, tob: e.target.value })} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">Birth place</Label>
                <Input value={partner.place} onChange={(e) => setPartner({ ...partner, place: e.target.value })} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]" placeholder="Yangon" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Gender</Label>
                <Select value={partner.gender || ""} onValueChange={(v) => setPartner({ ...partner, gender: v as any })}>
                  <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5"><SelectValue placeholder="—" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="male">Male</SelectItem>
                    <SelectItem value="female">Female</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <Label className="text-[12px] text-[#9C9489]">Latitude</Label>
                <Input type="number" step="0.0001" value={partner.latitude} onChange={(e) => setPartner({ ...partner, latitude: parseFloat(e.target.value) || 0 })} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]" />
              </div>
              <div>
                <Label className="text-[12px] text-[#9C9489]">Longitude</Label>
                <Input type="number" step="0.0001" value={partner.longitude} onChange={(e) => setPartner({ ...partner, longitude: parseFloat(e.target.value) || 0 })} className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5 focus-visible:border-[#C5A572]" />
              </div>
            </div>
            <div className="mb-4">
              <Label className="text-[12px] text-[#9C9489]">Relationship type</Label>
              <Select value={relationshipType} onValueChange={setRelationshipType}>
                <SelectTrigger className="bg-white/[0.03] border-[#2A2722] text-[#E8E2D5] mt-1.5"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="MARRIAGE">Marriage</SelectItem>
                  <SelectItem value="PARTNERSHIP">Partnership</SelectItem>
                  <SelectItem value="FRIENDSHIP">Friendship</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
              <GlowPill color="#C5A572" className="text-[11px]">
                <CloverIcon className="w-3 h-3" /> <NumberTicker value={COMPAT_COST} /> Luck
              </GlowPill>
              <span className="text-[11px] text-[#9C9489]">Ashtakoota + Mahendra + Vedha + Rajju + Stree-Deergha + Nadi</span>
            </div>
            <ShimmerButton onClick={run} disabled={!partner.dob} className="w-full">
              <BaydinUsers className="w-4 h-4" /> Analyze compatibility
            </ShimmerButton>
          </AuroraGlowCard>
        )}
      </div>
    </div>
  );
}
