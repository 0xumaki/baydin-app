"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useMe } from "@/lib/api-client";
import { X } from "lucide-react";
import { tierColor } from "@/lib/achievements";

export function AchievementCelebration() {
  const { data } = useMe();
  const user = data?.user;
  const [celebrating, setCelebrating] = React.useState<any[]>([]);
  const lastCheck = React.useRef<string>("");
  const prevLuck = React.useRef<number>(0);

  const checkForNew = React.useCallback(async () => {
    if (!user) return;
    // Debounce: check if Luck balance changed OR if 10s passed since last check
    const sig = `${user.luckBalance}-${user.streak}-${user.totalLuckEarned}`;
    if (sig === lastCheck.current) return;
    lastCheck.current = sig;
    try {
      const res = await fetch("/api/achievements", { credentials: "include" });
      const d = await res.json();
      if (d.newlyUnlocked?.length > 0) {
        setCelebrating((c) => [...c, ...d.newlyUnlocked]);
      }
    } catch {}
  }, [user?.luckBalance, user?.streak, user?.totalLuckEarned]);

  React.useEffect(() => {
    const t = setTimeout(checkForNew, 2000);
    const interval = setInterval(checkForNew, 15000); // also poll every 15s for non-Luck achievements
    return () => { clearTimeout(t); clearInterval(interval); };
  }, [checkForNew]);

  const dismiss = () => setCelebrating((c) => c.slice(1));
  const current = celebrating[0];
  if (!current) return null;

  const accent = tierColor(current.tier);

  return (
    <AnimatePresence>
      {current && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/85"
          onClick={dismiss}
          role="dialog"
          aria-modal="true"
          aria-label="Achievement unlocked"
        >
          {/* Confetti */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {Array.from({ length: 24 }).map((_, i) => {
              const colors = [accent, "#B5CD7E", "#E8E2D5", "#9E8AC9"];
              return (
                <motion.div
                  key={i}
                  className="absolute rounded-sm"
                  style={{
                    background: colors[i % colors.length],
                    width: 4 + Math.random() * 4,
                    height: 4 + Math.random() * 4,
                    left: `${Math.random() * 100}%`,
                    top: "-10px",
                  }}
                  initial={{ y: -20, opacity: 1, rotate: 0 }}
                  animate={{ y: "110vh", opacity: [1, 1, 0], rotate: 360 }}
                  transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5, ease: "easeIn" }}
                />
              );
            })}
          </div>

          {/* Card */}
          <motion.div
            initial={{ scale: 0.5, opacity: 0, y: 20 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 18 }}
            className="relative bg-[#0A0908] border p-8 max-w-sm w-full text-center focus-ring rounded-sm"
            style={{ borderColor: `${accent}40`, boxShadow: `0 0 60px ${accent}20` }}
            onClick={(e) => e.stopPropagation()}
          >
            <button onClick={dismiss} aria-label="Dismiss" className="absolute top-4 right-4 text-[#6B6358] hover:text-[#E8E2D5] transition">
              <X className="w-4 h-4" />
            </button>

            {/* Badge SVG */}
            <div className="relative inline-flex items-center justify-center mb-5">
              <div
                className="absolute inset-0 rounded-full blur-xl animate-pulse"
                style={{ background: `radial-gradient(circle, ${accent}40 0%, transparent 70%)` }}
              />
              <img
                src={`/badges/${current.badge || "star-bearer"}.svg`}
                alt={current.name}
                className="relative w-24 h-24"
                style={{ filter: `drop-shadow(0 0 12px ${accent}40)` }}
                onError={(e) => {
                  // Fallback: hide broken image, show emoji
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            </div>

            <div className="text-[11px] text-[#6B6358] mb-2">Achievement unlocked</div>
            <div className="serif-display text-[1.5rem] text-[#E8E2D5] mb-1">{current.name}</div>
            <div className="text-[13px] text-[#9C9489] mb-4 leading-relaxed">{current.description}</div>

            <div className="text-[11px] mb-5 serif-italic" style={{ color: accent }}>
              {current.tier} tier
            </div>

            <button
              onClick={dismiss}
              className="px-6 py-2.5 text-[13px] font-medium text-[#0A0908] hover:opacity-90 transition rounded-sm focus-ring"
              style={{ background: "#E8E2D5" }}
            >
              Continue
            </button>

            {celebrating.length > 1 && (
              <div className="text-[11px] text-[#6B6358] mt-3">+{celebrating.length - 1} more to see</div>
            )}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
