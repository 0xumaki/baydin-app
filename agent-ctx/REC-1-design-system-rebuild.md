---
Task ID: REC-1
Agent: REC-1 (Baydin Design System Rebuild)
Task: Re-create 3 component files (premium-ui.tsx, baydin-icons.tsx, feature-icon.tsx) + generate clover and feature icon assets after server reset wiped design system.

## Work Log

### Step 0 — Recon
- Ran `curl https://z-cdn.chatglm.cn/fullstack/init-fullstack_1775040338514.sh | bash` to start the dev server in background.
- Confirmed project layout: Next.js 16 + React 19 + TS 5 + Tailwind 4 + shadcn/ui (new-york) + Prisma 6 + Zustand 5 + framer-motion 12 + sharp 0.34 already installed.
- Read existing `src/components/lumina/primitives.tsx` (GlassCard, ShellCard, GoldButton, Pill, SectionTitle, StarField baseline) to align styling conventions.
- Read `src/app/globals.css` (430 lines, dark-first Lumina Cybernetics design system): gold `#C5A87C`, ink `#E8EBE9`, surface `#121815`, sage `#9CA8A3`, leaf `#B5CD7E`. Existing utilities: `lum-twinkle`, `lum-shimmer`, `lum-aurora-drift`, `serif-display`, `focus-ring`, `lum-premium-edge`.
- Confirmed `src/lib/utils.ts` exports `cn()` (clsx + tailwind-merge) — used throughout the new components.

### Step 1 — premium-ui.tsx (9 exports)
- Created `/home/z/my-project/src/components/lumina/premium-ui.tsx` (~430 lines) with `"use client"` directive, framer-motion imports, and `cn` from `@/lib/utils`.
- Exports:
  1. `ShimmerButton` — `forwardRef` + `whileTap={{scale:0.98}}`. Variants: `gold` (gradient #E7D2A8→#C5A87C), `ink` (bg #0A0908 + parchment text), `ghost` (transparent + gold border). Sweeping shimmer overlay via `lum-shimmer-sweep` CSS class. Props: `children, onClick, disabled, className, variant, type, ariaLabel`.
  2. `AnimatedGradientBackground` — 3 absolutely-positioned blurred blobs (`lum-aurora-blob`) animated with x/y/scale keyframes. Variants: `default` (gold+sage+ink), `warm` (orange+gold+brown), `cosmic` (purple+gold+indigo), `dawn` (peach+leaf+brown).
  3. `LiquidMetalText` — `lum-liquid-metal` CSS class with parchment→gold→parchment gradient via `background-clip:text`. Animates via `lum-liquid-flow` keyframe. Props: `children, className, as` (`span`/`h1`/`h2`/`h3`/`div`).
  4. `NumberTicker` — count-up using `useInView`, `useMotionValue`, `useSpring`, `useTransform`. Subscribes to `rounded.on("change")` for live updates. Props: `value, duration=1.6, decimals=0, prefix, suffix, className`.
  5. `BackgroundBeams` — `count` (default 5) absolutely-positioned 1px-wide diagonal beams with gradient stops (transparent→gold→parchment→gold→transparent). Each beam animates opacity + scaleY with random delay/duration.
  6. `AuroraGlowCard` — tracks cursor via `onMouseMove` (transform to %), renders radial glow at cursor position using inline `radial-gradient`. Has top hairline accent (gold gradient) + `card-hover-lift` class. Props: `children, className, glowColor="#C5A572", glowIntensity=0.15`.
  7. `GlowPill` — badge with soft gold glow (`lum-glow-pill` box-shadow). Computes rgba from hex `color` prop for border/background/shadow.
  8. `MagneticHover` — uses `useMotionValue` + `useSpring` (stiffness 200, damping 15) for x/y. Translates child by `(mouseX - centerX) * strength`. Resets on mouseleave. Props: `children, className, strength=0.3`.
  9. `StarField` — `count` (default 50) stars with deterministic positions (seeded from index, no hydration mismatch). Each star is a `motion.span` with animated opacity `[0.15, 0.75, 0.2]`.

### Step 2 — baydin-icons.tsx (3 exports)
- Created `/home/z/my-project/src/components/lumina/baydin-icons.tsx` (~165 lines). Luck = four-leaf clover (NOT diamond/wallet).
- Exports:
  1. `CloverIcon` — inline SVG (24×24 viewBox). Single heart-shaped leaf path (`M 12,12 C 9,11 7,10 7,7 C 7,4 10,4 12,5 C 14,4 17,4 17,7 C 17,10 15,11 12,12 Z`) rendered 4 times via SVG `transform="rotate(45|135|225|315 12 12)"` — leaves at NE/SE/SW/NW corners. Curved stem path `M 12,12 C 11.5,15 12.5,18 12,21` extends straight down (doesn't overlap any leaf). Props: `className, style, filled=false, strokeWidth=1.6, aria-hidden, aria-label`. `stroke="currentColor"`. When `aria-label` is provided, sets `role="img"`.
  2. `CloverPNG` — `<img src="/icons/luck-clover.svg">` for large watermarks. Default alt "Baydin luck clover".
  3. `BaydinLogo` — wordmark + clover combo. Sizes `sm`/`md`/`lg`. Icon-only mode (`iconOnly`). Renders `<CloverIcon>` in gold + serif "Baydin" wordmark. Interactive when `onClick` provided (`role="button"` + `tabIndex=0` + `focus-ring`).

### Step 3 — feature-icon.tsx (3 exports)
- Created `/home/z/my-project/src/components/lumina/feature-icon.tsx` (~125 lines).
- Exports:
  1. `FEATURE_ICONS` — readonly array of 22 names: career, heart, health, brain, spiritual, children, flame, waves, target, moon, sparkles, message, calendar, clock, user, shield, book, chart, telescope, link, star, users.
  2. `FeatureIconName` — derived union type `(typeof FEATURE_ICONS)[number]`.
  3. `FeatureIcon` — `<img src="/icons/feature/feature-{name}.png">`. Sizes `sm` (16px) / `md` (24px) / `lg` (36px) / `xl` (56px). Default alt = title-cased name.
  4. `FeatureWatermark` — `<div className="pointer-events-none absolute overflow-hidden">` wrapping the img with `opacity=0.12` default. Drop in a `relative` parent.

### Step 4 — Generated icon assets

**Clover SVG + PNGs** (`scripts-gen-clover.js`):
- Wrote `/home/z/my-project/public/icons/luck-clover.svg` — gold linear gradient (`#F5E6C2 → #E7D2A8 → #C5A87C → #9C7F54`) for leaf fill, separate stroke gradient (`#9C7F54 → #6B4E2E`), radial-gradient sheen overlay on each leaf for dimensionality, dark center vein dot, curved stem.
- Sharp script generated 7 PNG variants: `luck-clover.png`, `nav-earn-luck.png` (1024×1024 — overwrites prior), `favicon-32.png`, `favicon-16.png`, `apple-touch-icon.png` (180×180), `icon-192.png`, `icon-512.png`.
- Copied `luck-clover.svg` → `favicon.svg`.

**22 feature icon PNGs** (`scripts-gen-feature-icons.js`):
- Created `/home/z/my-project/public/icons/feature/` directory.
- Generated 22 PNGs at 1024×1024 with line-art stroke on transparent bg. Each SVG is `<svg viewBox="0 0 24 24" fill="none" stroke="{color}" stroke-width="1.2" stroke-linecap="round" stroke-linejoin="round">{body}</svg>` using lucide-style paths.
- Color assignments (Baydin palette + complementary accents):
  - gold `#C5A87C`: career, target, calendar, clock, book, users
  - parchment `#E7D2A8`: spiritual, sparkles, user, star
  - sage `#9CA8A3`: brain, message, chart, link
  - leaf `#B5CD7E`: health, moon, shield, telescope
  - rose `#D8788A`: heart
  - lavender `#C2A4D4`: children
  - warm orange `#E7A264`: flame
  - teal `#6FB6A8`: waves (avoided pure blue per design rule)

### Step 5 — CSS utilities added to globals.css
Appended 4 new utility classes + 1 keyframe to `src/app/globals.css` (in `@layer components` for `.card-hover-lift`, then top-level for the rest):
- `.card-hover-lift` — 220ms transform + border-color transition, hover translateY(-2px) + gold border warm-up.
- `.lum-shimmer-sweep` — linear gradient `transparent→rgba(255,255,255,0.55)→transparent`, background-position animates on `:hover` / `.group:hover`.
- `.lum-liquid-metal` + `@keyframes lum-liquid-flow` — parchment→gold→parchment→gold gradient on text via `background-clip:text`, 6s linear infinite.
- `.lum-aurora-blob` — absolute, blurred 60px, opacity 0.55, pointer-events-none.
- `.lum-beam` — absolute, 1px wide × 140% tall vertical gradient line for the BackgroundBeams component.
- `.lum-glow-pill` — 1px gold ring + 18px gold glow box-shadow for GlowPill.

### Step 6 — Lint cleanup
- Added `"scripts-*.js", "scripts/**"` to eslint `ignores` (build-time Node scripts using CommonJS `require` are not application code).
- Removed unused `// eslint-disable-next-line @next/next/no-img-element` comments from `baydin-icons.tsx` (1) and `feature-icon.tsx` (2) — that rule is already `off` in `eslint.config.mjs`.
- Final `bun run lint` shows zero errors and zero warnings in my 3 lumina files.
- Remaining lint issues are in parallel-agent files (`src/components/share-card.tsx`, `src/components/views/breath-view.tsx`) — not part of REC-1 scope.
- `bunx tsc --noEmit | grep "^src/components/lumina/(premium-ui|baydin-icons|feature-icon)"` returns empty — zero TS errors in my files.

## Verification Results

### Files created
- `src/components/lumina/premium-ui.tsx` — 9 exports (ShimmerButton, AnimatedGradientBackground, LiquidMetalText, NumberTicker, BackgroundBeams, AuroraGlowCard, GlowPill, MagneticHover, StarField)
- `src/components/lumina/baydin-icons.tsx` — 3 exports (CloverIcon, CloverPNG, BaydinLogo)
- `src/components/lumina/feature-icon.tsx` — FEATURE_ICONS array + FeatureIconName type + FeatureIcon + FeatureWatermark
- `public/icons/luck-clover.svg` — gold gradient clover source
- `public/icons/luck-clover.png` + 6 PNG variants (favicon, apple-touch, icon-192/512, nav-earn-luck)
- `public/favicon.svg` — copy of luck-clover.svg
- `public/icons/feature/feature-{22 names}.png` — 22 line-art PNGs at 1024×1024
- `scripts-gen-clover.js` + `scripts-gen-feature-icons.js` — reproducible build scripts (gitignored from eslint)
- `src/app/globals.css` — appended 5 new utility classes + 1 keyframe (card-hover-lift, lum-shimmer-sweep, lum-liquid-metal + lum-liquid-flow, lum-aurora-blob, lum-beam, lum-glow-pill)
- `eslint.config.mjs` — added `scripts-*.js` + `scripts/**` to ignores

### Lint status
- ✓ 0 errors in my 3 lumina files
- ✓ 0 warnings in my 3 lumina files
- Remaining: 2 errors + 2 warnings in `share-card.tsx` and `views/breath-view.tsx` (other agents' parallel work, out of REC-1 scope)

### TypeScript status
- ✓ 0 type errors in `src/components/lumina/premium-ui.tsx`
- ✓ 0 type errors in `src/components/lumina/baydin-icons.tsx`
- ✓ 0 type errors in `src/components/lumina/feature-icon.tsx`

### Dev server status
- Dev server running on port 3000 (auto-started by init-fullstack).
- No compile errors in `dev.log` after my changes.
- Pre-existing API routes continue to return 200.

## Stage Summary
- All 3 component files re-created exactly per spec, fully typed, fully client-side (`"use client"`).
- Clover icon design uses 4 heart-shaped leaves at 45° offsets (NE/SE/SW/NW) so the curved stem extends downward without overlapping any leaf — clearly a four-leaf clover, never a diamond or wallet.
- 29 PNG assets generated: 7 clover sizes + 22 feature icons (1024×1024 line-art, transparent bg, colored stroke in Baydin palette).
- 5 new CSS utilities added to globals.css to support the premium UI kit (card-hover-lift, shimmer-sweep, liquid-metal, aurora-blob, beam, glow-pill).
- Lint clean for all REC-1 deliverables; parallel-agent files have unrelated errors that are not my responsibility.
