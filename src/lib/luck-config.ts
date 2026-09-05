/**
 * Client-safe copy of FeatureId + FEATURE_COSTS.
 *
 * The canonical definitions live in `@/lib/luck` (server-only — it imports
 * Prisma `db`). To use these constants on the client without dragging the
 * server-only boundary into the browser bundle, this file re-exports the
 * pure-data subset that has no Prisma dependency.
 *
 * Keep this file in sync with `src/lib/luck.ts` when adding/removing features.
 */

export type FeatureId =
  | "astrologer_chat"
  | "birth_chart"
  | "insight"
  | "life_report"
  | "compatibility"
  | "mahabote"
  | "horoscope_personal"
  | "tarot_premium"
  | "numerology"
  | "positivity"
  | "dream_interpretation";

export const FEATURE_COSTS: Record<FeatureId, number> = {
  astrologer_chat: 2, // per message
  birth_chart: 3,
  insight: 3,
  life_report: 15,
  compatibility: 5,
  mahabote: 3,
  horoscope_personal: 2,
  tarot_premium: 1,
  numerology: 3,
  positivity: 1, // positivity script after free daily
  dream_interpretation: 2,
};

export const FEATURE_LABELS: Record<FeatureId, string> = {
  astrologer_chat: "Astrologer Chat",
  birth_chart: "Birth Chart",
  insight: "Insight",
  life_report: "Life Report",
  compatibility: "Compatibility",
  mahabote: "Mahabote",
  horoscope_personal: "Personal Horoscope",
  tarot_premium: "Premium Tarot",
  numerology: "Numerology",
  positivity: "Positivity",
  dream_interpretation: "Dream Interpretation",
};

/** All known feature IDs in display order. */
export const FEATURE_IDS: FeatureId[] = Object.keys(FEATURE_COSTS) as FeatureId[];
