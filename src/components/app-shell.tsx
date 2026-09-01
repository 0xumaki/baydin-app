"use client";

import * as React from "react";
import { useStore, type AppView } from "@/lib/store";
import { useMe } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GlassCard, GoldButton, GhostButton, Pill, StarField } from "@/components/lumina/primitives";
import { AuthModal } from "@/components/auth-modal";
import { ChatView } from "@/components/views/chat-view";
import { TarotView } from "@/components/views/tarot-view";
import { BirthChartView } from "@/components/views/birth-chart-view";
import { HoroscopeView } from "@/components/views/horoscope-view";
import { LuckStoreView } from "@/components/views/luck-store-view";
import { ResellerView } from "@/components/views/reseller-view";
import { AdminView } from "@/components/views/admin-view";
import { ProfileSheet } from "@/components/profile-sheet";
import {
  Sparkles, MessageCircle, Moon, Star, Sun, Wallet, Store, Shield,
  Menu, X, Plus, LogOut, Settings, Gift, ChevronRight,
} from "lucide-react";

const NAV_ITEMS: { view: AppView; label: string; icon: any; needsAuth?: boolean; resellerOnly?: boolean; adminOnly?: boolean }[] = [
  { view: "chat", label: "Astrologer", icon: MessageCircle, needsAuth: true },
  { view: "tarot", label: "Tarot", icon: Sparkles },
  { view: "horoscope", label: "Horoscope", icon: Moon, needsAuth: true },
  { view: "birth-chart", label: "Birth Chart", icon: Star, needsAuth: true },
  { view: "luck-store", label: "Buy Luck", icon: Wallet, needsAuth: true },
  { view: "reseller", label: "Reseller", icon: Store, resellerOnly: true, needsAuth: true },
  { view: "admin", label: "Admin", icon: Shield, adminOnly: true, needsAuth: true },
];

export function AppShell() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useStore();
  const { data, isLoading } = useMe();
  const user = data?.user ?? null;
  const [authOpen, setAuthOpen] = React.useState(false);
  const [profileOpen, setProfileOpen] = React.useState(false);

  const visibleNav = NAV_ITEMS.filter((item) => {
    if (item.resellerOnly && user?.role !== "reseller" && user?.role !== "admin") return false;
    if (item.adminOnly && user?.role !== "admin") return false;
    return true;
  });

  function handleNav(item: (typeof NAV_ITEMS)[number]) {
    if (item.needsAuth && !user) {
      setAuthOpen(true);
      return;
    }
    setView(item.view);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  function handleNewChat() {
    if (!user) { setAuthOpen(true); return; }
    setView("chat");
    // The ChatView watches activeConversationId; setting null triggers a new conversation
    useStore.getState().setActiveConversation(null);
    if (window.innerWidth < 1024) setSidebarOpen(false);
  }

  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-background lum-aurora overflow-hidden">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 lum-glass border-b border-white/5 px-4 py-3 flex items-center justify-between lum-pt-safe">
        <button onClick={() => setSidebarOpen(true)} className="p-2 -ml-2 text-ink-muted hover:text-ink transition">
          <Menu className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2">
          <span className="text-gold text-lg">✦</span>
          <span className="font-light tracking-tight text-ink text-[15px]">Baydin</span>
        </div>
        {user ? (
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-1.5">
            <Pill variant="gold">{user.luckBalance} Luck</Pill>
          </button>
        ) : (
          <button onClick={() => setAuthOpen(true)} className="text-[13px] text-gold">Sign in</button>
        )}
      </header>

      <div className="flex-1 flex relative z-10">
        {/* Sidebar */}
        <Sidebar
          open={sidebarOpen}
          onClose={() => setSidebarOpen(false)}
          user={user}
          navItems={visibleNav}
          currentView={view}
          onNav={handleNav}
          onNewChat={handleNewChat}
          onAuth={() => setAuthOpen(true)}
          onProfile={() => setProfileOpen(true)}
        />

        {/* Main area */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Desktop top bar */}
          <div className="hidden lg:flex items-center justify-between px-6 py-3 border-b border-white/5 lum-glass">
            <div className="flex items-center gap-2">
              <span className="text-gold text-xl">✦</span>
              <span className="font-light tracking-tight text-ink text-lg">Baydin</span>
              <span className="text-ink-muted text-xs ml-2 hidden xl:inline">Astrologer · Tarot · Horoscope · Rituals</span>
            </div>
            <div className="flex items-center gap-3">
              {user ? (
                <>
                  <DailyRewardBadge />
                  <Pill variant="gold" className="text-[12px]">
                    <Wallet className="w-3 h-3" /> {user.luckBalance} Luck
                  </Pill>
                  <button onClick={() => setProfileOpen(true)} className="w-8 h-8 rounded-full bg-white/5 border border-white/10 flex items-center justify-center text-ink-muted hover:text-ink hover:border-gold/30 transition">
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <GhostButton onClick={() => setAuthOpen(true)} className="py-2 px-4 text-[12px]">Sign in</GhostButton>
                  <GoldButton onClick={() => setAuthOpen(true)} className="py-2 px-4 text-[12px]">Get started</GoldButton>
                </>
              )}
            </div>
          </div>

          {/* View content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            {view === "chat" && <ChatView onAuth={() => setAuthOpen(true)} />}
            {view === "tarot" && <TarotView onAuth={() => setAuthOpen(true)} />}
            {view === "horoscope" && <HoroscopeView onAuth={() => setAuthOpen(true)} />}
            {view === "birth-chart" && <BirthChartView onAuth={() => setAuthOpen(true)} />}
            {view === "luck-store" && <LuckStoreView onAuth={() => setAuthOpen(true)} />}
            {view === "reseller" && <ResellerView onAuth={() => setAuthOpen(true)} />}
            {view === "admin" && <AdminView />}
          </div>
        </main>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
    </div>
  );
}

function Sidebar(props: {
  open: boolean;
  onClose: () => void;
  user: any;
  navItems: typeof NAV_ITEMS;
  currentView: AppView;
  onNav: (item: (typeof NAV_ITEMS)[number]) => void;
  onNewChat: () => void;
  onAuth: () => void;
  onProfile: () => void;
}) {
  return (
    <>
      {/* Mobile backdrop */}
      {props.open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={props.onClose} />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 lg:z-10 h-[100dvh] lg:h-auto lg:self-stretch w-[280px] shrink-0",
          "lum-glass border-r border-white/5 flex flex-col transition-transform duration-300",
          props.open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Logo / brand */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3">
          <div className="flex items-center gap-2">
            <span className="text-gold text-2xl">✦</span>
            <div className="leading-tight">
              <div className="font-light tracking-tight text-ink text-[17px]">Baydin</div>
              <div className="text-[10px] text-ink-muted tracking-[0.2em] uppercase">Fortune · Stars · Ritual</div>
            </div>
          </div>
          <button onClick={props.onClose} className="lg:hidden p-1 text-ink-muted">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New consultation button */}
        <div className="px-3 pb-3">
          <GoldButton onClick={props.onNewChat} className="w-full py-2.5 text-[13px]">
            <Plus className="w-4 h-4" /> New consultation
          </GoldButton>
        </div>

        {/* Navigation */}
        <nav className="px-2 flex-1 overflow-y-auto lumina-scroll space-y-0.5">
          {props.navItems.map((item) => (
            <button
              key={item.view}
              onClick={() => props.onNav(item)}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13px] transition-all",
                props.currentView === item.view
                  ? "bg-gold-soft text-gold border border-gold/20"
                  : "text-ink-muted hover:text-ink hover:bg-white/[0.03] border border-transparent"
              )}
            >
              <item.icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1 text-left">{item.label}</span>
              {props.currentView === item.view && <ChevronRight className="w-3.5 h-3.5" />}
            </button>
          ))}
        </nav>

        {/* Daily reward CTA (always visible, addictive) */}
        {props.user && (
          <div className="px-3 py-2">
            <DailyRewardCard />
          </div>
        )}

        {/* Footer: user profile / sign in */}
        <div className="border-t border-white/5 p-3">
          {props.user ? (
            <button
              onClick={props.onProfile}
              className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-white/[0.03] transition"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-gold/30 to-leaf/20 border border-gold/20 flex items-center justify-center text-gold text-[13px] font-medium">
                {(props.user.email[0] || "B").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] text-ink truncate">{props.user.name || props.user.email}</div>
                <div className="text-[11px] text-gold/80">{props.user.luckBalance} Luck</div>
              </div>
              <Settings className="w-4 h-4 text-ink-muted" />
            </button>
          ) : (
            <GhostButton onClick={props.onAuth} className="w-full py-2.5 text-[13px]">
              Sign in
            </GhostButton>
          )}
        </div>
      </aside>
    </>
  );
}

function DailyRewardBadge() {
  return <DailyRewardCard compact />;
}

function DailyRewardCard({ compact }: { compact?: boolean }) {
  const [claimed, setClaimed] = React.useState<boolean | null>(null);
  const [amount, setAmount] = React.useState(0);
  const [streak, setStreak] = React.useState(0);
  const { refetch } = useMe();

  React.useEffect(() => {
    fetch("/api/luck/daily-reward").then((r) => r.json()).then((d) => {
      setClaimed(d.claimed);
      setAmount(d.amount ?? 0);
      setStreak(d.streak ?? 0);
    }).catch(() => {});
  }, []);

  async function claim() {
    const res = await fetch("/api/luck/daily-reward", { method: "POST" });
    const d = await res.json();
    if (d.ok) {
      setClaimed(true);
      setAmount(d.amount);
      setStreak(d.streak);
      refetch();
    }
  }

  if (compact) {
    return (
      <button
        onClick={claim}
        disabled={claimed}
        className={cn(
          "flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] transition border",
          claimed
            ? "border-white/5 text-ink-muted/50"
            : "border-leaf/30 bg-leaf/10 text-leaf hover:bg-leaf/20"
        )}
      >
        <Gift className="w-3 h-3" />
        {claimed ? "Claimed" : `+${Math.max(1, amount)} Luck`}
      </button>
    );
  }

  return (
    <button
      onClick={claim}
      disabled={claimed}
      className={cn(
        "w-full text-left p-3 rounded-xl border transition-all",
        claimed
          ? "border-white/5 bg-white/[0.02] opacity-60"
          : "border-leaf/20 bg-leaf/[0.06] hover:bg-leaf/[0.1] hover:border-leaf/30"
      )}
    >
      <div className="flex items-center gap-2 mb-1">
        <Gift className={cn("w-4 h-4", claimed ? "text-ink-muted" : "text-leaf")} />
        <span className={cn("text-[12px] font-medium", claimed ? "text-ink-muted" : "text-leaf")}>
          {claimed ? "Today's Luck claimed" : "Claim daily Luck"}
        </span>
      </div>
      <div className="text-[11px] text-ink-muted">
        {claimed ? `Come back tomorrow (streak ${streak} days)` : `Streak ${streak} days · next reward +${Math.max(1, amount)} Luck`}
      </div>
    </button>
  );
}
