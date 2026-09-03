"use client";

import * as React from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { cn } from "@/lib/utils";
import { useStore } from "@/lib/store";
import { useMe, api } from "@/lib/api-client";
import { useT } from "@/lib/use-t";
import { Send, Plus, ChevronDown, Star, Moon, Sun, Heart, Download, Share2, Search, Pin, Pencil, Trash2, HelpCircle, X, Loader2 } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";

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
  const t = useT();
  const [messages, setMessages] = React.useState<Msg[]>([]);
  const [streaming, setStreaming] = React.useState(false);
  const [streamText, setStreamText] = React.useState("");
  const [mode, setMode] = React.useState<"vedic" | "western" | "mahabote">("vedic");
  const [showPrashna, setShowPrashna] = React.useState(false);
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

  async function shareLastReading() {
    const last = messages.filter((m) => m.role === "assistant").pop();
    if (!last) { toast.error("No reading to share yet"); return; }
    const text = last.content.slice(0, 500) + (last.content.length > 500 ? "…" : "");
    const shareData = {
      title: "My Baydin Astrologer Reading",
      text: text.replace(/[#*_`]/g, "").slice(0, 280),
      url: window.location.origin,
    };
    if (navigator.share) {
      try { await navigator.share(shareData); } catch {}
    } else {
      await navigator.clipboard.writeText(shareData.text + "\n\n" + shareData.url);
      toast.success("Reading copied to clipboard");
    }
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
                  finalData = { content: `_You're out of Luck. Visit **Earn Luck** to top up and continue your consultation._`, error: true };
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

  if (!user) return <EmptyState onAuth={onAuth} t={t} />;

  return (
    <div className="flex flex-col h-[100dvh] lg:h-[calc(100dvh-57px)]">
      {/* Top bar — mode selector + conversation picker */}
      <div className="flex items-center gap-3 px-6 py-3 border-b border-[#2A2722] overflow-x-auto" style={{ scrollbarWidth: "none" }}>
        <ModeSelector mode={mode} onChange={setMode} />
        <div className="w-px h-4 bg-[#2A2722] shrink-0" />
        <ConvPicker
          conversations={convData?.conversations ?? []}
          activeId={activeConversationId}
          onPick={setActiveConversation}
          onNew={() => setActiveConversation(null)}
        />
        <div className="ml-auto flex items-center gap-2 shrink-0">
          {hasBirthData ? (
            <span className="text-[11px] text-[#7A8B6F]">Birth data set</span>
          ) : (
            <span className="text-[11px] text-[#C26B5C]">Add birth data in profile</span>
          )}
          <button
            onClick={() => setShowPrashna(true)}
            className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition focus-ring rounded-sm"
            title="Ask a Yes/No question (Prashna)"
          >
            Prashna
          </button>
          {activeConversationId && messages.length > 0 && (
            <>
              <button
                onClick={() => shareLastReading()}
                className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition focus-ring rounded-sm"
              >
                Share
              </button>
              <button
                onClick={() => window.open(`/api/conversations/${activeConversationId}/export`, "_blank")}
                className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition focus-ring rounded-sm"
              >
                Export
              </button>
            </>
          )}
        </div>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto lumina-scroll">
        {messages.length === 0 && !streaming ? (
          <WelcomeState user={user} onSuggestion={(t) => send(t)} hasBirthData={hasBirthData} mode={mode} />
        ) : (
          <div className="max-w-3xl mx-auto px-6 py-8 lg:py-10 space-y-6">
            {messages.map((m, i) => (
              <MessageBubble key={m.id || i} msg={m} />
            ))}
            {streaming && (
              <MessageBubble msg={{ role: "assistant", content: streamText || "" }} streaming />
            )}
          </div>
        )}
      </div>

      {/* Composer */}
      <div className="border-t border-[#2A2722] p-4 lg:p-5 lum-pb-safe">
        <div className="max-w-3xl mx-auto">
          <Composer inputRef={inputRef} disabled={streaming} onSubmit={send} luckCost={messages.length === 0 ? 0 : 2} balance={user.luckBalance} />
          <div className="text-center text-[11px] text-[#6B6358] mt-2">
            {messages.length === 0 ? "First turn is free" : "2 Luck per message"} · Use discernment with all guidance.
          </div>
        </div>
      </div>

      {showPrashna && <PrashnaModal onClose={() => setShowPrashna(false)} />}
    </div>
  );
}

function MessageBubble({ msg, streaming }: { msg: Msg; streaming?: boolean }) {
  const isUser = msg.role === "user";
  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex justify-end"
      >
        <div className="max-w-[80%] px-4 py-2.5 text-[14px] text-[#E8E2D5] leading-[1.6] bg-[#1A1714] border border-[#2A2722] rounded-sm">
          {msg.content}
        </div>
      </motion.div>
    );
  }
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex gap-4"
    >
      <div className="w-8 h-8 rounded-sm bg-[#1A1714] border border-[#2A2722] flex items-center justify-center text-[#C5A572] shrink-0 mt-0.5">
        <Star className="w-3.5 h-3.5" />
      </div>
      <div className="flex-1 min-w-0">
        <div className="serif text-[15px] text-[#E8E2D5] leading-[1.8] prose-editorial">
          {msg.content ? <ReactMarkdown>{msg.content}</ReactMarkdown> : (streaming ? <span className="text-[#6B6358]">Reading the stars…</span> : null)}
        </div>
        {streaming && msg.content && (
          <span className="inline-block w-1.5 h-4 bg-[#C5A572] ml-0.5 align-middle animate-pulse" />
        )}
        {msg.metadata?.guidance && <GuidanceCard guidance={msg.metadata.guidance} />}
        {msg.metadata?.highlights?.length > 0 && (
          <div className="flex flex-wrap gap-2 mt-3">
            {msg.metadata.highlights.map((h: string, i: number) => (
              <span key={i} className="text-[12px] px-3 py-1 text-[#C5A572] serif-italic border border-[#C5A572]/20">
                {h}
              </span>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

function GuidanceCard({ guidance }: { guidance: any }) {
  const [open, setOpen] = React.useState(false);
  if (!guidance) return null;
  const items: { label: string; value: any; icon: any }[] = [];
  if (guidance.remedies?.length) items.push({ label: "Remedies", value: guidance.remedies, icon: Star });
  if (guidance.lucky_numbers?.length) items.push({ label: "Lucky numbers", value: guidance.lucky_numbers.join(", "), icon: Star });
  if (guidance.lucky_colors?.length) items.push({ label: "Lucky colors", value: guidance.lucky_colors.join(", "), icon: Star });
  if (guidance.warnings?.length) items.push({ label: "Cautions", value: guidance.warnings, icon: Moon });
  if (guidance.recommendations?.length) items.push({ label: "Recommendations", value: guidance.recommendations, icon: Star });
  if (items.length === 0) return null;
  return (
    <div className="mt-4">
      <button onClick={() => setOpen((o) => !o)} className="text-[12px] text-[#6B6358] hover:text-[#C5A572] transition flex items-center gap-1.5 focus-ring rounded-sm">
        <ChevronDown className={cn("w-3 h-3 transition-transform", open && "rotate-180")} />
        {open ? "Hide guidance" : "Show guidance & remedies"}
      </button>
      {open && (
        <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map((it, i) => (
            <div key={i} className="p-3 border border-[#2A2722]">
              <div className="flex items-center gap-1.5 mb-1.5 text-[12px] text-[#6B6358] font-medium">
                <it.icon className="w-3 h-3 text-[#C5A572]" /> {it.label}
              </div>
              <div className="text-[13px] text-[#9C9489]">
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
    { id: "vedic" as const, label: "Vedic" },
    { id: "western" as const, label: "Western" },
    { id: "mahabote" as const, label: "Mahabote" },
  ];
  return (
    <div className="flex items-center gap-0.5 shrink-0">
      {modes.map((m) => (
        <button
          key={m.id}
          onClick={() => onChange(m.id)}
          className={cn(
            "px-3 py-1.5 text-[12px] border-b-2 transition focus-ring rounded-sm",
            mode === m.id
              ? "border-[#C5A572] text-[#E8E2D5] font-medium"
              : "border-transparent text-[#6B6358] hover:text-[#9C9489]"
          )}
        >
          {m.label}
        </button>
      ))}
    </div>
  );
}

function ConvPicker({ conversations, activeId, onPick, onNew }: { conversations: any[]; activeId: string | null; onPick: (id: string) => void; onNew: () => void }) {
  const qc = useQueryClient();
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState("");
  const [searchResults, setSearchResults] = React.useState<any[] | null>(null);
  const [renameId, setRenameId] = React.useState<string | null>(null);
  const [renameText, setRenameText] = React.useState("");
  const [deleteId, setDeleteId] = React.useState<string | null>(null);
  const active = conversations.find((c) => c.id === activeId);

  React.useEffect(() => {
    if (!search.trim()) { setSearchResults(null); return; }
    const t = setTimeout(async () => {
      try {
        const res = await api<{ conversations: any[] }>(`/api/conversations?q=${encodeURIComponent(search)}`);
        setSearchResults(res.conversations);
      } catch { setSearchResults(null); }
    }, 300);
    return () => clearTimeout(t);
  }, [search]);

  const displayConversations = searchResults ?? conversations;
  const sorted = [...displayConversations].sort((a, b) => (b.pinned ? 1 : 0) - (a.pinned ? 1 : 0));

  async function togglePin(id: string, pinned: boolean, e: React.MouseEvent) {
    e.stopPropagation();
    try {
      await api("/api/conversations", { method: "PATCH", json: { id, pinned: !pinned } });
      qc.invalidateQueries({ queryKey: ["conversations"] });
    } catch {}
  }

  function startRename(id: string, title: string) {
    setRenameId(id);
    setRenameText(title);
  }

  async function confirmRename(e: React.KeyboardEvent) {
    if (e.key !== "Enter" || !renameId || !renameText.trim()) return;
    try {
      await api("/api/conversations", { method: "PATCH", json: { id: renameId, title: renameText.trim() } });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      setRenameId(null);
      toast.success("Renamed");
    } catch {}
  }

  async function deleteConv(id: string, e: React.MouseEvent) {
    e.stopPropagation();
    setDeleteId(id);
  }

  async function confirmDelete() {
    if (!deleteId) return;
    try {
      await api(`/api/conversations?id=${deleteId}`, { method: "DELETE" });
      qc.invalidateQueries({ queryKey: ["conversations"] });
      if (activeId === deleteId) onNew();
      toast.success("Conversation deleted");
    } catch (e: any) { toast.error(e.message); }
    finally { setDeleteId(null); }
  }

  return (
    <div className="relative">
      <button onClick={() => setOpen((o) => !o)} className="flex items-center gap-1.5 px-2 py-1 text-[12px] text-[#6B6358] hover:text-[#E8E2D5] transition">
        <span className="max-w-[120px] truncate">{active?.title || "History"}</span>
        <ChevronDown className="w-3 h-3" />
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setOpen(false)} />
          <div className="absolute top-full left-0 mt-1 w-72 max-h-96 bg-[#0A0908] border border-[#2A2722] z-20 p-2 flex flex-col rounded-sm">
            <button onClick={() => { onNew(); setOpen(false); }} className="w-full flex items-center gap-2 px-2.5 py-2 text-[12px] text-[#C5A572] hover:bg-[#0F0D0B] transition shrink-0 rounded-sm">
              <Plus className="w-3.5 h-3.5" /> New consultation
            </button>
            <div className="h-px bg-[#2A2722] my-1 shrink-0" />
            <div className="relative shrink-0 mb-1">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3 h-3 text-[#6B6358]" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search consultations…"
                className="w-full pl-7 pr-2 py-1.5 bg-transparent border-b border-[#2A2722] text-[12px] text-[#E8E2D5] placeholder:text-[#4A4540] outline-none focus:border-[#C5A572] transition"
              />
            </div>
            <div className="overflow-y-auto lumina-scroll flex-1">
              {sorted.length === 0 ? (
                <div className="px-2.5 py-3 text-[12px] text-[#6B6358] text-center">{search ? `No matches for "${search}"` : "No consultations yet"}</div>
              ) : (
                sorted.map((c) => (
                  <div key={c.id} className="flex items-center gap-1 group">
                    {renameId === c.id ? (
                      <input
                        autoFocus
                        value={renameText}
                        onChange={(e) => setRenameText(e.target.value)}
                        onKeyDown={confirmRename}
                        onBlur={() => setRenameId(null)}
                        className="flex-1 px-2.5 py-2 text-[12px] bg-[#1A1714] border border-[#C5A572]/30 text-[#E8E2D5] outline-none rounded-sm"
                      />
                    ) : (
                      <>
                        <button onClick={() => { onPick(c.id); setOpen(false); }} className={cn("flex-1 text-left px-2.5 py-2 text-[12px] hover:bg-[#0F0D0B] transition truncate rounded-sm", c.id === activeId ? "text-[#C5A572]" : "text-[#9C9489]")}>
                          {c.pinned && <Pin className="w-2.5 h-2.5 inline mr-1 text-[#C5A572]" />}
                          {c.title}
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); startRename(c.id, c.title); }} className="p-1 shrink-0 transition opacity-0 group-hover:opacity-100 text-[#6B6358] hover:text-[#9C9489]" title="Rename">
                          <Pencil className="w-3 h-3" />
                        </button>
                        <button onClick={(e) => togglePin(c.id, c.pinned, e)} className={cn("p-1 shrink-0 transition opacity-0 group-hover:opacity-100", c.pinned ? "text-[#C5A572] opacity-100" : "text-[#6B6358] hover:text-[#9C9489]")} title={c.pinned ? "Unpin" : "Pin to top"}>
                          <Pin className="w-3 h-3" fill={c.pinned ? "currentColor" : "none"} />
                        </button>
                        <button onClick={(e) => deleteConv(c.id, e)} className="p-1 shrink-0 transition opacity-0 group-hover:opacity-100 text-[#6B6358] hover:text-[#C26B5C]" title="Delete">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}

      {deleteId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85" onClick={() => setDeleteId(null)}>
          <div className="bg-[#0A0908] border border-[#C26B5C]/30 p-6 max-w-xs w-full rounded-sm" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-2 mb-3 text-[#C26B5C]">
              <Trash2 className="w-5 h-5" />
              <span className="serif text-[15px]">Delete consultation?</span>
            </div>
            <div className="text-[13px] text-[#9C9489] mb-5 leading-[1.6]">
              This permanently deletes this consultation and all its messages. This cannot be undone.
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setDeleteId(null)} className="flex-1 py-2.5 text-[13px] text-[#9C9489] hover:text-[#E8E2D5] border border-[#2A2722] hover:border-[#4A4540] transition rounded-sm">Cancel</button>
              <button onClick={confirmDelete} className="flex-1 py-2.5 text-[13px] bg-[#C26B5C] text-white hover:brightness-110 active:scale-95 transition rounded-sm">Delete</button>
            </div>
          </div>
        </div>
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
    <div className="flex items-end gap-2 border-b border-[#2A2722] px-1 py-1 focus-within:border-[#C5A572] transition">
      <textarea
        ref={inputRef}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
        disabled={disabled}
        rows={1}
        placeholder="Ask the astrologer anything…"
        className="flex-1 bg-transparent resize-none outline-none text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] py-2 max-h-32 overflow-y-auto lumina-scroll"
        style={{ minHeight: "24px" }}
      />
      <button
        onClick={handleSend}
        disabled={disabled || !text.trim()}
        className={cn(
          "w-9 h-9 rounded-sm flex items-center justify-center transition shrink-0 focus-ring",
          disabled || !text.trim()
            ? "bg-[#1A1714] text-[#4A4540]"
            : "bg-[#E8E2D5] text-[#0A0908] hover:bg-white active:scale-95"
        )}
        aria-label="Send message"
      >
        {disabled ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
      </button>
    </div>
  );
}

function WelcomeState({ user, onSuggestion, hasBirthData, mode }: { user: any; onSuggestion: (t: string) => void; hasBirthData: boolean; mode: string }) {
  return (
    <div className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
      <div className="mb-8 lum-reveal">
        <div className="text-[13px] text-[#6B6358] mb-2">Your astrologer</div>
        <h1 className="serif-display text-[2rem] lg:text-[2.5rem] text-[#E8E2D5] leading-[1.1] tracking-tight mb-3">
          {user.name ? `Welcome, ${user.name.split(" ")[0]}.` : "Welcome."}
        </h1>
        <p className="t-body text-[#9C9489] leading-[1.7] max-w-[55ch]">
          {hasBirthData
            ? "Ask me anything about your chart, your day, or what the stars hold for you."
            : "Add your birth details in your profile settings for a full reading of your natal chart."}
        </p>
      </div>
      <div className="pt-8 border-t border-[#2A2722]">
        <div className="text-[12px] text-[#6B6358] font-medium mb-4">Try asking</div>
        <div className="space-y-2">
          {SUGGESTIONS.map((s, i) => (
            <button
              key={i}
              onClick={() => onSuggestion(s.text)}
              className="w-full text-left p-3 border border-[#2A2722] hover:border-[#4A4540] hover:bg-[#0F0D0B] transition group focus-ring rounded-sm flex items-center gap-3"
            >
              <s.icon className="w-3.5 h-3.5 text-[#C5A572] shrink-0" />
              <span className="text-[13px] text-[#9C9489] group-hover:text-[#E8E2D5] transition flex-1">{s.text}</span>
              <span className="text-[10px] text-[#6B6358] serif-italic">{s.mode}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

function EmptyState({ onAuth, t }: { onAuth: () => void; t: (k: string) => string }) {
  return (
    <div className="h-[100dvh] lg:h-[calc(100dvh-57px)] overflow-y-auto lumina-scroll">
      <div className="max-w-2xl mx-auto px-6 py-12 lg:py-16">
        <div className="lum-reveal">
          <div className="text-[13px] text-[#6B6358] mb-2">Your astrologer</div>
          <h1 className="serif-display text-[2.5rem] sm:text-[3rem] text-[#E8E2D5] leading-[1.05] tracking-tight mb-4">
            Consult the stars.
          </h1>
          <p className="t-body-lg text-[#9C9489] leading-[1.7] max-w-[55ch] mb-8">
            Vedic, Western, and Myanmar Mahabote readings drawn from your birth chart and the moon overhead. Each consultation turn costs 2 Luck. The first turn is free.
          </p>
          <button
            onClick={onAuth}
            className="inline-flex items-center gap-2 py-3 px-6 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm focus-ring"
          >
            {t("begin")}
          </button>
          <div className="mt-3 text-[12px] text-[#6B6358]">5 Luck free on signup · No card required</div>
        </div>
      </div>
    </div>
  );
}

function PrashnaModal({ onClose }: { onClose: () => void }) {
  const [question, setQuestion] = React.useState("");
  const [result, setResult] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(false);

  async function ask() {
    if (!question.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const res = await fetch("/api/prashna", {
        method: "POST", headers: { "Content-Type": "application/json" }, credentials: "include",
        body: JSON.stringify({ question }),
      });
      const data = await res.json();
      if (data.error) { toast.error(data.error); return; }
      setResult(data.prashna);
    } catch (e: any) { toast.error(e.message); }
    finally { setLoading(false); }
  }

  const answerColor = result?.answer === "yes" ? "#7A8B6F" : result?.answer === "no" ? "#C26B5C" : "#C5A572";
  const answerIcon = result?.answer === "yes" ? "✓" : result?.answer === "no" ? "✕" : "?";

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center p-4 bg-black/85" onClick={onClose}>
      <div className="bg-[#0A0908] border border-[#2A2722] p-6 max-w-md w-full rounded-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div className="serif-display text-[1.25rem] text-[#E8E2D5]">Prashna — Horary</div>
          <button onClick={onClose} aria-label="Close" className="text-[#6B6358] hover:text-[#E8E2D5] transition"><X className="w-4 h-4" /></button>
        </div>

        {!result && !loading && (
          <>
            <div className="text-[13px] text-[#9C9489] mb-4 leading-[1.6]">
              Ask a Yes/No question. The answer is determined by casting a chart at this exact moment.
            </div>
            <input
              autoFocus
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && ask()}
              placeholder="e.g. Will I get the job?"
              className="w-full bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 py-2 text-[15px] text-[#E8E2D5] placeholder:text-[#4A4540] focus:outline-none focus:border-[#C5A572] transition mb-4"
            />
            <button
              onClick={ask}
              disabled={!question.trim()}
              className="w-full py-3 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium hover:bg-white transition rounded-sm disabled:opacity-50 focus-ring"
            >
              Ask the stars
            </button>
          </>
        )}

        {loading && (
          <div className="text-center py-8">
            <Loader2 className="w-6 h-6 text-[#C5A572] animate-spin mx-auto mb-3" />
            <div className="text-[13px] text-[#6B6358]">Casting the Prashna chart…</div>
          </div>
        )}

        {result && !loading && (
          <div>
            <div className="text-center mb-4">
              <div className="text-[12px] text-[#6B6358] mb-1">Your question</div>
              <div className="text-[14px] text-[#E8E2D5] mb-4">{result.question}</div>
              <div className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl font-light mb-2 border-2"
                style={{ borderColor: answerColor, color: answerColor, background: `${answerColor}15` }}>
                {answerIcon}
              </div>
              <div className="serif-display text-[1.5rem] capitalize" style={{ color: answerColor }}>{result.answer}</div>
              <div className="text-[12px] text-[#6B6358] mt-1">{result.confidence}% confidence</div>
            </div>
            <div className="p-3 border border-[#2A2722] mb-3">
              <div className="text-[12px] text-[#6B6358] font-medium mb-1">Reasoning</div>
              <div className="text-[12px] text-[#9C9489] leading-[1.6]">{result.reasoning}</div>
            </div>
            <div className="text-[12px] text-[#C5A572] serif-italic mb-3">{result.timing}</div>
            <div className="grid grid-cols-2 gap-2 mb-4">
              <div className="p-2 border border-[#2A2722]">
                <div className="text-[11px] text-[#6B6358]">Lagna</div>
                <div className="text-[13px] text-[#E8E2D5]">{result.chart.lagnaSign}</div>
              </div>
              <div className="p-2 border border-[#2A2722]">
                <div className="text-[11px] text-[#6B6358]">Moon</div>
                <div className="text-[13px] text-[#E8E2D5]">{result.chart.moonSign}</div>
              </div>
              <div className="p-2 border border-[#2A2722]">
                <div className="text-[11px] text-[#6B6358]">Nakshatra</div>
                <div className="text-[13px] text-[#E8E2D5]">{result.chart.moonNakshatra}</div>
              </div>
              <div className="p-2 border border-[#2A2722]">
                <div className="text-[11px] text-[#6B6358]">Nak Lord</div>
                <div className="text-[13px] text-[#E8E2D5]">{result.chart.nakshatraLord}</div>
              </div>
            </div>
            <button
              onClick={() => { setResult(null); setQuestion(""); }}
              className="w-full py-3 text-[14px] text-[#9C9489] hover:text-[#E8E2D5] border border-[#2A2722] hover:border-[#4A4540] transition rounded-sm focus-ring"
            >
              Ask another question
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
