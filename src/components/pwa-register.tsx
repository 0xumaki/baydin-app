"use client";

import { useEffect } from "react";
import { useStore, type AppView } from "@/lib/store";

const VALID_VIEWS: AppView[] = [
  "today", "chat", "tarot", "tarot-history", "birth-chart", "horoscope",
  "lunar-calendar", "dream-journal",
  "manifest", "ritual", "frequency", "positivity", "insights",
  "compatibility", "life-report", "numerology", "luck-store",
  "profile", "reseller", "admin",
];

/**
 * PWA bootstrap:
 *  - Registers /sw.js (offline caching, app shell)
 *  - Listens for SW updates → reload on controller change
 *  - Handles ?view=... deep-links from PWA shortcut URLs
 *    (shortcut URLs open at /, so we translate ?view=tarot → set view)
 */
export function PWARegister() {
  const setView = useStore((s) => s.setView);

  // Deep-link from PWA shortcut: ?view=today → setView("today")
  useEffect(() => {
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const v = params.get("view");
    if (v && VALID_VIEWS.includes(v as AppView)) {
      setView(v as AppView);
      // Clean the URL so refresh doesn't keep forcing the view
      const url = new URL(window.location.href);
      url.searchParams.delete("view");
      url.searchParams.delete("source");
      window.history.replaceState({}, "", url.toString());
    }
  }, [setView]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!("serviceWorker" in navigator)) return;
    // Don't register SW in dev — Next.js HMR conflicts with cached assets.
    if (process.env.NODE_ENV !== "production") return;

    let refreshing = false;
    navigator.serviceWorker
      .register("/sw.js", { scope: "/" })
      .then((reg) => {
        reg.addEventListener("updatefound", () => {
          const nw = reg.installing;
          if (!nw) return;
          nw.addEventListener("statechange", () => {
            if (nw.state === "installed" && navigator.serviceWorker.controller) {
              // New version available — tell SW to take over, then reload once
              nw.postMessage("SKIP_WAITING");
            }
          });
        });
      })
      .catch(() => {
        // SW registration failed — silently ignore (e.g., Safari quirks)
      });

    navigator.serviceWorker.addEventListener("controllerchange", () => {
      if (refreshing) return;
      refreshing = true;
      window.location.reload();
    });
  }, []);

  return null;
}
