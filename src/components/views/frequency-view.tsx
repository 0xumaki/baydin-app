"use client";

import * as React from "react";
import { GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard } from "@/components/lumina/primitives";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { FREQUENCIES } from "@/lib/frequencies";
import { Waves, Play, Pause, Volume2, VolumeX, Wind, Flame } from "lucide-react";
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
  const synthRef = React.useRef<any>(null);
  const intervalRef = React.useRef<any>(null);

  // Dynamic import Tone.js only on client
  async function startTone() {
    if (!user) { onAuth(); return; }
    if (playing) return;
    const Tone = (await import("tone")).default;
    await Tone.start();
    // Create synth based on mode
    if (synthRef.current) { synthRef.current.dispose(); synthRef.current = null; }
    if (mode === "pure") {
      synthRef.current = new Tone.Oscillator(selected.hz, "sine").toDestination();
      synthRef.current.volume.value = muted ? -Infinity : -12;
      synthRef.current.start();
    } else if (mode === "binaural") {
      // Two oscillators, slightly detuned (binaural beat)
      const left = new Tone.Oscillator(selected.hz, "sine");
      const right = new Tone.Oscillator(selected.hz + 4, "sine");
      const merger = new Tone.Merge().toDestination();
      left.connect(merger, 0, 0);
      right.connect(merger, 0, 1);
      left.volume.value = muted ? -Infinity : -14;
      right.volume.value = muted ? -Infinity : -14;
      synthRef.current = { dispose: () => { left.dispose(); right.dispose(); merger.dispose(); }, setVolume: (v: number) => { left.volume.value = v; right.volume.value = v; } };
      left.start(); right.start();
    } else {
      // pad — ambient polyphonic
      synthRef.current = new Tone.PolySynth(Tone.Synth, { oscillator: { type: "sine" }, envelope: { attack: 2, decay: 1, sustain: 0.8, release: 4 } }).toDestination();
      synthRef.current.volume.value = muted ? -Infinity : -16;
      // Play a chord around the frequency
      const notes = [`${selected.hz}`, `${selected.hz * 1.5}`, `${selected.hz * 2}`].map((f) => Tone.Frequency(f).toNote());
      synthRef.current.triggerAttack(notes);
      synthRef.current._notes = notes;
    }
    setPlaying(true);
    // Timer
    const start = Date.now();
    intervalRef.current = setInterval(() => {
      const e = Math.floor((Date.now() - start) / 1000);
      setElapsed(e);
      if (e >= duration) {
        stopTone(true);
      }
    }, 1000);
  }

  async function stopTone(completed = false) {
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
      // Log session
      try {
        await api("/api/frequency/session", { method: "POST", json: { intention: selected.intention, frequencyHz: selected.hz, mode, durationSec: duration } });
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

  if (!user) {
    return (
      <div className="h-full flex items-center justify-center px-6 text-center">
        <div>
          <Waves className="w-10 h-10 text-ink-muted mx-auto mb-3" />
          <div className="text-[16px] text-ink mb-1">Sign in to tune in</div>
          <GoldButton onClick={onAuth} className="mt-3">Sign in</GoldButton>
        </div>
      </div>
    );
  }

  const mins = Math.floor(elapsed / 60);
  const secs = elapsed % 60;
  const totalMins = Math.floor(duration / 60);
  const progress = duration > 0 ? (elapsed / duration) * 100 : 0;

  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-8">
        <SectionTitle eyebrow="Daily practice · Free" title="Solfeggio Frequencies" subtitle="Tune your mind. Pure tones, binaural beats & ambient pads via Web Audio." className="mb-6" />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Player */}
          <div className="space-y-4">
            {/* Now playing card */}
            <ShellCard className="p-6 relative overflow-hidden">
              <div className="lum-glow-gold absolute inset-0 opacity-30 pointer-events-none" style={{ background: `radial-gradient(120% 80% at 50% -10%, ${selected.color}28 0%, transparent 60%)` }} />
              <div className="relative flex flex-col items-center text-center">
                {/* Frequency dial */}
                <div className="relative w-40 h-40 mb-4">
                  <svg className="w-40 h-40 -rotate-90" viewBox="0 0 160 160">
                    <circle cx="80" cy="80" r="70" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                    <circle cx="80" cy="80" r="70" fill="none" stroke={selected.color} strokeWidth="3" strokeLinecap="round"
                      strokeDasharray={`${(progress / 100) * 440} 440`} style={{ transition: "stroke-dasharray 1s linear" }} />
                  </svg>
                  <div className="absolute inset-0 flex flex-col items-center justify-center">
                    <div className="text-[10px] uppercase tracking-[0.2em] text-ink-muted">{selected.name}</div>
                    <div className="text-[32px] font-light" style={{ color: selected.color }}>{selected.hz}<span className="text-[14px] text-ink-muted ml-0.5">Hz</span></div>
                    {playing && <div className="text-[11px] text-ink-muted mt-0.5">{mins}:{secs.toString().padStart(2, "0")} / {totalMins}:00</div>}
                  </div>
                  {playing && (
                    <div className="absolute inset-0 rounded-full pointer-events-none" style={{ boxShadow: `0 0 40px ${selected.color}40`, animation: "lum-pulse-ring 2s ease-out infinite" }} />
                  )}
                </div>
                {/* Controls */}
                <div className="flex items-center gap-3 mb-3">
                  <button onClick={toggleMute} className="w-9 h-9 rounded-full border border-white/10 flex items-center justify-center text-ink-muted hover:text-ink transition">
                    {muted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
                  </button>
                  <button
                    onClick={() => playing ? stopTone(false) : startTone()}
                    className="w-14 h-14 rounded-full flex items-center justify-center transition active:scale-95"
                    style={{ background: `linear-gradient(135deg, ${selected.color}, ${selected.color}80)`, boxShadow: `0 8px 30px -8px ${selected.color}80` }}
                  >
                    {playing ? <Pause className="w-6 h-6 text-black" /> : <Play className="w-6 h-6 text-black ml-0.5" />}
                  </button>
                  <div className="w-9" />
                </div>
                {/* Mode selector */}
                <div className="flex items-center gap-1">
                  {(["pure", "binaural", "pad"] as const).map((m) => (
                    <button key={m} onClick={() => { if (playing) stopTone(false); setMode(m); }} className={cn("px-2.5 py-1 rounded-full text-[10px] border transition", mode === m ? "border-gold/30 bg-gold/10 text-gold" : "border-white/10 text-ink-muted hover:text-ink")}>
                      {m === "pure" ? "Pure Tone" : m === "binaural" ? "Binaural" : "Ambient Pad"}
                    </button>
                  ))}
                </div>
                {/* Duration */}
                <div className="flex items-center gap-1 mt-2">
                  {[120, 300, 600, 900].map((d) => (
                    <button key={d} onClick={() => setDuration(d)} className={cn("px-2 py-0.5 rounded-full text-[10px] transition", duration === d ? "text-gold" : "text-ink-muted hover:text-ink")}>
                      {d < 60 ? `${d}s` : `${d / 60}m`}
                    </button>
                  ))}
                </div>
              </div>
            </ShellCard>

            {/* Breathing pacer */}
            <BreathingPacer active={playing} color={selected.color} />
          </div>

          {/* Frequency grid */}
          <div>
            <div className="text-[11px] uppercase tracking-[0.2em] text-ink-muted mb-3">Choose your intention</div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
              {FREQUENCIES.map((f) => (
                <button
                  key={f.id}
                  onClick={() => { if (playing) stopTone(false); setSelected(f); }}
                  className={cn("text-left p-3 rounded-xl border transition group", selected.id === f.id ? "border-gold/30 bg-gold/[0.06]" : "border-white/8 bg-white/[0.02] hover:border-white/15")}
                  style={selected.id === f.id ? { borderColor: `${f.color}50`, background: `${f.color}10` } : {}}
                >
                  <div className="flex items-center justify-between mb-1">
                    <div className="w-2 h-2 rounded-full" style={{ background: f.color }} />
                    <span className="text-[10px] text-ink-muted">{f.hz}Hz</span>
                  </div>
                  <div className="text-[12px] text-ink font-medium leading-tight">{f.name}</div>
                  <div className="text-[10px] text-ink-muted leading-tight">{f.description}</div>
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
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
    <GlassCard className="p-5 flex items-center gap-4">
      <div className="relative w-16 h-16 flex items-center justify-center shrink-0">
        <div
          className="w-10 h-10 rounded-full transition-all duration-1000 ease-in-out"
          style={{ transform: `scale(${active ? scale : 1})`, background: `radial-gradient(circle, ${color}60, ${color}20)`, boxShadow: `0 0 20px ${color}40` }}
        />
      </div>
      <div className="flex-1">
        <div className="flex items-center gap-1.5 mb-1">
          <Wind className="w-3.5 h-3.5 text-gold" />
          <span className="text-[12px] text-ink">Box Breathing</span>
        </div>
        {active ? (
          <div className="text-[13px] capitalize" style={{ color }}>{phase} · {count}</div>
        ) : (
          <div className="text-[11px] text-ink-muted">Start a session to activate the pacer (4-4-4-4)</div>
        )}
      </div>
    </GlassCard>
  );
}
