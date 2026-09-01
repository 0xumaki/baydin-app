"use client";

import { create } from "zustand";

/**
 * Baydin client state — ChatGPT-style app shell state.
 * Server state (conversations, user, luck) is fetched via TanStack Query;
 * this store holds only UI state (active view, sidebar, modals).
 */

export type AppView =
  | "chat"          // ChatGPT-style astrologer chat (default)
  | "tarot"         // Tarot reader (free)
  | "birth-chart"   // Natal chart tool
  | "horoscope"     // Daily/weekly horoscope
  | "luck-store"    // Buy Luck
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
  view: "chat",
  activeConversationId: null,
  sidebarOpen: true,
  authModalOpen: false,
  setView: (view) => set({ view }),
  setActiveConversation: (id) => set({ activeConversationId: id, view: "chat" }),
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setAuthModalOpen: (authModalOpen) => set({ authModalOpen }),
}));
