# REC-2 — Re-applied 8 critical fixes after server reset

**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")
**Agent:** REC-2 (recovery agent)
**Working directory:** `/home/z/my-project`

## Context
A server reset wiped out 8 critical fixes that had previously shipped. This agent re-applied each fix and verified `bun run lint` is clean.

Previous agent records visible in `/agent-ctx`:
- `REC-1-design-system-rebuild.md` — design system rebuild (clover icon, primitives).

## Fixes applied

### FIX 1 — `socket.io-client` installed
- `bun add socket.io-client` → `socket.io-client@4.8.3`.

### FIX 2 — Double scrollbar eliminated globally
- 21 view files in `src/components/views/*.tsx` — class substitutions applied via `sed`:
  - `h-[100dvh] lg:h-[calc(100dvh-57px)]` → `h-full`
  - `min-h-[100dvh] lg:min-h-[calc(100dvh-57px)]` → `min-h-full`
- `src/components/app-shell.tsx`:
  - Root div: `min-h-[100dvh]` → `h-[100dvh]`
  - Row container (`flex-1 flex relative z-10`) → added `min-h-0 overflow-hidden`
  - `<main>` → added `min-h-0 overflow-hidden`
  - View-content container div → added `h-full`
  - `motion.div` wrapper → added `overflow-hidden`

### FIX 3 — Missing astrology exports
`src/lib/astrology/index.ts` — added `export` to:
`daysSinceJ2000`, `T`, `obliquity`, `sunMeanAnomaly`, `planetHeliocentric`,
`earthPosition`, `geocentricPlanet`, `gmst`, `lst`.
(Other functions on the spec list — `rev`, `lahiriAyanamsa`, `sunPosition`,
`moonPosition`, `meanNode` — were already exported.)

### FIX 4 — Real LLM streaming + markdown prose output contract
`src/lib/llm.ts`:
- `streamAstrologerLLM` now passes `stream: true` to the SDK and parses SSE:
  - Splits chunks on `\n\n` (SSE event boundary).
  - For each event, walks lines, takes only `data:`-prefixed ones, JSON.parses
    them, and yields `obj.choices[0].delta.content` (or `.text` as fallback).
  - Skips `[DONE]` sentinels and malformed lines.
  - Falls back to simulated streaming if the SDK returns a buffered
    `choices[]` completion instead of a ReadableStream.
- `CHAT_SKILL` output contract:
  - Was: "Return a single valid JSON object…"
  - Now: "Respond in MARKDOWN PROSE only. Do NOT wrap your reply in a JSON
    object. Optional trailing sections: `### ✦ Highlights` and
    `### ✦ Remedies & Lucky Elements`."
- `LLMResult` type gained `failed?: boolean`. Both catch blocks
  (`callAstrologerLLM` and `streamAstrologerLLM`) set `failed: true`.
- `parseLLMResult` now:
  1. Tries legacy JSON parse (for backwards compat).
  2. If not JSON, treats the raw text as markdown prose and extracts
     `Highlights` + `Remedies` sections via two new helpers
     (`extractMarkdownSection`, `splitMarkdownList`).
  3. Strips those trailing sections from `content` so the prose stays clean
     while `parsed.highlights` and `parsed.guidance` carry the structured bits.

### FIX 5 — Horoscope cache + streaming
- `prisma/schema.prisma` — added `HoroscopeCache` model:
  - Fields: `id`, `sign`, `type`, `dateStr`, `language`, `content`,
    `highlights` (JSON string, optional), `guidance` (JSON string, optional),
    `personalized` (boolean), `createdAt`.
  - Unique constraint: `[sign, type, dateStr, language, personalized]`.
  - Index on `[sign, type, dateStr]`.
- `bun run db:push` → success, Prisma Client regenerated.
- `src/app/api/horoscope/route.ts`:
  - Non-personalized path checks `HoroscopeCache.findUnique` first. On hit,
    returns cached content immediately with `meta.cached: true`.
  - On miss, uses `streamAstrologerLLM` internally (consumes the async
    generator) to produce the full text. Falls back to `callAstrologerLLM`
    if streaming yields empty.
  - Persists the new result via `HoroscopeCache.upsert` (covers race
    conditions where two requests miss simultaneously).
  - Personalized path (with `birthData`) is never cached — always recomputed.
- `src/app/api/conversations/[id]/stream/route.ts`:
  - `tail: fullText.slice(-200)` → `tail: fullText`. The full partial
    transcript is now sent on every SSE chunk so the client can rebuild
    state from any point (e.g. on reconnect).

### FIX 6 — Tarot card face always renders real RWS image
`src/components/tarot-card-face.tsx` rewritten:
- The `<img src="/tarot/${card.id}.jpg">` is ALWAYS rendered when `showImage`
  is true. No more conditional gating on prior `imgOk`.
- Removed the entire SVG composition fallback block (~60 lines).
- When `imgOk === false`, an overlay is shown with the text "image unavailable"
  (centered, dim, using the suit accent color).
- All overlay layers (vignette, gradients, numeral, glyph, name) are gated
  on `imgOk !== false` so they don't render over the "image unavailable"
  placeholder.
- `reversed` rotation is now applied directly to the `<img>` className
  (no more nested motion.span rotation).

### FIX 7 — Horoscope auto-spend fix
`src/components/views/horoscope-view.tsx`:
- Added two wrapper functions:
  ```ts
  function changeSign(s: string) { setSign(s); setHoroscope(null); }
  function changeType(t: typeof type) { setType(t); setHoroscope(null); }
  ```
- Sign picker `onClick={() => changeSign(s)}` — no longer auto-fetches.
- Period tabs `onClick={() => changeType(t)}` — no longer auto-fetches.
- The "Read horoscope" GoldButton still calls `fetchH()` which is the only
  path that spends Luck (for personalized) or hits the cache (non-personalized).

### FIX 8 — refundLuck + admin bypass in `debitLuck`
`src/lib/luck.ts`:
- Added `export async function refundLuck({ userId, feature, amount, referenceId })`:
  - No-ops when `amount <= 0`.
  - Atomically increments `luckBalance` and reads back the new balance.
  - Creates a `refund`-type `LuckTransaction` ledger entry with the new
    `balanceAfter` populated.
- Added admin bypass to `debitLuck` (early return):
  ```ts
  if (process.env.BAYDIN_DISABLE_ADMIN_BYPASS !== "1") {
    const adminUser = await db.user.findUnique({
      where: { id: userId },
      select: { role: true, luckBalance: true },
    });
    if (adminUser?.role === "admin") {
      return { ok: true, balance: adminUser.luckBalance };
    }
  }
  ```
  This mirrors the bypass that already existed in `spendForFeature`, so
  callers that go straight to `debitLuck` (instead of `spendForFeature`)
  also get the admin bypass.

### FIX 9 — CSS for prose-editorial line breaks
`src/app/globals.css`:
- `.prose-editorial` and `.prose-editorial p` get:
  `overflow-wrap: anywhere; word-break: break-word; white-space: normal;`
- Added matching rules for: `h1`–`h4`, `ul`, `ol`, `li`, `code`, `pre`,
  `pre code`, `blockquote`, `hr` — all with `overflow-wrap: anywhere`.
- Headings: sensible margins (1.4em top, 0.6em bottom), `first-child` resets.
- Lists: `list-style: disc/decimal`, 1.4em left margin, 0.4em item spacing.
- Code: monospace font, subtle bg + padding, 3px radius.
- Pre: dark bg, 6px radius, horizontal overflow.
- Blockquote: gold left border, italic, dimmed opacity.
- HR: 1.5em top/bottom margin, subtle white-alpha top border.

## Bonus — pre-existing lint cleanup
While running `bun run lint`, two pre-existing errors and two pre-existing
warnings surfaced in files I did not touch as part of the 8 fixes:

- `src/components/views/breath-view.tsx`:
  - Line 316 + 352: `react-hooks/rules-of-hooks` — `React.useEffect` was
    called AFTER an early `if (!user) return`. Moved the early-return block
    to AFTER both useEffects (comment: "Sign-in gate (after all hooks)").
  - Line 435: removed unused `// eslint-disable-next-line react-hooks/exhaustive-deps`.
- `src/components/share-card.tsx`:
  - Line 860: removed unused `// eslint-disable-next-line @typescript-eslint/no-explicit-any`.

## Verification
- `bun run db:push` → success.
- `bun run lint` → exit code 0, no errors, no warnings. Output: `$ eslint .` (clean).

## Files touched
- `package.json` + `bun.lock` (socket.io-client).
- `prisma/schema.prisma`.
- `src/components/app-shell.tsx`.
- `src/components/tarot-card-face.tsx`.
- `src/components/views/*.tsx` (21 files — sed height-class replacement).
- `src/components/views/breath-view.tsx` (lint fix).
- `src/components/views/horoscope-view.tsx` (FIX 7).
- `src/components/share-card.tsx` (lint fix).
- `src/lib/astrology/index.ts` (FIX 3).
- `src/lib/llm.ts` (FIX 4).
- `src/lib/luck.ts` (FIX 8).
- `src/app/api/horoscope/route.ts` (FIX 5).
- `src/app/api/conversations/[id]/stream/route.ts` (FIX 5).
- `src/app/globals.css` (FIX 9).
- `worklog.md` (this entry).
- `agent-ctx/REC-2-critical-fixes-reapply.md` (this file).
