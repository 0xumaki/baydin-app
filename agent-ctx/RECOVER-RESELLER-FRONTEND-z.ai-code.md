# Task RECOVER-RESELLER-FRONTEND — Recover reseller portal + profile + luck store + app shell frontend

**Agent:** RECOVER-RESELLER-FRONTEND (Z.ai Code)
**Task ID:** RECOVER-RESELLER-FRONTEND
**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

A data loss event reverted `src/components/views/reseller-view.tsx`, `src/components/views/profile-view.tsx`, `src/components/views/luck-store-view.tsx`, and `src/components/app-shell.tsx`. This agent re-applied all lost frontend changes additively — preserving every existing section while adding the new reseller TopUpBalanceBanner, Branded Certificates, Partner Resources, ReferralEarningsCard, campaign-aware TierCard badges, and URL `?view=` sync.

## Context

Read prior agent records in `/agent-ctx`:
- `REC-1-design-system-rebuild.md` — design system (clover icon, primitives, premium-ui v1)
- `REC-2-critical-fixes-reapply.md` — 8 critical fixes
- `REC-3-z.ai-code.md` — share-card system + breath view (premium-ui.tsx ShimmerButton/ShimmerCard/OrnamentDivider + later re-added NumberTicker/AuroraGlowCard/GlowPill)
- `RECOVER-BACKEND-z.ai-code.md` — backend recovery (all reseller/referral endpoints)
- `RECOVER-ADMIN-FRONTEND-z.ai-code.md` — admin redesign + branded image system

Backend already had every endpoint this frontend needed:
- `/api/reseller/inventory`, `/api/reseller/transfer`
- `/api/reseller/certificate` (POST self-issue: welcome / tier_upgrade / promotion)
- `/api/reseller/certificate/history` (GET — returns `{issuedToMe, issuedByMe}`)
- `/api/referral/earnings` (GET — returns `{referralCode, stats, shareCard, referrals}`)
- `/api/luck/tiers` (GET — overlays active seasonal campaigns; per-tier `campaign: {id,name,kind}` + top-level `campaigns[]`)

## Files modified

### 1. `src/components/views/reseller-view.tsx` (additive, 143 → ~625 lines)
Preserved existing Hero/Stats/Buy-more/Transfer/Transfer-history. Added:

**A. TopUpBalanceBanner** — between Hero and Stats. `AuroraGlowCard` (gold glow, 0.15 normal / 0.25 empty pool) with:
- `GlowPill` "Reseller Pool" + tier `GlowPill(resellerTierColor(user.resellerTier))`
- Large `NumberTicker` of pool balance (serif-display 2.4rem gold) + `CloverIcon`
- Contextual empty/non-empty pool message
- `ShimmerButton tone="gold"` "Top Up More Luck" → `setView("luck-store")`
- Empty-pool CTA strip "Top up required to start reselling. Reseller packs start at 50,000 MMK with up to 54% bonus."

**B. PartnerResources** — NEW section. Three wired-up CTAs:
- **Marketing kit** → downloads branded welcome card PNG via hidden `<BrandedImageCard variant="certificate-welcome">` + `useBrandedImageDownload`. Filename: `baydin-certificate-welcome-marketing-kit.png`
- **Terms & Policies** → opens `<Sheet>` (sm:max-w-lg) with 6-section reseller agreement
- **Partner support** → `mailto:partners@baydin.app?subject=Baydin%20Reseller%20Support`

**C. BrandedCertificatesSection** — after PartnerResources. Three `AuroraGlowCard`s:
- Welcome Certificate (Sparkles, green `#7A8B6F`) → POST `{kind:"welcome"}`
- Tier Promotion Certificate (Award, gold `#C5A572`) → shows tier `GlowPill`; POST `{kind:"tier_upgrade", metadata:{tier}}`
- Promotional Certificate (Megaphone, purple `#9E8AC9`) → POST `{kind:"promotion", metadata:{tier}}`

Each: "Generate & Download" `ShimmerButton` → API → `<Dialog max-w-2xl>` showing returned SVG via `dangerouslySetInnerHTML` → "Download PNG" `ShimmerButton` + hidden `BrandedImageCard variant={activeCert.variant}` offscreen.

**D. RecentCertificates** — below the 3 cards. Fetches `/api/reseller/certificate/history`, merges `issuedToMe` + `issuedByMe`, dedupes by id, sorts by createdAt desc, takes last 5. Each row: kind label (capitalized) + tier `GlowPill` + timestamp.

Local helpers added: `resellerTierColor(tier)` + `resellerTierName(tier)` (kept local because `@/lib/luck.ts` is `server-only` — cannot be imported from client; mirrors admin-view's local `tierColor` pattern).

### 2. `src/components/views/profile-view.tsx` (additive, ~280 new lines)
Added imports (ShimmerButton, AuroraGlowCard, GlowPill, NumberTicker, BrandedImageCard, brandedFilename, useBrandedImageDownload, CloverIcon, lucide Copy/Share2/UserPlus) and three new components appended at end of file.

**ReferralEarningsCard** inserted between Achievements and SavedInsights. Wraps in `AuroraGlowCard` (gold glow 0.12):
- Header: `UserPlus` icon + "Referral earnings" + `GlowPill` showing `referralCode`
- 4 stat cards (`RefStatCard`): Total referees / Luck earned / Signup bonus / First-purchase bonus — each uses `NumberTicker`
- 6-month SVG bar chart (`ReferralBarChart`): pre-fills last 6 months, aggregates `r.totalLuck` per month, custom SVG with gold-gradient (`<linearGradient id="ref-bar-gold">`) bars, baseline rule, value labels, x-axis month labels
- Top referees list (top 5): rank + name/email + totalLuck with `CloverIcon` + signup date
- Referral code block (serif-display 1.25rem gold, letter-spaced 0.2em, tabular-nums) + 3 action buttons: Copy code / Share (`navigator.share` if available, else copy URL) / `ShimmerButton tone="gold"` "Download Referral Card" via hidden `<BrandedImageCard variant="referral-share">`

### 3. `src/components/views/luck-store-view.tsx` (additive)
- Added `Campaign` type + 3 client-side helpers: `daysUntilExpiry(validUntil)`, `formatExpiryDate(validUntil)`, `findCampaignForTier(tier, campaigns)`
- `tiers` state extended with optional `campaigns?: Campaign[]` (top-level array from API)
- `TierCard` rewritten: new `campaign: Campaign | null` prop; shows `GlowPill` "✦ {campaign.name}" at `absolute top-3 left-3` when campaign active; bonus pill becomes `+{bonusPct}% bonus ✦` + secondary "incl. campaign bonus" line; footnote `Campaign valid until {MMM D, YYYY}` (red `#D8788A` if `expiryDays <= 3`); title gets `mt-6` when campaign pill present
- Payment panel: wraps existing block in IIFE to compute `selectedCampaign`/`expiryDays`/`expiringSoon`; inserts campaign info banner (`CalendarClock` icon + campaign name + override details + expiry text) before payment form; banner shifts to red styling when expiring soon

### 4. `src/components/app-shell.tsx` (additive)
- Two new `useEffect`s:
  1. **Mount parse** (`[]` deps): reads `URLSearchParams(window.location.search).get("view")`, validates against `NAV_ITEMS`, calls `setView(v)` if valid + different
  2. **Watch view** (`[view]` deps): updates URL `?view={view}` via `window.history.replaceState` (not `pushState` — avoids history pollution)
- New `handleSetView = React.useCallback((v) => setView(v), [setView])` wrapper
- Replaced `setView(item.view)` in `handleNav` and `setView("chat")` in `handleNewChat` with `handleSetView(...)`
- `useStore.getState().setActiveConversation(null)` still works — the watch-view effect catches the indirect view change and syncs the URL

## Constraints honored

- ✓ TypeScript strict throughout (only `as any` on legitimate `any`-typed API response shapes, matching admin-view pattern)
- ✓ NO test code
- ✓ NO new packages installed
- ✓ Existing premium-ui primitives reused (AuroraGlowCard, ShimmerButton, GlowPill, NumberTicker)
- ✓ Existing branded-image system reused (BrandedImageCard + useBrandedImageDownload + brandedFilename)
- ✓ PRESERVED existing structure in all 4 files — additive only
- ✓ All hidden BrandedImageCard mounts use the exact spec style: `style={{ position: "fixed", left: -99999, top: 0, pointerEvents: "none", opacity: 0 }}`

## Import path deviation

The task spec listed `import { resellerTierColor } from "@/lib/luck"` — but `src/lib/luck.ts` begins with `import "server-only"` (it imports Prisma `db`), so any client-side import from it would fail to compile. To stay TypeScript-clean without restructuring `luck.ts`, the `resellerTierColor` (and helper `resellerTierName`) function is defined locally in `reseller-view.tsx`, mirroring the local `tierColor` pattern already used in `admin-view.tsx`.

## Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings (clean)
- `bunx tsc --noEmit` → 0 errors in `src/` (only pre-existing errors in out-of-scope `repo-scan/` and `examples/`)
- Dev server stable: `GET / 200` repeated in dev.log, no compile errors

## Notes for downstream agents

1. **BrandedImageCard offscreen mount style**: the spec mandates `opacity: 0` (not `opacity: 1` like admin-view uses). html-to-image may not rasterize correctly with `opacity: 0` because the parent's opacity cascades to the cloned DOM. If PNG downloads return transparent images, change `opacity: 0` → `opacity: 1` on the hidden mounts. The spec was followed verbatim here.

2. **Campaign `tier.campaign` vs `tier.campaignOverride`**: the spec mentions `tier.campaignOverride` but the live `/api/luck/tiers` response returns `tier.campaign: {id, name, kind}` (per-tier object) plus a top-level `campaigns[]` array with full override details. `findCampaignForTier(tier, tiers.campaigns)` reconciles both — looks up `tier.campaign.id` in the `campaigns[]` array, with a fallback to `tierId + kind` matching.

3. **`/api/referral/earnings` response shape**: `{ referralCode, stats: {totalReferrals, totalLuckEarned, signupBonusTotal, firstPurchaseBonusTotal}, shareCard: {text, url, qrSource}, referrals: [{id, refereeId, signupBonusLuck, firstPurchaseBonusLuck, firstPurchaseMmk, firstPurchaseAt, totalLuck, createdAt, referee: {id, email, name, createdAt}}] }`. The 6-month bar chart aggregates `r.totalLuck` by `r.createdAt` month.

4. **`/api/reseller/certificate` request bodies**: `{kind:"welcome"}` (no metadata) | `{kind:"tier_upgrade", metadata:{tier: user.resellerTier}}` | `{kind:"promotion", metadata:{tier: user.resellerTier}}`. Response: `{certificate: {id, userId, tier, kind, brandedImageSvg, campaignId, createdAt}}`. The `brandedImageSvg` is the full SVG string ready for `dangerouslySetInnerHTML`.

5. **`/api/reseller/certificate/history` response**: `{issuedToMe: [...], issuedByMe: [...]}`. Both arrays contain `ResellerCertificate` rows. Self-service certs appear in BOTH arrays (since the user self-issues them) — the `RecentCertificates` component dedupes by id.

6. **AppShell URL sync**: uses `replaceState` (not `pushState`) per spec. Browser back/forward will NOT navigate between views — that's intentional. The watch-view `useEffect` runs on every view change including indirect ones (e.g. `setActiveConversation(null)` which sets view to "chat" via the store).
