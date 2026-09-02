/**
 * Baydin achievement badges — gamification system.
 * Each badge has an id, name, description, icon, tier, and unlock condition.
 * Side-effect free: pure functions for client + server.
 */

export type Achievement = {
  id: string;
  name: string;
  description: string;
  icon: string; // emoji or unicode glyph
  tier: "bronze" | "silver" | "gold" | "luminary";
  /** Returns true if the user's stats unlock this badge. */
  check: (stats: { tarot: number; chat: number; frequency: number; manifest: number; ritual: number; mood: number; streak: number; luckEarned: number; }) => boolean;
};

export const ACHIEVEMENTS: Achievement[] = [
  // Tarot
  { id: "first-draw", name: "First Draw", description: "Draw your first tarot card", icon: "🃏", tier: "bronze", check: (s) => s.tarot >= 1 },
  { id: "card-keeper", name: "Card Keeper", description: "Draw 10 tarot readings", icon: "🎴", tier: "silver", check: (s) => s.tarot >= 10 },
  { id: "cartomancer", name: "Cartomancer", description: "Draw 50 tarot readings", icon: "🔮", tier: "gold", check: (s) => s.tarot >= 50 },

  // Astrologer chat
  { id: "first-question", name: "First Question", description: "Ask the astrologer your first question", icon: "💬", tier: "bronze", check: (s) => s.chat >= 1 },
  { id: "seeker", name: "The Seeker", description: "Have 25 astrologer conversations", icon: "🌙", tier: "silver", check: (s) => s.chat >= 25 },
  { id: "confidant", name: "The Confidant", description: "Have 100 astrologer conversations", icon: "✨", tier: "gold", check: (s) => s.chat >= 100 },

  // Frequency
  { id: "first-tone", name: "First Tone", description: "Complete your first frequency session", icon: "♪", tier: "bronze", check: (s) => s.frequency >= 1 },
  { id: "resonator", name: "The Resonator", description: "Complete 25 frequency sessions", icon: "🎵", tier: "silver", check: (s) => s.frequency >= 25 },

  // Manifest
  { id: "first-intention", name: "First Intention", description: "Confirm your first daily intention", icon: "◎", tier: "bronze", check: (s) => s.manifest >= 1 },
  { id: "manifestor", name: "The Manifestor", description: "Confirm 50 daily intentions", icon: "🌟", tier: "gold", check: (s) => s.manifest >= 50 },

  // Ritual
  { id: "first-ritual", name: "First Ritual", description: "Complete your first daily ritual", icon: "🔥", tier: "bronze", check: (s) => s.ritual >= 1 },
  { id: "devoted", name: "The Devoted", description: "Complete 30 daily rituals", icon: "🕯️", tier: "gold", check: (s) => s.ritual >= 30 },

  // Mood
  { id: "first-mood", name: "First Check-in", description: "Record your first mood", icon: "♡", tier: "bronze", check: (s) => s.mood >= 1 },
  { id: "self-aware", name: "Self-Aware", description: "Record 30 mood check-ins", icon: "🧘", tier: "silver", check: (s) => s.mood >= 30 },

  // Streak
  { id: "streak-3", name: "3-Day Streak", description: "Practice 3 days in a row", icon: "🔥", tier: "bronze", check: (s) => s.streak >= 3 },
  { id: "streak-7", name: "Week Warrior", description: "Practice 7 days in a row", icon: "⚡", tier: "silver", check: (s) => s.streak >= 7 },
  { id: "streak-30", name: "Monthly Devotee", description: "Practice 30 days in a row", icon: "🏆", tier: "gold", check: (s) => s.streak >= 30 },

  // Luck economy
  { id: "first-luck", name: "First Fortune", description: "Earn your first Luck", icon: "✦", tier: "bronze", check: (s) => s.luckEarned >= 1 },
  { id: "luck-100", name: "Centurion", description: "Earn 100 Luck lifetime", icon: "💎", tier: "silver", check: (s) => s.luckEarned >= 100 },
  { id: "luck-1000", name: "Luminary", description: "Earn 1000 Luck lifetime", icon: "👑", tier: "luminary", check: (s) => s.luckEarned >= 1000 },
];

/** Evaluate which achievements a user has unlocked given their stats. */
export function evaluateAchievements(stats: { tarot: number; chat: number; frequency: number; manifest: number; ritual: number; mood: number; streak: number; luckEarned: number; }) {
  const unlocked = ACHIEVEMENTS.filter((a) => a.check(stats));
  const locked = ACHIEVEMENTS.filter((a) => !a.check(stats));
  return { unlocked, locked, total: ACHIEVEMENTS.length };
}

const TIER_COLORS: Record<Achievement["tier"], string> = {
  bronze: "#C5824A",
  silver: "#9CA8A3",
  gold: "#C5A87C",
  luminary: "#E7D2A8",
};

export function tierColor(tier: Achievement["tier"]): string {
  return TIER_COLORS[tier];
}
