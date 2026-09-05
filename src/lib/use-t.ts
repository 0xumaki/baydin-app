"use client";

import * as React from "react";
import { useMe } from "@/lib/api-client";
import { translate, type Language } from "@/lib/i18n";

/**
 * useT — translation hook for client components.
 *
 * Returns a function `t(key)` that looks up the string in the user's
 * preferred language, falling back to English.
 *
 * Usage:
 *   const t = useT();
 *   <button>{t("sign_in")}</button>
 *
 * The hook re-renders when the user's language changes (via useMe).
 */
export function useT(): (key: string) => string {
  const { data } = useMe();
  const lang = (data?.user?.language as Language) || "en";
  return React.useCallback(
    (key: string) => translate(key, lang),
    [lang]
  );
}

/** Get the current user's language (for server-passed contexts). */
export function useLanguage(): Language {
  const { data } = useMe();
  return (data?.user?.language as Language) || "en";
}
