"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useStore, type AppView } from "@/lib/store";
import { useMe, useBadges } from "@/lib/api-client";
import { cn } from "@/lib/utils";
import { GlassCard, GoldButton, GhostButton, Pill, StarField } from "@/components/lumina/primitives";
import { AuthModal } from "@/components/auth-modal";
import { ChatView } from "@/components/views/chat-view";
import { TarotView } from "@/components/views/tarot-view";
import { TarotHistoryView } from "@/components/views/tarot-history-view";
import { BirthChartView } from "@/components/views/birth-chart-view";
import { HoroscopeView } from "@/components/views/horoscope-view";
import { TodayView } from "@/components/views/today-view";
import { ManifestView } from "@/components/views/manifest-view";
import { RitualView } from "@/components/views/ritual-view";
import { InsightsView } from "@/components/views/insights-view";
import { LifeReportView } from "@/components/views/life-report-view";
import { NumerologyView } from "@/components/views/numerology-view";
import { LunarCalendarView } from "@/components/views/lunar-calendar-view";
import { DreamJournalView } from "@/components/views/dream-journal-view";
import { AnalyticsDashboardView } from "@/components/views/analytics-dashboard-view";
import { FrequencyView } from "@/components/views/frequency-view";
import { PositivityView } from "@/components/views/positivity-view";
import { CompatibilityView } from "@/components/views/compatibility-view";
import { ProfileView } from "@/components/views/profile-view";
import { LuckStoreView } from "@/components/views/luck-store-view";
import { ResellerView } from "@/components/views/reseller-view";
import { AdminView } from "@/components/views/admin-view";
import { ProfileSheet } from "@/components/profile-sheet";
import { AchievementCelebration } from "@/components/achievement-celebration";
import { ThemeToggle } from "@/components/theme-toggle";
import { Onboarding } from "@/components/onboarding";
import { ReminderService } from "@/components/reminder-service";
import { PWARegister } from "@/components/pwa-register";
import {
  Sparkles, MessageCircle, Moon, Star, Sun, Wallet, Store, Shield,
  Menu, X, Plus, LogOut, Settings, Gift, ChevronRight, Target, Compass, BookOpen, CalendarDays,
  Waves, Heart, Users, Flame, BarChart3, Hash, Calendar, CloudMoon, LineChart,
} from "lucide-react";

const NAV_ITEMS: { view: AppView; label: string; icon: any; needsAuth?: boolean; resellerOnly?: boolean; adminOnly?: boolean; group?: string }[] = [
  { view: "today", label: "Today", icon: CalendarDays, needsAuth: true, group: "Daily" },
  { view: "chat", label: "Astrologer", icon: MessageCircle, needsAuth: true, group: "Daily" },
  { view: "tarot", label: "Tarot", icon: Sparkles, group: "Daily" },
  { view: "tarot-history", label: "Tarot History", icon: BookOpen, needsAuth: true, group: "Daily" },
  { view: "horoscope", label: "Horoscope", icon: Moon, needsAuth: true, group: "Daily" },
  { view: "lunar-calendar", label: "Lunar Calendar", icon: Calendar, needsAuth: true, group: "Daily" },
  { view: "dream-journal", label: "Dream Journal", icon: CloudMoon, needsAuth: true, group: "Daily" },
  { view: "manifest", label: "Manifest", icon: Target, needsAuth: true, group: "Practice" },
  { view: "ritual", label: "Ritual", icon: Flame, needsAuth: true, group: "Practice" },
  { view: "frequency", label: "Frequencies", icon: Waves, needsAuth: true, group: "Practice" },
  { view: "positivity", label: "Positivity", icon: Heart, needsAuth: true, group: "Practice" },
  { view: "birth-chart", label: "Birth Chart", icon: Star, needsAuth: true, group: "Astrology" },
  { view: "numerology", label: "Numerology", icon: Hash, needsAuth: true, group: "Astrology" },
  { view: "insights", label: "Insights", icon: Compass, needsAuth: true, group: "Astrology" },
  { view: "compatibility", label: "Compatibility", icon: Users, needsAuth: true, group: "Astrology" },
  { view: "life-report", label: "Life Report", icon: BookOpen, needsAuth: true, group: "Astrology" },
  { view: "luck-store", label: "Buy Luck", icon: Wallet, needsAuth: true, group: "Account" },
  { view: "profile", label: "Profile & Stats", icon: BarChart3, needsAuth: true, group: "Account" },
  { view: "analytics", label: "Insights Dashboard", icon: LineChart, needsAuth: true, group: "Account" },
  { view: "reseller", label: "Reseller", icon: Store, resellerOnly: true, needsAuth: true, group: "Account" },
  { view: "admin", label: "Admin", icon: Shield, adminOnly: true, needsAuth: true, group: "Account" },
];

export function AppShell() {
  const { view, setView, sidebarOpen, setSidebarOpen } = useStore();
  const { data, isLoading } = useMe();
  const { data: badgeData } = useBadges();
  const user = data?.user ?? null;
  const badges = badgeData?.badges;
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
    <div className="relative min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Mobile top bar */}
      <header className="lg:hidden sticky top-0 z-30 bg-[#0A0908] border-b border-[#2A2722] px-4 py-3 flex items-center justify-between lum-pt-safe">
        <button onClick={() => setSidebarOpen(true)} aria-label="Open navigation menu" className="p-2 -ml-2 text-[#6B6358] hover:text-[#E8E2D5] transition">
          <Menu className="w-5 h-5" />
        </button>
        <div className="serif-display text-[1.125rem] text-[#E8E2D5] leading-none">Baydin</div>
        {user ? (
          <button onClick={() => setProfileOpen(true)} className="flex items-center gap-1.5 text-[12px] text-[#9C9489]">
            {user.role === "admin" && (
              <span className="text-[10px] text-[#C5A572]">admin</span>
            )}
            <span className="tabular-nums">{user.luckBalance}</span>
          </button>
        ) : (
          <button onClick={() => setAuthOpen(true)} className="text-[13px] text-[#9C9489] hover:text-[#E8E2D5] transition">Sign in</button>
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
          badges={badges}
        />

        {/* Main area */}
        <main className="flex-1 min-w-0 flex flex-col">
          {/* Desktop top bar — quiet, no glass, no sparkle */}
          <div className="hidden lg:flex items-center justify-between px-8 py-4 border-b border-[#2A2722] bg-[#0A0908]">
            <div className="flex items-baseline gap-3">
              <span className="serif-display text-[1.125rem] text-[#E8E2D5]">Baydin</span>
              <span className="text-[11px] text-[#6B6358] hidden xl:inline">Astrology, tarot, ritual</span>
            </div>
            <div className="flex items-center gap-4">
              {user ? (
                <>
                  {user.role === "admin" && (
                    <span className="text-[11px] text-[#C5A572]" title="Admin bypass active">
                      admin
                    </span>
                  )}
                  <DailyRewardBadge />
                  <button onClick={() => setProfileOpen(true)} className="text-[12px] text-[#9C9489] hover:text-[#E8E2D5] transition tabular-nums">
                    {user.luckBalance} Luck
                  </button>
                  <ThemeToggle />
                  <button onClick={() => setProfileOpen(true)} aria-label="Open profile and settings" className="w-8 h-8 rounded-sm flex items-center justify-center text-[#6B6358] hover:text-[#E8E2D5] transition focus-ring">
                    <Settings className="w-4 h-4" />
                  </button>
                </>
              ) : (
                <>
                  <GhostButton onClick={() => setAuthOpen(true)} className="py-2 px-4 text-[12px]">Sign in</GhostButton>
                  <button
                    onClick={() => setAuthOpen(true)}
                    className="py-2 px-4 text-[13px] bg-[#E8E2D5] text-[#0A0908] hover:bg-white transition rounded-sm focus-ring"
                  >
                    Begin
                  </button>
                </>
              )}
            </div>
          </div>

          {/* View content */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <AnimatePresence mode="wait">
              <motion.div
                key={view}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.25, ease: [0.2, 0, 0, 1] }}
                className="h-full"
              >
                {view === "today" && <TodayView onAuth={() => setAuthOpen(true)} />}
                {view === "chat" && <ChatView onAuth={() => setAuthOpen(true)} />}
                {view === "tarot" && <TarotView onAuth={() => setAuthOpen(true)} />}
            {view === "tarot-history" && <TarotHistoryView onAuth={() => setAuthOpen(true)} />}
                {view === "horoscope" && <HoroscopeView onAuth={() => setAuthOpen(true)} />}
                {view === "lunar-calendar" && <LunarCalendarView onAuth={() => setAuthOpen(true)} />}
                {view === "dream-journal" && <DreamJournalView onAuth={() => setAuthOpen(true)} />}
                {view === "manifest" && <ManifestView onAuth={() => setAuthOpen(true)} />}
                {view === "ritual" && <RitualView onAuth={() => setAuthOpen(true)} />}
                {view === "frequency" && <FrequencyView onAuth={() => setAuthOpen(true)} />}
                {view === "positivity" && <PositivityView onAuth={() => setAuthOpen(true)} />}
                {view === "birth-chart" && <BirthChartView onAuth={() => setAuthOpen(true)} />}
                {view === "insights" && <InsightsView onAuth={() => setAuthOpen(true)} />}
                {view === "compatibility" && <CompatibilityView onAuth={() => setAuthOpen(true)} />}
                {view === "life-report" && <LifeReportView onAuth={() => setAuthOpen(true)} />}
                {view === "numerology" && <NumerologyView onAuth={() => setAuthOpen(true)} />}
                {view === "luck-store" && <LuckStoreView onAuth={() => setAuthOpen(true)} />}
            {view === "profile" && <ProfileView onAuth={() => setAuthOpen(true)} />}
                {view === "analytics" && <AnalyticsDashboardView onAuth={() => setAuthOpen(true)} />}
                {view === "reseller" && <ResellerView onAuth={() => setAuthOpen(true)} />}
                {view === "admin" && <AdminView />}
              </motion.div>
            </AnimatePresence>
          </div>
        </main>
      </div>

      <AuthModal open={authOpen} onOpenChange={setAuthOpen} />
      <ProfileSheet open={profileOpen} onOpenChange={setProfileOpen} />
      {user && <AchievementCelebration />}
      {user && <ReminderService />}
      {user && <Onboarding />}
      <PWARegister />
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
  badges?: { unconfirmedGoals: number; ritualIncomplete: boolean; recentConversations: number };
}) {
  // Helper to get badge count for a view
  function badgeFor(view: AppView): number | null {
    if (!props.badges) return null;
    if (view === "manifest" && props.badges.unconfirmedGoals > 0) return props.badges.unconfirmedGoals;
    if (view === "ritual" && props.badges.ritualIncomplete) return 1;
    return null;
  }
  return (
    <>
      {/* Mobile backdrop */}
      {props.open && (
        <div className="lg:hidden fixed inset-0 bg-black/60 backdrop-blur-sm z-40" onClick={props.onClose} />
      )}
      <aside
        className={cn(
          "fixed lg:sticky top-0 left-0 z-40 lg:z-10 h-[100dvh] lg:h-auto lg:self-stretch w-[280px] shrink-0",
          "bg-[#0A0908] border-r border-[#2A2722] flex flex-col transition-transform duration-300",
          props.open ? "translate-x-0" : "-translate-x-full lg:translate-x-0"
        )}
      >
        {/* Brand — serif wordmark, no sparkle emoji */}
        <div className="flex items-center justify-between px-5 pt-6 pb-4">
          <div className="leading-tight">
            <div className="serif-display text-[1.5rem] text-[#E8E2D5] leading-none">Baydin</div>
            <div className="text-[11px] text-[#6B6358] mt-1">Fortune, stars, ritual</div>
          </div>
          <button onClick={props.onClose} aria-label="Close navigation menu" className="lg:hidden p-1 text-[#6B6358] hover:text-[#E8E2D5] transition">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* New consultation — understated text link, not a gold button */}
        <div className="px-5 pb-4">
          <button
            onClick={props.onNewChat}
            className="w-full flex items-center gap-2 py-2.5 text-[13px] text-[#E8E2D5] hover:text-[#C5A572] transition border-b border-[#2A2722] focus-ring rounded-sm"
          >
            <Plus className="w-3.5 h-3.5" /> New consultation
          </button>
        </div>

        {/* Navigation — sentence-case group labels, no ALL-CAPS */}
        <nav className="px-3 flex-1 overflow-y-auto lumina-scroll">
          {(() => {
            const groups: Record<string, typeof props.navItems> = {};
            for (const item of props.navItems) {
              const g = item.group || "Other";
              (groups[g] ||= []).push(item);
            }
            const order = ["Daily", "Practice", "Astrology", "Account", "Other"];
            return order.filter((g) => groups[g]).map((g) => (
              <div key={g} className="mb-5">
                <div className="px-3 pt-3 pb-1.5 text-[12px] text-[#6B6358] font-medium">{g}</div>
                <div className="space-y-px">
                  {groups[g].map((item) => (
                    <button
                      key={item.view}
                      onClick={() => props.onNav(item)}
                      className={cn(
                        "group w-full flex items-center gap-3 px-3 py-2 min-h-[36px] rounded-none text-[13px] transition-colors",
                        props.currentView === item.view
                          ? "text-[#E8E2D5] bg-[#1A1714]"
                          : "text-[#9C9489] hover:text-[#E8E2D5] hover:bg-[#0F0D0B]"
                      )}
                    >
                      <item.icon className={cn("w-[15px] h-[15px] shrink-0", props.currentView === item.view && "text-[#C5A572]")} />
                      <span className="flex-1 text-left">{item.label}</span>
                      {(() => { const b = badgeFor(item.view); return b ? <span className="text-[10px] text-[#C5A572] tabular-nums">{b}</span> : null; })()}
                    </button>
                  ))}
                </div>
              </div>
            ));
          })()}
        </nav>

        {/* Daily reward CTA */}
        {props.user && (
          <div className="px-5 py-2">
            <DailyRewardCard />
          </div>
        )}

        {/* Footer: user profile / sign in */}
        <div className="border-t border-[#2A2722] p-3">
          {props.user ? (
            <button
              onClick={props.onProfile}
              className="w-full flex items-center gap-3 p-2 rounded-sm hover:bg-[#0F0D0B] transition"
            >
              <div className="w-8 h-8 rounded-full bg-[#1A1714] border border-[#2A2722] flex items-center justify-center text-[#C5A572] text-[12px] font-medium">
                {(props.user.email[0] || "B").toUpperCase()}
              </div>
              <div className="flex-1 min-w-0 text-left">
                <div className="text-[13px] text-[#E8E2D5] truncate">{props.user.name || props.user.email}</div>
                <div className="text-[11px] text-[#6B6358]">{props.user.luckBalance} Luck</div>
              </div>
              <Settings className="w-3.5 h-3.5 text-[#6B6358]" />
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
