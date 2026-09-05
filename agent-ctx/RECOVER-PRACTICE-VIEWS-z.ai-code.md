---
Task ID: RECOVER-PRACTICE-VIEWS
Agent: RECOVER-PRACTICE-VIEWS (z.ai-code)
Task: Recover 6 Practice views with ZERO premium UI references (manifest, ritual, frequency, breath, positivity, dream-journal).

## Summary

All 6 Practice views recovered with premium UI:
- `manifest-view.tsx`: 235 → 354 lines (48 premium refs)
- `ritual-view.tsx`: 193 → 301 lines (41 premium refs)
- `frequency-view.tsx`: 287 → 448 lines (32 premium refs)
- `breath-view.tsx`: 954 → 1007 lines (63 premium refs, enhanced existing 10)
- `positivity-view.tsx`: 247 → 423 lines (52 premium refs)
- `dream-journal-view.tsx`: 687 → 807 lines (81 premium refs)

## Pattern applied to all 6 views

```tsx
<div className="h-full overflow-y-auto lumina-scroll relative">
  <div className="fixed inset-0 pointer-events-none z-0">
    <AnimatedGradientBackground variant="warm" />
    <StarField count={30} />
  </div>
  <div className="max-w-3xl mx-auto px-4 py-6 lg:py-10 relative z-10 min-w-0 overflow-hidden">
    {/* GlowPill eyebrow + LiquidMetalText hero + AuroraGlowCard content + ShimmerButton CTAs + NumberTicker numbers + CloverIcon Luck refs */}
  </div>
</div>
```

CRITICAL: Used `variant="warm"` for AnimatedGradientBackground (not "cosmic") on all 6 practice views.

## Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings.
- `bunx tsc --noEmit` → 0 errors in `src/components/views/` (only pre-existing out-of-scope errors in `repo-scan/`, `examples/`, `skills/`).
- All 6 views have 30+ premium UI references each (verified via grep).

## Bugs fixed during build

1. `</></>` (double fragment close) in manifest-view "Confirm" button JSX → `</span></>`.
2. NumberTicker inline ternary in JSX attribute (`value={minutes > 0 ? minutes : seconds}`) caused TS1003 "Identifier expected" parser error on a later unrelated line — extracted to `const durationDisplay`/`durationSuffix`.
3. Removed unused imports (GlassCard, GhostButton, GoldButton, ShellCard, SectionTitle, Volume2, VolumeX) from breath-view.
4. Used `Wind as WindIcon` alias → just use `Wind` directly.

## Notes for downstream agents

1. **NumberTicker limitation with inline ternary in JSX attribute**: `<NumberTicker value={minutes > 0 ? minutes : seconds} suffix={minutes > 0 ? "m" : "s"} />` triggered TS1003 "Identifier expected" parser error on a totally unrelated line further down in the file. Extracting the ternary to `const durationDisplay = ...; const durationSuffix = ...` outside the JSX solves it. This is a TypeScript JSX parsing quirk worth documenting.
2. **`suffix=":"` is fine** — string literals with `:` are valid as JSX attribute values. The error was elsewhere.
3. **Waveform component** in frequency-view uses a state-based 100ms tick to drive animation. Each of 24 bars computes its height as `30 + abs(sin(tick * 0.5 + i * 0.6)) * 70` percent. When paused, bars show static low height with `i % 3 * 6` variation.
4. **AuroraGlowCard + nested button**: when wrapping a clickable card with an inner button (frequency grid, positivity categories), wrap the button with AuroraGlowCard and let the button fill the card width via `w-full text-left`.
5. **Dream journal stat row** uses 4 StatPill components (Dreams/Favorites/Recurring/Interpreted). Each uses AuroraGlowCard with 0.1 intensity + colored icon + NumberTicker. Same pattern as manifest-view's 3 StatCard row.
6. **Stale dev log errors** — `tail dev.log` may show `Module not found: Can't resolve '@lib/utils'` from a previous tarot-view round. The tarot-view file is already fixed (`@/lib/utils`); the error in dev.log is stale. New compiles will be clean.

## Preserved functionality

All existing API endpoints still called:
- `/api/manifest/goals` (GET, POST, DELETE)
- `/api/manifest/confirm` (POST)
- `/api/ritual` (GET, POST)
- `/api/frequency/session` (POST)
- `/api/breath-session` (POST)
- `/api/positivity/generate` (GET, POST)
- `/api/dream-journal` (GET, POST)
- `/api/dream-journal/[id]` (PATCH, DELETE)
- `/api/dream-journal/[id]/interpret` (POST)

All state management preserved:
- React.useReducer in breath-view (4 patterns, 3 states welcome/active/complete)
- useState everywhere else
- Tone.js dynamic import for frequency synth
- Web Audio API chime engine in breath-view
- All useEffect cleanup hooks preserved
