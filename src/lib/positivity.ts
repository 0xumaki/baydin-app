/**
 * 11 positivity categories × affirmation templates — ported from Lumina.
 * Side-effect free: safe for both server and client.
 */

export type PositivityCategory = {
  id: string;
  name: string;
  description: string;
  color: string;
  // base frequency for ambient bed
  frequencyHz: number;
  affirmations: string[];
};

export const POSITIVITY_CATEGORIES: PositivityCategory[] = [
  {
    id: "wealth",
    name: "Wealth",
    description: "Abundance & money mindset",
    color: "#C5A87C",
    frequencyHz: 888,
    affirmations: [
      "Money flows to me in expected and unexpected ways.",
      "I am a magnet for wealth and opportunity.",
      "My income grows while I sleep.",
      "I deserve financial abundance.",
      "Every dollar I spend returns to me multiplied.",
      "I am worthy of unlimited prosperity.",
      "Wealth is my natural state of being.",
      "I release all scarcity thinking.",
    ],
  },
  {
    id: "money",
    name: "Money Confidence",
    description: "Bust money anxiety",
    color: "#C5A87C",
    frequencyHz: 528,
    affirmations: [
      "I trust the universe to provide for me.",
      "My needs are always met.",
      "I am calm and confident with money.",
      "I make wise financial decisions.",
      "Abundance is my birthright.",
      "I am free from financial worry.",
      "My relationship with money is healthy.",
      "I am generous because I have enough.",
    ],
  },
  {
    id: "health",
    name: "Health",
    description: "Body & wellness",
    color: "#B5CD7E",
    frequencyHz: 528,
    affirmations: [
      "My body knows how to heal itself.",
      "I am healthy, strong, and full of vitality.",
      "Every cell in my body vibrates with wellness.",
      "I treat my body with love and respect.",
      "Health is my natural state.",
      "I nourish myself with what my body needs.",
      "I am grateful for my healthy body.",
      "I release all tension and dis-ease.",
    ],
  },
  {
    id: "relationship",
    name: "Relationships",
    description: "Love & connection",
    color: "#D876A0",
    frequencyHz: 639,
    affirmations: [
      "I am worthy of deep, loving relationships.",
      "Love flows to me and through me.",
      "I attract people who honor and cherish me.",
      "I give and receive love freely.",
      "My heart is open to connection.",
      "I am surrounded by love.",
      "I communicate my needs clearly and kindly.",
      "I am the love I seek.",
    ],
  },
  {
    id: "power",
    name: "Personal Power",
    description: "Confidence & self-worth",
    color: "#C5A87C",
    frequencyHz: 528,
    affirmations: [
      "I stand in my power with grace.",
      "I am enough, exactly as I am.",
      "I trust my voice and my choices.",
      "I am confident in my abilities.",
      "I do not shrink to make others comfortable.",
      "My presence matters.",
      "I am the authority in my own life.",
      "I radiate quiet, unshakeable strength.",
    ],
  },
  {
    id: "career",
    name: "Career",
    description: "Purpose & success",
    color: "#5FA9C7",
    frequencyHz: 432,
    affirmations: [
      "I am exactly where I need to be.",
      "My work has value and impact.",
      "Opportunities find me.",
      "I am capable of more than I know.",
      "I grow through every challenge.",
      "Success is natural for me.",
      "I am recognized for my gifts.",
      "My career aligns with my purpose.",
    ],
  },
  {
    id: "stress-release",
    name: "Stress Release",
    description: "Calm & ease",
    color: "#B5CD7E",
    frequencyHz: 396,
    affirmations: [
      "I exhale tension and inhale calm.",
      "I am safe in this moment.",
      "Everything can wait while I breathe.",
      "I release what I cannot control.",
      "My nervous system is calming down.",
      "I trust the timing of my life.",
      "I am grounded and present.",
      "Peace is my default state.",
    ],
  },
  {
    id: "anxiety",
    name: "Anxiety Relief",
    description: "Quiet the mind",
    color: "#9CA8A3",
    frequencyHz: 285,
    affirmations: [
      "This feeling will pass.",
      "I am safe right now.",
      "My breath is my anchor.",
      "I am not my thoughts.",
      "I am held by something larger than me.",
      "I can handle whatever comes.",
      "I am stronger than my anxiety.",
      "I am grounded in the present.",
    ],
  },
  {
    id: "worries",
    name: "Worries",
    description: "Release overthinking",
    color: "#9CA8A3",
    frequencyHz: 417,
    affirmations: [
      "I release the need to control everything.",
      "I cannot predict the future, and that is OK.",
      "Worrying changes nothing.",
      "I trust the unfolding of my life.",
      "I let go of what I cannot change.",
      "I am safe to surrender.",
      "I choose faith over fear.",
      "The universe supports me.",
    ],
  },
  {
    id: "anti-negative",
    name: "Anti-Negative",
    description: "Clear energy",
    color: "#9CA8A3",
    frequencyHz: 417,
    affirmations: [
      "I release all energy that is not mine.",
      "My field is clear and protected.",
      "I do not absorb other people's moods.",
      "I am surrounded by light.",
      "Negativity cannot attach to me.",
      "I am a positive force.",
      "I choose peace over reaction.",
      "My energy is my own.",
    ],
  },
  {
    id: "promotion",
    name: "Promotion",
    description: "Rise & recognition",
    color: "#F09A3D",
    frequencyHz: 528,
    affirmations: [
      "I am ready for the next level.",
      "My work is seen and valued.",
      "I am the obvious choice for advancement.",
      "I step into greater responsibility with ease.",
      "I am ready to lead.",
      "My gifts are needed in higher places.",
      "I welcome recognition.",
      "I am promoted in expected and unexpected ways.",
    ],
  },
];

export function getCategory(id: string): PositivityCategory | undefined {
  return POSITIVITY_CATEGORIES.find((c) => c.id === id);
}
