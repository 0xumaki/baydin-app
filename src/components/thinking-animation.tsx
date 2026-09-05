"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Star, Moon, Sun, Sparkles, Flame, Heart, Zap, Eye } from "lucide-react";

/**
 * ThinkingAnimation — shows during LLM generation with mini entertainment.
 * Rotates through astrology facts + a cosmic pulse animation to amuse the user.
 */

const FACTS = [
  "The Moon moves about 13° per day — visiting each zodiac sign for ~2.3 days.",
  "Saturn takes 29.5 years to orbit the Sun — your Saturn Return happens once per generation.",
  "Mercury retrograde occurs 3-4 times per year, each lasting about 3 weeks.",
  "The Vimshottari dasha system spans 120 years, divided among 9 planets.",
  "Rahu and Ketu are not physical planets — they are the lunar nodes, points of eclipse.",
  "Jupiter's transit through a sign takes about 1 year — it brings expansion to that house.",
  "The Nakshatras are 27 lunar mansions, each spanning 13°20' of the zodiac.",
  "Venus retrogrades only once every 18 months — a time to revisit love and values.",
  "Mars stays in a sign for about 1.5 months, bringing energy to that area of life.",
  "Your Ascendant changes every 2 hours — it determines the chart's entire house structure.",
  "The Sun takes exactly 1 year to traverse all 12 signs, spending ~30 days in each.",
  "Ketu represents past-life karma — its house placement shows where you've already mastered.",
];

const ICONS = [Star, Moon, Sun, Sparkles, Flame, Heart, Zap, Eye];
const COLORS = ["#C5A572", "#9CB4D1", "#D4A0B8", "#7A8B6F", "#E8B557", "#D58FA3", "#8FA37E", "#B8553F"];

export function ThinkingAnimation() {
  const [factIndex, setFactIndex] = React.useState(0);
  const [iconIndex, setIconIndex] = React.useState(0);

  React.useEffect(() => {
    const factTimer = setInterval(() => {
      setFactIndex((i) => (i + 1) % FACTS.length);
    }, 4000);
    const iconTimer = setInterval(() => {
      setIconIndex((i) => (i + 1) % ICONS.length);
    }, 800);
    return () => { clearInterval(factTimer); clearInterval(iconTimer); };
  }, []);

  const Icon = ICONS[iconIndex];
  const color = COLORS[iconIndex];

  return (
    <div className="flex gap-4">
      {/* Avatar with pulsing icon */}
      <div className="w-8 h-8 rounded-sm bg-[#1A1714] border border-[#2A2722] flex items-center justify-center shrink-0 mt-0.5 relative overflow-hidden">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 1.5, repeat: Infinity, ease: "easeInOut" }}
          style={{ color }}
        >
          <Icon className="w-3.5 h-3.5" />
        </motion.div>
        {/* Orbiting dot */}
        <motion.div
          className="absolute w-1 h-1 rounded-full"
          style={{ background: color }}
          animate={{
            rotate: 360,
            x: [0, 8, 0, -8, 0],
            y: [0, 0, -8, 0, 0],
          }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
      </div>

      {/* Content area */}
      <div className="flex-1 min-w-0">
        {/* Typing indicator */}
        <div className="flex items-center gap-1.5 mb-2">
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#C5A572]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0 }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#C5A572]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.2 }}
          />
          <motion.div
            className="w-1.5 h-1.5 rounded-full bg-[#C5A572]"
            animate={{ opacity: [0.3, 1, 0.3] }}
            transition={{ duration: 0.8, repeat: Infinity, delay: 0.4 }}
          />
          <span className="text-[12px] text-[#6B6358] ml-1 serif-italic">reading the stars…</span>
        </div>

        {/* Rotating fact card */}
        <AnimatePresence mode="wait">
          <motion.div
            key={factIndex}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.4 }}
            className="p-3 border border-[#2A2722] rounded-sm bg-[#0A0908]"
          >
            <div className="flex items-start gap-2">
              <Sparkles className="w-3 h-3 text-[#C5A572] shrink-0 mt-0.5" />
              <span className="text-[12px] text-[#9C9489] leading-[1.6]">
                {FACTS[factIndex]}
              </span>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
