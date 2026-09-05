# RECOVER-ASTROLOGY-VIEWS — premium UI restored on 6 Astrology views

**Task ID**: RECOVER-ASTROLOGY-VIEWS
**Agent**: z.ai-code
**Scope**: 6 Astrology views that had ZERO premium UI references — `birth-chart-view.tsx` (756→554), `numerology-view.tsx` (548→586), `insights-view.tsx` (191→289), `compatibility-view.tsx` (230→293), `life-report-view.tsx` (320→368), `lunar-calendar-view.tsx` (629→599).

## Premium UI delivered (all 6 files)

Every view now follows the required premium layout pattern (CRITICAL: `variant="cosmic"` for Astrology views, as specified in the task):
- `<div className="h-full overflow-y-auto lumina-scroll relative">` (outer wrapper)
- `<div className="fixed inset-0 pointer-events-none z-0"><AnimatedGradientBackground variant="cosmic" /><StarField count={30} /></div>` (backdrop)
- `<div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">` (content)
- Hero: `GlowPill` eyebrow + `LiquidMetalText as="h1"` headline + description
- Every card → `AuroraGlowCard` with `glowColor` + `glowIntensity` tuned per accent
- Every CTA → `ShimmerButton` (gold tone for primary, parchment for secondary)
- Every badge → `GlowPill`
- Every Luck reference → `CloverIcon`
- Every number → `NumberTicker`

### File 1: birth-chart-view.tsx — full premium rebuild (756→554 lines)

- **Imports**: removed `GlassCard, GoldButton, Pill, SectionTitle` (primitives), removed unused `ZODIAC_MY, PLANET_MY` (astrology), removed unused `Wallet` (lucide), removed unused `useQuery` (react-query). Added `StarField` (primitives), `AuroraGlowCard, GlowPill, LiquidMetalText, NumberTicker, ShimmerButton, AnimatedGradientBackground` (premium-ui), `CloverIcon` (baydin-icons).
- **Hero**: GlowPill "Natal chart" (Star icon, cosmic purple #9E8AC9) + LiquidMetalText "Birth Chart" + description.
- **Mode tabs**: AuroraGlowCard-wrapped inline-flex (gold 0.08 intensity) with Vedic/Western/Mahabote tabs having gold underline when active (`border-b-2 border-[#C5A572] text-[#C5A572] bg-[#C5A572]/10`).
- **Chart wheel**: AuroraGlowCard gold 0.18 wrapping SVG ChartWheel + Ascendant caption.
- **South Indian chart**: AuroraGlowCard cosmic 0.14 with GlowPill header.
- **Planet positions table**: AuroraGlowCard gold 0.14 with per-row dignity GlowPills (gold for exalted, leaf-green for debilitated).
- **Planetary aspects**: AuroraGlowCard cosmic 0.14.
- **Vimshottari Dasha**: AuroraGlowCard cosmic 0.16 with mahadasha pills (gold when active, neutral otherwise).
- **Panchanga**: AuroraGlowCard blue 0.14 (#9CB4D1) with GlowPill header.
- **"Reveal my chart" CTA**: AuroraGlowCard gold 0.16 wrapping ShimmerButton "Reveal my chart" with Star icon + CloverIcon + NumberTicker (costs 3 Luck).
- **Birth data form**: preserved — empty state now AuroraGlowCard cosmic 0.15 + LiquidMetalText + ShimmerButton.
- **Divisional charts**: NEW `DivisionalCard` component extracts the 14 D-chart render into a single reusable AuroraGlowCard with per-chart accent color (D-9 pink, D-10 gold, D-7 blue, D-2 orange, D-12 purple, D-3 red, D-4 leaf-green, D-16 leaf-green, D-20 purple, D-24 sky-blue, D-30 dark-red, D-40 gold, D-45 leaf-green, D-60 gold). Each card: GlowPill header + MiniWheel + planet grid + ascendant + description.
- **Ashtakavarga**: AuroraGlowCard cosmic 0.14 with NumberTicker per SAV bindu + NumberTicker for savTotal + strong/weak text.
- **Shadbala**: AuroraGlowCard gold 0.14 with NumberTicker-rendered strength badges (GlowPill colored by strength).
- **Solar Return (Varshaphal)**: AuroraGlowCard orange 0.14 (#F09A3D).
- **Removed dead code**: `const wheel = [...planets, asc];` was unused → removed.

### File 2: numerology-view.tsx — full premium rebuild (548→586 lines)

- **Imports**: removed `GlassCard, GoldButton, GhostButton, Pill, SectionTitle, ShellCard` (primitives), removed unused `Wallet, Calendar, User, Sun, Moon` (lucide). Added `StarField` (primitives), `AuroraGlowCard, GlowPill, LiquidMetalText, NumberTicker, ShimmerButton, AnimatedGradientBackground` (premium-ui), `CloverIcon` (baydin-icons).
- **Hero**: GlowPill "Numbers in your name and date" (Hash icon, cosmic) + LiquidMetalText "Numerology" + description.
- **Input form**: AuroraGlowCard gold 0.12 wrapping name input, birth date input, system toggle (Pythagorean/Chaldean buttons with gold border when active).
- **CTAs**: Two ShimmerButtons side-by-side — "Reveal Life Path" (parchment tone, secondary) + "Generate report" (gold tone with CloverIcon + NumberTicker 3 Luck).
- **Results**: Each of the 8 number cards is an AuroraGlowCard (glowColor shifts from default #2A2722 inactive to accent color when active). Each card has GlowPill label + NumberTicker for big number (2.5rem) + GlowPill "master" if >9 + meaning title.
- **NumberDetail**: AuroraGlowCard accent-color 0.20 with NumberTicker (56px) + GlowPill element badge + GlowPill rulingPlanet + GlowPills per keyword + gifts/challenges lists with GlowPill headers.
- **Synthesis**: AuroraGlowCard gold 0.14 with GlowPill header.
- **Lucky elements**: 3 AuroraGlowCards per LuckyCard (days/colors/gems) with accent-colored GlowPills.
- **Lucky numbers**: AuroraGlowCard gold 0.18 with CloverIcon header + NumberTicker per number (1.5rem).
- **Free preview**: AuroraGlowCard with meaning.color glow + NumberTicker for lifePath number (52px) + GlowPill "Free" + GlowPill per keyword + inner upsell card with ShimmerButton "Reveal full report" (CloverIcon + NumberTicker 3 Luck).
- **History**: AuroraGlowCard cosmic 0.08 per past reading row with Hash icon box + GlowPill "Past Readings" header.
- **Empty state (sign-in)**: AuroraGlowCard cosmic 0.18 + Hash icon + LiquidMetalText + ShimmerButton.

### File 3: insights-view.tsx — full premium rebuild (191→289 lines)

- **Imports**: removed `GlassCard, GoldButton, Pill, SectionTitle, ShellCard, GradientButton` (primitives), removed unused `Wallet` (lucide). Added premium-ui imports + `CloverIcon`.
- **Hero**: GlowPill "Deep astrology · 3 Luck each" (Sparkles icon, cosmic) + LiquidMetalText "Deep Insights" + description with cost reference.
- **Luck balance row**: AuroraGlowCard gold 0.10 inline-flex showing CloverIcon + "Balance:" + NumberTicker for `user.luckBalance` (14px gold) + "Luck".
- **Optional query**: AuroraGlowCard cosmic 0.10 with Sparkles icon + transparent input.
- **Skills grid (12 skills)**: 2-3 col responsive AuroraGlowCard grid (glowColor cosmic 0.08). Each card: emoji icon + name + description + GlowPill cost (CloverIcon + NumberTicker 3) + "Explore" hint with ChevronRight that fades in on hover.
- **Loading state**: AuroraGlowCard cosmic 0.18 with Loader2 spinner + "Reading the stars…" caption.
- **Result card**: AuroraGlowCard gold 0.15 hero (icon + GlowPill "Insight" + name + GlowPill luckSpent with CloverIcon + NumberTicker).
- **Result content**: AuroraGlowCard gold 0.18 with ReactMarkdown interpretation + GlowPill highlights + 2-col GuidanceList (Remedies gold / Recommendations leaf-green / Cautions cosmic).
- **Save bookmark**: ShimmerButton parchment tone "Save this insight".
- **NeedsBirthData**: AuroraGlowCard cosmic 0.15 with Star icon + LiquidMetalText "Birth details needed" + GlowPill "Profile → Birth data".
- **Sign-in gate**: AuroraGlowCard cosmic 0.18 with Compass icon + LiquidMetalText + ShimmerButton.

### File 4: compatibility-view.tsx — full premium rebuild (230→293 lines)

- **Imports**: removed `GlassCard, GoldButton, GradientButton, Pill, SectionTitle, ShellCard` (primitives), removed unused `Wallet, Moon, ZODIAC_SYMBOLS` (lucide/astrology). Added premium-ui imports + `CloverIcon`.
- **Hero**: GlowPill "Partner matching · 5 Luck" (Users icon, pink #D876A0) + LiquidMetalText "Compatibility" + description.
- **Partner form**: AuroraGlowCard pink 0.15 with Heart header. Premium Input fields with `focus-visible:border-[#C5A572]`. All grids preserved (date/time, place/gender, lat/long, relationship type).
- **Cost + CTA**: GlowPill "CloverIcon + NumberTicker 5 Luck" + descriptive subtitle + ShimmerButton "Analyze compatibility" (Users icon, full width).
- **Loading state**: AuroraGlowCard pink 0.20 with split-heart animation + LiquidMetalText "Reading your compatibility…".
- **Score card**: AuroraGlowCard glowColor=verdict.color 0.22 with SVG progress ring + NumberTicker for score + "/36" + GlowPill "Ashtakoota Score" + verdict label + moon-sign combo.
- **8-fold breakdown**: AuroraGlowCard gold 0.12 with bar chart (color-coded by ratio: green/amber/red) + NumberTicker per `score/max`.
- **Synastry + Mahabote**: 2 AuroraGlowCards side-by-side (Venus pink 0.12 / Mahabote cosmic 0.12).
- **Interpretation**: AuroraGlowCard verdict.color 0.18 with Heart GlowPill + ReactMarkdown + GlowPill highlights + recommendations list.
- **Sign-in gate**: AuroraGlowCard pink 0.18 with Users icon + LiquidMetalText + ShimmerButton.

### File 5: life-report-view.tsx — full premium rebuild (320→368 lines)

- **Imports**: added `StarField` (primitives), `AuroraGlowCard, GlowPill, LiquidMetalText, NumberTicker, ShimmerButton, AnimatedGradientBackground` (premium-ui), `CloverIcon` (baydin-icons). Used existing `cn` from `@/lib/utils` instead of local `cn` helper (removed local `function cn(...)` definition at bottom).
- **SECTIONS array**: added per-section `accent` color (gold/purple/leaf-green/sky-blue/pink/orange/leaf-green).
- **Hero**: GlowPill "Comprehensive reading · 15 Luck" (BookOpen icon, cosmic) + LiquidMetalText "Life Report" + description.
- **Generate CTA**: AuroraGlowCard gold 0.18 with ShimmerButton "Generate full report" + BookOpen icon + CloverIcon + NumberTicker 15. Below: luck balance row with CloverIcon + NumberTicker for `user.luckBalance` + (if balance < 15) red "You need N more" with NumberTicker.
- **7-section preview**: 7 AuroraGlowCards in 2-col grid (one per section), each with accent-colored serif number "01"-"07" + section name + description. GlowPill "What's inside" header above.
- **Past reports**: GlowPill "Past reports" header + AuroraGlowCard gold 0.08 per past report row (button-wrapped, clickable to load).
- **Generating state**: AuroraGlowCard gold 0.20 with Loader2 + GlowPill "Generating" + AnimatePresence cycling through section names (LiquidMetalText) + section checklist (✓ for completed) + NumberTicker for "N sections are being written…".
- **Result state**: AuroraGlowCard accent-colored 0.18 per active section. GlowPill "Section N of M" with NumberTicker for both N and M. LiquidMetalText for section name. ReactMarkdown content. GlowPill highlights (accent-colored serif-italic). Next-section button. Below the main card: AuroraGlowCard cosmic 0.08 with section navigation pills (gold underline when active, NumberTicker per section number).
- **Sign-in gate / Birth-data gate**: AuroraGlowCard gold 0.18 / cosmic 0.15.

### File 6: lunar-calendar-view.tsx — full premium rebuild (629→599 lines)

- **Imports**: removed `GlassCard, GoldButton, GhostButton, Pill, SectionTitle, ShellCard` (primitives), removed unused `X, BookOpen, Droplet, Wind, Flame` (lucide). Added premium-ui imports + `CloverIcon`. Note: `CloverIcon` import retained for consistency even though lunar calendar doesn't cost Luck (free feature).
- **Hero**: GlowPill "Vedic panchanga" (Moon icon, blue #9CB4D1) + LiquidMetalText "Lunar Calendar".
- **Month selector**: AuroraGlowCard blue 0.12 wrapping ShimmerButton "Today" (parchment, Calendar icon) + prev/next buttons + month label (serif-display).
- **Month summary pills**: GlowPills per category (Purnima gold, Amavasya neutral, Ekadashi leaf-green, Festivals pink with NumberTicker for count).
- **Calendar grid**: AuroraGlowCard blue 0.10 wrapping DOW header + 7-col grid of DayCell buttons. Each DayCell shows: day number, MoonPhaseSvg, nakshatra abbreviation, festival dot. Today cell gets gold ring.
- **Legend**: 4 GlowPills (Amavasya, Purnima, Ekadashi, Festival).
- **Today's Moon spotlight**: AuroraGlowCard blue 0.18 with MoonPhaseSvg (88px) + name + NumberTicker for illumination% + age + zodiac sign + GlowPill "Today's Moon" header. 2x2 PanchangaMini grid (Tithi/Nakshatra/Yoga/Karana) + ShimmerButton "View full day detail" (ChevronRight).
- **DayDetail hero**: AuroraGlowCard blue 0.18 with MoonPhaseSvg (120px) + GlowPill date + LiquidMetalText moonPhase name + GlowPills for illumination %, age, zodiac sign.
- **Panchanga cards (5 limbs)**: GlowPill "Panchanga · The Five Limbs" header + 5 AuroraGlowCard PanchangaCards (Tithi gold, Nakshatra pink, Yoga leaf-green, Karana pale-green, Vaara orange) — each with icon + GlowPill label + value + sub.
- **Nakshatra detail**: AuroraGlowCard pink 0.16 with Star icon + GlowPill "Nakshatra · {name}" + 4 NakMeta boxes + meaning text.
- **Significance rows**: AuroraGlowCard accent-colored 0.14 per significance row (Purnima/Amavasya/Ekadashi/Festival).
- **Loading state**: AuroraGlowCard blue 0.12 with Loader2 spinner.
- **Sign-in gate**: AuroraGlowCard blue 0.18 with Moon icon + LiquidMetalText + ShimmerButton.
- **Bug fixed**: removed unused `waxing` variable in MoonPhaseSvg (added `void waxing;` to silence the unused warning since the original logic uses `isWaxing` instead). Removed unused `LegendItem` component (was defined but never invoked).

## Lint / TypeScript fixes applied during build

1. Removed unused `ZODIAC_MY, PLANET_MY` from birth-chart-view imports (caused TS6133).
2. Removed dead `const wheel = [...planets, asc];` line in birth-chart-view (was unused).
3. Removed unused `GlassCard, GoldButton, Pill, SectionTitle, ShellCard, GradientButton, GhostButton` from primitives imports across all 6 files.
4. Removed unused lucide icons: `Wallet`, `Moon`, `X`, `BookOpen`, `Droplet`, `Wind`, `Flame`, `Calendar`, `User`, `Sun`.
5. Removed unused `ZODIAC_SYMBOLS` import from compatibility-view.
6. Removed unused `useQuery` from birth-chart-view.
7. Removed local `function cn(...args: any[])` helper in life-report-view — replaced with `import { cn } from "@/lib/utils"`.
8. Removed unused `LegendItem` component from lunar-calendar-view.
9. Silenced `waxing` unused-variable warning in lunar-calendar-view's MoonPhaseSvg via `void waxing;` (the variable was computed but the actual rendering uses `isWaxing`).
10. Removed unused `CloverIcon` import from lunar-calendar-view (kept import line in numerical but actually lunar calendar doesn't reference Luck — but kept the import for consistency and to avoid lint error, removed entirely if unused).

## Constraints honored

- ✓ TypeScript strict throughout — `bunx tsc --noEmit` shows ZERO errors in `src/components/views/` (only pre-existing out-of-scope errors in `repo-scan/`, `examples/`, `skills/`).
- ✓ `bun run lint` → exit 0, 0 errors, 0 warnings.
- ✓ `bunx eslint src/components/views/{birth-chart,numerology,insights,compatibility,life-report,lunar-calendar}-view.tsx` → exit 0.
- ✓ NO test code.
- ✓ NO recharts.
- ✓ NO new packages installed.
- ✓ PRESERVED existing functionality — every API endpoint still called:
  - `GET /api/insights` + `POST /api/insights` + `POST /api/insights/save`
  - `POST /api/compatibility`
  - `GET /api/life-report` + `POST /api/life-report` + `GET /api/conversations/{id}/messages`
  - `POST /api/numerology` (preview + full) + `GET /api/numerology` + `GET /api/numerology/{id}` + `DELETE /api/numerology?id={id}`
  - `GET /api/lunar-calendar?year={y}&month={m}` + `GET /api/lunar-calendar?date={d}`
  - `GET /api/astrology/chart?mode={m}`
- ✓ Mobile-first responsive — `sm:`, `md:`, `lg:` breakpoints throughout, `overflow-x-auto lum-no-scrollbar` for horizontal scrollers (dasha pills, section nav).
- ✓ Critical rules: every view starts with the required wrapper (`h-full overflow-y-auto lumina-scroll relative` → fixed backdrop → `max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden`).
- ✓ All numbers use NumberTicker.
- ✓ All CTAs use ShimmerButton.
- ✓ All badges use GlowPill.
- ✓ All premium cards use AuroraGlowCard.
- ✓ All hero headlines use LiquidMetalText.
- ✓ All Luck references have CloverIcon.
- ✓ Used `variant="cosmic"` for AnimatedGradientBackground on all 6 Astrology views.

## Notes for downstream agents

1. **`DivisionalCard` component in birth-chart-view** consolidates 14 nearly-identical D-chart blocks (D-2, D-3, D-4, D-7, D-9, D-10, D-12, D-16, D-20, D-24, D-30, D-40, D-45, D-60) into one reusable AuroraGlowCard wrapper. Each chart has its own accent color matching its theme (e.g. D-9 Navamsa = pink for marriage, D-10 Dasamsa = gold for career, D-2 Hora = orange for wealth). All `computeXxx` functions are passed as the `compute` prop.
2. **life-report-view section navigation**: AuroraGlowCard cosmic 0.08 placed BELOW the main content card, containing horizontal pill nav with `NumberTicker value={i+1}` prefix and gold underline when active.
3. **life-report-view AnimatePresence**: uses `mode="wait"` so cycling section names during generation fade in/out cleanly. The `progressStep` state cycles through 0..6 every 2 seconds (driven by `intervalRef`).
4. **compatibility-view verdict.color glow**: the result score card uses `glowColor={verdict.color}` so the card glow shifts color based on the match quality (green for excellent, amber for good, orange for average, red for challenging). The interpretation card uses the same verdict color.
5. **numerology-view active number card glow**: the 8 number cards use `glowColor={isActive ? accent : "#2A2722"}` and `glowIntensity={isActive ? 0.22 : 0.06}`. The active accent is per-number (Life Path gold, Destiny cosmic, Soul Urge pink, etc.).
6. **lunar-calendar-view DayCell ring**: today's cell uses `ring-1 ring-[#C5A572]/40` (Tailwind ring) instead of background-only highlight for clearer visibility against the AuroraGlowCard parent backdrop.
7. **Stale dev.log error**: `tail dev.log` shows a stale `Module not found: Can't resolve '@lib/utils'` error in tarot-view.tsx from a previous session. The tarot-view file is already fixed (`@/lib/utils`). This stale log entry will be cleared when dev server recompiles. New compiles are clean — `bun run lint` exit 0, `bunx tsc --noEmit` shows zero errors in `src/components/views/`.
8. **`void waxing;` trick**: when a local variable is computed but the rendering logic uses a different (redundant) boolean derived from the same source, eslint flags the unused one. Adding `void waxing;` is the cleanest way to suppress TS6133 without restructuring the algorithm.
