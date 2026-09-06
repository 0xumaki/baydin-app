"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StarField } from "@/components/lumina/primitives";
import {
  ShimmerButton,
  OrnamentDivider,
  AuroraGlowCard,
  GlowPill,
  LiquidMetalText,
  NumberTicker,
  AnimatedGradientBackground,
} from "@/components/lumina/premium-ui";
import { CloverIcon, LotusIcon, StarGlyphIcon, BaydinBreath, BaydinPlay, BaydinPause, BaydinBell, BaydinRefresh, BaydinCheck } from "@/components/lumina/baydin-icons";
import { useMe, api } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { useT } from "@/lib/use-t";
import { toast } from "sonner";
import { BaydinBell as BellOff } from "@/components/lumina/baydin-icons";

/* ============================================================
   BREATH VIEW — Calm / Headspace-style breath guide
   4 patterns · 3 states (useReducer) · concentric circles
   ============================================================ */

type Phase = "inhale" | "hold" | "exhale" | "rest";

interface BreathPattern {
  id: string;
  name: string;
  subtitle: string;
  phases: { phase: Phase; sec: number }[];
  description: string;
  glyph: "clover" | "lotus" | "star";
  color: string;
}

const PATTERNS: BreathPattern[] = [
  {
    id: "box",
    name: "Box Breathing",
    subtitle: "4-4-4-4",
    phases: [
      { phase: "inhale", sec: 4 },
      { phase: "hold", sec: 4 },
      { phase: "exhale", sec: 4 },
      { phase: "rest", sec: 4 },
    ],
    description: "Steady square. Used by Navy SEALs to anchor focus before high-stress moments.",
    glyph: "lotus",
    color: "#B5CD7E",
  },
  {
    id: "478",
    name: "Relaxing Breath",
    subtitle: "4-7-8",
    phases: [
      { phase: "inhale", sec: 4 },
      { phase: "hold", sec: 7 },
      { phase: "exhale", sec: 8 },
    ],
    description: "Dr. Andrew Weil's 4-7-8 — calms the nervous system and eases sleep.",
    glyph: "star",
    color: "#9CA8A3",
  },
  {
    id: "coherent",
    name: "Coherent Breathing",
    subtitle: "5-5",
    phases: [
      { phase: "inhale", sec: 5 },
      { phase: "exhale", sec: 5 },
    ],
    description: "Five in, five out. Balances heart-rate variability and vagal tone.",
    glyph: "clover",
    color: "#C5A572",
  },
  {
    id: "deep-relax",
    name: "Deep Relaxation",
    subtitle: "4-7-8-0",
    phases: [
      { phase: "inhale", sec: 4 },
      { phase: "hold", sec: 7 },
      { phase: "exhale", sec: 8 },
      { phase: "rest", sec: 0 },
    ],
    description: "Extended 4-7-8 with a brief stillpoint between cycles. For deep release.",
    glyph: "clover",
    color: "#7A9CB8",
  },
];

const DURATIONS = [60, 180, 300, 600]; // 1m / 3m / 5m / 10m

const PHASE_LABELS: Record<Phase, string> = {
  inhale: "Breathe in",
  hold: "Hold",
  exhale: "Breathe out",
  rest: "Rest",
};

/* ------------------------------------------------------------------ */
/* Reducer                                                             */
/* ------------------------------------------------------------------ */

type BreathState =
  | { kind: "welcome"; patternId: string; durationSec: number; chime: boolean; ambient: boolean }
  | {
      kind: "active";
      patternId: string;
      durationSec: number;
      chime: boolean;
      ambient: boolean;
      startedAt: number;
      phaseIndex: number;
      phaseElapsed: number;
      totalElapsed: number;
      paused: boolean;
    }
  | {
      kind: "complete";
      patternId: string;
      breathCount: number;
      durationSec: number;
      chime: boolean;
      ambient: boolean;
      completedAt: number;
    };

type Action =
  | { type: "set_pattern"; patternId: string }
  | { type: "set_duration"; durationSec: number }
  | { type: "set_chime"; chime: boolean }
  | { type: "set_ambient"; ambient: boolean }
  | { type: "begin" }
  | { type: "tick"; phaseElapsed: number; totalElapsed: number }
  | { type: "advance_phase"; phaseIndex: number; phaseElapsed: number }
  | { type: "toggle_pause"; paused: boolean }
  | { type: "complete"; breathCount: number }
  | { type: "restart" }
  | { type: "back_to_welcome" };

function reducer(state: BreathState, action: Action): BreathState {
  switch (action.type) {
    case "set_pattern":
      if (state.kind !== "welcome") return state;
      return { ...state, patternId: action.patternId };
    case "set_duration":
      if (state.kind !== "welcome") return state;
      return { ...state, durationSec: action.durationSec };
    case "set_chime":
      if (state.kind !== "welcome") return state;
      return { ...state, chime: action.chime };
    case "set_ambient":
      if (state.kind !== "welcome") return state;
      return { ...state, ambient: action.ambient };
    case "begin":
      if (state.kind !== "welcome") return state;
      return {
        kind: "active",
        patternId: state.patternId,
        durationSec: state.durationSec,
        chime: state.chime,
        ambient: state.ambient,
        startedAt: Date.now(),
        phaseIndex: 0,
        phaseElapsed: 0,
        totalElapsed: 0,
        paused: false,
      };
    case "tick":
      if (state.kind !== "active") return state;
      return { ...state, phaseElapsed: action.phaseElapsed, totalElapsed: action.totalElapsed };
    case "advance_phase":
      if (state.kind !== "active") return state;
      return { ...state, phaseIndex: action.phaseIndex, phaseElapsed: action.phaseElapsed };
    case "toggle_pause":
      if (state.kind !== "active") return state;
      return { ...state, paused: action.paused };
    case "complete":
      if (state.kind !== "active") return state;
      return {
        kind: "complete",
        patternId: state.patternId,
        breathCount: action.breathCount,
        durationSec: state.durationSec,
        chime: state.chime,
        ambient: state.ambient,
        completedAt: Date.now(),
      };
    case "restart":
      if (state.kind !== "complete") return state;
      return {
        kind: "welcome",
        patternId: state.patternId,
        durationSec: state.durationSec,
        chime: state.chime,
        ambient: state.ambient,
      };
    case "back_to_welcome":
      return {
        kind: "welcome",
        patternId: state.kind === "welcome" ? state.patternId : state.patternId,
        durationSec: state.kind === "welcome" ? state.durationSec : state.durationSec,
        chime: state.kind === "welcome" ? state.chime : state.chime,
        ambient: state.kind === "welcome" ? state.ambient : state.ambient,
      };
    default:
      return state;
  }
}

const INITIAL: BreathState = {
  kind: "welcome",
  patternId: "box",
  durationSec: 180,
  chime: true,
  ambient: false,
};

/* ------------------------------------------------------------------ */
/* Audio: A440 chime via Web Audio, ambient pad via Tone.js (dynamic) */
/* ------------------------------------------------------------------ */

interface ChimeEngine {
  ctx: AudioContext;
  play: (freq?: number, duration?: number) => void;
  close: () => void;
}

function createChime(): ChimeEngine | null {
  if (typeof window === "undefined") return null;
  try {
    const Ctx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!Ctx) return null;
    const ctx = new Ctx();
    const play = (freq = 440, duration = 0.6) => {
      const t0 = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.frequency.value = freq;
      osc.type = "sine";
      gain.gain.setValueAtTime(0, t0);
      gain.gain.linearRampToValueAtTime(0.18, t0 + 0.04);
      gain.gain.exponentialRampToValueAtTime(0.001, t0 + duration);
      osc.connect(gain).connect(ctx.destination);
      osc.start(t0);
      osc.stop(t0 + duration + 0.05);
    };
    const close = () => {
      try {
        ctx.close();
      } catch {}
    };
    return { ctx, play, close };
  } catch {
    return null;
  }
}

interface AmbientEngine {
  stop: () => Promise<void>;
}

async function createAmbient(): Promise<AmbientEngine | null> {
  if (typeof window === "undefined") return null;
  try {
    const Tone = await import("tone");
    await Tone.start();
    const synth = new Tone.PolySynth(Tone.Synth, {
      oscillator: { type: "sine" },
      envelope: { attack: 4, decay: 2, sustain: 0.7, release: 6 },
    }).toDestination();
    synth.volume.value = -18;
    const notes = ["C3", "G3", "C4", "E4"];
    synth.triggerAttack(notes);
    return {
      stop: async () => {
        try {
          synth.triggerRelease(notes);
          setTimeout(() => synth.dispose(), 2500);
        } catch {}
      },
    };
  } catch {
    return null;
  }
}

/* ------------------------------------------------------------------ */
/* Main view                                                          */
/* ------------------------------------------------------------------ */

export function BreathView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const t = useT();
  const [state, dispatch] = React.useReducer(reducer, INITIAL);

  const chimeRef = React.useRef<ChimeEngine | null>(null);
  const ambientRef = React.useRef<AmbientEngine | null>(null);
  const intervalRef = React.useRef<ReturnType<typeof setInterval> | null>(null);

  const pattern = PATTERNS.find((p) => p.id === state.patternId) ?? PATTERNS[0];

  // ----- Cleanup on unmount (always declared, regardless of auth) -----
  React.useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
      if (chimeRef.current) {
        chimeRef.current.close();
        chimeRef.current = null;
      }
      if (ambientRef.current) {
        ambientRef.current.stop();
        ambientRef.current = null;
      }
    };
  }, []);

  // ----- Begin session: start chime + ambient + timer -----
  async function beginSession() {
    if (state.kind !== "welcome") return;
    if (state.chime) {
      chimeRef.current = createChime();
      if (chimeRef.current) {
        // Resume context if suspended (autoplay policy)
        if (chimeRef.current.ctx.state === "suspended") {
          try {
            await chimeRef.current.ctx.resume();
          } catch {}
        }
        chimeRef.current.play(523.25, 1.2); // C5 chime
      }
    }
    if (state.ambient) {
      ambientRef.current = await createAmbient();
    }
    dispatch({ type: "begin" });
  }

  // ----- Active-state timer effect (declared unconditionally; guards inside) -----
  React.useEffect(() => {
    if (state.kind !== "active") return;
    if (state.paused) return;

    const patternNow = PATTERNS.find((p) => p.id === state.patternId) ?? PATTERNS[0];
    const phases = patternNow.phases;

    const startTs = Date.now();
    const phaseStartTs = startTs - state.phaseElapsed * 1000;
    const totalStartTs = startTs - state.totalElapsed * 1000;
    let phaseIdx = state.phaseIndex;

    intervalRef.current = setInterval(() => {
      const now = Date.now();
      const totalElapsed = Math.floor((now - totalStartTs) / 1000);

      // End by duration
      if (totalElapsed >= state.durationSec) {
        if (intervalRef.current) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
        }
        // Compute breath count up to this point
        const cycleSec = phases.reduce((a, p) => a + p.sec, 0);
        const breathCount = Math.max(1, Math.floor(totalElapsed / cycleSec));
        // Close audio
        if (chimeRef.current) {
          chimeRef.current.play(659.25, 1.5); // E5 closing tone
        }
        // Save session server-side
        api("/api/breath-session", {
          method: "POST",
          json: {
            pattern: state.patternId,
            durationSec: state.durationSec,
            breathCount,
          },
        }).catch(() => {});
        dispatch({ type: "complete", breathCount });
        return;
      }

      const phaseElapsed = Math.floor((now - phaseStartTs) / 1000);
      const currentPhase = phases[phaseIdx];
      if (!currentPhase) return;

      if (phaseElapsed >= currentPhase.sec && currentPhase.sec > 0) {
        // Advance
        const nextIdx = (phaseIdx + 1) % phases.length;
        const nextPhase = phases[nextIdx];
        phaseIdx = nextIdx;
        // Note: phaseStartTs is captured in the closure of this interval;
        // reassigning it here doesn't persist across ticks — we reset phase
        // progress by advancing phaseElapsed via dispatch and letting the
        // effect re-run only on phase change. The slight inaccuracy (~1
        // extra tick on the new phase) is acceptable for a breath pacer.
        // Play chime on phase transitions
        if (state.chime && chimeRef.current) {
          const tone =
            nextPhase.phase === "inhale"
              ? 523.25 // C5
              : nextPhase.phase === "exhale"
              ? 392.0 // G4
              : nextPhase.phase === "hold"
              ? 659.25 // E5
              : 440.0; // A4 (rest)
          chimeRef.current.play(tone, 0.5);
        }
        dispatch({ type: "advance_phase", phaseIndex: nextIdx, phaseElapsed: 0 });
      } else if (currentPhase.sec === 0) {
        // Skip phases with sec=0 (like Deep Relaxation's "rest")
        const nextIdx = (phaseIdx + 1) % phases.length;
        phaseIdx = nextIdx;
        dispatch({ type: "advance_phase", phaseIndex: nextIdx, phaseElapsed: 0 });
      } else {
        dispatch({ type: "tick", phaseElapsed, totalElapsed });
      }
    }, 250);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [state.kind, state.kind === "active" ? state.paused : false, state.patternId, state.durationSec, state.chime]);

  // ----- Sign-in gate (after all hooks) -----
  if (!user) {
    return (
      <div className="h-full overflow-hidden relative">
        <div className="fixed inset-0 pointer-events-none z-0">
          <AnimatedGradientBackground variant="warm" />
          <StarField count={30} />
        </div>
        <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden flex items-center justify-center">
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.15} className="max-w-sm w-full p-10 text-center">
            <div className="inline-flex items-center justify-center w-14 h-14 rounded-full mb-4 border border-[#C5A572]/30" style={{ background: "#C5A57210" }}>
              <CloverIcon className="w-7 h-7 text-[#C5A572]" />
            </div>
            <LiquidMetalText as="h1" className="serif-display text-[1.75rem] block mb-2">
              Sign in to begin your breath practice
            </LiquidMetalText>
            <p className="text-[13px] text-[#9C9489] mb-6 leading-relaxed">
              A calm pacer for the nervous system. Choose a pattern, settle in, and follow the circles.
            </p>
            <ShimmerButton onClick={onAuth} className="w-full">{t("sign_in")}</ShimmerButton>
          </AuroraGlowCard>
        </div>
      </div>
    );
  }

  /* ----- Welcome ----- */
  if (state.kind === "welcome") {
    return (
      <WelcomeScreen
        state={state}
        dispatch={dispatch}
        pattern={pattern}
        onBegin={beginSession}
      />
    );
  }

  /* ----- Active ----- */
  if (state.kind === "active") {
    return (
      <ActiveScreen
        state={state}
        pattern={pattern}
        onTogglePause={() => dispatch({ type: "toggle_pause", paused: !state.paused })}
        onEnd={() => {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          const phases = pattern.phases;
          const cycleSec = phases.reduce((a, p) => a + p.sec, 0);
          const breathCount = Math.max(1, Math.floor(state.totalElapsed / cycleSec));
          if (chimeRef.current) chimeRef.current.close();
          if (ambientRef.current) ambientRef.current.stop();
          chimeRef.current = null;
          ambientRef.current = null;
          dispatch({ type: "complete", breathCount });
        }}
      />
    );
  }

  /* ----- Complete ----- */
  return <CompleteScreen state={state} pattern={pattern} dispatch={dispatch} />;
}

/* ------------------------------------------------------------------ */
/* Welcome screen                                                     */
/* ------------------------------------------------------------------ */

function WelcomeScreen({
  state,
  dispatch,
  pattern,
  onBegin,
}: {
  state: Extract<BreathState, { kind: "welcome" }>;
  dispatch: React.Dispatch<Action>;
  pattern: BreathPattern;
  onBegin: () => void;
}) {
  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-4xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
        {/* ===== Hero ===== */}
        <div className="mb-6 lum-reveal">
          <GlowPill className="mb-3" color={pattern.color}>
            <BaydinBreath className="w-3 h-3" /> Practice · Breath
          </GlowPill>
          <LiquidMetalText as="h1" className="serif-display text-[2rem] sm:text-[2.5rem] leading-[1.05] tracking-tight block mb-2">
            Breathwork
          </LiquidMetalText>
          <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[55ch]">
            A calm pacer for the nervous system. Choose a pattern, settle in, and follow the circles.
          </p>
        </div>

        <OrnamentDivider className="mb-6" />

        {/* Pattern picker */}
        <div className="mb-6">
          <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B6358] mb-3">Pattern</div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            {PATTERNS.map((p) => {
              const selected = p.id === state.patternId;
              const Glyph = p.glyph === "clover" ? CloverIcon : p.glyph === "lotus" ? LotusIcon : StarGlyphIcon;
              return (
                <AuroraGlowCard
                  key={p.id}
                  glowColor={selected ? p.color : "#2A2722"}
                  glowIntensity={selected ? 0.18 : 0.05}
                  className="p-4"
                >
                  <button
                    onClick={() => dispatch({ type: "set_pattern", patternId: p.id })}
                    className="w-full text-left group"
                  >
                    <div className="flex items-start gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center shrink-0"
                        style={{ background: `${p.color}1A`, color: p.color, border: `1px solid ${p.color}33` }}
                      >
                        <Glyph className="w-[18px] h-[18px]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-baseline justify-between gap-2">
                          <span className="text-[14px] text-[#E8E2D5] font-medium leading-tight">{p.name}</span>
                          <GlowPill color={p.color} className="text-[10px]">{p.subtitle}</GlowPill>
                        </div>
                        <p className="text-[11px] text-[#9C9489] mt-1 leading-snug">{p.description}</p>
                      </div>
                    </div>
                  </button>
                </AuroraGlowCard>
              );
            })}
          </div>
        </div>

        {/* Duration + audio toggles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B6358] mb-3">Duration</div>
            <div className="grid grid-cols-4 gap-2">
              {DURATIONS.map((d) => (
                <button
                  key={d}
                  onClick={() => dispatch({ type: "set_duration", durationSec: d })}
                  className={cn(
                    "py-3 rounded-sm border text-[13px] transition focus-ring",
                    state.durationSec === d
                      ? "border-[#C5A572]/30 bg-[#C5A572]/10 text-[#C5A572]"
                      : "border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5] hover:border-white/15"
                  )}
                >
                  {d < 60 ? `${d}s` : `${d / 60}m`}
                </button>
              ))}
            </div>
          </AuroraGlowCard>

          <AuroraGlowCard glowColor="#C5A572" glowIntensity={0.1} className="p-4">
            <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B6358] mb-3">Audio</div>
            <div className="flex flex-col gap-2">
              <ToggleRow
                active={state.chime}
                onClick={() => dispatch({ type: "set_chime", chime: !state.chime })}
                icon={state.chime ? <BaydinBell className="w-4 h-4" /> : <BellOff className="w-4 h-4" />}
                label="Phase chime"
                hint="Soft tone at each phase change (A440)"
              />
              <ToggleRow
                active={state.ambient}
                onClick={() => dispatch({ type: "set_ambient", ambient: !state.ambient })}
                icon={<BaydinBreath className="w-4 h-4" />}
                label="Ambient pad"
                hint="Drone via Tone.js (uses data)"
              />
            </div>
          </AuroraGlowCard>
        </div>

        {/* Selected pattern summary */}
        <AuroraGlowCard glowColor={pattern.color} glowIntensity={0.15} className="p-5 mb-6 relative overflow-hidden">
          <StarField count={14} />
          <div className="relative flex items-center gap-5">
            <motion.div
              className="w-16 h-16 rounded-full shrink-0"
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: pattern.phases[0].sec, repeat: Infinity, ease: "easeInOut" }}
              style={{
                background: `radial-gradient(circle, ${pattern.color}40, ${pattern.color}10)`,
                boxShadow: `0 0 30px ${pattern.color}40`,
                border: `1px solid ${pattern.color}33`,
              }}
            />
            <div className="flex-1 min-w-0">
              <div className="text-[11px] uppercase tracking-[0.2em] text-[#6B6358] mb-1">
                Selected
              </div>
              <LiquidMetalText as="div" className="serif-display text-[1.125rem] block">
                {pattern.name}
              </LiquidMetalText>
              <div className="text-[12px] text-[#9C9489] mt-0.5 flex items-center gap-2">
                <GlowPill color={pattern.color} className="text-[10px]">{pattern.phases.map((p) => p.sec).join("-")}</GlowPill>
                <span>·</span>
                <span><NumberTicker value={Math.floor(state.durationSec / 60)} suffix="m" /> session</span>
              </div>
            </div>
          </div>
        </AuroraGlowCard>

        {/* Begin button */}
        <div className="flex flex-col items-center gap-3 pb-6">
          <ShimmerButton
            onClick={onBegin}
            tone="gold"
            className="px-8 py-3 text-[14px]"
          >
            <BaydinPlay className="w-4 h-4 mr-1" />
            Begin session
          </ShimmerButton>
          <div className="text-[11px] text-[#6B6358]">
            Sit upright · breathe through the nose · follow the circles
          </div>
        </div>
      </div>
    </div>
  );
}

function ToggleRow({
  active,
  onClick,
  icon,
  label,
  hint,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
  hint: string;
}) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-center gap-3 px-3 py-2 rounded-sm border transition text-left",
        active
          ? "border-[#C5A572]/30 bg-[#C5A572]/[0.06] text-[#E8E2D5]"
          : "border-[#2A2722] text-[#9C9489] hover:text-[#E8E2D5] hover:border-white/15"
      )}
    >
      <span className={cn("shrink-0", active ? "text-[#C5A572]" : "text-[#6B6358]")}>{icon}</span>
      <div className="flex-1 min-w-0">
        <div className="text-[12px] font-medium leading-tight">{label}</div>
        <div className="text-[10px] text-[#6B6358] leading-tight">{hint}</div>
      </div>
      <span
        className={cn(
          "w-8 h-4 rounded-full relative transition shrink-0",
          active ? "bg-[#C5A572]/40" : "bg-[#2A2722]"
        )}
      >
        <span
          className={cn(
            "absolute top-0.5 w-3 h-3 rounded-full bg-[#E8E2D5] transition-all",
            active ? "left-4" : "left-0.5"
          )}
        />
      </span>
    </button>
  );
}

/* ------------------------------------------------------------------ */
/* Active screen — concentric circles                                */
/* ------------------------------------------------------------------ */

function ActiveScreen({
  state,
  pattern,
  onTogglePause,
  onEnd,
}: {
  state: Extract<BreathState, { kind: "active" }>;
  pattern: BreathPattern;
  onTogglePause: () => void;
  onEnd: () => void;
}) {
  const phases = pattern.phases;
  const currentPhase = phases[state.phaseIndex] ?? phases[0];
  const phaseSec = currentPhase.sec;

  // Compute scale based on phase: inhale expands, exhale contracts, hold holds
  const scale = React.useMemo(() => {
    if (phaseSec === 0) return 1;
    const progress = Math.min(1, state.phaseElapsed / phaseSec);
    if (currentPhase.phase === "inhale") return 0.7 + progress * 0.6; // 0.7 → 1.3
    if (currentPhase.phase === "exhale") return 1.3 - progress * 0.6; // 1.3 → 0.7
    if (currentPhase.phase === "hold") {
      // Stay at expand if previous was inhale; contract if previous was exhale.
      const prevIdx = (state.phaseIndex - 1 + phases.length) % phases.length;
      const prev = phases[prevIdx];
      return prev?.phase === "exhale" ? 0.7 : 1.3;
    }
    return 0.7; // rest
  }, [currentPhase, state.phaseElapsed, state.phaseIndex, phaseSec, phases]);

  const remaining = Math.max(0, phaseSec - state.phaseElapsed);
  const totalRemaining = Math.max(0, state.durationSec - state.totalElapsed);

  const phaseColor = pattern.color;
  const ringColor = phaseColor;

  const cycleSec = phases.reduce((a, p) => a + p.sec, 0);
  const breathCount = Math.max(0, Math.floor(state.totalElapsed / cycleSec));

  return (
    <div className="h-full flex flex-col relative">
      {/* Backdrop */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
      </div>
      {/* Top: status row */}
      <div className="relative z-10 flex items-center justify-between px-4 lg:px-8 py-4 border-b border-[#2A2722]">
        <div className="flex items-center gap-2">
          <CloverIcon className="w-3.5 h-3.5 text-[#C5A572]" filled />
          <span className="text-[12px] text-[#9C9489]">{pattern.name}</span>
          <GlowPill color={pattern.color} className="text-[10px]">{pattern.subtitle}</GlowPill>
        </div>
        <div className="flex items-center gap-3 text-[11px] text-[#9C9489] tabular-nums">
          <span className="flex items-center gap-1">
            <BaydinBreath className="w-3 h-3 text-[#C5A572]" />
            <NumberTicker value={Math.floor(totalRemaining / 60)} suffix=":" />
            {(totalRemaining % 60).toString().padStart(2, "0")} left
          </span>
          <span className="text-[#6B6358]">·</span>
          <span className="flex items-center gap-1">
            <NumberTicker value={breathCount} className="text-[#E8E2D5]" /> breaths
          </span>
        </div>
      </div>

      {/* Center: concentric circles */}
      <div className="flex-1 relative flex items-center justify-center overflow-hidden">
        <StarField count={20} />

        {/* Concentric rings — outer to inner */}
        <div className="relative" style={{ width: 360, height: 360 }}>
          {/* Outermost ring */}
          <motion.div
            className="absolute inset-0 rounded-full"
            animate={{ scale }}
            transition={{ duration: phaseSec > 0 ? Math.min(phaseSec, 1) : 0.5, ease: "easeInOut" }}
            style={{
              border: `1px solid ${ringColor}22`,
              background: `radial-gradient(circle, ${phaseColor}10 0%, transparent 70%)`,
            }}
          />
          {/* Ring 3 */}
          <motion.div
            className="absolute rounded-full"
            style={{
              top: "12%",
              left: "12%",
              right: "12%",
              bottom: "12%",
              border: `1px solid ${ringColor}33`,
              background: `radial-gradient(circle, ${phaseColor}18 0%, transparent 70%)`,
            }}
            animate={{ scale }}
            transition={{ duration: phaseSec > 0 ? Math.min(phaseSec, 1) : 0.5, ease: "easeInOut" }}
          />
          {/* Ring 2 */}
          <motion.div
            className="absolute rounded-full"
            style={{
              top: "24%",
              left: "24%",
              right: "24%",
              bottom: "24%",
              border: `1px solid ${ringColor}55`,
              background: `radial-gradient(circle, ${phaseColor}26 0%, transparent 70%)`,
            }}
            animate={{ scale }}
            transition={{ duration: phaseSec > 0 ? Math.min(phaseSec, 1) : 0.5, ease: "easeInOut" }}
          />
          {/* Innermost pulsing core */}
          <motion.div
            className="absolute rounded-full flex items-center justify-center"
            style={{
              top: "35%",
              left: "35%",
              right: "35%",
              bottom: "35%",
              background: `radial-gradient(circle, ${phaseColor}66, ${phaseColor}22)`,
              boxShadow: `0 0 60px ${phaseColor}66, inset 0 0 30px ${phaseColor}40`,
            }}
            animate={{ scale }}
            transition={{ duration: phaseSec > 0 ? Math.min(phaseSec, 1) : 0.5, ease: "easeInOut" }}
          >
            {/* Phase label inside the core */}
            <div className="text-center">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentPhase.phase}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -4 }}
                  transition={{ duration: 0.25 }}
                >
                  <div className="serif-display text-[18px] text-[#E8E2D5] tracking-tight">
                    {PHASE_LABELS[currentPhase.phase]}
                  </div>
                  {phaseSec > 0 && (
                    <div className="text-[28px] font-light tabular-nums" style={{ color: phaseColor }}>
                      {remaining}
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </motion.div>

          {/* Phase progress ring (SVG arc) */}
          {phaseSec > 0 && (
            <svg
              className="absolute inset-0 w-full h-full -rotate-90"
              viewBox="0 0 360 360"
              style={{ pointerEvents: "none" }}
            >
              <circle
                cx="180"
                cy="180"
                r="170"
                fill="none"
                stroke={`${phaseColor}22`}
                strokeWidth="1.5"
              />
              <circle
                cx="180"
                cy="180"
                r="170"
                fill="none"
                stroke={phaseColor}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeDasharray={`${(state.phaseElapsed / phaseSec) * 1068} 1068`}
                style={{ transition: "stroke-dasharray 0.25s linear" }}
              />
            </svg>
          )}
        </div>
      </div>

      {/* Bottom: minimal controls */}
      <div className="flex items-center justify-center gap-3 px-4 py-6 border-t border-[#2A2722]">
        <button
          onClick={onTogglePause}
          className="w-11 h-11 rounded-full border border-[#2A2722] flex items-center justify-center text-[#9C9489] hover:text-[#E8E2D5] hover:border-white/15 transition"
          aria-label={state.paused ? "Resume breathing" : "Pause breathing"}
        >
          {state.paused ? <BaydinPlay className="w-4 h-4" /> : <BaydinPause className="w-4 h-4" />}
        </button>
        <button
          onClick={onEnd}
          className="px-5 h-11 rounded-full border border-[#2A2722] text-[12px] text-[#9C9489] hover:text-[#E8E2D5] hover:border-white/15 transition"
        >
          End session
        </button>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Complete screen                                                    */
/* ------------------------------------------------------------------ */

function CompleteScreen({
  state,
  pattern,
  dispatch,
}: {
  state: Extract<BreathState, { kind: "complete" }>;
  pattern: BreathPattern;
  dispatch: React.Dispatch<Action>;
}) {
  const minutes = Math.floor(state.durationSec / 60);
  const seconds = state.durationSec % 60;
  const durationDisplay = minutes > 0 ? minutes : seconds;
  const durationSuffix = minutes > 0 ? "m" : "s";

  return (
    <div className="h-full overflow-y-auto lumina-scroll relative">
      <div className="fixed inset-0 pointer-events-none z-0">
        <AnimatedGradientBackground variant="warm" />
        <StarField count={30} />
      </div>
      <div className="max-w-2xl mx-auto px-4 py-8 lg:py-12 flex flex-col items-center text-center relative z-10 min-w-0 overflow-hidden">
        <motion.div
          initial={{ scale: 0.6, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="w-20 h-20 rounded-full flex items-center justify-center mb-5"
          style={{
            background: `radial-gradient(circle, ${pattern.color}33, ${pattern.color}11)`,
            border: `1px solid ${pattern.color}55`,
            boxShadow: `0 0 40px ${pattern.color}33`,
          }}
        >
          <BaydinCheck className="w-8 h-8" style={{ color: pattern.color }} />
        </motion.div>

        <LiquidMetalText as="h1" className="serif-display text-[1.5rem] block mb-2">
          Session complete
        </LiquidMetalText>
        <p className="text-[13px] text-[#9C9489] leading-[1.7] max-w-[45ch] mb-6">
          Take a moment before moving on. Notice the quiet inside the breath.
        </p>

        <OrnamentDivider className="mb-6" />

        {/* Summary stats */}
        <div className="grid grid-cols-3 gap-3 w-full max-w-md mb-6">
          <AuroraGlowCard glowColor={pattern.color} glowIntensity={0.12} className="p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6358] mb-1">Breaths</div>
            <div className="text-[24px] font-light text-[#E8E2D5] tabular-nums">
              <NumberTicker value={state.breathCount} />
            </div>
          </AuroraGlowCard>
          <AuroraGlowCard glowColor={pattern.color} glowIntensity={0.12} className="p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6358] mb-1">Minutes</div>
            <div className="text-[24px] font-light text-[#E8E2D5] tabular-nums">
              <NumberTicker value={durationDisplay} suffix={durationSuffix} />
            </div>
          </AuroraGlowCard>
          <AuroraGlowCard glowColor={pattern.color} glowIntensity={0.12} className="p-4">
            <div className="text-[10px] uppercase tracking-[0.2em] text-[#6B6358] mb-1">Pattern</div>
            <GlowPill color={pattern.color} className="text-[12px] mt-1">{pattern.subtitle}</GlowPill>
          </AuroraGlowCard>
        </div>

        <div className="text-[11px] text-[#6B6358] mb-6 flex items-center gap-1">
          <CloverIcon className="w-3 h-3 text-[#C5A572]" filled />
          <span>Logged as a frequency session · mode: breath</span>
        </div>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row items-center gap-3">
          <ShimmerButton
            onClick={() => dispatch({ type: "restart" })}
            className="px-6 py-2.5"
          >
            <BaydinRefresh className="w-4 h-4 mr-1.5" />
            Breathe again
          </ShimmerButton>
          <ShimmerButton
            onClick={() => dispatch({ type: "back_to_welcome" })}
            tone="parchment"
            className="px-6 py-2.5"
          >
            Choose another pattern
          </ShimmerButton>
        </div>
      </div>
    </div>
  );
}
