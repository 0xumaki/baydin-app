# Task RECOVER-PREMIUM-CERT — Recover premium certificate design on BrandedImageCard client component

**Task ID:** RECOVER-PREMIUM-CERT
**Agent:** RECOVER-PREMIUM-CERT (Z.ai Code)
**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

## Context

A data loss event reverted the `BrandedImageCard` client component to a
basic SVG-embed-only implementation (`dangerouslySetInnerHTML` with the
server-side SVG string). While visually functional, this approach:

1. Has no React-level control over individual premium elements (shield,
   seal, signature line) — they exist only inside the opaque SVG string.
2. Forces `html-to-image` to rasterize a `<svg>` element with `<text>`
   children (font-rendering quirks under `skipFonts: true`).
3. Means the React tree bears no resemblance to the SVG tree, making
   future diffs / visual regression checks hard.

The task was to rebuild `BrandedImageCard` as a native React component
that mirrors the server SVG (`src/lib/branded-image.ts`) element-by-
element, using inline `style` props for all colors / backgrounds /
borders / opacities (html-to-image compatibility) and inline `<svg>`
elements for vector primitives (clover, shield, seal, corner ornament).

## Prior agent records read

Read every prior agent record in `/agent-ctx` to understand the full
project context (Baydin merged Lumina + GURU app):

- `REC-1-design-system-rebuild.md` — design system (clover icon, primitives)
- `REC-2-critical-fixes-reapply.md` — 8 critical fixes
- `REC-3-z.ai-code.md` — share-card system + breath view
- `RECOVER-BACKEND-z.ai-code.md` — backend recovery
- `RECOVER-ADMIN-FRONTEND-z.ai-code.md` — admin redesign + branded-image
  system (created `src/lib/branded-image.ts` with 4 SVG renderers +
  `src/components/branded-image/branded-image-card.tsx` using
  `dangerouslySetInnerHTML`)
- `RECOVER-RESELLER-FRONTEND-z.ai-code.md` — reseller portal frontend
  (uses BrandedImageCard hidden mounts + useBrandedImageDownload)

## Files inspected before changes

- `src/lib/branded-image.ts` (449 lines) — server-side SVG renderers.
  Premium design tokens: GOLD=#C5A87C, GOLD_LIGHT=#E7D2A8, GOLD_DARK=#9C7F54,
  PARCHMENT=#F5E6C2, INK=#E8EBE9, INK_DIM=#9CA8A3, SURFACE=#0A0908,
  SURFACE_2=#121815. Helpers: `cornerOrnament`, `shieldBadge`,
  `sealOfAuthenticity`, `cloverMark`, `sharedDefs` (linear/radial
  gradients + clover-dot pattern). 4 renderers: `renderCertificateSvg`
  (900×560), `renderLeaderboardSvg` (900×H), `renderCampaignFlyerSvg`
  (600×800), `renderReferralShareSvg` (600×700).
- `src/components/branded-image/branded-image-card.tsx` (199 lines, pre-edit)
  — `dangerouslySetInnerHTML` embed of the SVG string. Had a live-preview
  pulse dot + aspect-ratio wrapper but NO React-level premium elements.
- `src/lib/use-branded-image-download.ts` — `useBrandedImageDownload` hook
  (html-to-image `toPng` with `pixelRatio: 2`, `skipFonts: true`) +
  `brandedFilename(variant, suffix)` helper.
- `src/components/branded-image/index.ts` — barrel export of
  `BrandedImageCard`, `brandedFilename`, types.
- `src/components/lumina/baydin-icons.tsx` — existing `CloverIcon`
  component (4-leaf clover SVG with stem). Not used in the new
  `BrandedImageCard` because the server SVG uses a stemless cloverMark
  (4 petals + center dot, no stem) — using a different clover would
  diverge from the SVG.
- All call sites in `src/components/views/{admin,reseller,profile}-view.tsx`
  verified to confirm the existing prop contract (variant + certificate |
  leaderboard | campaign | referral + caption + className) and the hidden
  mount pattern (`position: fixed; left: -99999; opacity: 0`).

## File modified

- `src/components/branded-image/branded-image-card.tsx` — full rewrite
  from 199 → 1601 lines. New architecture (all native React + inline
  styles):

## New architecture

### Premium design tokens (mirror src/lib/branded-image.ts)
Same 8 color tokens + `SERIF = 'Georgia, "Times New Roman", serif'` and
`SANS = 'Inter, Arial, sans-serif'` constants.

### Helpers
- `truncate(s, max)`, `titleCase(s)` — verbatim copies of the SVG helpers
  so React + SVG agree on string truncation/labeling.
- `formalIssueDate(d)` — produces "Issued on the Nth day of Month, Year"
  with proper English ordinal suffix (1st, 2nd, 3rd, 4th...th). Used in
  the certificate's premium metadata area.
- `shortIssueDate(d)` — produces "October 15, 2024" matching the SVG's
  `date` field. Used in the certificate footer cert ID line.
- `generateCertId()` — produces "BAY-{base36 timestamp}-{base36 rand}"
  matching the SVG's certId format.

### `Text` component
SVG `<text x y>` uses the BASELINE as the y anchor; CSS uses the TOP of
the box. `Text` approximates the baseline by offsetting `top` by
`fontSize * 0.85` (typical Georgia / Inter baseline ratio at
`line-height: 1`). Supports `align: "start" | "middle" | "end"` (mapped
to `transform: translateX(-50% | -100% | none)`). All colors / fonts /
opacities / letter-spacing passed as inline `style`.

### SVG vector primitives (inline `<svg>`, no `<text>` except seal)
- `CloverMark({cx, cy, scale, color, opacity})` — mirrors `cloverMark()`.
  Computes `s = 8 * scale`, rendered extent `s * 1.5 * scale = 12 * scale^2`
  in each direction. SVG element sized `24 * scale^2` × `24 * scale^2`,
  viewBox `-renderedHalf -renderedHalf renderedSize renderedSize`.
  Inner `<g transform="scale(scale)">` with 4 quadratic-Bezier petal
  paths + center dot. Position verified: for `cx=84, cy=102, scale=1.4`,
  the SVG element is at (60.48, 78.48) — matches the SVG's
  `translate(72,90) → translate(12,12) → scale(1.4)` chain.
- `CornerOrnament({x, y, size})` — mirrors `cornerOrnament()`. SVG
  element at `(x, y)` with viewBox `0 0 size size`. Contains a `<g
  stroke=GOLD strokeWidth=0.8 fill=none opacity=0.7>` with the L-shape
  path + secondary inner L path + 3 small filled circles at the
  corners. Circles inherit stroke from the parent g (matching SVG
  group inheritance). `overflow: visible` so circles at the edges
  render fully.
- `ShieldBadge({cx, cy, scale})` — mirrors `shieldBadge()`. Computes
  `s = 18 * scale`, `elemSize = 2 * s * scale = 36 * scale^2`. SVG
  element at `(cx - s, cy - s)` (matches SVG's translate). Inner
  `<g transform="scale(scale)">` with the 8-point shield outline path
  (filled with SURFACE, opacity 0.95, stroked GOLD 1.2) + the diamond
  inner path (filled GOLD, opacity 0.8). For `cx=560, cy=484, scale=1.4`,
  the shield's bounding box is at (537.6, 461.6) — matches SVG.
- `SealOfAuthenticity({cx, cy, r})` — mirrors `sealOfAuthenticity()`.
  SVG element at `(cx - r, cy - r)`, viewBox `0 0 2r 2r`. Contains 3
  concentric circles (outer fill GOLD_DARK 0.85, middle ring
  GOLD_LIGHT 1.2 stroke, inner ring PARCHMENT 0.5 stroke 0.6 opacity).
  Uses inline SVG `<text>` for "BAYDIN" (font-size `r * 0.32`,
  fontWeight 700) and "AUTHENTIC" (font-size `r * 0.18`,
  letterSpacing 2) — both with `fontFamily={SERIF}` so html-to-image
  rasterizes via the browser's font renderer.

### `BackgroundLayers({width, height, showWatermark})`
- Layer 1: linear gradient `135deg, SURFACE_2 → SURFACE` (mirrors
  SVG's `url(#bg)`).
- Layer 2: radial gradient `ellipse at 50% 36%,
  rgba(245,230,194,0.08) 0%, rgba(245,230,194,0) 60%` (mirrors SVG's
  `url(#sheen)`).
- Layer 3 (optional, `showWatermark`): large central clover SVG
  (sized `min(width, height) * 0.7`) at `opacity: 0.04` — barely
  visible "watermark" backdrop. Rendered for certificate + flyer +
  referral variants. NOT rendered for leaderboard (which has no
  watermark in the SVG).

### `OuterChrome` component
Wraps the content with the double-border + 4 corner ornaments:
- Outer border: `<div>` at `(outerInset, outerInset)`, size
  `(width - 2*outerInset) × (height - 2*outerInset)`,
  `border: ${outerStroke}px solid ${GOLD}`,
  `borderRadius: roundedOuter` (default 6).
- Inner border: `<div>` at `(innerInset, innerInset)`, size
  `(width - 2*innerInset) × (height - 2*innerInset)`,
  `border: ${innerStroke}px solid ${GOLD}`,
  `opacity: innerOpacity` (default 0.5),
  `borderRadius: roundedInner` (default 4).
  8px gap between outer and inner (default `innerInset - outerInset = 12`).
- 4 `CornerOrnament`s at `(cornerInset, cornerInset)`,
  `(width - cornerInset - cornerSize, cornerInset)`,
  `(cornerInset, height - cornerInset - cornerSize)`,
  `(width - cornerInset - cornerSize, height - cornerInset - cornerSize)`.

Defaults match the certificate SVG: `outerInset=24, innerInset=36,
outerStroke=2.5, innerStroke=0.6, innerOpacity=0.5, cornerSize=28,
cornerInset=48`. Other variants override via props:
- Leaderboard: `outerStroke=2, innerStroke=0.5, innerOpacity=0.4,
  cornerSize=24, cornerInset=48`
- Campaign flyer + referral share: `outerInset=20, innerInset=30,
  outerStroke=2, innerStroke=0.5, innerOpacity=0.4, cornerSize=22,
  cornerInset=40`

### Variant content renderers

#### `CertificateContent({certificate, kind})` (900×560)
Layout matches the SVG pixel-for-pixel:
1. `BackgroundLayers` (width=900, height=560, showWatermark=true)
2. `OuterChrome` (defaults)
3. Baydin wordmark + clover at (72,90): `CloverMark cx=84 cy=102 scale=1.4` +
   `<Text x=108 y=110>Baydin</Text>` (serif 22, PARCHMENT, letterSpacing 1) +
   `<Text x=108 y=126>CERTIFIED PARTNER</Text>` (sans 9, GOLD, letterSpacing 3)
4. Title block: `<Text x=450 y=160>{headingText}</Text>` (serif 36,
   weight 700, PARCHMENT, align middle) + `<Text x=450 y=190>CERTIFICATE
   OF ACHIEVEMENT</Text>` (sans 13, GOLD, align middle, letterSpacing 6)
5. Gold rule: `<div>` at (260, 210), 380×1.2px, linear-gradient
   `GOLD_LIGHT → GOLD → GOLD_DARK`
6. Center clover: `CloverMark cx=450 cy=210 scale=0.7`
7. Recipient: "AWARDED TO" (sans 11, INK_DIM, letterSpacing 4) +
   `<Text x=450 y=312>{truncate(displayName, 36)}</Text>` (serif 32,
   weight 600, INK, align middle) + email (sans 12, INK_DIM, opacity 0.7)
8. Tier block: "{KIND} · TIER" (sans 11, INK_DIM, letterSpacing 4) +
   `<Text x=450 y=424>{tierLabel}</Text>` (serif 28, weight 700, GOLD,
   letterSpacing 2)
9. **Premium metadata area** (NEW — between tier block and signature):
   `<div>` at (200, 444), 500×24, flex centered, containing
   `{formalDate}` ("Issued on the Nth day of Month, Year"). Sans 9,
   INK_DIM, letterSpacing 3, opacity 0.7.
10. Signature line: `<div>` at (120, 490), 200×0.8, GOLD, opacity 0.7 +
    `<Text x=220 y=508>Baydin Astrology Council</Text>` (serif 13, INK,
    align middle) + `<Text x=220 y=524>Authorized Signatory</Text>` (sans
    10, INK_DIM, align middle)
11. Seal of authenticity: `SealOfAuthenticity cx=720 cy=488 r=40`
12. Shield badge: `ShieldBadge cx=560 cy=484 scale=1.4`
13. Footer cert id: `<Text x=450 y=544 opacity=0.6>Issued {shortDate} · {certId}</Text>`
    (sans 10, INK_DIM, align middle)

Heading text per kind: "Reseller Promotion" | "Tier Advancement" |
"Reseller Welcome" (matches SVG's headingText logic).

#### `LeaderboardContent({leaderboard, height})` (900×H, H = 200 + entries.length * 32 + 60)
1. `BackgroundLayers` (no watermark)
2. `OuterChrome` (leaderboard override)
3. Brand: `CloverMark cx=72 cy=84 scale=1.2` + `<Text x=92 y=90>Baydin</Text>`
4. Title: "Top Resellers" | "Top Seekers" (serif 32, weight 700, PARCHMENT,
   align middle) at (450, 100)
5. Subtitle: `By ${metric} · Top ${topN}` uppercased (sans 13, GOLD,
   letterSpacing 4, align middle) at (450, 128)
6. `CloverMark cx=450 cy=150 scale=0.8`
7. Rows (mapped from `entries.slice(0, topN)`):
   - Top-3 rows get a gold pill background (`<div>` at (60, y-18),
     780×28, GOLD opacity 0.07, borderRadius 3)
   - Medal cell: 🥇/🥈/🥉 or `{rank}.` (sans 14, color depends on
     top-3, fontWeight 700/400) at (76, y)
   - Name: `truncate(name, 28)` (sans 13, INK) at (120, y)
   - Email: `truncate(email, 30)` (sans 12, INK_DIM) at (540, y)
   - Value: `metric.toLocaleString()` (serif 14, GOLD, fontWeight
     700/500, align end) at (824, y)
   - Row y = `180 + i * 32` (matches SVG)
8. Footer rule + lines at `height - 60` and `height - 40`

#### `CampaignFlyerContent({campaign})` (600×800)
1. `BackgroundLayers` (with watermark)
2. `OuterChrome` (flyer override)
3. Top brand: clover + "Baydin" (left) + "SEASONAL CAMPAIGN" (right, align end)
4. Headline: "LIMITED OFFER" (small caps, INK_DIM) +
   `<Text x=300 y=260 fontSize=46 fontWeight=800>{headline}</Text>` +
   `CloverMark cx=300 cy=310 scale=1.5`
5. Tier block: "{KIND} TIER" + tierLabel (serif 32, GOLD, weight 700)
6. Campaign name: `truncate(name, 32)` (serif 22, INK, align middle)
7. Description: `<div>` at (60, 500), 480px wide, sans 13, INK_DIM,
   textAlign center, lineHeight 1.5, padding 0 20px
8. Validity window: gold rule + "VALID" + "{fromDate} – {untilDate}" (serif 18, INK)
9. Footer: "baydin.app · Powered by Baydin Astrology"

#### `ReferralShareContent({referral})` (600×700)
1. `BackgroundLayers` (with watermark)
2. `OuterChrome` (referral override)
3. Brand: clover + "Baydin" (left) + "INVITATION" (right, align end)
4. Headline: "YOUR FRIEND INVITES YOU" + "Begin Your Journey" (serif 34,
   weight 700, PARCHMENT) + `CloverMark cx=300 cy=290 scale=1.4`
5. "{name} invites you" (serif 22, INK) + "Sign up with this code to
   receive" (sans 12, INK_DIM)
6. Bonus block: gold-tinted `<div>` at (180, 390), 240×80, opacity 0.08,
   borderRadius 6 + "{N} Luck" (serif 32, GOLD, weight 700) + "SIGNUP
   BONUS" (sans 11, INK_DIM, letterSpacing 3)
7. Referral code: "YOUR CODE" + code (serif 28, PARCHMENT, weight 700,
   letterSpacing 4)
8. Sign-up URL: gold rule + "Sign up at" + URL (serif 14, INK)
9. Small seal at top-right corner: `SealOfAuthenticity cx=540 cy=80 r=22`

### Main `BrandedImageCard` (forwardRef)
- `React.forwardRef<HTMLDivElement, BrandedImageCardProps>`
- Computes `naturalWidth` and `naturalHeight` per variant
  (900×560 cert, 900×(200+N*32+60) leaderboard, 600×800 flyer, 600×700 referral)
- Root `<div>` at fixed pixel dimensions: `width: naturalWidth,
  height: naturalHeight, overflow: hidden, borderRadius: 6,
  border: 1px solid #2A2722, background: SURFACE, margin: "0 auto",
  flexShrink: 0`. Fixed dimensions are critical for the hidden download
  mounts (parent `position: fixed; left: -99999` with no width
  shrink-to-fits to the child's intrinsic width — works because the
  child has explicit `width: naturalWidth`).
- Live preview pulse (top-left, NOT scaled): `position: absolute; top:
  12; left: 12; zIndex: 10` with the green ping animation. All colors
  (background rgba, dot color, label color) inlined. The `animate-ping`
  Tailwind class is used only for the keyframe animation (html-to-image
  captures a single frame, so the animation state is unpredictable but
  the dot itself renders fine). New optional `hideLiveBadge` prop
  (default false) lets callers suppress the dot for cleaner PNG export.
- Content (variant renderer) rendered absolutely-positioned at natural
  pixel coords.
- "No data to preview" fallback if `certificate`/`leaderboard`/etc. is
  missing — fully inline-styled.
- Forwards ref to the root div for use with `useBrandedImageDownload`
  (existing call sites still wrap BrandedImageCard in their own
  `<div ref={hiddenCardRef}>` — that pattern continues to work, but
  now the ref can also be passed directly to BrandedImageCard for
  cleaner capture).

### Re-export preserved
- `export { brandedFilename } from "@/lib/use-branded-image-download"` —
  unchanged, so existing `import { BrandedImageCard, brandedFilename }
  from "@/components/branded-image"` continues to work.

## Constraints honored

- ✓ TypeScript strict throughout (no `any`, no `as any`)
- ✓ NO test code
- ✓ NO new packages installed (only `React` from existing dep)
- ✓ Inline `style` props for ALL colors / backgrounds / borders /
  opacities (Tailwind classes only for the `animate-ping` keyframe —
  no colors / backgrounds / borders via Tailwind)
- ✓ `fontFamily: 'Georgia, "Times New Roman", serif'` for all serif text
- ✓ forwardRef component (for use with useBrandedImageDownload hook)
- ✓ Supports all 7 variants: leaderboard-user, leaderboard-reseller,
  certificate-promotion, certificate-tier-upgrade, certificate-welcome,
  campaign-flyer, referral-share
- ✓ Existing call sites in admin-view / reseller-view / profile-view
  remain functional — no prop contract changes (only the new optional
  `hideLiveBadge` prop was added)
- ✓ Premium elements match the server SVG element-by-element:
  - Double gold border (outer 2.5px + inner 0.6px at 50% opacity, 12px
    gap = 8px between borders)
  - 4 corner clover ornaments (28×28 for cert, 24×24 for leaderboard,
    22×22 for flyer/referral)
  - Shield-shaped tier badge (SVG path, scale 1.4)
  - Seal of authenticity (circular gold seal with BAYDIN / AUTHENTIC)
  - Signature line ("Baydin Astrology Council" + "Authorized Signatory")
  - Large central CloverIcon watermark (opacity 0.04)
  - Subtle radial background gradient (mirrors url(#sheen))
  - Formal issue date ("Issued on the Nth day of Month, Year") in the
    premium metadata area + short date in the footer cert ID line
  - Premium metadata area between tier block and signature line

## Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings
- `bunx tsc --noEmit` → 0 errors in `src/` (only pre-existing errors in
  out-of-scope `repo-scan/GURU/services/...` and `examples/`)
- Dev server stable: `GET / 200` repeated in dev.log, no compile errors

## One fix applied during build

- `react-hooks/use-memo` lint rule requires the first argument to be an
  inline function expression. The original `React.useMemo(generateCertId, [])`
  (passing the function reference directly) failed this rule. Changed
  to `React.useMemo(() => generateCertId(), [])`.

## Notes for downstream agents

1. **Visual fidelity vs SVG**: The React component reproduces the SVG
   layout pixel-for-pixel for all absolutely-positioned elements.
   Minor visual differences may exist in text baseline positioning
   (the `Text` helper uses `top: y - fontSize * 0.85` to approximate
   the SVG baseline). If pixel-perfect alignment is required, the
   baseline ratio can be tuned per font (e.g. Georgia uses 0.88,
   Inter uses 0.82). The current 0.85 is a good average.

2. **Watermark on leaderboard**: The SVG leaderboard has NO central
   watermark (only the certificate, flyer, and referral SVGs have the
   sheen/radial gradient). The React component mirrors this —
   `BackgroundLayers` is called with `showWatermark={false}` for
   leaderboard, `showWatermark={true}` for cert/flyer/referral. This
   matches the SVG exactly.

3. **`hideLiveBadge` prop**: New optional prop. Existing call sites
   (admin-view leaderboard hidden mount, reseller-view cert hidden
   mount, profile-view referral hidden mount) do NOT pass it, so the
   pulse dot still appears in their PNGs (preserving existing
   behavior). Future agents can opt-in by passing
   `hideLiveBadge` for cleaner rasterization.

4. **Seal text via inline SVG `<text>`**: The seal's "BAYDIN" /
   "AUTHENTIC" labels use inline SVG `<text>` elements (not HTML divs)
   so they render at exact pixel positions matching the SVG. html-to-
   image rasterizes SVG text via the browser's font renderer — safe
   for system fonts (Georgia is system; Inter is loaded via Next.js
   font loader but falls back to Arial if not loaded).

5. **Fixed pixel dimensions vs responsive**: The BrandedImageCard
   root has fixed `width` / `height` (not `width: 100%`). This is
   intentional — gives the wrapper an intrinsic width so the hidden
   download mount's parent (`position: fixed; left: -99999` with no
   width) shrink-to-fits to the natural SVG dimensions. For visible
   modal previews (admin-view flyer dialog), the card at 600×800 fits
   inside the dialog content area (~640px wide). For certificate
   modals (reseller-view), BrandedImageCard is only used in the
   hidden mount — the visible modal uses the raw SVG returned from
   the API.

6. **`formalIssueDate` vs `shortIssueDate`**: Both are used. The
   formal date ("Issued on the Nth day of Month, Year") appears in
   the premium metadata area between the tier block and the signature
   line. The short date ("October 15, 2024") appears in the footer
   cert ID line ("Issued {shortDate} · {certId}") — this matches the
   SVG's footer exactly.

## Files

- Modified: `src/components/branded-image/branded-image-card.tsx`
  (199 → 1601 lines, full rewrite as forwardRef + native React mirror)
