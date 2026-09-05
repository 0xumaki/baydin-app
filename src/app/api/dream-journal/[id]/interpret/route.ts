import { NextRequest, NextResponse } from "next/server";
import { parseBirthData } from "@/lib/validate";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature } from "@/lib/luck";
import { callAstrologerLLM } from "@/lib/llm";
import { DREAM_SYMBOLS, detectSymbols } from "@/lib/dream-symbols";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 45;

/**
 * POST /api/dream-journal/[id]/interpret
 *
 * Generates an AI interpretation of the dream, drawing on:
 *   - The dream content itself
 *   - Auto-detected symbols (Vedic + Jungian meanings)
 *   - The lunar context (moon phase, nakshatra, tithi)
 *   - The user's natal chart if available (transits at time of dream)
 *
 * Cost: 2 Luck (admin bypass applies).
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await params;

  const entry = await db.dreamJournal.findUnique({ where: { id } });
  if (!entry || entry.userId !== user.id) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  // Charge Luck
  const spent = await spendForFeature({
    userId: user.id,
    feature: "dream_interpretation",
    description: `Dream interpretation: "${entry.title}"`,
  });
  if (!spent.ok) {
    return NextResponse.json(
      { error: "Insufficient Luck. You need 2 Luck for AI dream interpretation.", balance: spent.balance, cost: 2 },
      { status: 402 }
    );
  }

  // Re-detect symbols (in case content changed)
  const detectedSymbols = detectSymbols(entry.content);
  const symbolSection = detectedSymbols.length > 0
    ? "Symbols detected in the dream:\n" + detectedSymbols.map((s) =>
        `- ${s.keyword} (${s.category}, ${s.polarity}): Vedic — ${s.vedic} Jungian — ${s.jungian}`
      ).join("\n")
    : "No major archetypal symbols were auto-detected, but interpret the imagery using your own cultural lens.";

  // Lunar context
  let lunarSection = "Lunar context unavailable.";
  if (entry.lunarContext) {
    try {
      const lunar = JSON.parse(entry.lunarContext);
      lunarSection = `Lunar context at time of dream:
- Moon phase: ${lunar.emoji} ${lunar.moonPhase} (${(lunar.illumination * 100).toFixed(0)}% illuminated)
- Nakshatra: ${lunar.nakshatra} pada ${lunar.nakshatraPada}
- Tithi: ${lunar.tithi}
- Yoga: ${lunar.yoga || "n/a"}
${lunar.isPurnima ? "- Purnima (Full Moon) — dreams are especially vivid and prophetic.\n" : ""}
${lunar.isAmavasya ? "- Amavasya (New Moon) — dreams may carry ancestral messages.\n" : ""}
${lunar.isEkadashi ? "- Ekadashi — a spiritually charged night.\n" : ""}`;
    } catch { /* ignore */ }
  }

  // Birth context (optional)
  let birthSection = "";
  if (user.birthData) {
    try {
      const bd = JSON.parse(user.birthData);
      birthSection = `\nThe dreamer's natal context (use sparingly, only to highlight relevant placements): ${bd.year || "?"}-${bd.month || "?"}-${bd.day || "?"} in ${bd.place || "unknown"}.`;
    } catch { /* ignore */ }
  }

  const system = `You are Baydin, a wise dream interpreter trained in both Vedic symbolism and Jungian depth psychology. You interpret dreams with compassion, insight, and practical wisdom.

Your interpretation should:
1. Honor the dreamer's emotional experience without dismissing or pathologizing
2. Draw on the symbols' meanings (Vedic + Jungian) where relevant
3. Consider the lunar context — moon phase and nakshatra shape dream energy
4. Offer ONE actionable question for the dreamer to sit with (not advice, a question)
5. Be 4-6 short paragraphs, warm but not flabby
6. Avoid literal predictions ("you will X") — dreams speak in metaphor, not forecast
7. Write in clear, evocative English

Do not start with "Based on..." or "I interpret..." — begin with the interpretation directly.`;

  const userPrompt = `Please interpret this dream.

Title: ${entry.title}
Mood: ${entry.mood}
Recurring: ${entry.isRecurring ? "Yes, this is a recurring theme" : "No"}

Dream narrative:
"""
${entry.content}
"""

${symbolSection}

${lunarSection}
${birthSection}

Provide a thoughtful, layered interpretation. End with one question for the dreamer.`;

  const result = await callAstrologerLLM(system, userPrompt, {
    temperature: 0.8,
    maxTokens: 1200,
  });

  // Save the interpretation
  await db.dreamJournal.update({
    where: { id: entry.id },
    data: { interpretation: result.content },
  });

  return NextResponse.json({
    interpretation: result.content,
    symbols: detectedSymbols.map((s) => ({ keyword: s.keyword, vedic: s.vedic, jungian: s.jungian, polarity: s.polarity, category: s.category })),
    balance: spent.balance,
    cost: spent.cost,
  });
}
