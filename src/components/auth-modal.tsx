"use client";

import * as React from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { X } from "lucide-react";
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
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md">
      <div ref={dialogRef} className="w-full max-w-md">
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Sign in or create account"
          className="relative bg-[#0A0908] border border-[#2A2722] p-7 lum-reveal"
        >
          <button
            onClick={() => onOpenChange(false)}
            aria-label="Close dialog"
            className="absolute top-4 right-4 text-[#6B6358] hover:text-[#E8E2D5] transition focus-ring rounded-sm"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Hero — serif wordmark, the one distinctive moment */}
          <div className="mb-7">
            <div className="serif-display text-[2.5rem] leading-none text-[#E8E2D5] mb-1">
              Baydin
            </div>
            <div className="text-[13px] text-[#6B6358] leading-relaxed">
              Astrology, tarot, and the lunar calendar — for daily practice.
            </div>
          </div>

          {/* Hairline divider instead of card chrome */}
          <hr className="rule-h mb-6" />

          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid grid-cols-2 w-full bg-transparent border-b border-[#2A2722] rounded-none mb-5 h-auto p-0">
              <TabsTrigger
                value="login"
                className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#C5A572] data-[state=active]:bg-transparent data-[state=active]:text-[#E8E2D5] text-[#6B6358] text-[13px] py-3 data-[state=active]:shadow-none"
              >
                Sign in
              </TabsTrigger>
              <TabsTrigger
                value="register"
                className="rounded-none border-0 border-b-2 border-transparent data-[state=active]:border-[#C5A572] data-[state=active]:bg-transparent data-[state=active]:text-[#E8E2D5] text-[#6B6358] text-[13px] py-3 data-[state=active]:shadow-none"
              >
                Create account
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login">
              <LoginForm onSubmit={(e, p) => submit("login", e, p)} loading={loading} />
            </TabsContent>
            <TabsContent value="register">
              <RegisterForm onSubmit={(e, p, n) => submit("register", e, p, n)} loading={loading} referralCode={referralCode} setReferralCode={setReferralCode} />
            </TabsContent>
          </Tabs>

          {/* Demo Admin — understated, not a gold-wash button */}
          <div className="mt-6 pt-5 border-t border-[#2A2722]">
            <button
              onClick={demoAdminLogin}
              disabled={demoLoading || loading}
              className="w-full text-[13px] text-[#6B6358] hover:text-[#C5A572] transition py-2 disabled:opacity-50 focus-ring rounded-sm"
            >
              {demoLoading ? "Signing in…" : "Continue as demo admin"}
            </button>
            <p className="text-[11px] text-[#4A4540] text-center mt-1 leading-relaxed">
              All features available without charge.
            </p>
          </div>

          {referralCode && (
            <div className="mt-4 text-center text-[12px] text-[#8B7355] serif-italic">
              Referred by {referralCode} — bonus Luck on signup
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function LoginForm({ onSubmit, loading }: { onSubmit: (email: string, password: string) => void; loading: boolean }) {
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="le" className="text-[12px] text-[#6B6358] font-medium">Email</Label>
        <Input
          id="le"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 text-[14px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="lp" className="text-[12px] text-[#6B6358] font-medium">Password</Label>
        <Input
          id="lp"
          type="password"
          required
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 text-[14px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
          placeholder="••••••••"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 py-3 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium tracking-tight hover:bg-white transition disabled:opacity-50 focus-ring rounded-sm"
      >
        {loading ? "Signing in…" : "Sign in"}
      </button>
    </form>
  );
}

function RegisterForm({ onSubmit, loading, referralCode, setReferralCode }: { onSubmit: (email: string, password: string, name?: string) => void; loading: boolean; referralCode: string; setReferralCode: (v: string) => void }) {
  const [name, setName] = React.useState("");
  const [email, setEmail] = React.useState("");
  const [password, setPassword] = React.useState("");
  return (
    <form onSubmit={(e) => { e.preventDefault(); onSubmit(email, password, name || undefined); }} className="space-y-4">
      <div className="space-y-1.5">
        <Label htmlFor="rn" className="text-[12px] text-[#6B6358] font-medium">Name (optional)</Label>
        <Input
          id="rn"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 text-[14px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
          placeholder="Your name"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="re" className="text-[12px] text-[#6B6358] font-medium">Email</Label>
        <Input
          id="re"
          type="email"
          required
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 text-[14px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
          placeholder="you@example.com"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rp" className="text-[12px] text-[#6B6358] font-medium">Password</Label>
        <Input
          id="rp"
          type="password"
          required
          minLength={6}
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 text-[14px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
          placeholder="At least 6 characters"
        />
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="rr" className="text-[12px] text-[#6B6358] font-medium">Referral code (optional)</Label>
        <Input
          id="rr"
          value={referralCode}
          onChange={(e) => setReferralCode(e.target.value)}
          className="bg-transparent border-0 border-b border-[#2A2722] rounded-none px-0 text-[14px] text-[#E8E2D5] placeholder:text-[#4A4540] focus-visible:border-[#C5A572] focus-visible:ring-0"
          placeholder="BAYDIN-XXXXXX"
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full mt-6 py-3 bg-[#E8E2D5] text-[#0A0908] text-[14px] font-medium tracking-tight hover:bg-white transition disabled:opacity-50 focus-ring rounded-sm"
      >
        {loading ? "Creating…" : "Create account"}
      </button>
    </form>
  );
}
