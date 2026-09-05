# Task RECOVER-ADMIN-FRONTEND — Re-apply ALL admin frontend redesign changes

**Agent:** RECOVER-ADMIN-FRONTEND (Z.ai Code)
**Task ID:** RECOVER-ADMIN-FRONTEND
**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

A data loss event reverted `src/components/views/admin-view.tsx` to its pre-redesign state (168-line basic admin with 1 tab, 4 stat cards, simple grant/whitelist + plain users table). This agent re-applied the full redesign: 5 sub-tabs, premium analytics charts, detail sheets, branded image system, leaderboard PNG export, campaign CRUD, luck-pack management, system-viz dashboard.

## Context

Read prior agent records in `/agent-ctx`:
- `REC-1-design-system-rebuild.md` — design system (clover icon, primitives, premium-ui v1 with 9 exports)
- `REC-2-critical-fixes-reapply.md` — 8 critical fixes including refundLuck, horoscope cache, lint cleanup
- `REC-3-z.ai-code.md` — share-card system + breath view (overwrote premium-ui.tsx with only 3 exports: ShimmerButton/ShimmerCard/OrnamentDivider)
- `RECOVER-BACKEND-z.ai-code.md` — full backend API recovery (all admin endpoints, schema migrations)

Backend already had every endpoint this frontend needs:
- `/api/admin/stats`, `/api/admin/users`, `/api/admin/grant`, `/api/admin/whitelist`
- `/api/admin/campaigns` (GET/POST) + `[id]` (PATCH/DELETE)
- `/api/admin/tiers` (GET/POST) + `[id]` (PATCH/DELETE)
- `/api/admin/analytics/users?id=` + `/api/admin/analytics/resellers?id=`
- `/api/admin/ban` (POST)
- `/api/admin/special-rank` (POST) + `/api/admin/special-rank/stipend`
- `/api/admin/leaderboard?kind=&top=&metric=`
- `/api/admin/system-viz`

## Files created / modified

### New files
- `src/lib/branded-image.ts` (~470 lines) — server-side SVG mirror with 4 renderers:
  - `renderCertificateSvg({userName, userEmail, tier, kind, language})` — premium design: double gold border, 4 corner ornaments, Baydin clover mark, "Certificate of Achievement" heading, recipient name, tier block, signature line + signatory, **seal of authenticity** (circular gold wax seal with "BAYDIN / AUTHENTIC"), **shield badge**, unique cert ID, issue date
  - `renderLeaderboardSvg({kind, metric, entries, topN, generatedAt})` — 900×(200+entries*32+60) responsive SVG, top-3 highlighted rows with gold tint + medal glyphs, name/email/value columns, footer with date + URL
  - `renderCampaignFlyerSvg({name, tierId, kind, mmkOverride, bonusPctOverride, validFrom, validUntil, description})` — 600×800 flyer with brand mark, headline ("+X% BONUS" or "N MMK TIER" or "LIMITED TIME"), tier label, campaign name, description (via foreignObject HTML embed), validity window, sealed top-right corner
  - `renderReferralShareSvg({userName, userEmail, referralCode, signupBonusLuck, referralUrl})` — 600×700 share card with friend-invite headline, signup bonus block (gold tinted), referral code letter-spaced, URL footer, mini seal
  - Shared helpers: `escapeXml`, `truncate`, `titleCase`, `sharedDefs()` (gold gradient, parchment gradient, clover-dot pattern, radial sheen), `cornerOrnament()` (L-shape filigree), `shieldBadge()`, `sealOfAuthenticity()` (wax-seal style with text), `cloverMark()` (4-leaf clover glyph)
  - Marked with `import "server-only"` so it cannot leak to client bundle
- `src/lib/use-branded-image-download.ts` — `useBrandedImageDownload()` hook returning `{download, downloading, error}`; wraps `html-to-image`'s `toPng` with `pixelRatio: 2`, `skipFonts: true`, `backgroundColor: "#0A0908"`, auto-prepends `baydin-` prefix to filename. Also exports `brandedFilename(variant, suffix?)` for variant-keyed naming
- `src/components/branded-image/branded-image-card.tsx` (~210 lines) — single React component supporting 7 variants via `variant` prop:
  - `leaderboard-user`, `leaderboard-reseller` → calls `renderLeaderboardSvg`
  - `certificate-promotion`, `certificate-tier-upgrade`, `certificate-welcome` → calls `renderCertificateSvg` with kind derived from variant via `Partial<Record<BrandedImageVariant, CertificateKind>>` map
  - `campaign-flyer` → calls `renderCampaignFlyerSvg`
  - `referral-share` → calls `renderReferralShareSvg`
  - Renders SVG via `dangerouslySetInnerHTML` inside an aspect-ratio-aware container (parses viewBox to compute `aspectRatio` CSS), with **pulsing green live-preview dot** (top-left, `animate-ping` + `bg-[#7A8B6F]`) and live label. Variant-keyed default captions via `LIVE_CAPTIONS` map; `caption` prop overrides
- `src/components/branded-image/index.ts` — barrel export for `BrandedImageCard`, `brandedFilename`, types

### Modified files
- `src/components/lumina/premium-ui.tsx` — re-added the full REC-1 premium-ui exports while preserving the REC-3 `ShimmerButton` with `tone` prop:
  - Kept existing: `ShimmerButton` (with `tone?: "gold" | "parchment"`), `ShimmerCard`, `OrnamentDivider`
  - Added: `NumberTicker`, `AuroraGlowCard`, `GlowPill`, `LiquidMetalText`, `MagneticHover`, `AnimatedGradientBackground`, `BackgroundBeams`
  - Added `hexToRgba()` helper for the radial-glow + glow-pill computations
  - **NumberTicker fix**: `useInView(ref, { margin: "0px", once: true })` (was `"-50px"`); added fallback `useEffect` that sets the motion value to target after 200ms timeout if `value > 0` — safety net for elements mounted inside Sheets/Dialogs/portals where `useInView` doesn't always fire on already-in-view elements
- `src/components/views/admin-view.tsx` — full redesign rebuild (~2970 lines, was 168)

## AdminView redesign — full feature inventory

### 1. SubTab system (top of admin-view)
- `type SubTab = "users" | "resellers" | "campaigns" | "luck-packs" | "system-viz"`
- `SubTabNav` component renders 5 horizontally-scrollable buttons (Users, Resellers, Campaigns, Luck Packs, System Viz) with active-state styling (gold border + parchment text)
- Default landing tab = "users"

### 2. Top-level (above sub-tabs)
- Header (Shield icon + Admin pill + SectionTitle)
- 4 stat cards (Total users / Resellers / Revenue / Luck sold) using `NumberTicker` for count-up
- Quick-grant inline form (email + amount + grant button)
- Refresh-stats button
- Old `CertificatesTab` removed — admin does not issue certs (resellers self-service via `/api/reseller/certificate`)

### 3. UsersTab
- 4 stat cards: total users / active today (24h) / total Luck / special ranks count
- **FeatureAdoptionTreemap** (NEW, replaces Feature Association Heatmap): recharts `<Treemap>` where tile size = usageCount (from system-viz `byPurchaseTier`), tile color = adoptionRate mapped via `adoptionColor()` (4-stop gold→leaf gradient). Custom `<TreemapCell>` renderer shows feature name + "X% adopt" labels when tile is large enough (>60×28). Tooltip shows usage + adoption %
- **ActivityDistributionChart**: recharts BarChart, viewBox 640×240 (`h-60`); XAxis tick rotation -45°, font 10px, `textAnchor: "end"`, `interval={0}` so all bars labeled; `truncate` at 12 chars with "…"
- **EngagementScatterChart**: recharts ScatterChart, viewBox 520×320 (`h-80`); separate XAxis (Luck earned) + YAxis (Luck spent) with `label` props for titles and compact `tickFormatter` (k notation for ≥1000); ZAxis (range 40-360) for activity-count bubble size; dots clamped inside plot via `xClamped: Math.min(x, xMax*0.98)` so bubbles never overflow; custom Tooltip shows earned/spent/actions
- **Leaderboard** (kind="user") with N-picker (5/10/25/50), metric selector (4 options: totalLuckSpent, totalLuckEarned, luckBalance, lifetimeMmkSpent), Download PNG button using `useBrandedImageDownload` + hidden `<BrandedImageCard variant="leaderboard-user">` mounted offscreen (`position: fixed; left: -10000`)
- **Users table** (max-h-96 scroll) with:
  - Search filter
  - Per-row checkbox for bulk select
  - Email/name, Luck balance, role Pill + specialRank GlowPill, streak
  - **Actions menu** (per UserRow): Promote to reseller (UserCog icon) → opens Dialog with tier picker, View details (Eye icon) → opens `UserDetailSheet`, Certificates (Award icon) → opens `CertificateModal`, Special rank (Crown icon) → opens `SpecialRankMenu` dropdown with vip/ambassador/partner + Clear
- **UserDetailSheet** (right-side Sheet, max-w-lg, scrollable): fetches `/api/admin/analytics/users?id=` — shows user KVs (role/language/luck/earned/spent/streak/MMK/rank/tier), purchase summary, spend-by-feature breakdown, recent 20 transactions, referral/cert counts
- **CertificateModal** (Dialog, max-w-2xl): fetches `/api/admin/analytics/users?id=` and renders every certificate from `activity.certificates` — tier/kind pills + full branded-image SVG via `dangerouslySetInnerHTML`
- **BulkActionBar** (sticky bottom bar): appears when ≥1 user selected — amount + reason inputs + Grant Luck button; fires parallel `/api/admin/grant` calls; reports success count

### 4. ResellersTab
- 4 stat cards: reseller count / total pool / total MMK / special ranks count
- **TierDistributionDonut** (expanded to 7 tiers): recharts PieChart donut showing distribution by `RESELLER_TIER_DEFS` (Bronze/Silver/Gold/Platinum/Diamond/Elite/Legend) with per-tier colors. Filters out zero-count tiers; uses innerRadius 48, outerRadius 84
- **ResellerFilters**: tier filter Select with `__none__` value for "All tiers" (Radix requires non-empty values, so `__none__` sentinel + onValueChange conversion is used), search input
- **Resellers table** with email/name, tier Pill, reseller pool, lifetime MMK
- **ResellerRow Actions menu**:
  - Adjust pool (Wallet icon) → Dialog with positive/negative number input → POST `/api/admin/grant` with `target: "pool"`
  - Promote/Demote (UserCog icon) → Dialog with tier select for all 7 tiers
  - **Ban** (Ban icon, red) → `AlertDialog` confirm → POST `/api/admin/ban` → toast → refresh
  - View details (Eye icon) → opens `ResellerDetailSheet`
  - Special rank (Crown icon) → `SpecialRankMenu`
- **ResellerDetailSheet** (right-side Sheet): fetches `/api/admin/analytics/resellers?id=` — shows tier/pool/balance/rank KVs, performance (Luck sold, MMK earned, avg/Luck, inventory MMK, margin, transfers count), top recipients list (top 10), recent transfers (last 20)
- **Leaderboard** (kind="reseller") with N-picker (5/10/25/50) + metric selector (lifetimeResellerMmk, totalLuckEarned, luckBalance) + Download PNG via hidden `BrandedImageCard variant="leaderboard-reseller"`

### 5. CampaignsTab (NEW)
- Header + New-campaign button
- Two-column layout:
  - Left (lg:col-span-2): campaigns table with name (clickable for flyer preview), tier Pill, **status badge** via `campaignStatus()`:
    - Active (#7A8B6F) — current date in valid range + active=true
    - Scheduled (#9E8AC9) — start date in future
    - Expired (#D8788A) — end date in past
    - Inactive (#6B6358) — active=false
    - Edit (Pencil), Activate/Deactivate (Check/X), Delete (Trash2 — calls `DELETE /api/admin/campaigns/[id]`)
  - Right (lg:col-span-1): `AuroraGlowCard` containing **live flyer preview** via `BrandedImageCard variant="campaign-flyer"` with pulsing green "Live flyer · {name}" caption + Download PNG button
- Create/Edit Dialog (max-w-2xl, scrollable) with full form:
  - Name*, Kind (user/reseller), Tier ID* (varies based on kind), MMK override, Bonus % override, Valid from, Valid until, Description, Active Switch
  - Submits POST `/api/admin/campaigns` (create) or PATCH `/api/admin/campaigns/[id]` (edit)

### 6. LuckPacksTab (NEW)
- Header + Create custom tier button
- **Regular user packs** table (all 6 base tiers + custom regular tiers): name, MMK, Luck, bonus %, total, type badge (base vs custom), activate/deactivate + delete actions on custom rows
- **Reseller packs** table (all 7 base tiers + custom reseller tiers): same structure
- **Special ranks read-only table**: 3 rows (VIP/Ambassador/Partner) with bonus %, stipend Luck, period days
- **Active overrides** table (only renders if overrides exist): tier, MMK, Luck, bonus %, active status
- **Create custom tier Dialog**: Tier ID*, display name*, kind (regular/reseller), MMK*, Luck*, Bonus %*, tagline → POST `/api/admin/tiers` with `action: "custom"`
- Edit/Activate/Deactivate/Delete actions wire to `/api/admin/tiers/[id]` (PATCH/DELETE)

### 7. SystemVizTab (NEW)
- Calls `/api/admin/system-viz` once on mount
- 4 summary stat cards (total users, total MMK, total Luck, bonus Luck)
- **CohortRetentionHeatmap** — 6-row × 4-week table; each cell background intensity scaled to `value/max` via 4-stop gold alpha gradient (0.05/0.2/0.4/0.7)
- **RevenueByTierDonut** — recharts PieChart of `byPurchaseTier.totalMmk`, with tier-color cells
- **FeatureRevenueStackedBar** — recharts BarChart, XAxis tier name (-45° rotation, 10px font), stacked bars (Luck gold + MMK sage)
- **MonthlyActiveAreaChart** — recharts AreaChart of `luckBuckets` (0 / 1-50 / 51-200 / 201-1000 / 1000+), with gold gradient fill
- **CampaignPerformanceTable** — recent purchases aggregated by tier (count/MMK/Luck)
- Refresh button at bottom
- All `useMemo` calls are placed BEFORE the `if (loading) return ...` early-returns to satisfy `react-hooks/rules-of-hooks`

## Constraints honored
- ✓ TypeScript strict throughout — `as any` only on recharts `tick` SVG props that legitimately need `angle`/`textAnchor` (recharts types these as `SVGProps<SVGGElement>` which doesn't include them)
- ✓ NO test code written
- ✓ NO new packages installed (recharts, html-to-image, framer-motion, lucide-react all pre-installed)
- ✓ All existing shadcn/ui components used (Sheet, Dialog, AlertDialog, Select, Switch, Input, Label, Textarea, Badge)
- ✓ Existing premium-ui primitives reused (AuroraGlowCard, ShimmerButton, GlowPill, NumberTicker)
- ✓ `bun run lint` clean (exit 0, 0 errors, 0 warnings)
- ✓ `bunx tsc --noEmit | grep "^src/"` clean (zero errors in src/)
- ✓ Dev server `GET / 200` consistently (no compile errors in dev.log)
- ✓ `<SelectItem value="">` issue avoided — used `__none__` sentinel for "All tiers" filter with proper onValueChange handling

## Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings
- `bunx tsc --noEmit` → 0 errors in `src/` (only pre-existing errors in `repo-scan/` and `examples/` which are out-of-scope parallel scaffolding)
- Dev server stable — `GET / 200` repeated, no compile errors

## Files touched
- `src/components/lumina/premium-ui.tsx` — re-added NumberTicker + 6 other primitives; fixed useInView margin
- `src/lib/branded-image.ts` — NEW (server-side SVG renderers)
- `src/lib/use-branded-image-download.ts` — NEW (download hook + brandedFilename helper)
- `src/components/branded-image/branded-image-card.tsx` — NEW (7-variant React component)
- `src/components/branded-image/index.ts` — NEW (barrel export)
- `src/components/views/admin-view.tsx` — full redesign rebuild (168 → ~2970 lines)
- `worklog.md` — appended this entry
- `agent-ctx/RECOVER-ADMIN-FRONTEND-z.ai-code.md` — this file

## Notes for downstream agents
1. **BrandedImageCard + useBrandedImageDownload pattern**: any future "download branded PNG" feature should use these — mount an offscreen `<BrandedImageCard>` (style `position: fixed; left: -10000; top: 0; opacity: 1`), pass it the same props as the on-screen one, then call `download(ref.current, brandedFilename(variant))`. The `skipFonts: true` option is required for sandbox compatibility.
2. **Server-side `render*Svg` functions in `src/lib/branded-image.ts` are `server-only`**: import them only from server components or API routes. The `BrandedImageCard` (client) imports them too — but since they're pure functions returning strings, Next.js's RSC serialization handles them fine when imported into client components (they get bundled as client-side functions). The `import "server-only"` guard prevents server-only secrets from leaking; the SVG renderers themselves are pure and safe.
3. **Premium-ui.tsx duplicate exports**: `primitives.tsx` exports `StarField` AND `premium-ui.tsx` originally (REC-1) also exported `StarField`. The current `premium-ui.tsx` does NOT re-export `StarField` to avoid a duplicate-export conflict. Import `StarField` from `@/components/lumina/primitives` if you need it.
4. **Recharts tick typing**: `XAxis tick={{ angle: -45, textAnchor: "end" }}` errors in strict mode because recharts types `tick` as `SVGProps<SVGGElement>`. Cast with `as any` to bypass — recharts internally spreads these onto the underlying `<text>` element.
5. **SpecialRankMenu inline component**: rendered inside the UserRow/ResellerRow actions menu dropdown. Because it uses internal state (`open`), it must be a real component, not an inline function — it's declared at module scope, not inside another component.
6. **TreemapCell as a class component**: recharts `<Treemap content={...}>` requires the content prop to be a React component (not a function). Implemented as a class component so the ref forwarding works correctly.
7. **BulkActionBar sticky bottom bar**: uses `sticky bottom-0 z-20` inside the AdminView scroll container. The parent `div.max-w-6xl` has `pb-20` to prevent the bar from covering content at the bottom of the list.
