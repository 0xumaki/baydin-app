"use client";

import { create } from "zustand";

/**
 * Baydin client state — ChatGPT-style app shell state.
 * Server state (conversations, user, luck) is fetched via TanStack Query;
 * this store holds only UI state (active view, sidebar, modals).
 */

export type AppView =
  | "today"        // Daily dashboard (card-of-day, horoscope, mood, ritual, manifest)
  | "chat"          // ChatGPT-style astrologer chat
  | "tarot"         // Tarot reader (free)
  | "tarot-history" // Past tarot readings with save/bookmark
  | "birth-chart"   // Natal chart tool
  | "horoscope"     // Daily/weekly horoscope
  | "lunar-calendar" // Monthly moon phase + panchanga calendar
  | "manifest"     // Manifestation goals + confirmations (free, daily-use)
  | "ritual"        // 4-step daily ritual tracker (free, daily-use)
  | "dream-journal" // Dream journal with lunar context + AI interpretation
  | "frequency"    // Solfeggio tone sessions + breathing pacer (free, daily-use)
  | "positivity"   // Affirmation generator (1 free/day, then Luck)
  | "insights"      // Skill-based deep readings (yogas, transits, etc.)
  | "compatibility" // Partner matching (Ashtakoota + synastry)
  | "life-report"   // 7-section comprehensive report
  | "numerology"    // Pythagorean + Chaldean name/date numerology
  | "luck-store"    // Buy Luck
  | "profile"       // Stats, achievements, lifetime totals
  | "reseller"      // Reseller portal (whitelist-gated)
  | "admin";        // Admin panel (admin-gated)

type BaydinState = {
  view: AppView;
  activeConversationId: string | null;
  sidebarOpen: boolean;
  authModalOpen: boolean;
  setView: (v: AppView) => void;
  setActiveConversation: (id: string | null) => void;
  setSidebarOpen: (open: boolean) => void;
  setAuthModalOpen: (open: boolean) => void;
};

export const useStore = create<BaydinState>((set) => ({
  view: "today",
  activeConversationId: null,
  sidebarOpen: true,
  authModalOpen: false,
  setView: (view) => set({ view }),
  setActiveConversation: (id) => set({ activeConversationId: id, view: "chat" }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setAuthModalOpen: (authModalOpen) => set({ authModalOpen }),
}));
