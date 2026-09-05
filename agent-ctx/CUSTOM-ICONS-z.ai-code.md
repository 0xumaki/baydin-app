# CUSTOM-ICONS — Custom Black-and-Gold SVG Icon System

**Task ID:** CUSTOM-ICONS
**Agent:** z.ai-code
**Date:** 2025-09-05
**Scope:** Extend `src/components/lumina/baydin-icons.tsx` with a comprehensive
custom black-and-gold themed SVG icon system (78 new icons + 1 helper).

## Context loaded

- Read `worklog.md` (last 100 lines) — recent work was a full premium rebuild of
  6 Astrology views (birth-chart, numerology, insights, compatibility,
  life-report, lunar-calendar) using `AuroraGlowCard`, `GlowPill`,
  `LiquidMetalText`, `ShimmerButton`, `NumberTicker`, `CloverIcon`.
- Confirmed existing `baydin-icons.tsx` (220 lines) had only `CloverIcon`,
  `CloverPNG`, `BaydinLogo`, `LotusIcon`, `StarGlyphIcon`.
- 20 view files import from `baydin-icons` (mostly `CloverIcon`/`CloverPNG`
  named imports) — must remain compatible.

## Implementation summary

### File: `src/components/lumina/baydin-icons.tsx`

Grew from **220 → 1315 lines** (added ~1095 lines for 78 new icons + helper + barrel).

### Design language applied to every new icon

- **ViewBox** `0 0 24 24`
- **`stroke="currentColor"`** so icons inherit surrounding text color
  (gold `#C5A572` inside gold elements, parchment `#E8E2D5` in normal contexts).
- **`strokeWidth="1.5"`** with `strokeLinecap="round"` + `strokeLinejoin="round"`.
- **`fill="none"`** outline by default; `filled` prop flips SVG-level fill to
  `currentColor` for solid icons (Star, Heart, Play, etc.).
- **`aria-hidden="true"`** by default; if `aria-label` is supplied, role flips
  to `"img"` and aria-hidden is cleared.
- **No external assets** — every path hand-crafted.

### Internal helper: `BaydinSvg`

Centralized shell so every icon stays visually consistent and the per-icon
boilerplate collapses to 3–6 lines:

```tsx
function BaydinSvg({
  children, filled = false, strokeWidth = 1.5,
  className, style,
  "aria-label": ariaLabel, "aria-hidden": ariaHidden, ...props
}: BaydinIconProps & { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 24 24" className={className} style={style}
      fill={filled ? "currentColor" : "none"} stroke="currentColor"
      strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"
      role={ariaLabel ? "img" : undefined}
      aria-hidden={ariaLabel ? undefined : ariaHidden ?? "true"}
      aria-label={ariaLabel} {...props}>
      {children}
    </svg>
  );
}
```

Each icon is then a 4-line function:

```tsx
function BaydinSend(props: BaydinIconProps) {
  return (
    <BaydinSvg {...props}>
      <path d="M22 2 L15 22 L11 13 L2 9 Z" />
      <path d="M22 2 L11 13" />
      <path d="M4 17 C 7 15 9 14 11 13" opacity="0.5" />
    </BaydinSvg>
  );
}
```

### Category 1 — UI Action Icons (40)

`BaydinSend` (paper plane + gold trail), `BaydinDownload` (arrow into tray),
`BaydinSearch` (magnifier + handle), `BaydinPlus` (circle + plus), `BaydinCheck`
(check + flourish), `BaydinX` (rounded caps), `BaydinChevronRight/Left/Down`,
`BaydinCopy` (overlapping rects, only visible L drawn via open path),
`BaydinShare` (3 dots + thread lines), `BaydinEdit` (pencil + rounded tip,
lucide-style path), `BaydinTrash` (can + handle + 2 vertical lines),
`BaydinEye` (lens + iris circle), `BaydinStar` (5-point star, `filled` supported),
`BaydinHeart` (heart + EKG pulse line), `BaydinMoon` (crescent via 2-arc path),
`BaydinSun` (circle + 8 rays), `BaydinFlame` (teardrop + inner flame),
`BaydinBell` (bell curve + clapper arc), `BaydinClock` (circle + L-shaped hands),
`BaydinCalendar` (rect + binding rings), `BaydinMenu` (3 lines + 3 gold dots),
`BaydinPin` (teardrop + inner hole), `BaydinBookmark` (notch + tassel + bead),
`BaydinShuffle` (2 crossing curves + 2 chevron heads), `BaydinPlay` (triangle),
`BaydinPause` (2 bars), `BaydinRefresh` (¾ arc + L-corner head),
`BaydinTrending` (zigzag + L-corner head), `BaydinUsers` (lucide-users pattern),
`BaydinWallet` (body + flap + clasp dot), `BaydinGlobe` (circle + equator +
vertical meridian ellipse), `BaydinSave` (floppy + label slot + bottom label),
`BaydinHelp` (circle + ?-hook + dot), `BaydinAlert` (triangle + ! + dot),
`BaydinLogout` (door + arrow), `BaydinArrowLeft/Right`, `BaydinLoader`
(¾ arc with `cn("animate-spin", className)` merged).

### Category 2 — Zodiac Signs (12)

Each glyph **hand-drawn as SVG paths** (NOT unicode):

- `ZodiacAries` — two curling horns + central stem
- `ZodiacTaurus` — circle head + two outward-curving horns
- `ZodiacGemini` — twin vertical pillars joined top & bottom by horizontal bars
- `ZodiacCancer` — two opposing C-shape claw curls + 2 gold dots
- `ZodiacLeo` — circle head + curling tail with internal loop
- `ZodiacVirgo` — M-shape + small hook on right leg
- `ZodiacLibra` — beam + center post + base + 2 triangular pans
- `ZodiacScorpio` — M-shape + curling tail + rightward arrowhead
- `ZodiacSagittarius` — diagonal arrow + perpendicular crossbar + L-corner head
- `ZodiacCapricorn` — V-shape + looping sea-tail
- `ZodiacAquarius` — two stacked zigzag waves
- `ZodiacPisces` — two opposing arcs + horizontal connecting thread

### Category 3 — Feature / Practice Icons (17)

`BaydinTarot` (card + star inlay), `BaydinAstrologer` (crystal ball on
trapezoid stand + highlight), `BaydinManifest` (5-petal lotus + center spire),
`BaydinRitual` (candle + flame + 2 soft glow curves), `BaydinFrequency`
(7 vertical bars varying heights), `BaydinBreath` (windpipe + 2 lung lobes),
`BaydinPositivity` (half-sun above horizon + 3 rays), `BaydinDream`
(crescent + 2 stars + cloud curve), `BaydinNumerology` ("7" inside circle),
`BaydinCompatibility` (2 interlocking rings), `BaydinLifeReport` (book + 3
text lines + seal dot), `BaydinBirthChart` (circle + 4 diameters = 8 sectors),
`BaydinLunarCalendar` (3 moon phases: new/half/full — half uses
`fill="currentColor" stroke="none"` semicircle path), `BaydinInsights`
(eye inside triangle), `BaydinStore` (shop + striped awning + door),
`BaydinAdmin` (shield + filled star inlay), `BaydinGift` (box + lid +
vertical ribbon + 2 bow loops).

### Category 4 — Planet Icons (9)

`PlanetSun` (disk + filled core + 8 corona rays), `PlanetMoon` (crescent +
2 crater dots), `PlanetMercury` (winged circle + cross + crescent + 2 wings),
`PlanetVenus` (♀ — circle + cross below), `PlanetMars` (♂ — circle + arrow
upper-right + L-corner head), `PlanetJupiter` (curved crown + horizontal bar +
vertical leg), `PlanetSaturn` (circle + tilted ellipse ring at -25°),
`PlanetRahu` (U-shape + 2 horns + 2 eye dots), `PlanetKetu` (curling tail
with internal knot + tip).

### Helper: `ZodiacIcon`

```tsx
function ZodiacIcon({ sign, className, style }: {
  sign: string; className?: string; style?: React.CSSProperties;
}) {
  const map: Record<string, React.ComponentType<BaydinIconProps>> = {
    aries: ZodiacAries, taurus: ZodiacTaurus, /* ...all 12... */
  };
  const key = (sign ?? "").toLowerCase();
  const Comp = map[key] ?? BaydinStar;   // fallback to BaydinStar
  return <Comp className={className} style={style} />;
}
```

Null-safe: `(sign ?? "").toLowerCase()` prevents crash on undefined.

### Barrel export

Single `export { ... }` block at the end of the file lists **all 84 names**
(5 original + 78 new + `ZodiacIcon` helper).

## Export mechanism choice

Originally wanted `export function BaydinSend() {}` + barrel
`export { BaydinSend }`. **Tested with `bunx tsc`** and confirmed TypeScript
**rejects** duplicate exports (`TS2484: Export declaration conflicts with
exported declaration`). Therefore converted **all icon declarations** (including
existing `CloverIcon`, `CloverPNG`, `BaydinLogo`, `LotusIcon`, `StarGlyphIcon`)
from `export function` to plain `function`, and consolidated ALL exports into
the single barrel at the end. The `export interface` declarations
(`CloverIconProps`, `BaydinLogoProps`) and `export type BaydinIconProps` remain
inline exports — types are exempt from the duplicate-export rule.

**Compatibility preserved**: all 20 view files that do
`import { CloverIcon } from "@/components/lumina/baydin-icons"` continue to work
unchanged — named imports resolve identically whether the binding is exported
via `export function` or via a barrel `export { }`.

## Quality gates

| Check | Result |
|---|---|
| `bunx tsc --noEmit` | ✅ ZERO errors in `baydin-icons.tsx` (only pre-existing out-of-scope errors in `examples/`, `repo-scan/`, `skills/`) |
| `bun run lint` | ✅ exit 0, 0 errors, 0 warnings |
| `bunx eslint src/components/lumina/baydin-icons.tsx` | ✅ exit 0 |
| Dev server recompile | ✅ `✓ Compiled in 1332ms`, all routes return 200 |
| Existing imports (`CloverIcon`, `CloverPNG`, `LotusIcon`, `StarGlyphIcon`) | ✅ Still resolvable via barrel |

## Constraints honored

- ✓ TypeScript strict throughout — every icon component fully typed.
- ✓ NO test code.
- ✓ NO new packages installed (only `React` + `cn` from `@/lib/utils`).
- ✓ PRESERVED existing `CloverIcon`, `CloverPNG`, `BaydinLogo`,
  `LotusIcon`, `StarGlyphIcon` — same props, same behavior, same rendering.
  Only the `export` keyword moved from per-declaration to the barrel.
- ✓ Every icon's SVG path is hand-crafted (no auto-generation).
- ✓ `aria-hidden="true"` by default on all decorative icons.
- ✓ 24×24 viewBox, 1.5px stroke, round caps & joins — consistent across all 78.
- ✓ `stroke="currentColor"` everywhere so icons inherit gold/parchment context.
- ✓ `filled` prop supported (works naturally for Star, Heart, Play, etc.).
- ✓ Barrel export matches the task spec (includes all original + new icons).

## Notes for downstream agents

1. **To use any icon**, import from `@/components/lumina/baydin-icons`:
   ```tsx
   import { BaydinStar, ZodiacLeo, PlanetSun, ZodiacIcon } from "@/components/lumina/baydin-icons";
   <BaydinStar className="h-5 w-5 text-[#C5A572]" filled />
   <ZodiacIcon sign="leo" className="h-4 w-4" />
   ```
2. **All icons accept the standard SVG props** (`className`, `style`, `onClick`,
   `id`, etc.) plus `filled?` and `strokeWidth?` via `BaydinIconProps`.
3. **Color inheritance**: don't hardcode gold. Wrap the icon in a parent with
   `text-[#C5A572]` (or any color) and the icon inherits it via `currentColor`.
4. **`BaydinLoader`** auto-merges `animate-spin` with the user's className via
   `cn("animate-spin", className)` — no need to add the class manually.
5. **`ZodiacIcon`** is a helper component that takes `sign` (string,
   case-insensitive) and renders the corresponding zodiac icon, falling back
   to `BaydinStar` for unknown signs.
6. **The `BaydinSvg` shell is internal** (not exported). New icons should be
   added as new `function Foo(props: BaydinIconProps) { return <BaydinSvg {...props}>...</BaydinSvg>; }`
   and appended to the barrel export at the end of the file.
7. **Filled accent dots** (e.g., the dot on `BaydinHelp`, `BaydinAlert`,
   `BaydinMenu`) use `fill="currentColor" stroke="none"` on the circle/path so
   they're always filled regardless of the parent `filled` prop. This makes
   them read as gold accents even when the rest of the icon is outline-only.
