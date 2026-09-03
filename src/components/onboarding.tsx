"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard, GoldButton, GradientButton } from "@/components/lumina/primitives";
import { useStore } from "@/lib/store";
import { Sparkles, MessageCircle, Star, Target, Waves, ChevronRight, X } from "lucide-react";

const ONBOARDING_KEY = "baydin.onboarded";

const SLIDES = [
  {
    icon: MessageCircle,
    title: "Ask the Astrologer",
    desc: "Chat with your AI astrologer — versed in Vedic, Western & Myanmar Mahabote traditions. Real chart-grounded readings in your language.",
    color: "#C5A87C",
    feature: "chat" as const,
  },
  {
    icon: Sparkles,
    title: "Draw the Cards",
    desc: "The Rider-Waite-Smith tarot deck speaks in symbols. 6 spreads, free daily readings, AI interpretations that weave meaning into narrative.",
    color: "#9E8AC9",
    feature: "tarot" as const,
  },
  {
    icon: Target,
    title: "Daily Rituals",
    desc: "Set intentions, confirm them daily, tune to Solfeggio frequencies, and complete your 4-step ritual. Earn Luck with every practice.",
    color: "#B5CD7E",
    feature: "ritual" as const,
  },
  {
    icon: Waves,
    title: "Luck Credits",
    desc: "Each reading costs Luck — earn it through daily rewards, referrals, or by topping up.",
    color: "#5FA9C7",
    feature: "luck-store" as const,
  },
];

export function Onboarding() {
  const { setView } = useStore();
  const [show, setShow] = React.useState(false);
  const [slide, setSlide] = React.useState(0);

  React.useEffect(() => {
    if (typeof window === "undefined") return;
    const onboarded = localStorage.getItem(ONBOARDING_KEY);
    if (!onboarded) {
      // Small delay so the app shell loads first
      const t = setTimeout(() => setShow(true), 1500);
      return () => clearTimeout(t);
    }
  }, []);

  function dismiss(goToFeature?: typeof SLIDES[number]["feature"]) {
    localStorage.setItem(ONBOARDING_KEY, "1");
    setShow(false);
    if (goToFeature) setView(goToFeature);
  }

  const current = SLIDES[slide];
  const isLast = slide === SLIDES.length - 1;

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
        >
          <motion.div
            initial={{ scale: 0.9, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.9, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 20 }}
            className="relative max-w-md w-full"
          >
            <GlassCard float className="p-8 rounded-3xl border border-gold/20">
              {/* Skip button */}
              <button onClick={() => dismiss()} className="absolute top-4 right-4 text-ink-muted hover:text-ink transition">
                <X className="w-5 h-5" />
              </button>

              {/* Slide icon */}
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center mb-5 mx-auto border-2"
                style={{ background: `${current.color}15`, borderColor: `${current.color}40` }}
              >
                <current.icon className="w-9 h-9" style={{ color: current.color }} />
              </div>

              {/* Slide content */}
              <motion.div
                key={slide}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.3 }}
                className="text-center"
              >
                <h2 className="text-[22px] font-light text-ink mb-2">{current.title}</h2>
                <p className="text-[13px] text-ink-muted leading-relaxed mb-6">{current.desc}</p>
              </motion.div>

              {/* Progress dots */}
              <div className="flex items-center justify-center gap-1.5 mb-6">
                {SLIDES.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setSlide(i)}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === slide ? 24 : 8,
                      background: i === slide ? current.color : "rgba(255,255,255,0.15)",
                    }}
                  />
                ))}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2">
                {!isLast ? (
                  <>
                    <button onClick={() => dismiss()} className="px-4 py-2.5 text-[12px] text-ink-muted hover:text-ink transition">
                      Skip tour
                    </button>
                    <GradientButton onClick={() => setSlide(slide + 1)} className="flex-1 py-2.5 text-[13px]">
                      Next <ChevronRight className="w-4 h-4" />
                    </GradientButton>
                  </>
                ) : (
                  <GradientButton onClick={() => dismiss(current.feature)} className="w-full py-2.5 text-[13px]">
                    <Sparkles className="w-4 h-4" /> Begin your journey · 5 Luck free
                  </GradientButton>
                )}
              </div>

              {/* Step counter */}
              <div className="text-center text-[10px] text-ink-muted/50 mt-3">
                {slide + 1} of {SLIDES.length}
              </div>
            </GlassCard>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
