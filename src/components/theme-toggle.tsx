"use client";

import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { cn } from "@/lib/utils";

type BaydinTheme = "dark" | "luminary";

/**
 * ThemeToggle — switches between the default dark Lumina theme and the
 * warm "Luminary" gold-tinted theme. Stored in localStorage.
 */
export function ThemeToggle() {
  const [theme, setTheme] = React.useState<BaydinTheme>("dark");

  React.useEffect(() => {
    const saved = (typeof window !== "undefined" && localStorage.getItem("baydin-theme")) as BaydinTheme | null;
    if (saved === "luminary") {
      setTheme("luminary");
      document.documentElement.setAttribute("data-theme", "luminary");
    }
  }, []);

  function toggle() {
    const next: BaydinTheme = theme === "dark" ? "luminary" : "dark";
    setTheme(next);
    if (next === "luminary") {
      document.documentElement.setAttribute("data-theme", "luminary");
      localStorage.setItem("baydin-theme", "luminary");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("baydin-theme", "dark");
    }
  }

  return (
    <button
      onClick={toggle}
      className={cn(
        "w-8 h-8 rounded-full border flex items-center justify-center transition",
        theme === "luminary"
          ? "border-gold/30 bg-gold/10 text-gold"
          : "border-white/10 text-ink-muted hover:text-ink"
      )}
      title={theme === "luminary" ? "Switch to dark theme" : "Switch to Luminary warm theme"}
    >
      {theme === "luminary" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
    </button>
  );
}
