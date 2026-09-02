"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "@/lib/api-client";
import { X, Sparkles } from "lucide-react";
import { toast } from "sonner";

/**
 * AchievementCelebration — polls /api/achievements on mount and whenever the
 * user's Luck balance or streak changes. Shows a celebratory modal when new
 * badges are unlocked.
 */
export function AchievementCelebration() {
  const { data } = useMe();
  const user = data?.user;
  const [celebrating, setCelebrating] = React.useState<any[]>([]);
  const lastCheck = React.useRef<string>("");

  const checkForNew = React.useCallback(async () => {
    if (!user) return;
    // Debounce: only check if balance or streak changed since last check
    const sig = `${user.luckBalance}-${user.streak}-${user.totalLuckEarned}`;
    if (sig === lastCheck.current) return;
    lastCheck.current = sig;
    try {
      const res = await fetch("/api/achievements", { credentials: "include" });
      const data = await res.json();
      if (data.newlyUnlocked?.length > 0) {
        setCelebrating((c) => [...c, ...data.newlyUnlocked]);
      }
    } catch {}
  }, [user?.luckBalance, user?.streak, user?.totalLuckEarned]);

  React.useEffect(() => {
    const t = setTimeout(checkForNew, 2000); // check 2s after mount/balance change
    return () => clearTimeout(t);
  }, [checkForNew]);

  const dismiss = () => setCelebrating((c) => c.slice(1));

  const current = celebrating[0];

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md"
          onClick={dismiss}
        >
          {/* Confetti particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 30 }).map((_, i) => {
              const colors = ["#C5A87C", "#B5CD7E", "#9E8AC9", "#F09A3D", "#D876A0"];
              const left = Math.random() * 100;
              const delay = Math.random() * 0.5;
              const dur = 2 + Math.random() * 2;
              const size = 4 + Math.random() * 6;
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-sm"
                  style={{ background: colors[i % colors.length], width: size, height: size, left: `${left}%`, top: "-10px" }}
                  initial={{ y: -20, opacity: 1, rotate: 0 }}
                  animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 }}
                  transition={{ duration: dur, delay, ease: "easeIn" }}
                />
              );
            })}
          </div>

          {/* Badge card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative lum-glass-float rounded-3xl p-8 max-w-sm w-full text-center border border-gold/30"
            style={{ boxShadow: "0 0 60px rgba(197,168,124,0.3)" }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={dismiss} className="absolute top-4 right-4 text-ink-muted hover:text-ink">
              <X className="w-5 h-5" />
            </button>

            <div className="text-[11px] uppercase tracking-[0.25em] text-gold mb-3 flex items-center justify-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> Achievement Unlocked
            </div>

            {/* Badge icon with glow */}
            <div className="relative inline-flex items-center justify-center w-24 h-24 mb-4">
              <div className="absolute inset-0 rounded-full bg-gradient-to-br from-gold/30 to-leaf/20 blur-xl animate-pulse" />
              <div className="relative w-24 h-24 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border-2 border-gold/40 flex items-center justify-center text-5xl">
                {current.icon}
              </div>
            </div>

            <div className="text-[20px] font-light text-ink mb-1">{current.name}</div>
            <div className="text-[13px] text-ink-muted mb-5 leading-relaxed">{current.description}</div>

            <div className="text-[10px] uppercase tracking-wide text-gold/70 mb-4">
              {current.tier} tier
            </div>

            <button
              onClick={dismiss}
              className="px-6 py-2.5 rounded-full bg-[linear-gradient(135deg,#FBEFC8,#D4B27A,#8A6A2F)] text-[#0A0805] text-[13px] font-medium hover:brightness-110 active:scale-95 transition"
            >
              Continue ✦
            </button>

            {celebrating.length > 1 && (
              <div className="text-[10px] text-ink-muted mt-3">+{celebrating.length - 1} more to see</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
