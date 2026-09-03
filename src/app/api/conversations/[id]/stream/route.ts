import { NextRequest } from "next/server";
import { getCurrentUser } from "@/lib/auth";
import { db } from "@/lib/db";
import { spendForFeature } from "@/lib/luck";
import { computeNatalChart, computeTransits, type BirthContext, type AstrologyMode, type NatalChart } from "@/lib/astrology";
import { renderChatPrompt, streamAstrologerLLM } from "@/lib/llm";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const maxDuration = 60;

/**
 * SSE streaming astrologer chat — ChatGPT-style.
 *
 * Flow:
 * 1. Auth + load conversation + history
 * 2. Spend Luck (astrologer_chat = 2 Luck). If insufficient → return a 402 event.
 * 3. Compute natal chart (cached on the conversation) from user's birth data.
 * 4. Render prompt with chart + transits + history + memory.
 * 5. Stream LLM response as SSE text/event-stream chunks.
 * 6. Persist user + assistant messages, update conversation title if first turn.
 */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const user = await getCurrentUser();
  if (!user) {
    return sseError("unauthorized", "Please sign in to continue.");
  }
  const { id } = await params;
  const conversation = await db.conversation.findFirst({
    where: { id, userId: user.id },
  });
  if (!conversation) {
    return sseError("not_found", "Conversation not found.");
  }
  const body = await req.json();
  const userMessage: string = (body.message ?? "").toString().trim();
  if (!userMessage) {
    return sseError("empty", "Please enter a message.");
  }

  // --- Persist the user message first ---
  await db.message.create({
    data: { conversationId: id, role: "user", content: userMessage },
  });
  await db.conversation.update({
    where: { id },
    data: { messageCount: { increment: 1 }, updatedAt: new Date() },
  });

  // --- Spend Luck (unless this is the first message — give one free turn) ---
  const isFirstTurn = conversation.messageCount === 0;
  let luckResult: { ok: boolean; balance: number; cost: number; reason?: string } | null = null;
  if (!isFirstTurn) {
    luckResult = await spendForFeature({
      userId: user.id,
      feature: "astrologer_chat",
      referenceId: id,
      description: `Astrologer chat turn in "${conversation.title}"`,
    });
    if (!luckResult.ok) {
      return sseError("insufficient_luck", "You're out of Luck. Top up to continue your consultation.", {
        balance: luckResult.balance,
        cost: luckResult.cost,
      });
    }
  }
  const luckCost = isFirstTurn ? 0 : (luckResult?.cost ?? 2);

  // --- Compute / fetch cached natal chart ---
  let chart: NatalChart | null = null;
  let transits: any = null;
  const birthData: BirthContext | null = user.birthData ? JSON.parse(user.birthData) : null;
  const mode = (conversation.astrologyMode as AstrologyMode) || "vedic";

  if (birthData && (conversation.mode === "astrologer" || conversation.mode === "birth-chart")) {
    if (conversation.chartData) {
      try { chart = JSON.parse(conversation.chartData); } catch { chart = null; }
    }
    if (!chart) {
      try {
        chart = computeNatalChart(birthData, mode);
        await db.conversation.update({ where: { id }, data: { chartData: JSON.stringify(chart) } });
      } catch (e) {
        console.error("Chart compute failed:", e);
      }
    }
    try { transits = computeTransits(birthData, chart!, 7); } catch { /* non-fatal */ }
  }

  // --- Build history from DB ---
  const historyRows = await db.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: "asc" },
    take: 16,
    select: { role: true, content: true },
  });
  const history = historyRows.slice(0, -1).map((m) => ({
    role: (m.role === "user" ? "user" : "assistant") as "user" | "assistant",
    content: m.content,
  }));

  // --- Render prompt ---
  const { system, user: userPrompt } = renderChatPrompt({
    mode,
    language: user.language || "my",
    gender: birthData?.gender ?? null,
    chart,
    transits,
    history,
    userMessage,
    userMemory: null,
  });

  // --- Stream the LLM response via SSE ---
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const send = (event: string, data: any) => {
        try {
          controller.enqueue(encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`));
        } catch {
          // controller already closed (client disconnected)
        }
      };

      send("phase", { phase: "calculating", luckSpent: luckCost, balance: user.luckBalance - luckCost });

      let fullText = "";
      let parsed: any = null;
      let clientDisconnected = false;
      try {
        send("phase", { phase: "writing" });
        // Stream in a single pass; capture the generator return value on done.
        const gen = streamAstrologerLLM(system, userPrompt, { temperature: 0.7, maxTokens: 2048 });
        while (true) {
          // Check if client has disconnected between chunks
          if (req.signal.aborted) {
            clientDisconnected = true;
            break;
          }
          const r = await gen.next();
          if (r.done) {
            parsed = r.value?.parsed ?? null;
            break;
          }
          if (r.value) {
            fullText += r.value;
            send("writing", { delta: r.value, tail: fullText.slice(-200) });
          }
        }
      } catch (err: any) {
        console.error("Stream error:", err);
        send("error", { message: "The astrologer couldn't finish. Please try again." });
        controller.close();
        return;
      }

      const content = parsed?.content || fullText || "I apologize — I couldn't complete that reading.";
      const highlights = parsed?.highlights ?? [];
      const guidance = parsed?.guidance ?? null;

      // --- Persist the assistant message (even if client disconnected,
      //     so the conversation history is complete on next load) ---
      const saved = await db.message.create({
        data: {
          conversationId: id,
          role: "assistant",
          content,
          metadata: JSON.stringify({ highlights, guidance, luckCost, interpretationType: "chat" }),
        },
      });
      await db.conversation.update({
        where: { id },
        data: {
          messageCount: { increment: 1 },
          totalLuckCost: { increment: luckCost },
          updatedAt: new Date(),
          ...(isFirstTurn ? { title: userMessage.slice(0, 60) } : {}),
        },
      });

      // Only send the "done" event if the client is still connected
      if (!clientDisconnected && !req.signal.aborted) {
        send("done", {
          content,
          highlights,
          guidance,
          luckSpent: luckCost,
          messageId: saved.id,
        });
      }
      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
    },
  });
}

function sseError(code: string, message: string, extra?: any) {
  const body = `event: error\ndata: ${JSON.stringify({ code, message, ...extra })}\n\n`;
  return new Response(body, {
    status: 200, // 200 so the EventSource on the client can receive the event
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
    },
  });
}
