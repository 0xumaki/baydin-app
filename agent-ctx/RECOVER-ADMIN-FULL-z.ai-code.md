Task ID: RECOVER-ADMIN-FULL
Agent: RECOVER-ADMIN-FULL (Z.ai Code)
Date: $(date -u +"%Y-%m-%dT%H:%M:%SZ")

# Complete rewrite of `src/components/views/admin-view.tsx`

The admin-view was previously recovered incompletely (RECOVER-ADMIN-FRONTEND):
it used `recharts` instead of hand-rolled SVG charts, was only 2975 lines, and
was missing many premium UI elements. This task did a complete ground-up
rewrite to deliver the comprehensive admin control center.

## Read first

- `/home/z/my-project/worklog.md` — full project history (all prior features)
- `/home/z/my-project/src/components/views/admin-view.tsx` (prior 2975-line version, with recharts + several syntax bugs like `const enuOpen, setMenuOpen] = React.useState(false);`)
- `/home/z/my-project/src/components/lumina/premium-ui.tsx` (AuroraGlowCard, GlowPill, LiquidMetalText, NumberTicker, ShimmerButton, AnimatedGradientBackground)
- `/home/z/my-project/src/components/lumina/primitives.tsx` (GlassCard, SectionTitle, StarField)
- `/home/z/my-project/src/components/lumina/baydin-icons.tsx` (CloverIcon)
- `/home/z/my-project/src/components/branded-image/branded-image-card.tsx` (BrandedImageCard + brandedFilename)
- `/home/z/my-project/src/lib/use-branded-image-download.ts` (useBrandedImageDownload hook)
- `/home/z/my-project/src/lib/api-client.ts` (api, useMe)
- `/home/z/my-project/src/app/api/admin/*` — all admin API routes (users, leaderboard, system-viz, analytics/{users,resellers}, grant, whitelist, ban, campaigns, tiers, special-rank, certificate/reseller)

## New file: `src/lib/luck-config.ts` (54 lines)

Client-safe mirror of `FeatureId` + `FEATURE_COSTS` (server-only `@/lib/luck.ts` cannot be imported on the client). Also exports `FEATURE_LABELS` (display names) and `FEATURE_IDS` (ordered list).

## Rewritten: `src/components/views/admin-view.tsx` (5068 lines)

### Architecture

- **NO recharts dependency** — all 11 distinct chart types are hand-rolled SVG with `<svg viewBox>` + custom paths/rects/circles/text. Each chart has its own gradient `<defs>`.
- **Premium UI everywhere**: `LiquidMetalText` hero headline, `AuroraGlowCard` for all cards, `NumberTicker` for every numeric value, `ShimmerButton` for all CTAs, `GlowPill` for all badges, `CloverIcon` for Luck references, `AnimatedGradientBackground variant="cosmic"` + `StarField count={36}` as fixed backdrop.
- **Dark theme**: `#0A0908` bg, `#C5A572` gold, `#E8E2D5` text, `#9C9489` dim text.
- **Layout**: `min-h-screen flex flex-col` root, `max-w-7xl mx-auto px-4 py-6 lg:py-10 pb-20` content, `relative z-10 min-w-0 overflow-hidden` on content container.

### Sub-tab structure (preserves existing pattern)

```ts
type SubTab = "users" | "resellers" | "campaigns" | "luck-packs" | "system-viz";
```

SubTabNav has 5 tabs with gold underline active indicator (inset shadow on the active row).

### Helper components

- `Gate` — auth gate
- `EmptyState`, `EmptyChart` — empty placeholders
- `SectionLabel`, `SectionHeading` (GlowPill eyebrow + icon + SectionTitle)
- `StatCard` (GlassCard + NumberTicker)
- `HeroQuickStat` (simple bordered div, not AuroraGlowCard)
- `OverviewStat` (AuroraGlowCard + icon + NumberTicker + optional trend pill)
- `ChartCard` (AuroraGlowCard wrapper with title + subtitle + right slot)
- `SortableTh` (table header with sort indicator)
- `RowIconButton` (small icon button, 5 tones: default/gold/green/red/purple)
- `BulkActionBar` (sticky AuroraGlowCard with selection summary + amount + presets +10/+50/+100/+500)
- `HealthCard` (status icon + GlowPill + metric + detail)
- `KV` (key-value pair)
- `useSvgTooltip` hook (state-tracked width to satisfy react-hooks/refs rule)
- `MiniSparkline` (tiny inline SVG chart with useId-based gradient)
- `tierColor`, `tierName`, `truncate`, `fmtDate`, `fmtDateTime`, `fmtMmk`, `fmtCompact`, `daysSince`, `adoptionColor`, `goldIntensity`, `campaignStatus` helpers

### 11 hand-rolled SVG charts (NO recharts)

1. `ActivityDistributionChart` — viewBox 640×240 vertical bar chart with -45° rotated labels at 10px, gold gradient bars, truncate at 12 chars, HTML tooltip overlay on hover.
2. `LuckDistributionHistogram` — viewBox 480×220 histogram with 6 buckets (0/1-10/11-50/51-100/101-500/500+) using purple gradient bars.
3. `EngagementScatterChart` — viewBox 520×320 scatter plot, X=Luck spent, Y=Streak, dot size=features used, dots clamped inside plot area, separate axis title bands, grid lines, tooltips.
4. `FeatureAdoptionTreemap` — viewBox 560×320 treemap with row-based greedy bin packing, tile size=usage count, color intensity=adoption rate, labels truncate based on tile width, tooltips.
5. `RevenueByResellerChart` — viewBox 480×H horizontal bar chart, top 10 resellers by MMK, gold gradient bars, email labels on left, value labels on right, vertical gridlines.
6. `TierDistributionDonut` — viewBox 280×220 donut chart with 7 tier colors (bronze #B87333, silver #9C9489, gold #C5A572, platinum #9CB4D1, diamond #B9F2FF, elite #E69138, legend #FF6B6B), center count + label, legend below. Uses cumulative-offsets array to avoid react-hooks/immutability rule.
7. `SalesTrendLineChart` — viewBox 720×240 line chart with area fill, 6 months, gold gradient line + area, grid lines, data points with tooltips.
8. `CohortRetentionHeatmap` — viewBox 720×240 heatmap grid (6 cohorts × 13 weeks, gold intensity = retention %), week labels along top, cohort labels along left, tooltips.
9. `FeatureRevenueStackedBar` — viewBox 560×260 stacked vertical bars (MMK gold segment + Luck purple segment per tier), grid lines, legend.
10. `MonthlyActiveAreaChart` — viewBox 720×240 with 3 overlapping areas (DAU gold gradient, WAU green gradient, MAU purple gradient), grid lines, legend.
11. `MiniSparkline` — inline mini chart (240×56 default) used in UserDetailSheet retention curve.

### UsersTab implementation

- **Hero quick stats** (in main AdminView): 3 HeroQuickStat cards (Total Users, Resellers, Luck in System) with CloverIcon for the Luck card.
- **User Analytics Overview**: 4 OverviewStat cards (Total Users with growth %, Active Today, New This Week, Avg Luck Balance).
- **User Behavior Visualizations** (2x2 grid of ChartCards): ActivityDistributionChart, LuckDistributionHistogram, EngagementScatterChart, FeatureAdoptionTreemap.
- **User Directory** (GlassCard with filters):
  - UserFilters: search input with icon, role Select (all/admin/reseller/user), activity Select (all/active/dormant/new), feature Select (Any + 11 features from FEATURE_COSTS), Luck range (min/max), sort via SortableTh headers (8 sort keys).
  - User table (20/page): checkbox column with bulk select-all, User (name+email), Luck (with CloverIcon), Role (GlowPill + special rank), Streak, Features (6-dot indicator), Joined, Last Active (with status dot), Actions (4 RowIconButtons: Quick Grant +10, Custom Grant, Copy Email, View Details + expand chevron).
  - Expandable row: lifetime stats grid + SpecialRankForm inline component.
  - Pagination with chevron icons.
- **UserLeaderboard**: N-picker (5/10/25/50 Select) + metric Select + Share button (navigator.share or clipboard fallback) + Download PNG button via hidden BrandedImageCard variant="leaderboard-user". Top 10 by Luck, #1 highlighted with gold border + Crown icon + GlowPill rank badge.

### ResellersTab implementation

- **Reseller Analytics Overview**: 4 OverviewStat cards (Total Resellers, Active Resellers, Total Luck Sold, Total Revenue MMK).
- **Reseller Performance Visualizations** (2+1 grid):
  - RevenueByResellerChart (2-col span)
  - TierDistributionDonut (1-col, center="resellers" with total count)
  - SalesTrendLineChart below (full width)
- **Reseller Directory** (GlassCard):
  - ResellerFilters: search, tier Select (all 7 tiers), status Select (all/active/inactive).
  - BulkActionBar (same pattern as UsersTab).
  - Reseller table (20/page): checkbox, Name+Email, Tier (GlowPill), Pool (CloverIcon), Total Sold, Revenue, Joined, Actions (Adjust Pool, tier Select with 7 options inline, Ban button, Special rank Crown button, View Details).
  - Expandable row: Pool adjustment form (Input + Apply button), Tier upgrade form (Select + Apply), SpecialRankForm.
- **ResellerLeaderboard**: same pattern as UserLeaderboard but variant="leaderboard-reseller".
- **Ban Confirm**: AlertDialog with Cancel/Ban actions.

### CampaignsTab implementation

- **Campaign CRUD form** (GlassCard):
  - Fields: name, kind (user/reseller), tierId Select populated from tiers (filtered by kind), mmkOverride, bonusPctOverride, validFrom (datetime-local), validUntil, description, active (Switch).
  - "Create new campaign" ShimmerButton.
  - Live flyer preview (AuroraGlowCard with pulsing green dot + BrandedImageCard variant="campaign-flyer").
  - Dynamic caption: "Previewing {tier} · {mmk} MMK · +{bonus}% bonus · {total} Luck total".
- **Existing campaigns table**: Name, Kind, Tier (GlowPill), MMK Δ, Bonus Δ, Until, Status (Active/Expired/Scheduled/Inactive via campaignStatus helper), Actions (Edit, Download flyer via hidden BrandedImageCard mounts, Deactivate).
- Hidden flyer mounts: one per campaign (data-hidden-flyer={id}) + one for the live preview form.

### LuckPacksTab implementation

- **Regular User Packs table**: 6 base tiers + custom additions. Columns: Name (GlowPill + tagline + popular star), MMK, Luck (CloverIcon), Bonus %, Total, Per Luck, Status (GlowPill), Purchases, Revenue, Actions (Edit for customs, Activate/Deactivate, Delete for customs).
- **Reseller Packs table**: 7 base tiers + customs, capped at 54% bonus (Math.min(bonusPct, 54)).
- **Create Custom Tier dialog**: name, kind (regular/reseller), mmk, luck, bonusPct, tagline, popular Switch.
- **Special Ranks table** (read-only): VIP/Ambassador/Partner with bonus%, stipendLuck (with CloverIcon), periodDays.

### SystemVizTab implementation

Calls `/api/admin/system-viz`, renders 5 ChartCards:
1. CohortRetentionHeatmap (6 cohorts × 13 weeks, gold intensity = retention %, derived from trend7d).
2. RevenueByTierDonut (extends TierDistributionDonut, 7 tiers, center="MMK").
3. FeatureRevenueStackedBar (MMK gold + Luck purple segments per tier).
4. MonthlyActiveAreaChart (3 overlapping areas: DAU gold, WAU green, MAU purple).
5. CampaignPerformanceTable (sortable by tier/count/mmk/luck).
Plus 3 HealthCards (API health, Database, Luck engine) and a Refresh button.

### Detail sheets + modals

1. `UserDetailSheet` — right-side Sheet (sm:max-w-2xl) fetching `/api/admin/analytics/users?id=...`. Shows: avatar, role/tier pills, lifetime stats, revenue contribution, 12-week retention curve (MiniSparkline SVG), 90-day feature timeline, purchase history table, referral stats. Footer: Promote to Reseller, Issue Certificate, Close.
2. `ResellerDetailSheet` — right-side Sheet fetching `/api/admin/analytics/resellers?id=...`. Shows: header with avatar, pool/sold/revenue, avgSaleSize/transfers/clients, 6-month sales trend (SalesTrendLineChart), top clients list, tier progress bar. Footer: Upgrade Tier, Issue Certificate, Close.
3. `CertificateModal` — Dialog showing issued certificate SVG via `dangerouslySetInnerHTML` from `/api/admin/certificate/reseller` POST response + Download PNG button (useBrandedImageDownload + hidden BrandedImageCard variant="certificate-{kind}"). Supports welcome/tier_upgrade/promotion kinds.
4. `AlertDialog` — Ban confirm with Cancel/Ban actions.
5. `SpecialRankForm` — inline Select (None/VIP/Ambassador/Partner with color dots) + Apply button. Uses `__none__` sentinel value for "no selection" SelectItem.

### Lint / TypeScript fixes applied

1. `react-hooks/refs` rule: refactored `useSvgTooltip` to track width in state instead of accessing `ref.current?.clientWidth` inside the JSX overlay. Also destructured `{ ref, show, hide, overlay }` at each call site (instead of `tip.X`) so the rule no longer flags property access.
2. `react-hooks/rules-of-hooks` (useId after early return): moved `React.useId()` to the top of MiniSparkline before the `if (data.length === 0) return ...` guard.
3. `react-hooks/rules-of-hooks` (useBrandedImageDownload inside callback): removed the inner hook call in CampaignsTab's table-row Download button; the click handler now uses the parent component's `download` function and queries the hidden flyer mount via `document.querySelector('[data-hidden-flyer="ID"]')`.
4. `react-hooks/immutability` rule: refactored TierDistributionDonut arc calculation to precompute cumulative offsets in a `cumOffsets: number[]` array before `.map`, instead of mutating a `cursor` variable inside the .map callback.
5. TS18047 null check: changed `poolAdjust?.id === r.id ? poolAdjust.amount : ""` to `poolAdjust && poolAdjust.id === r.id ? poolAdjust.amount : ""` so TS narrows the type properly. Same pattern for `tierUpgrade`.

### API contracts (preserved from prior implementation)

- `GET /api/admin/users` → `{ users: [...] }` (200 latest users)
- `GET /api/admin/system-viz` → `{ summary, distributions, trend7d, recentPurchases }`
- `GET /api/admin/leaderboard?kind=&top=&metric=` → `{ entries: [...] }`
- `GET /api/admin/analytics/users?id=` → `{ user, analytics, activity }`
- `GET /api/admin/analytics/resellers?id=` → `{ reseller, analytics, activity }`
- `POST /api/admin/grant` `{ userEmail, amount, description }` → `{ ok, user, newBalance }`
- `POST /api/admin/whitelist` `{ userEmail, tier }` → `{ ok, user }`
- `POST /api/admin/ban` `{ userId }` → `{ ok }`
- `POST /api/admin/special-rank` `{ userId, rank|null }` → `{ user }`
- `GET /api/admin/campaigns` → `{ campaigns: [...] }`; `POST` + `PATCH /:id` + (no DELETE)
- `GET /api/admin/tiers` → `{ staticTiers: {regular,reseller}, overrides, customs }`; `POST` + `PATCH /:id` + `DELETE /:id`
- `POST /api/admin/certificate/reseller` `{ userId, tier, kind, campaignId?, metadata? }` → `{ certificate: { id, tier, kind, brandedImageSvg, createdAt } }`

### Constraints honored

- ✓ TypeScript strict — only `any` casts on API response shapes (matches existing pattern)
- ✓ NO test code
- ✓ NO recharts — all 11 chart types hand-rolled SVG
- ✓ Premium UI primitives reused everywhere (LiquidMetalText, AuroraGlowCard, NumberTicker, ShimmerButton, GlowPill, CloverIcon, AnimatedGradientBackground, StarField)
- ✓ BrandedImageCard hidden mounts for PNG download use exact spec style `position: fixed; left: -10000; top: 0; opacity: 1; pointerEvents: none`
- ✓ All Radix SelectItem values are non-empty strings — `__none__` sentinel used for "no selection" options
- ✓ PRESERVED existing SubTab routing, `load()` function, and data fetching pattern (Promise.all of `/api/admin/users` + `/api/admin/system-viz`)
- ✓ Dark theme colors used consistently

### Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings
- `bunx tsc --noEmit` → 0 errors in `src/` (only pre-existing errors in out-of-scope `repo-scan/` and `examples/`)
- Dev server stable: `GET / 200` repeated in dev.log, no compile errors after rewrite

### Files

- Created: `src/lib/luck-config.ts` (54 lines)
- Modified: `src/components/views/admin-view.tsx` (2975 → 5068 lines, complete rewrite)
- Created: `/home/z/my-project/agent-ctx/RECOVER-ADMIN-FULL-z.ai-code.md` (this task record)

### Notes for downstream agents

1. **`useSvgTooltip` pattern**: when using `useRef` in a custom hook that returns JSX (the tooltip overlay), the new `react-hooks/refs` rule will flag any access of `ref.current` inside JSX. The fix is to track any width/position values needed for the overlay in `useState` and update them inside event handlers (not during render). Then destructure the hook's return value at the call site so property access doesn't trigger the rule either.

2. **TierDistributionDonut cumulative offsets**: the `react-hooks/immutability` rule disallows reassigning a `let` variable inside a `.map` callback, even for purely computational code. Use a precomputed `cumOffsets: number[]` array built via a `for...of` loop, then index into it inside `.map`.

3. **`useBrandedImageDownload` cannot be called inside a click handler**. If you need to download a BrandedImageCard from a table row that doesn't have its own ref, mount a hidden BrandedImageCard with a unique `data-*` attribute, then query it via `document.querySelector` and pass the resulting HTMLElement to the parent component's `download` function.

4. **`/api/admin/grant` credits `user.luckBalance`, not `resellerPool`** — there is no dedicated admin pool-adjustment endpoint. The ResellersTab pool-adjustment form routes through `/api/admin/grant` with `description: "pool_adjustment"` as a proxy (noted in the UI: "Credits user balance as pool proxy"). A future task could add a dedicated `POST /api/admin/reseller-pool` endpoint if true pool accounting is needed.

5. **`/api/admin/leaderboard` has a server-side bug** (`{ etric]: "desc" }` instead of `{ [metric]: "desc" }`) in `src/app/api/admin/leaderboard/route.ts`. The endpoint still returns 200 but the sort is broken. Not in scope for this task (frontend only) but worth flagging.

6. **Campaign download button uses `document.querySelector`** to find the hidden BrandedImageCard mount by its `data-hidden-flyer={id}` attribute. This is a deliberate escape hatch from React's ref model — necessary because each campaign row is rendered inside a `.map` and we can't create a useRef per row cleanly. The hidden mounts are rendered once at the bottom of the CampaignsTab.

7. **MiniSparkline `React.useId()` must be called before any early return** to satisfy the rules-of-hooks rule. The gradient ID is then used in the `<defs>` and `fill="url(#spark-...)"` reference.
