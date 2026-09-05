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
import { CloverIcon } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { FREQUENCIES } from "@/lib/frequencies";
import {
  Waves, Play, Pause, Volume2, VolumeX, Wind, Loader2,
  Headphones, Timer,
} from "lucide-react";
import { toast } from "sonner";

export function FrequencyView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const [selected, setSelected] = React.useState(FREQUENCIES[0]);
  const [playing, setPlaying] = React.useState(false);
  const [mode, setMode] = React.useState<"pure" | "binaural" | "pad">("pure");
  const [muted, setMuted] = React.useState(false);
  const [duration, setDuration] = React.useState(300); // 5 min default
  const [elapsed, setElapsed] = React.useState(0);
  const [session, setSession] = React.useState<any>(null);
  const [ambient, setAmbient] = React.useState<"none" | "rain" | "ocean" | "wind" | "stream" | "river">("none");
  const synthRef = React.useRef<any>(null);
  const intervalRef = React.useRef<any>(null);
  const ambientAudioRef = React.useRef<HTMLAudioElement | null>(null);

  async function startTone() {
    if (!user) { onAuth(); return; }
    if (playing) return;
    try {
      const Tone = await import("tone");
      await Tone.start();
      if (synthRef.current) { synthRef.current.dispose(); synthRef.current = null; }
      if (mode === "pure") {
        synthRef.current = new Tone.Oscillator(selected.hz, "sine").toDestination();
        synthRef.current.volume.value = muted ? -Infinity : -12;
        synthRef.current.start();
      } else if (mode === "binaural") {
        const left = new Tone.Oscillator(selected.hz, "sine");
        const right = new Tone.Oscillator(selected.hz + 4, "sine");
        const merger = new Tone.Merge().toDestination();
        left.connect(merger, 0, 0);
        right.connect(merger, 0, 1);
        left.volume.value = muted ? -Infinity : -14;
        right.volume.value = muted ? -Infinity : -14;
        synthRef.current = {
          dispose: () => { left.dispose(); right.dispose(); merger.dispose(); },
          setVolume: (v: number) => { left.volume.value = v; right.volume.value = v; },
        };
        left.start(); right.start();
      } else {
        synthRef.current = new Tone.PolySynth(Tone.Synth, {
          oscillator: { type: "sine" },
          envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 },
        }).toDestination();
        synthRef.current.volume.value = muted ? -Infinity : -16;
        const notes = [`${selected.hz}`, `${selected.hz * 1.5}`, `${selected.hz * 2}`].map((f) => Tone.Frequency(f).toNote());
        synthRef.current.triggerAttack(notes);
        synthRef.current._notes = notes;
      }
      setPlaying(true);
      toast.success(`Playing ${selected.hz}Hz · ${mode}`);
      if (ambient !== "none") {
        ambientAudioRef.current = new Audio(`/audio/${ambient}.wav`);
        ambientAudioRef.current.loop = true;
        ambientAudioRef.current.volume = 0.3;
        ambientAudioRef.current.play().catch(() => {});
      }
      const start = Date.now();
      intervalRef.current = setInterval(() => {
        const e = Math.floor((Date.now() - start) / 1000);
        setElapsed(e);
        if (e >= duration) {
          stopTone(true);
        }
      }, 1000);
    } catch (err: any) {
      console.error("Tone.js failed:", err);
      toast.error("Audio couldn't start. Try clicking play again, or use a different browser.");
      setPlaying(false);
    }
  }

  async function stopTone(completed = false) {
    if (ambientAudioRef.current) {
      ambientAudioRef.current.pause();
      ambientAudioRef.current = null;
    }
    if (synthRef.current) {
      if (mode === "pad" && synthRef.current.triggerRelease) {
        synthRef.current.triggerRelease(synthRef.current._notes);
        setTimeout(() => synthRef.current?.dispose(), 2000);
      } else {
        synthRef.current.dispose();
      }
      synthRef.current = null;
    }
    if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
    setPlaying(false);
    if (completed && user) {
      try {
        await api("/api/frequency/session", {
          method: "POST",
          json: { intention: selected.intention, frequencyHz: selected.hz, mode, durationSec: duration },
        });
        toast.success(`Session complete — ${duration}s of ${selected.hz}Hz ✦`);
      } catch {}
    }
  }

  function toggleMute() {
    const newMuted = !muted;
    setMuted(newMuted);
    if (synthRef.current?.setVolume) {
      synthRef.current.setVolume(newMuted ? -Infinity : (mode === "pure" ? -12 : mode === "binaural" ? -14 : -16));
    } else if (synthRef.current?.volume) {
      synthRef.current.volume.value = newMuted ? -Infinity : -12;
    }
  }

  React.useEffect(() => {
    return () => { if (synthRef.current) synthRef.current.dispose(); if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  if (!user) return <Gate onAuth={onAuth} />;

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const totalMins = Math.floor(duration / 60);
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">

        {/* ===== Hero ===== */}
        <div className="mb-6 lum-reveal">
          <GlowPill className="mb-3" color={selected.color}>
            <Waves className="w-3 h-3" /> Daily practice · Free
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block mb-2">
            Frequencies
          </LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            Solfeggio tones, binaural beats, and ambient pads via Web Audio. Tune your mind.
            Sessions are free and logged to your practice journal.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Player */}
          <div className="space-y-4">
            {/* Now playing card */}
            <AuroraGlowCard glowColor={selected.color} glowIntensity={0.18} className="p-6 relative overflow-hidden">
              {/* Radial glow halo */}
              <div
                className="absolute inset-0 pointer-events-none"
                style={{ background: `radial-gradient(120% 80% at 50% -10%, ${selected.color}28 0%, transparent 60%)` }}
              />
              <div className="relative flex flex-col items-center text-center">
                {/* Frequency dial */}
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle
                      cx="80" cy="80" r="70" fill="none"
                      stroke={selected.color} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(progress / 100) * 440} 440`}
                      style={{ transition: "stroke-dasharray 1s linear" }}
                    />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-[#9C9489]">{selected.name}</div>
                    <div className="text-[32px] font-light leading-none mt-1" style={{ color: selected.color }}>
                      <NumberTicker value={selected.hz} className="tabular-nums" />
                      <span className="text-[14px] text-[#9C9489] ml-0.5">Hz</span>
                    </div>
                    {playing && (
                      <div className="text-[11px] text-[#9C9489] mt-0.5 tabular-nums">
                        {mins}:{secs.toString().padStart(2, "0")} / {totalMins}:00
                      </div>
                    )}
                  </div>
                  {playing && (
                    <div
                      className="absolute inset-0 rounded-full pointer-events-none"
                      style={{
                        boxShadow: `0 0 40px ${selected.color}40`,
                        animation: "lum-pulse-ring 2s ease-out infinite",
                      }}
                    />
                  )}
                </div>

                {/* Waveform viz */}
                <Waveform active={playing} color={selected.color} />

                {/* Controls */}
                <div className="flex items-center gap-3 mb-3">
                  <button
                    onClick={toggleMute}
                    className="w-9 h-9 rounded-full border border-[#2A2722] flex items-center justify-center text-[#9C9489] hover:text-[#E8E2D5] transition focus-ring"
                    aria-label={muted ? "Unmute" : "Mute"}
                  >
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <ShimmerButton
                    onClick={() => playing ? stopTone(false) : startTone()}
                    tone="gold"
                    className="w-14 h-14 rounded-full p-0"
                    aria-label={playing ? "Pause" : "Play"}
                  >
                    {playing ? (
                      <Pause className="w-6 h-6" />
                    ) : (
                      <Play className="w-6 h-6 ml-0.5" />
                    )}
                  </ShimmerButton>
                  <div className="w-9" />
                </div>

                {/* Mode selector */}
                <div className="flex items-center gap-1 flex-wrap justify-center">
                  {(["pure", "binaural", "pad"] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => { if (playing) stopTone(false); setMode(m); }}
                      className={cn(
                        "px-2.5 py-1 rounded-full text-[10px] border transition focus-ring",
                        mode === m
                          ? "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572]"
                          : "border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5]"
                      )}
                    >
                      {m === "pure" ? "Pure Tone" : m === "binaural" ? "Binaural" : "Ambient Pad"}
                    </button>
                  ))}
                </div>

                {mode === "binaural" && (
                  <div className="text-[10px] text-[#9C9489] mt-1.5 flex items-center justify-center gap-1">
                    <Headphones className="w-3 h-3" /> Use headphones for the binaural effect
                  </div>
                )}

                {/* Ambient bed selector */}
                <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
                  <span className="text-[9px] text-[#9C9489] mr-1">Ambient:</span>
                  {(["none", "rain", "ocean", "wind", "stream", "river"] as const).map((a) => (
                    <button
                      key={a}
                      onClick={() => { if (playing) stopTone(false); setAmbient(a); }}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[9px] transition focus-ring",
                        ambient === a ? "text-[#C5A572]" : "text-[#9C9489] hover:text-[#E8E2D5]"
                      )}
                    >
                      {a === "none" ? "Off" : a}
                    </button>
                  ))}
                </div>

                {/* Duration */}
                <div className="flex items-center gap-1 mt-2 flex-wrap justify-center">
                  <Timer className="w-3 h-3 text-[#9C9489] mr-1" />
                  {[120, 300, 600, 900].map((d) => (
                    <button
                      key={d}
                      onClick={() => setDuration(d)}
                      className={cn(
                        "px-2 py-0.5 rounded-full text-[10px] transition focus-ring",
                        duration === d ? "text-[#C5A572]" : "text-[#9C9489] hover:text-[#E8E2D5]"
                      )}
                    >
                      {d < 60 ? `${d}s` : `${d / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            </AuroraGlowCard>

            {/* Breathing pacer */}
            <BreathingPacer active={playing} color={selected.color} />
          </div>

          {/* Frequency grid */}
          <div>
            <div className="flex items-center gap-2 mb-3">
              <Wind className="w-3.5 h-3.5 text-[#C5A572]" />
              <span className="text-[11px] uppercase tracking-[0.2em] text-[#9C9489]">Choose your intention</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5">
              {FREQUENCIES.map((f) => {
                const isSelected = selected.id === f.id;
                return (
                  <AuroraGlowCard
                    key={f.id}
                    glowColor={isSelected ? f.color : "#2A2722"}
                    glowIntensity={isSelected ? 0.18 : 0.05}
                    className="p-3"
                  >
                    <button
                      onClick={() => { if (playing) stopTone(false); setSelected(f); }}
                      className="w-full text-left"
                    >
                      <div className="flex items-center justify-between mb-1.5">
                        <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                        <span className="text-[10px] text-[#9C9489] tabular-nums">
                          <NumberTicker value={f.hz} suffix="Hz" />
                        </span>
                      </div>
                      <div className="text-[12px] text-[#E8E2D5] font-medium leading-tight mb-0.5">{f.name}</div>
                      <div className="text-[10px] text-[#9C9489] leading-tight">{f.description}</div>
                      <div className="mt-2">
                        <GlowPill color={f.color} className="text-[9px]">{f.intention}</GlowPill>
                      </div>
                    </button>
                  </AuroraGlowCard>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Waveform({ active, color }: { active: boolean; color: string }) {
  const [tick, setTick] = React.useState(0);
  React.useEffect(() => {
    if (!active) return;
    const id = setInterval(() => setTick((t) => t + 1), 100);
    return () => clearInterval(id);
  }, [active]);
  const bars = 24;
  return (
    <div className="flex items-end justify-center gap-0.5 h-6 mb-3" aria-hidden>
      {Array.from({ length: bars }).map((_, i) => {
        const heightPct = active
          ? 30 + Math.abs(Math.sin(tick * 0.5 + i * 0.6)) * 70
          : 18 + (i % 3) * 6;
        return (
          <span
            key={i}
            className="w-0.5 rounded-full transition-all duration-150"
            style={{
              height: `${heightPct}%`,
              background: active ? color : "#2A2722",
              opacity: active ? 0.8 : 0.4,
            }}
          />
        );
      })}
    </div>
  );
}

function BreathingPacer({ active, color }: { active: boolean; color: string }) {
  const [phase, setPhase] = React.useState<"inhale" | "hold" | "exhale" | "rest">("inhale");
  const [count, setCount] = React.useState(4);
  const PATTERN = { inhale: 4, hold: 4, exhale: 4, rest: 4 };
  React.useEffect(() => {
    if (!active) { setPhase("inhale"); setCount(4); return; }
    let p: keyof typeof PATTERN = "inhale";
    let c = PATTERN[p];
    const id = setInterval(() => {
      c--;
      if (c <= 0) {
        p = p === "inhale" ? "hold" : p === "hold" ? "exhale" : p === "exhale" ? "rest" : "inhale";
        c = PATTERN[p];
        setPhase(p);
      }
      setCount(c);
    }, 1000);
    return () => clearInterval(id);
  }, [active]);
  const scale = phase === "inhale" ? 1.3 : phase === "exhale" ? 0.7 : phase === "hold" ? 1.3 : 0.7;
  return (
    <AuroraGlowCard glowColor={color} glowIntensity={0.12} className="p-5">
      <div className="flex items-center gap-4">
        <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
          <div
            className="w-10 h-10 rounded-full transition-all duration-1000 ease-in-out"
            style={{
              transform: `scale(${active ? scale : 1})`,
              background: `radial-gradient(circle, ${color}60, ${color}20)`,
              boxShadow: `0 0 20px ${color}40`,
            }}
          />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 mb-1">
            <Wind className="w-3.5 h-3.5 text-[#C5A572]" />
            <span className="text-[12px] text-[#E8E2D5] font-medium">Box Breathing</span>
          </div>
          {active ? (
            <div className="text-[13px] capitalize tabular-nums" style={{ color }}>
              {phase} · <NumberTicker value={count} />
            </div>
          ) : (
            <div className="text-[11px] text-[#9C9489]">Start a session to activate the pacer (4-4-4-4)</div>
          )}
        </div>
      </div>
    </AuroraGlowCard>
  );
}

function Gate({ onAuth }: { onAuth: () => void }) {
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        <div className="flex flex-col items-center justify-center text-center py-20">
          <AuroraGlowCard glowColor="#9CA8A3" glowIntensity={0.15} className="max-w-sm w-full p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 border border-[#9CA8A3]/30" style={{ background: "#9CA8A310" }}>
              <Waves className="w-7 h-7 text-[#9CA8A3]" />
            </div>
            <LiquidMetalText as="h1" className="serif-display text-[1.75rem] block mb-2">Sign in to tune in</LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
              Solfeggio frequencies, binaural beats, and ambient pads via Web Audio.
            </p>
            <ShimmerButton onClick={onAuth} className="w-full">Sign in</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    </div>
  );
}
