"use client";

import * as React from "react";
import { GlassCard, GoldButton, Pill, SectionTitle } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { Moon, Star, Sun, Sparkles, Wallet } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { ZODIAC_SYMBOLS } from "@/lib/astrology";

const SIGNS = ["aries","taurus","gemini","cancer","leo","virgo","libra","scorpio","sagittarius","capricorn","aquarius","pisces"];

export function HoroscopeView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [sign, setSign] = React.useState("aries");
  const [type, setType] = React.useState<"daily" | "weekly" | "monthly">("daily");
  const [horoscope, setHoroscope] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  async function fetchH(s?: string, t?: typeof type) {
    if (!user) { onAuth(); return; }
    setLoading(true);
    try {
      const res = await api<{ horoscope: any }>(`/api/horoscope?sign=${s || sign}&type=${t || type}`);
      setHoroscope(res.horoscope);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Daily guidance" title="Horoscope" subtitle="Written by Gemini from live transit data." className="mb-6" />

        <div className="flex items-center gap-2 mb-4">
          {(["daily", "weekly", "monthly"] as const).map((t) => (
            <button key={t} onClick={() => { setType(t); fetchH(undefined, t); }} className={`px-3 py-1.5 rounded-full text-[12px] border transition ${type === t ? "bg-[#C5A572]/15 text-[#C5A572] border-[#C5A572]/30" : "border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5]"}`}>
              {t[0].toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-6 sm:grid-cols-12 gap-1.5 mb-5">
          {SIGNS.map((s, i) => (
            <button key={s} onClick={() => { setSign(s); fetchH(s); }} className={`aspect-square rounded-lg flex items-center justify-center text-lg transition ${sign === s ? "bg-[#C5A572]/15 text-[#C5A572] border border-[#C5A572]/30" : "bg-white/[0.02] text-[#9C9489] hover:text-[#E8E2D5] hover:bg-white/[0.04]"}`} title={s}>
              {ZODIAC_SYMBOLS[i]}
            </button>
          ))}
        </div>

        <GoldButton onClick={() => fetchH()} disabled={loading} className="w-full mb-5">
          {loading ? "Reading the stars…" : <><Moon className="w-4 h-4" /> {user?.birthData ? "Personalized · 2 Luck" : "Read horoscope"}</>}
        </GoldButton>

        {loading && (
          <GlassCard className="p-5">
            <div className="animate-pulse space-y-3">
              <div className="h-4 w-3/4 bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-5/6 bg-white/5 rounded" />
              <div className="h-3 w-full bg-white/5 rounded" />
              <div className="h-3 w-2/3 bg-white/5 rounded" />
            </div>
          </GlassCard>
        )}

        {horoscope && !loading && (
          <GlassCard className="p-5">
            {horoscope.personalized && <Pill variant="gold" className="mb-3">Personalized for your chart</Pill>}
            <div className="serif prose-editorial text-[14px] text-[#E8E2D5]/90">
              <ReactMarkdown>{horoscope.content}</ReactMarkdown>
            </div>
            {horoscope.guidance && (
              <div className="mt-4 pt-4 border-t border-[#2A2722] grid grid-cols-2 sm:grid-cols-3 gap-3">
                {horoscope.guidance.lucky_color && <Stat label="Lucky color" value={horoscope.guidance.lucky_color} />}
                {horoscope.guidance.lucky_number !== undefined && <Stat label="Lucky number" value={String(horoscope.guidance.lucky_number)} />}
                {horoscope.guidance.lucky_time && <Stat label="Lucky time" value={horoscope.guidance.lucky_time} />}
              </div>
            )}
            {horoscope.highlights?.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {horoscope.highlights.map((h: string, i: number) => <Pill key={i} variant="gold" className="text-[10px]">{h}</Pill>)}
              </div>
            )}
          </GlassCard>
        )}

        {!horoscope && !loading && (
          <div className="text-center py-12 text-[#9C9489] text-[13px]">Select your sign and read your stars.</div>
        )}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <div className="text-[10px] text-[#9C9489] uppercase tracking-wide mb-0.5">{label}</div>
      <div className="text-[13px] text-[#C5A572]">{value}</div>
    </div>
  );
}
