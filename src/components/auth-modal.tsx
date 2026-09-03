"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { GlassCard, GoldButton, GhostButton, Pill } from "@/components/lumina/primitives";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X, Sparkles, Wallet, Star, ShieldCheck } from "lucide-react";
import { toast } from "sonner";

export function AuthModal({ open, onOpenChange }: { open: boolean; onOpenChange: (v: boolean) => void }) {
  const qc = useQueryClient();
  const [loading, setLoading] = React.useState(false);
  const [demoLoading, setDemoLoading] = React.useState(false);
  const [referralCode, setReferralCode] = React.useState("");
  const dialogRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    // Read ?ref= from URL
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) setReferralCode(ref);
  }, []);

  // Close on Escape, lock body scroll while open
  React.useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onOpenChange(false);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    // Focus the first input on open
    setTimeout(() => {
      dialogRef.current?.querySelector("input")?.focus();
    }, 50);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onOpenChange]);

  if (!open) return null;

  async function submit(mode: "login" | "register", email: string, password: string, name?: string) {
    setLoading(true);
    try {
      const res = await fetch(`/api/auth/${mode}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ email, password, name, referralCode: referralCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Authentication failed");
      toast.success(mode === "register" ? "Welcome to Baydin! 5 Luck gifted ✦" : "Welcome back");
      qc.invalidateQueries({ queryKey: ["me"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setLoading(false);
    }
  }

  /** One-click demo admin login — bypasses Luck charges on all features. */
  async function demoAdminLogin() {
    setDemoLoading(true);
    try {
      const res = await fetch("/api/auth/demo-admin", {
        method: "POST",
        credentials: "include",
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Demo admin login failed");
      toast.success("Logged in as Baydin Admin · all features unlocked ✦");
      qc.invalidateQueries({ queryKey: ["me"] });
      onOpenChange(false);
    } catch (e: any) {
      toast.error(e.message);
    } finally {
      setDemoLoading(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-md">
      <div ref={dialogRef} className="w-full max-w-md">
      <GlassCard float className="p-6 relative lum-anim-float-up" role="dialog" aria-modal="true" aria-label="Sign in or create account">
        <button onClick={() => onOpenChange(false)} aria-label="Close dialog" className="absolute top-4 right-4 text-ink-muted hover:text-ink transition">
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-5">
          <div className="text-gold text-3xl mb-1">✦</div>
          <h2 className="text-[22px] font-light tracking-tight text-ink">Baydin</h2>
          <p className="text-[12px] text-ink-muted mt-1">Astrologer · Tarot · Horoscope · Rituals</p>
        </div>

        <Tabs defaultValue="login" className="w-full">
          <TabsList className="grid grid-cols-2 w-full bg-white/[0.03] mb-4">
            <TabsTrigger value="login" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-ink-muted text-[13px]">Sign in</TabsTrigger>
            <TabsTrigger value="register" className="data-[state=active]:bg-gold/15 data-[state=active]:text-gold text-ink-muted text-[13px]">Create account</TabsTrigger>
          </TabsList>

          <TabsContent value="login">
            <LoginForm onSubmit={(e, p) => submit("login", e, p)} loading={loading} />
          </TabsContent>
          <TabsContent value="register">
            <RegisterForm onSubmit={(e, p, n) => submit("register", e, p, n)} loading={loading} referralCode={referralCode} setReferralCode={setReferralCode} />
          </TabsContent>
        </Tabs>

        {/* Demo Admin one-click login — bypasses Luck charges on all features */}
        <div className="mt-4 pt-4 border-t border-white/5">
          <button
            onClick={demoAdminLogin}
            disabled={demoLoading || loading}
            className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-gold/30 bg-gold-soft/40 hover:bg-gold-soft/60 text-gold text-[12px] font-medium tracking-wide transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {demoLoading ? (
              <span className="animate-pulse">Signing in…</span>
            ) : (
              <>
                <ShieldCheck className="w-4 h-4" />
                Demo Admin · unlock everything
              </>
            )}
          </button>
          <p className="text-[10px] text-ink-muted/70 text-center mt-1.5 leading-relaxed">
            Bypasses Luck charges for QA / preview. All features free.
          </p>
        </div>

        {referralCode && (
          <div className="mt-3 flex items-center justify-center gap-1.5 text-[11px] text-leaf">
            <Sparkles className="w-3 h-3" /> Referred by {referralCode} — bonus Luck on signup
          </div>
        )}

        <div className="mt-5 pt-4 border-t border-white/5 flex items-center justify-center gap-4 text-[10px] text-ink-muted">
          <span className="flex items-center gap-1"><Star className="w-3 h-3 text-gold" /> 5 Luck free</span>
          <span className="flex items-center gap-1"><Wallet className="w-3 h-3 text-leaf" /> Pay-as-you-go</span>
        </div>
      </GlassCard>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void; loading: boolean }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password); }} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="le" className="text-[12px] text-ink-muted">Email</Label>
        <Input id="le" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink placeholder:text-ink-muted/50" placeholder="you@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lp" className="text-[12px] text-ink-muted">Password</Label>
        <Input id="lp" type="password" required value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink placeholder:text-ink-muted/50" placeholder="••••••••" />
      </div>
      <GoldButton type="submit" disabled={loading} className="w-full">
        {loading ? "Signing in…" : "Sign in"}
      </GoldButton>
    </form>
  );
}

function RegisterForm({ onSubmit, loading, referralCode, setReferralCode }: { onSubmit: (email: string, password: string, name?: string) => void; loading: boolean; referralCode: string; setReferralCode: (v: string) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password, name || undefined); }} className="space-y-3">
      <div className="space-y-1.5">
        <Label htmlFor="rn" className="text-[12px] text-ink-muted">Name (optional)</Label>
        <Input id="rn" value={name} onChange={(e) => setName(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink placeholder:text-ink-muted/50" placeholder="Your name" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="re" className="text-[12px] text-ink-muted">Email</Label>
        <Input id="re" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink placeholder:text-ink-muted/50" placeholder="you@example.com" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rp" className="text-[12px] text-ink-muted">Password</Label>
        <Input id="rp" type="password" required minLength={6} value={password} onChange={(e) => setPassword(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink placeholder:text-ink-muted/50" placeholder="Min 6 characters" />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rr" className="text-[12px] text-ink-muted">Referral code (optional)</Label>
        <Input id="rr" value={referralCode} onChange={(e) => setReferralCode(e.target.value)} className="bg-white/[0.03] border-white/10 text-ink placeholder:text-ink-muted/50" placeholder="BAYDIN-XXXXXX" />
      </div>
      <GoldButton type="submit" disabled={loading} className="w-full">
        {loading ? "Creating…" : "Create account · 5 Luck free"}
      </GoldButton>
    </form>
  );
}
