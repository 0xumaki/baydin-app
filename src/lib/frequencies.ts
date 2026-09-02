/**
 * 12 Solfeggio frequency presets — ported from Lumina.
 * Side-effect free: safe for both server and client.
 */

export type FrequencyPreset = {
  id: string;
  name: string;
  hz: number;
  intention: string;
  color: string;
  description: string;
};

export const FREQUENCIES: FrequencyPreset[] = [
  { id: "abundance", name: "Abundance", hz: 888, intention: "abundance", color: "#C5A87C", description: "Wealth & prosperity" },
  { id: "love", name: "Love", hz: 639, intention: "love", color: "#D876A0", description: "Connection & harmony" },
  { id: "healing", name: "Healing", hz: 528, intention: "healing", color: "#B5CD7E", description: "DNA repair & restoration" },
  { id: "intuition", name: "Intuition", hz: 852, intention: "intuition", color: "#9E8AC9", description: "Inner knowing & third eye" },
  { id: "transformation", name: "Transformation", hz: 741, intention: "transformation", color: "#5FA9C7", description: "Change & awakening" },
  { id: "protection", name: "Protection", hz: 417, intention: "protection", color: "#9CA8A3", description: "Clearing & shielding" },
  { id: "clarity", name: "Clarity", hz: 432, intention: "clarity", color: "#5FA9C7", description: "Cosmic harmony & focus" },
  { id: "peace", name: "Peace", hz: 396, intention: "peace", color: "#B5CD7E", description: "Release fear & guilt" },
  { id: "creativity", name: "Creativity", hz: 417, intention: "creativity", color: "#F09A3D", description: "Inspiration & expression" },
  { id: "spiritual", name: "Spiritual Growth", hz: 963, intention: "spiritual", color: "#9E8AC9", description: "Crown & unity" },
  { id: "confidence", name: "Confidence", hz: 528, intention: "confidence", color: "#C5A87C", description: "Self-worth & power" },
  { id: "release", name: "Release", hz: 285, intention: "release", color: "#9CA8A3", description: "Letting go" },
];

export function getFrequency(id: string): FrequencyPreset | undefined {
  return FREQUENCIES.find((f) => f.id === id);
}
