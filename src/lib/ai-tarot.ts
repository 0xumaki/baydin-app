import "server-only";
import { callTarotLLM, TAROT_SYSTEM_PROMPT } from "@/lib/llm";
import { summarizeDrawn, tallyYesNo, type DrawnCardWithMeta } from "@/lib/tarot";

/**
 * AI tarot interpretation — calls Gemini via z-ai-web-dev-sdk with Lumina's
 * engineered system prompt. Falls back to a smart template if the LLM fails.
 */

export async function interpretReading(
  question: string,
  spreadType: string,
  drawn: DrawnCardWithMeta[],
  isPremium: boolean
): Promise<string> {
  const summary = summarizeDrawn(drawn);
  const yesNoTally = spreadType === "yes-no" ? tallyYesNo(drawn) : null;

  let user = `Someone has come to you with this question: "${question}"

You are reading the ${spreadType} spread for them. Here are the cards that were drawn:

${summary}`;

  if (yesNoTally) {
    user += `

When you look at this card, the energy leans ${yesNoTally.answer.toUpperCase()}. But don't just parrot that — read the card yourself and give your own nuanced answer.`;
  }

  const depth = isPremium
    ? `Give a comprehensive, detailed reading (500-800 words): opening acknowledging their question, card-by-card (imagery + position meaning + connections), synthesis of the whole spread, specific guidance, then a TL;DR synthesizing the ENTIRE reading without naming cards, and a Summary tying it all together.`
    : spreadType === "yes-no"
    ? `Give a focused reading (6-8 sentences): start with YES/NO/MAYBE framed with nuance, describe the card, connect to their situation, then a TL;DR and Summary.`
    : `Give a focused reading (7-10 sentences): acknowledge their question, describe the imagery, connect symbolism to their question, then a TL;DR and Summary.`;

  user += `

${depth}

Give the reading now. Speak directly to them. Start with the reading itself — no preamble.`;

  const result = await callTarotLLM(TAROT_SYSTEM_PROMPT + "\n\n" + depth, user, {
    temperature: 0.9,
    maxTokens: isPremium ? 1800 : 600,
  });

  if (result && result.length > 20) return sanitizeReading(result);

  // Fallback: smart template (always works)
  return fallbackInterpretation(question, spreadType, drawn, isPremium);
}

function fallbackInterpretation(
  question: string,
  spreadType: string,
  drawn: DrawnCardWithMeta[],
  isPremium: boolean
): string {
  if (spreadType === "yes-no") {
    const tally = tallyYesNo(drawn);
    const c = drawn[0].card;
    const meaning = drawn[0].reversed ? c.meaningReversed : c.meaningUpright;
    return `${tally.answer.toUpperCase()} — ${c.name} ${drawn[0].reversed ? "(reversed)" : ""}: ${meaning}

**TL;DR:** ${tally.answer.toUpperCase()}. Trust this direction and bring awareness to how you move forward.

**Summary:** The reading answers your question with ${tally.answer}. Act on the guidance above and let the path reveal itself.`;
  }
  const c = drawn[0].card;
  const meaning = drawn[0].reversed ? c.meaningReversed : c.meaningUpright;
  return `${c.name} ${drawn[0].reversed ? "(Reversed)" : ""} — ${meaning}

**TL;DR:** The energy you need is present. Meet this moment consciously.

**Summary:** Reflect on how this maps onto your situation, then take your next step.`;
}

function sanitizeReading(text: string): string {
  let cleaned = text;
  const metaIndicators = [
    "we need to", "i will produce", "thus output", "make sure to",
    "let me", "i'll", "i will", "here is your reading", "based on the instructions",
    "note:", "disclaimer:", "remember:",
  ];
  const lower = cleaned.toLowerCase();
  if (!metaIndicators.some((p) => lower.includes(p))) return cleaned.trim();
  cleaned = cleaned.replace(/\[.*?\]/g, "").trim();
  return cleaned;
}
