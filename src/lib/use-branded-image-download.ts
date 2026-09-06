"use client";

import * as React from "react";
import { toPng } from "html-to-image";

/**
 * useBrandedImageDownload — convert a DOM node (rendered SVG or HTML card)
 * to a PNG download.
 *
 * Usage:
 *   const ref = useRef<HTMLDivElement>(null);
 *   const { download, downloading } = useBrandedImageDownload();
 *   <div ref={ref}>{liveSvgOrComponent}</div>
 *   <button onClick={() => download(ref.current, "filename.png")}>Download</button>
 *
 * - Uses html-to-image's toPng with pixelRatio: 2 for crisp output.
 * - skipFonts: true to avoid CORS font-loading issues when running in sandbox.
 * - Auto-prepends "baydin-" to the filename if not already prefixed.
 */
export function useBrandedImageDownload() {
  const [downloading, setDownloading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const download = React.useCallback(
    async (
      node: HTMLElement | null,
      filename: string,
      opts?: { pixelRatio?: number; backgroundColor?: string }
    ) => {
      if (!node) {
        setError("No node provided");
        return;
      }
      setDownloading(true);
      setError(null);
      try {
        const dataUrl = await toPng(node, {
          cacheBust: true,
          pixelRatio: opts?.pixelRatio ?? 2,
          backgroundColor: opts?.backgroundColor ?? "#0A0908",
          skipFonts: true,
        });
        const link = document.createElement("a");
        const safeName = /^baydin-/i.test(filename) ? filename : `baydin-${filename}`;
        link.download = safeName.endsWith(".png") ? safeName : `${safeName}.png`;
        link.href = dataUrl;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch (e: any) {
        console.error("[useBrandedImageDownload] failed:", e);
        setError(e?.message ?? "Download failed");
      } finally {
        setDownloading(false);
      }
    },
    []
  );

  return { download, downloading, error };
}

/** Variant-keyed download filename generator (matches BrandedImageCard variants). */
export function brandedFilename(
  variant: string,
  suffix?: string
): string {
  const base: Record<string, string> = {
    "leaderboard-user": "leaderboard-users",
    "leaderboard-reseller": "leaderboard-resellers",
    "certificate-promotion": "certificate-promotion",
    "certificate-tier-upgrade": "certificate-tier-upgrade",
    "certificate-welcome": "certificate-welcome",
    "campaign-flyer": "campaign-flyer",
    "referral-share": "referral-share",
  };
  const name = base[variant] ?? "branded-image";
  return suffix ? `${name}-${suffix}` : name;
}
