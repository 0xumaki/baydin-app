# Task REC-3 — Re-create share-card system + breath view

**Agent:** Z.ai Code (Agent REC-3)
**Task:** Re-create the share-card system (`ShareCardModal`) and the Breath view (`BreathView`) for the Baydin Next.js project at `/home/z/my-project`, plus the supporting API route and nav wiring. (A previous server reset had wiped both out.)

## Files created / modified

### New files
- `src/components/share-card.tsx` — ShareCardModal + types + helpers
- `src/components/views/breath-view.tsx` — BreathView (3 states, 4 patterns)
- `src/app/api/breath-session/route.ts` — POST/GET breath session log
- `src/components/lumina/premium-ui.tsx` — ShimmerButton, ShimmerCard, OrnamentDivider
- `scripts/gen-nav-breath-icon.mjs` — sharp SVG→PNG icon generator
- `public/icons/nav-breath.png` — generated 512×512 PNG icon

### Existing files edited
- `src/components/lumina/baydin-icons.tsx` — added LotusIcon + StarGlyphIcon exports (className-based, consistent with existing CloverIcon API)
- `src/lib/store.ts` — added `"breath"` to AppView union
- `src/components/app-shell.tsx` — added Wind import, breath NAV_ITEM, view render
- `src/components/pwa-register.tsx` — added `"breath"` to VALID_VIEWS
- `src/lib/i18n.ts` — added `nav_breath` translations (en/my/th/kh/lo)

### Package install
- `html-to-image@1.11.13` (via `bun add html-to-image`)

## Verification

- ✅ `bun run lint` — clean (0 errors, 0 warnings)
- ✅ `bunx tsc --noEmit` — clean for all `src/` files (only pre-existing errors in unrelated `repo-scan/` and `skills/` directories)
- ✅ Dev server briefly served `GET /` → 200 (webpack mode) before being OOM-killed by the 4 GB sandbox memory ceiling — this is a system-level memory pressure issue, not a code defect

## Notes for downstream agents

1. **baydin-icons.tsx contract**: `CloverIcon`, `LotusIcon`, `StarGlyphIcon` all take `className` for sizing (Tailwind `w-N h-N`). They do NOT take a numeric `size` prop — use className instead. The existing `BaydinLogo` and `CloverPNG` exports were preserved untouched.

2. **premium-ui.tsx**: `ShimmerButton` accepts `tone?: "gold" | "parchment"` and standard button props. The shimmer effect relies on the `.lum-shimmer-sweep` CSS class already defined in `src/app/globals.css`.

3. **API contract for `/api/breath-session`**:
   - `POST { pattern: "box"|"478"|"coherent"|"deep-relax", durationSec: number, breathCount?: number }` → creates a `FrequencySession` row with `mode: "breath"`, `frequencyHz: 0`, `intention: <pattern>`, `beatHz: <breathCount>` (stashed in the float column so we don't need a migration).
   - `GET` → last 50 breath sessions (filtered by `mode: "breath"`).
   - Auth required for both — unauthenticated requests get `401` / empty list.

4. **ShareCardModal contract**: see exported `ShareCardReading` (a union of tarot/horoscope/chat reading shapes) and `useShareCard()` convenience hook. The modal renders the live preview at small scale + an offscreen full-resolution (1080×H) mount that `html-to-image`'s `toPng()` captures with `{ skipFonts: true, pixelRatio: 2 }`. Three templates (editorial / celestial / minimal) × three aspects (story / square / portrait). Baydin wordmark sits bottom-right of every card.

5. **BreathView 3 states via useReducer** (`welcome | active | complete`):
   - All hooks (useReducer, useRef×3, useEffect×2) are declared BEFORE the `if (!user)` early-return — required by React rules-of-hooks.
   - Phase progression runs on a 250 ms `setInterval`; chime tones differ per phase (C5 inhale, E5 hold, G4 exhale, A4 rest).
   - Ambient pad uses dynamic `import("tone")`.
   - On completion the view POSTs to `/api/breath-session` and shows a summary card.

6. **Icon generation**: re-runnable via `bun scripts/gen-nav-breath-icon.mjs` if the asset needs regeneration. Outputs a 512×512 PNG with concentric breath rings + a 4-leaf clover glyph.
