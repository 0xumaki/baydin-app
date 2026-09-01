"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GhostButton, Pill } from "@/components/lumina/primitives";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useMe, api } from "@/lib/api-client";
import { MessageSquare, Send, Sparkles, Plus, Clock, ChevronDown, Star, Moon, Sun, Heart, Download } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";

const SUGGESTIONS = [
  { icon: Star, text: "Read my birth chart", mode: "vedic" },
  { icon: Heart, text: "What does my love life look like?", mode: "vedic" },
  { icon: Moon, text: "Today's horoscope for me", mode: "vedic" },
  { icon: Sun, text: "Tell me about my Mahabote sign", mode: "mahabote" },
];

type Msg = { id?: string; role: "user" | "assistant" | "system"; content: string; metadata?: any };

export function ChatView({ onAuth }: { onAuth: () => void }) {
  const { data } = useMe();
  const user = data?.user;
  const { activeConversationId, setActiveConversation } = useStore();
  const qc = useQueryClient();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState("");
  const [mode, setMode] = React.useState<"vedic" | "western" | "mahabote">("vedic");
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const inputRef = React.useRef<HTMLTextAreaElement>(null);

  const { data: convData } = useQuery({
    queryKey: ["conversations"],
    queryFn: () => api<{ conversations: any[] }>("/api/conversations"),
    enabled: !!user,
  });

  const { data: msgData } = useQuery({
    queryKey: ["messages", activeConversationId],
    queryFn: () => api<{ messages: any[] }>(`/api/conversations/${activeConversationId}/messages`),
    enabled: !!activeConversationId && !!user,
  });

  React.useEffect(() => {
    if (msgData?.messages) {
      setMessages(msgData.messages.map((m) => ({ id: m.id, role: m.role, content: m.content, metadata: m.metadata ? JSON.parse(m.metadata) : null })));
    } else if (!activeConversationId) {
      setMessages([]);
    }
  }, [msgData, activeConversationId]);

  React.useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, streamText]);

  const hasBirthData = !!user?.birthData;

  async function ensureConversation(): Promise<string | null> {
    if (activeConversationId) return activeConversationId;
    if (!user) return null;
    const res = await api<{ conversation: any }>("/api/conversations", {
      method: "POST",
      json: { mode: "astrologer", astrologyMode: mode, title: "New consultation" },
    });
    setActiveConversation(res.conversation.id);
    qc.invalidateQueries({ queryKey: ["conversations"] });
    return res.conversation.id;
  }

  async function send(text: string) {
    if (!user) { onAuth(); return; }
    if (!text.trim() || streaming) return;
    const convId = await ensureConversation();
    if (!convId) return;

    setMessages((m) => [...m, { role: "user", content: text }]);
    setStreaming(true);
    setStreamText("");
    if (inputRef.current) inputRef.current.value = "";

    try {
      const res = await fetch(`/api/conversations/${convId}/stream`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ message: text }),
      });
      if (!res.ok || !res.body) throw new Error("Stream failed");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let fullText = "";
      let finalData: any = null;

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";
        let eventType = "";
        for (const line of lines) {
          if (line.startsWith("event: ")) eventType = line.slice(7).trim();
          else if (line.startsWith("data: ")) {
            try {
              const d = JSON.parse(line.slice(6));
              if (eventType === "writing" && d.tail !== undefined) { fullText = d.tail; setStreamText(d.tail); }
              else if (eventType === "done") { finalData = d; }
              else if (eventType === "error") {
                if (d.code === "insufficient_luck") {
                  finalData = { content: `_You're out of Luck. Visit **Buy Luck** to top up and continue your consultation._`, error: true };
                  toast.error(d.message);
                } else toast.error(d.message || "Something went wrong");
              }
            } catch {}
          }
        }
      }

      const content = finalData?.content || fullText || "I couldn't complete that reading.";
      setMessages((m) => [...m, { role: "assistant", content, metadata: finalData }]);
      setStreamText("");
      qc.invalidateQueries({ queryKey: ["me"] });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      qc.invalidateQueries({ queryKey: ["messages", convId] });
    } catch (e: any) {
      toast.error(e.message || "Could not send message");
      setMessages((m) => m.filter((x) => x.role !== "user" || x.content !== text));
    } finally {
      setStreaming(false);
    }
  }

  if (!user) return <EmptyState onAuth={onAuth} />;

  return (
    <div className="flex flex-col h-[100dvh] lg:h-[calc(100dvh-57px)]">
      <div className="flex items-center gap-2 px-4 lg:px-6 py-2.5 border-b border-white/5 lum-glass overflow-x-auto lum-no-scrollbar">
        <ModeSelector mode={mode} onChange={setMode} />
        <div className="h-5 w-px bg-white/10" />
        <ConvPicker
          conversations={convData?.conversations ?? []}
          activeId={activeConversationId}
          onPick={setActiveConversation}
          onNew={() => setActiveConversation(null)}
        />
        <div className="ml-auto flex items-center gap-1.5">
          {hasBirthData ? (
            <Pill variant="leaf" className="text-[10px]">Birth data set</Pill>
          ) : (
            <Pill className="text-[10px] text-amber-400/80 border-amber-400/20 bg-amber-400/5">Add birth data in profile →</Pill>
          )}
          {activeConversationId && messages.length > 0 && (
            <button
              onClick={() => window.open(`/api/conversations/${activeConversationId}/export`, "_blank")}
              className="px-2 py-1 rounded-full text-[10px] text-ink-muted hover:text-gold border border-white/10 hover:border-gold/30 transition flex items-center gap-1"
              title="Download this consultation as markdown"
            >
              <Download className="w-3 h-3" /> Export
            </button>
          )}
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto lumina-scroll">
        {messages.length === 0 && !streaming ? (
          <WelcomeState user={user} onSuggestion={(t) => send(t)} hasBirthData={hasBirthData} mode={mode} />
        ) : (
          <div className="max-w-3xl mx-auto px-4 lg:px-6 py-6 space-y-5">
            {messages.map((m, i) => (
              <MessageBubble key={m.id || i} msg={m} />
            ))}
            {streaming && (
              <MessageBubble msg={{ role: "assistant", content: streamText || "✦ Reading the stars…" }} streaming />
            )}
          </div>
        )}
      </div>

      <div className="border-t border-white/5 lum-glass p-3 lg:p-4 lum-pb-safe">
        <div className="max-w-3xl mx-auto">
          <Composer inputRef={inputRef} disabled={streaming} onSubmit={send} luckCost={messages.length === 0 ? 0 : 2} balance={user.luckBalance} />
          <div className="text-center text-[10px] text-ink-muted mt-1.5">
            {messages.length === 0 ? "First turn is free" : "2 Luck per message"} · Use discernment with all guidance.
          </div>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg, streaming }: { msg: Msg; streaming?: boolean }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <div className="flex justify-end lum-anim-float-up">
        <div className="max-w-[85%] rounded-2xl rounded-tr-md bg-gold/10 border border-gold/15 px-4 py-2.5 text-[14px] text-ink leading-relaxed">
          {msg.content}
        </div>
      </div>
    );
  }
  return (
    <div className="flex gap-3 lum-anim-float-up">
      <div className="w-8 h-8 rounded-full bg-gradient-to-br from-gold/30 to-leaf/20 border border-gold/20 flex items-center justify-center text-gold shrink-0 mt-0.5">
        <Sparkles className="w-4 h-4" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="lum-prose text-[14px] text-ink/90 leading-relaxed">
          <ReactMarkdown>{msg.content}</ReactMarkdown>
        </div>
        {streaming && <span className="inline-block w-2 h-4 bg-gold/60 ml-0.5 align-middle animate-pulse" />}
        {msg.metadata?.guidance && <GuidanceCard guidance={msg.metadata.guidance} />}
        {msg.metadata?.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-3">
            {msg.metadata.highlights.map((h: string, i: number) => (
              <Pill key={i} variant="gold" className="text-[10px]">{h}</Pill>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function GuidanceCard({ guidance }: { guidance: any }) {
  const [open, setOpen] = React.useState(false);
  if (!guidance) return null;
  const items: { label: string; value: any; icon: any }[] = [];
  if (guidance.remedies?.length) items.push({ label: "Remedies", value: guidance.remedies, icon: Sparkles });
  if (guidance.lucky_numbers?.length) items.push({ label: "Lucky numbers", value: guidance.lucky_numbers.join(", "), icon: Star });
  if (guidance.lucky_colors?.length) items.push({ label: "Lucky colors", value: guidance.lucky_colors.join(", "), icon: Star });
  if (guidance.warnings?.length) items.push({ label: "Cautions", value: guidance.warnings, icon: Moon });
  if (guidance.recommendations?.length) items.push({ label: "Recommendations", value: guidance.recommendations, icon: Sparkles });
  if (items.length === 0) return null;
  return (
    <div className="mt-3">
      <button onClick={() => setOpen((o) => !o)} className="text-[11px] text-gold/80 hover:text-gold flex items-center gap-1">
        <ChevronDown className={cn("w-3 h-3 transition", open && "rotate-180")} />
        {open ? "Hide guidance" : "Show guidance & remedies"}
      </button>
      {open && (
        <div className="mt-2 grid grid-cols-1 sm:grid-cols-2 gap-2">
          {items.map((it, i) => (
            <div key={i} className="p-2.5 rounded-lg bg-white/[0.02] border border-white/5">
              <div className="flex items-center gap-1.5 mb-1 text-[11px] text-ink-muted">
                <it.icon className="w-3 h-3 text-gold" /> {it.label}
              </div>
              <div className="text-[12px] text-ink/90">
                {Array.isArray(it.value) ? (
                  <ul className="space-y-0.5">{it.value.map((v: string, j: number) => <li key={j}>• {v}</li>)}</ul>
                ) : it.value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function ModeSelector({ mode, onChange }: { mode: "vedic" | "western" | "mahabote"; onChange: (m: any) => void }) {
  const modes = [
    { id: "vedic" as const, label: "Vedic", icon: Star },
    { id: "western" as const, label: "Western", icon: Moon },
    { id: "mahabote" as const, label: "Mahabote", icon: Sun },
  ];
  return (
    <div className="flex items-center gap-1">
      {modes.map((m) => (
        <button key={m.id} onClick={() => onChange(m.id)} className={cn("flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] transition", mode === m.id ? "bg-gold/15 text-gold border border-gold/20" : "text-ink-muted hover:text-ink")}>
          <m.icon className="w-3 h-3" /> {m.label}
        </button>
      ))}
    </div>
  );
}

function ConvPicker({ conversations, activeId, onPick, onNew }: { conversations: any[]; activeId: string | null; onPick: (id: string) => void; onNew: () => void }) {
  const [open, setOpen] = React.useState(false);
  const active = conversations.find((c) => c.id === activeId);
  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-ink-muted hover:text-ink">
        <Clock className="w-3.5 h-3.5" />
        <span className="max-w-[140px] truncate">{active?.title || "History"}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-64 max-h-80 overflow-y-auto lumina-scroll rounded-xl lum-glass-float border border-white/10 z-20 p-1.5">
            <button onClick={() => { onNew(); setOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 rounded-lg text-[12px] text-gold hover:bg-gold/10">
              <Plus className="w-3.5 h-3.5" /> New consultation
            </button>
            <div className="h-px bg-white/5 my-1" />
            {conversations.length === 0 ? (
              <div className="px-2.5 py-3 text-[11px] text-ink-muted text-center">No consultations yet</div>
            ) : (
              conversations.map((c) => (
                <button key={c.id} onClick={() => { onPick(c.id); setOpen(false); }} className={cn("w-full text-left px-2.5 py-2 rounded-lg text-[12px] hover:bg-white/5 transition truncate", c.id === activeId ? "text-gold bg-gold/5" : "text-ink-muted")}>
                  {c.title}
                </button>
              ))
            )}
          </div>
        </>
      )}
    </div>
  );
}

function Composer({ inputRef, disabled, onSubmit, luckCost, balance }: { inputRef: any; disabled: boolean; onSubmit: (t: string) => void; luckCost: number; balance: number }) {
  const [text, setText] = React.useState("");
  function handleSend() {
    const t = text.trim();
    if (!t || disabled) return;
    onSubmit(t);
    setText("");
  }
  return (
    <div className="flex items-end gap-2 rounded-2xl lum-glass border border-white/10 px-3 py-2 focus-within:border-gold/30 transition">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        disabled={disabled}
        rows={1}
        placeholder="Ask the astrologer anything…"
        className="flex-1 bg-transparent resize-none outline-none text-[14px] text-ink placeholder:text-ink-muted/60 py-1.5 max-h-32 overflow-y-auto lumina-scroll"
        style={{ minHeight: "24px" }}
      />
      <button onClick={handleSend} disabled={disabled || !text.trim()} className={cn("w-9 h-9 rounded-full flex items-center justify-center transition shrink-0", disabled || !text.trim() ? "bg-white/5 text-ink-muted/40" : "bg-[linear-gradient(135deg,#FBEFC8,#D4B27A,#8A6A2F)] text-[#0A0805] hover:brightness-110 active:scale-95 shadow-[0_4px_16px_-4px_rgba(197,168,124,0.5)]")}>
        <Send className="w-4 h-4" />
      </button>
    </div>
  );
}

function WelcomeState({ user, onSuggestion, hasBirthData, mode }: { user: any; onSuggestion: (t: string) => void; hasBirthData: boolean; mode: string }) {
  return (
    <div className="max-w-2xl mx-auto px-4 py-10 lg:py-16">
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 mb-4">
          <Sparkles className="w-7 h-7 text-gold" />
        </div>
        <h1 className="text-[26px] font-light tracking-tight text-ink mb-2">
          Welcome{user.name ? `, ${user.name}` : ""} <span className="lum-text-gold">✦</span>
        </h1>
        <p className="text-[14px] text-ink-muted leading-relaxed max-w-md mx-auto">
          I'm your Baydin astrologer — versed in Vedic, Western & Myanmar Mahabote traditions.
          {hasBirthData ? " Ask me anything about your chart, your day, or your future." : " Add your birth details in profile for a full reading."}
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
        {SUGGESTIONS.map((s, i) => (
          <button key={i} onClick={() => onSuggestion(s.text)} className="text-left p-3.5 rounded-xl lum-glass border border-white/5 hover:border-gold/20 hover:bg-gold/[0.03] transition group">
            <div className="flex items-center gap-2 mb-1">
              <s.icon className="w-4 h-4 text-gold" />
              <span className="text-[11px] text-ink-muted uppercase tracking-wide">{s.mode}</span>
            </div>
            <div className="text-[13px] text-ink group-hover:text-gold transition">{s.text}</div>
          </button>
        ))}
      </div>
    </div>
  );
}

function EmptyState({ onAuth }: { onAuth: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center h-full px-6 text-center">
      <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-gold/20 to-leaf/10 border border-gold/20 mb-5">
        <Sparkles className="w-9 h-9 text-gold" />
      </div>
      <h1 className="text-[28px] font-light tracking-tight text-ink mb-2">
        Baydin <span className="lum-text-gold">✦</span>
      </h1>
      <p className="text-[14px] text-ink-muted max-w-md mb-6 leading-relaxed">
        Your AI astrologer — Vedic, Western & Myanmar Mahabote readings. Tarot, horoscopes, rituals.
        Pay-as-you-go with Luck credits. <span className="text-leaf">99% cheaper than real-life fortune telling.</span>
      </p>
      <GoldButton onClick={onAuth} className="px-8">Begin your consultation</GoldButton>
      <div className="mt-4 text-[11px] text-ink-muted">5 Luck free on signup · No card required</div>
    </div>
  );
}
