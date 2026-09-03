"use client";

import * as React from "react";
import type { PlanetPosition } from "@/lib/astrology";

const ZODIAC_SHORT = ["Ar", "Ta", "Ge", "Ca", "Le", "Vi", "Li", "Sc", "Sa", "Cp", "Aq", "Pi"];

/**
 * SouthIndianChart — the canonical 4×4 fixed-sign grid used in Indian astrology.
 * Signs don't move (Aries always top-right, Pisces always top-right of second row, etc.)
 * Planets are placed in their sign's cell.
 * The ascendant marker (1) shows which house is the 1st.
 */
export function SouthIndianChart({
  planets,
  ascendant,
  className,
}: {
  planets: PlanetPosition[];
  ascendant: PlanetPosition;
  className?: string;
}) {
  // South Indian layout: signs are fixed in position
  // Row 0: Pis(11) | Ar(0)  | Ta(1) | Ge(2)
  // Row 1: Aq(10)  |        |       | Ca(3)
  // Row 2: Cp(9)   |        |       | Le(4)
  // Row 3: Sa(8)    | Sc(7)  | Li(6) | Vi(5)
  // The center 2×2 is empty (the "open courtyard")

  const signToCell: Record<number, { row: number; col: number }> = {
    0: { row: 0, col: 1 },  // Aries
    1: { row: 0, col: 2 },  // Taurus
    2: { row: 0, col: 3 },  // Gemini
    3: { row: 1, col: 3 },  // Cancer
    4: { row: 2, col: 3 },  // Leo
    5: { row: 3, col: 3 },  // Virgo
    6: { row: 3, col: 2 },  // Libra
    7: { row: 3, col: 1 },  // Scorpio
    8: { row: 3, col: 0 },  // Sagittarius
    9: { row: 2, col: 0 },  // Capricorn
    10: { row: 1, col: 0 }, // Aquarius
    11: { row: 0, col: 0 }, // Pisces
  };

  // Group planets by sign index
  const planetsBySign: Record<number, PlanetPosition[]> = {};
  for (const p of planets) {
    if (!planetsBySign[p.signIndex]) planetsBySign[p.signIndex] = [];
    planetsBySign[p.signIndex].push(p);
  }
  // Add ascendant to its sign
  if (ascendant) {
    if (!planetsBySign[ascendant.signIndex]) planetsBySign[ascendant.signIndex] = [];
    // Asc is already in planets as "Ascendant" in the chart
  }

  // Find the ascendant sign for the "1" marker
  const ascSignIndex = ascendant?.signIndex ?? 0;

  // Render 4×4 grid
  return (
    <div className={className} style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gridTemplateRows: "repeat(4, 1fr)", aspectRatio: "1", gap: "1px", background: "#2A2722", border: "1px solid #2A2722", borderRadius: "4px", overflow: "hidden" }}>
      {Array.from({ length: 16 }).map((_, idx) => {
        const row = Math.floor(idx / 4);
        const col = idx % 4;
        // Center 2×2 is empty (rows 1-2, cols 1-2)
        const isCenter = row >= 1 && row <= 2 && col >= 1 && col <= 2;
        if (isCenter) {
          return (
            <div key={idx} style={{ background: "#0A0908", gridColumn: "span 1", gridRow: "span 1" }}>
              {/* This cell is part of the center — only render once */}
              {row === 1 && col === 1 && (
                <div style={{ gridColumn: "span 2", gridRow: "span 2", display: "flex", alignItems: "center", justifyContent: "center", height: "100%", width: "100%", background: "#0A0908" }}>
                  <div style={{ textAlign: "center" }}>
                    <div style={{ fontSize: "10px", color: "#6B6358" }}>Ascendant</div>
                    <div style={{ fontSize: "16px", color: "#C5A572", fontWeight: 500 }}>{ZODIAC_SHORT[ascSignIndex]}</div>
                  </div>
                </div>
              )}
            </div>
          );
        }

        // Find which sign this cell belongs to
        const signEntry = Object.entries(signToCell).find(([, pos]) => pos.row === row && pos.col === col);
        const signIdx = signEntry ? parseInt(signEntry[0]) : -1;
        const cellPlanets = signIdx >= 0 ? (planetsBySign[signIdx] || []) : [];

        return (
          <div key={idx} style={{ background: "#0A0908", padding: "4px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "50px" }}>
            {/* Sign label (top-right corner) */}
            <div style={{ display: "flex", justifyContent: "flex-end" }}>
              <span style={{ fontSize: "8px", color: signIdx === ascSignIndex ? "#C5A572" : "#4A4540", fontWeight: signIdx === ascSignIndex ? 600 : 400 }}>
                {signIdx >= 0 ? ZODIAC_SHORT[signIdx] : ""}
              </span>
            </div>
            {/* Planets */}
            <div style={{ display: "flex", flexWrap: "wrap", gap: "2px" }}>
              {cellPlanets.map((p, i) => (
                <span
                  key={i}
                  style={{
                    fontSize: "10px",
                    color: p.retrograde ? "#C26B5C" : "#E8E2D5",
                    fontWeight: 400,
                  }}
                  title={`${p.name} ${p.degree.toFixed(1)}° ${p.retrograde ? "℞" : ""}`}
                >
                  {p.name.substring(0, 2)}{p.retrograde ? "℞" : ""}
                </span>
              ))}
            </div>
            {/* Ascendant house number (bottom-left) */}
            <div style={{ display: "flex", justifyContent: "flex-start" }}>
              {signIdx === ascSignIndex && (
                <span style={{ fontSize: "8px", color: "#C5A572", fontWeight: 600 }}>1</span>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
