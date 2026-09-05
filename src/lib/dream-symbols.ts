/**
 * BAYDIN — Dream symbol dictionary.
 *
 * A curated lexicon of common dream symbols with Vedic + Jungian
 * interpretations. Used to auto-detect symbols in user dream narratives
 * and provide quick interpretations.
 *
 * Symbol meanings blend:
 *  - Vedic / Hindu tradition (e.g. snake = Kundalini, elephant = Ganesha)
 *  - Jungian archetypes (water = unconscious, fire = transformation)
 *  - Universal folklore (falling = loss of control, flying = freedom)
 */

export type DreamSymbol = {
  keyword: string;
  aliases: string[];
  category: "animal" | "nature" | "object" | "person" | "action" | "emotion" | "setting";
  vedic: string;
  jungian: string;
  element: "Fire" | "Earth" | "Air" | "Water" | "Spirit";
  polarity: "auspicious" | "warning" | "neutral" | "transformative";
};

export const DREAM_SYMBOLS: DreamSymbol[] = [
  // ===== ANIMALS =====
  {
    keyword: "snake",
    aliases: ["serpent", "cobra", "naga"],
    category: "animal",
    vedic: "Kundalini energy, hidden wisdom. A white snake = divine blessing; a black one = unresolved fear.",
    jungian: "The shadow self, transformation, healing (caduceus). Shedding skin = releasing old identity.",
    element: "Spirit",
    polarity: "transformative",
  },
  {
    keyword: "elephant",
    aliases: ["ganesha"],
    category: "animal",
    vedic: "Ganesha — remover of obstacles. Auspicious for new beginnings, wisdom, memory, and patience.",
    jungian: "The Self archetype — power held in reserve, ancestral memory, grounded wisdom.",
    element: "Earth",
    polarity: "auspicious",
  },
  {
    keyword: "cow",
    aliases: ["bull", "cattle"],
    category: "animal",
    vedic: "Sacred to Krishna — abundance, dharma, motherly nourishment, patience.",
    jungian: "Fertility, the Great Mother, contentment with what is.",
    element: "Earth",
    polarity: "auspicious",
  },
  {
    keyword: "tiger",
    aliases: ["lion"],
    category: "animal",
    vedic: "Power, dharma's protector (Durga's vahana). Raw primal strength, courage.",
    jungian: "The golden shadow — power you have not yet integrated into your waking life.",
    element: "Fire",
    polarity: "transformative",
  },
  {
    keyword: "bird",
    aliases: ["eagle", "crow", "peacock", "swan", "dove"],
    category: "animal",
    vedic: "Soul, messenger between worlds. Garuda = Vishnu's mount, divine protection.",
    jungian: "Thought, aspiration, the spirit's flight beyond the material.",
    element: "Air",
    polarity: "auspicious",
  },
  {
    keyword: "fish",
    aliases: ["whale", "dolphin"],
    category: "animal",
    vedic: "Matsya avatar of Vishnu — salvation, deep wisdom from the unconscious depths.",
    jungian: "Christ symbol, contents rising from the personal unconscious into awareness.",
    element: "Water",
    polarity: "auspicious",
  },
  {
    keyword: "horse",
    aliases: ["stallion", "mare"],
    category: "animal",
    vedic: "The Ashwini Kumaras — vitality, swift movement, healing journeys.",
    jungian: "Instinctual drive, the body's vitality, sexual energy.",
    element: "Fire",
    polarity: "neutral",
  },
  {
    keyword: "dog",
    aliases: ["wolf"],
    category: "animal",
    vedic: "Bhairava's mount — loyalty, dharma guardian, but also Yama's messenger.",
    jungian: "Loyalty, the instinctual self, shadow aspects of trust.",
    element: "Earth",
    polarity: "neutral",
  },
  {
    keyword: "cat",
    aliases: ["kitten"],
    category: "animal",
    vedic: "Independence, mystery, the feminine night principle.",
    jungian: "The independent feminine, secrecy, alertness to the unseen.",
    element: "Spirit",
    polarity: "neutral",
  },
  {
    keyword: "spider",
    aliases: ["web"],
    category: "animal",
    vedic: "Maya — the weaver of illusion. A reminder that reality is interwoven.",
    jungian: "The Great Mother in her weaving aspect, creativity vs. entrapment.",
    element: "Spirit",
    polarity: "transformative",
  },

  // ===== NATURE =====
  {
    keyword: "water",
    aliases: ["ocean", "sea", "river", "lake", "rain"],
    category: "nature",
    vedic: "Emotions, the lunar principle, purification. Calm water = clarity; turbulent = unresolved feelings.",
    jungian: "The unconscious mind. The depths hold the shadow and the treasure.",
    element: "Water",
    polarity: "neutral",
  },
  {
    keyword: "fire",
    aliases: ["flame", "burning", "bonfire"],
    category: "nature",
    vedic: "Agni — transformation, purification, divine message. Controlled = ritual; wild = anger.",
    jungian: "Passion, destruction-and-renewal, the transformative instinct.",
    element: "Fire",
    polarity: "transformative",
  },
  {
    keyword: "mountain",
    aliases: ["hill", "peak"],
    category: "nature",
    vedic: "Meru — the cosmic axis, spiritual aspiration, steady practice (abhyasa).",
    jungian: "The Self, the goal of individuation, something that demands patient ascent.",
    element: "Earth",
    polarity: "auspicious",
  },
  {
    keyword: "tree",
    aliases: ["forest", "banyan", "peepal"],
    category: "nature",
    vedic: "Kalpavriksha — wish-fulfilling, rooted in dharma. Peepal = Buddha's enlightenment.",
    jungian: "The Self, growth from unconscious roots into conscious flowering.",
    element: "Earth",
    polarity: "auspicious",
  },
  {
    keyword: "flower",
    aliases: ["lotus", "rose", "bloom"],
    category: "nature",
    vedic: "Lotus = spiritual unfoldment from the mud of attachment. Beauty emerging from the unconscious.",
    jungian: "The Self in bloom, the feminine, a moment of completion.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "sun",
    aliases: ["sunlight", "dawn"],
    category: "nature",
    vedic: "Surya — the Self, consciousness, the father principle, clarity.",
    jungian: "Consciousness, the masculine, the light of awareness dispelling shadow.",
    element: "Fire",
    polarity: "auspicious",
  },
  {
    keyword: "moon",
    aliases: ["moonlight", "full moon"],
    category: "nature",
    vedic: "Chandra — the mind (manas), emotions, the feminine, cycles, dreams themselves.",
    jungian: "The unconscious, the anima, the reflective principle that mirrors the sun.",
    element: "Water",
    polarity: "neutral",
  },
  {
    keyword: "star",
    aliases: ["stars", "constellation"],
    category: "nature",
    vedic: "Destiny, guidance from the ancestors (Pitris), cosmic order.",
    jungian: "The Self, hope, a distant wholeness calling.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "storm",
    aliases: ["lightning", "thunder", "wind"],
    category: "nature",
    vedic: "Indra's energy — sudden change, karmic clearing, the power of the gods.",
    jungian: "Affect, psychic upheaval, a breakthrough disguised as breakdown.",
    element: "Air",
    polarity: "transformative",
  },
  {
    keyword: "rainbow",
    aliases: [],
    category: "nature",
    vedic: "Indra's bow — divine promise, the bridge between worlds, hope after hardship.",
    jungian: "Wholeness, integration of opposites, the bridge from ego to Self.",
    element: "Spirit",
    polarity: "auspicious",
  },

  // ===== OBJECTS =====
  {
    keyword: "door",
    aliases: ["gate", "portal", "threshold"],
    category: "object",
    vedic: "A transition between states — opportunity, choice, the unknown.",
    jungian: "The threshold of consciousness; opening = new insight; locked = resistance.",
    element: "Spirit",
    polarity: "transformative",
  },
  {
    keyword: "key",
    aliases: [],
    category: "object",
    vedic: "Knowledge, the solution to a riddle, access to a locked mystery.",
    jungian: "The insight that unlocks a complex; the symbol that resolves a tension.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "mirror",
    aliases: ["reflection"],
    category: "object",
    vedic: "Self-knowledge, the witness (sakshi) seeing itself.",
    jungian: "The Self, confronting the shadow, projection and recognition.",
    element: "Spirit",
    polarity: "transformative",
  },
  {
    keyword: "book",
    aliases: ["scroll", "manuscript"],
    category: "object",
    vedic: "Vedas — revealed knowledge, study (svadhyaya), a teaching coming.",
    jungian: "The wisdom tradition, your own unwritten story.",
    element: "Air",
    polarity: "auspicious",
  },
  {
    keyword: "house",
    aliases: ["home", "temple", "palace"],
    category: "object",
    vedic: "The body, the self; rooms = different aspects of the psyche.",
    jungian: "The Self; the structure of the psyche. Attic = higher mind; cellar = shadow.",
    element: "Earth",
    polarity: "neutral",
  },
  {
    keyword: "ring",
    aliases: ["circle"],
    category: "object",
    vedic: "Eternity, commitment, a cycle completing. Wedding ring = partnership dharma.",
    jungian: "The Self, wholeness, the mandala of the psyche.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "knife",
    aliases: ["sword", "dagger", "blade"],
    category: "object",
    vedic: "Discrimination (viveka), cutting through illusion, the goddess's weapon.",
    jungian: "The intellect severing attachment, aggression, decisive action.",
    element: "Air",
    polarity: "transformative",
  },
  {
    keyword: "money",
    aliases: ["gold", "coins", "treasure"],
    category: "object",
    vedic: "Lakshmi — abundance, value, the exchange principle. Hoarding = attachment.",
    jungian: "Psychic energy, libido, what you value; finding = discovering self-worth.",
    element: "Earth",
    polarity: "neutral",
  },

  // ===== PERSONS =====
  {
    keyword: "mother",
    aliases: ["mom", "mama"],
    category: "person",
    vedic: "Shakti, the divine feminine, your source, nourishment, attachment.",
    jungian: "The Great Mother archetype; nurturing vs. devouring aspects.",
    element: "Water",
    polarity: "neutral",
  },
  {
    keyword: "father",
    aliases: ["dad", "papa"],
    category: "person",
    vedic: "Authority, dharma, the seed-self, guidance from above.",
    jungian: "The Father archetype; law, order, the masculine principle.",
    element: "Fire",
    polarity: "neutral",
  },
  {
    keyword: "child",
    aliases: ["baby", "infant"],
    category: "person",
    vedic: "The atman, innocence, a new beginning, the eternal child (sanatana).",
    jungian: "The Divine Child archetype, new potential, the Self reborn.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "stranger",
    aliases: ["unknown person", "intruder"],
    category: "person",
    vedic: "An unrecognized aspect of yourself; a karmic visitor.",
    jungian: "The Shadow — qualities you have not yet owned in yourself.",
    element: "Spirit",
    polarity: "transformative",
  },
  {
    keyword: "god",
    aliases: ["deity", "goddess", "divine"],
    category: "person",
    vedic: "Darshana — direct encounter with the divine. A call to devotion or service.",
    jungian: "The Self archetype, the supreme wholeness, the God-image in the psyche.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "ghost",
    aliases: ["spirit", "apparition"],
    category: "person",
    vedic: "Pitri — ancestral presence, unfinished karma, the past seeking resolution.",
    jungian: "The returning repressed, contents demanding integration.",
    element: "Spirit",
    polarity: "warning",
  },

  // ===== ACTIONS =====
  {
    keyword: "flying",
    aliases: ["flight", "soar"],
    category: "action",
    vedic: "Freedom from gravity (attachment), astral travel, expanded consciousness.",
    jungian: "Aspiration, transcendence, liberation from the earthbound ego.",
    element: "Air",
    polarity: "auspicious",
  },
  {
    keyword: "falling",
    aliases: ["fall", "drop"],
    category: "action",
    vedic: "Loss of control, a wake-up call, pride before a fall.",
    jungian: "Loss of ego support, fear of failure, re-entry into the unconscious.",
    element: "Air",
    polarity: "warning",
  },
  {
    keyword: "running",
    aliases: ["chase", "flee"],
    category: "action",
    vedic: "Avoidance — what you run from defines your karma. Turn and face it.",
    jungian: "Flight from the shadow; the pursuer is the unlived part of you.",
    element: "Fire",
    polarity: "warning",
  },
  {
    keyword: "drowning",
    aliases: ["sinking", "submerged"],
    category: "action",
    vedic: "Overwhelm by emotion (the lunar principle). A call to surrender.",
    jungian: "The unconscious swallowing the ego; a transformative ordeal.",
    element: "Water",
    polarity: "warning",
  },
  {
    keyword: "dancing",
    aliases: ["dance"],
    category: "action",
    vedic: "Nataraja — Shiva's cosmic dance, creation and destruction in rhythm.",
    jungian: "The play of the Self, integration of opposites in motion.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "climbing",
    aliases: ["ascent"],
    category: "action",
    vedic: "Tapas — disciplined effort toward a spiritual goal.",
    jungian: "Individuation, the climb toward wholeness.",
    element: "Earth",
    polarity: "auspicious",
  },
  {
    keyword: "wedding",
    aliases: ["marriage"],
    category: "action",
    vedic: "Union of Shiva-Shakti, the sacred marriage, integration of opposites.",
    jungian: "The coniunctio — union of conscious and unconscious, anima/animus integration.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "death",
    aliases: ["dying", "funeral", "corpse"],
    category: "action",
    vedic: "Transformation — the death of one phase, the seed of another. NOT a literal omen.",
    jungian: "Ego death, the end of an old identity, renewal.",
    element: "Spirit",
    polarity: "transformative",
  },
  {
    keyword: "birth",
    aliases: ["born", "newborn"],
    category: "action",
    vedic: "Reincarnation, a new beginning, karmic opportunity.",
    jungian: "The birth of a new Self, creative emergence.",
    element: "Spirit",
    polarity: "auspicious",
  },

  // ===== EMOTIONS =====
  {
    keyword: "fear",
    aliases: ["afraid", "terror", "scared"],
    category: "emotion",
    vedic: "A signal — what you fear points to your dharma's edge. Move toward it.",
    jungian: "The shadow beckoning; fear marks the threshold of growth.",
    element: "Fire",
    polarity: "warning",
  },
  {
    keyword: "joy",
    aliases: ["happiness", "bliss", "delight"],
    category: "emotion",
    vedic: "Ananda — the natural state of the Self when the mind is clear.",
    jungian: "The Self shining through; a moment of alignment with your true nature.",
    element: "Spirit",
    polarity: "auspicious",
  },
  {
    keyword: "anger",
    aliases: ["rage", "fury"],
    category: "emotion",
    vedic: "Agni suppressed — needs conscious expression, not suppression or venting.",
    jungian: "Psychic energy seeking a channel; the warrior archetype demanding integration.",
    element: "Fire",
    polarity: "transformative",
  },

  // ===== SETTINGS =====
  {
    keyword: "school",
    aliases: ["classroom", "exam"],
    category: "setting",
    vedic: "Gurukul — a lesson arriving, a test of readiness.",
    jungian: "The Self being tested; socialization patterns returning for review.",
    element: "Air",
    polarity: "neutral",
  },
  {
    keyword: "bridge",
    aliases: [],
    category: "setting",
    vedic: "Transition between states, a connection across an inner divide.",
    jungian: "The symbol of moving from one phase of life to another.",
    element: "Spirit",
    polarity: "transformative",
  },
  {
    keyword: "cave",
    aliases: ["cavern", "tunnel"],
    category: "setting",
    vedic: "The heart's inner sanctum (guha), the place of meditation and revelation.",
    jungian: "The unconscious itself; descent into the Self, initiation.",
    element: "Earth",
    polarity: "transformative",
  },
  {
    keyword: "garden",
    aliases: ["meadow", "field"],
    category: "setting",
    vedic: "Cultivated nature — your karma tended consciously. Fertility of the soul.",
    jungian: "The tended psyche, the inner work growing fruit.",
    element: "Earth",
    polarity: "auspicious",
  },
];

/**
 * Detect symbols mentioned in a dream narrative.
 * Returns the matching DreamSymbol entries (deduplicated by keyword).
 */
export function detectSymbols(content: string): DreamSymbol[] {
  const lower = content.toLowerCase();
  const found: DreamSymbol[] = [];
  const seen = new Set<string>();
  for (const sym of DREAM_SYMBOLS) {
    if (seen.has(sym.keyword)) continue;
    const candidates = [sym.keyword, ...sym.aliases];
    const matched = candidates.some((c) => {
      // word boundary match, allow plural 's'
      const re = new RegExp(`\\b${c.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}s?\\b`, "i");
      return re.test(lower);
    });
    if (matched) {
      found.push(sym);
      seen.add(sym.keyword);
    }
  }
  return found;
}

/** Mood options for the dream entry form. */
export const DREAM_MOODS = [
  { id: "peaceful", label: "Peaceful", emoji: "🌙", color: "#9CB4D1", desc: "Calm, serene, harmonious" },
  { id: "vivid", label: "Vivid", emoji: "✨", color: "#C5A87C", desc: "Bright, detailed, memorable" },
  { id: "nightmare", label: "Nightmare", emoji: "🔥", color: "#B8553F", desc: "Frightening, distressing" },
  { id: "lucid", label: "Lucid", emoji: "👁", color: "#7A8B6F", desc: "Aware you were dreaming" },
  { id: "prophetic", label: "Prophetic", emoji: "⭐", color: "#D4A0B8", desc: "Felt significant, symbolic" },
  { id: "neutral", label: "Neutral", emoji: "○", color: "#8B7355", desc: "Neither positive nor negative" },
] as const;

export type DreamMood = (typeof DREAM_MOODS)[number]["id"];
