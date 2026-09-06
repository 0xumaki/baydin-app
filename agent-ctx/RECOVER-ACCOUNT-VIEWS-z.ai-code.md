# Task RECOVER-ACCOUNT-VIEWS — Recover 4 account panel views to premium state

**Agent:** RECOVER-ACCOUNT-VIEWS (Z.ai Code)
**Task ID:** RECOVER-ACCOUNT-VIEWS
**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

The 4 account panel views had been only partially recovered by RECOVER-RESELLER-FRONTEND. They were missing premium backdrop, LiquidMetalText heroes, NumberTicker usage, AuroraGlowCard wrappers, and were significantly shorter than their final premium versions. A syntax bug (`const istory, setHistory]` in `RecentCertificates`) was also present in `reseller-view.tsx`. This task did a comprehensive additive+premium rewrite of all 4 views.

## Files modified

1. `src/components/views/reseller-view.tsx` (712 → 1122 lines)
2. `src/components/views/profile-view.tsx` (677 → 1089 lines)
3. `src/components/views/luck-store-view.tsx` (449 → 620 lines)
4. `src/components/views/analytics-dashboard-view.tsx` (461 → 567 lines)

## Architecture delivered (all 4 files)

Every view now follows the same premium layout pattern:

```tsx
<div className="relative min-h-screen flex flex-col">
  {/* Fixed backdrop */}
  <div className="fixed inset-0 z-0 pointer-events-none">
    <AnimatedGradientBackground variant={cosmic|warm} />
    <StarField count={30|36} />
  </div>
  <div className="relative z-10 min-w-0 overflow-hidden flex-1">
    <div className="max-w-{3xl|4xl|5xl} mx-auto px-4 py-6 lg:py-10 pb-20">
      ...premium content...
    </div>
  </div>
</div>
```

Premium primitives used throughout (all from `@/components/lumina/premium-ui` + `@/components/lumina/baydin-icons`):
- `LiquidMetalText as="h1"` for every hero headline
- `AuroraGlowCard` for every card (with `glowColor` + `glowIntensity` tuned per accent)
- `NumberTicker` for every numeric display (counts, balances, totals, prices)
- `ShimmerButton` (tone="gold") for every CTA
- `GlowPill` for every badge/pill
- `CloverIcon` for all Luck references
- `CloverPNG` for watermarks on Luck Economy card, TopUpBalanceBanner, BirthDataCard, ReferralEarningsCard, payment panel, referral program card
- `AnimatedGradientBackground` + `StarField` for fixed backdrop

### File 1: reseller-view.tsx

**Bug fix**: `const istory, setHistory] = React.useState<any[]>([]);` → `const [history, setHistory] = React.useState<any[]>([]);`

**Hero**: LiquidMetalText "Reseller Portal" + GlowPills "Reseller Portal" / tier (with Crown icon) / "Active" + description. Backdrop variant="warm" + StarField count={36}.

**TopUpBalanceBanner** (verified FULL implementation):
- AuroraGlowCard glowColor="#C5A572" glowIntensity={isEmpty ? 0.25 : 0.15}
- GlowPill "Reseller Pool" + tier GlowPill
- Large NumberTicker for pool balance (serif-display 2.4rem gold) + CloverIcon
- Contextual message (empty vs non-empty pool)
- ShimmerButton "Top Up More Luck" → setView("luck-store")
- Empty pool CTA strip with Sparkles icon ("Top up required to start reselling…")
- CloverPNG watermark in corner

**4 AuroraGlowCard stat cards** (StatCard component): Wholesale Pool (Package), Your Balance (Wallet), Total Sold (TrendingUp), Active Clients (Users) — each with NumberTicker + CloverIcon where Luck-related.

**6-month sales analytics**: 
- `SalesTrendChart` (hand-rolled SVG bar chart, gold gradient bars, max=1 floor for empty months)
- `buildMonthlySales()` helper aggregates transfersOut per month over last 6 months
- Revenue AuroraGlowCard: total MMK + average sale size + avg Luck/sale + markup rate

**Buy more + Transfer grid (2-col)**: AuroraGlowCard "Need more inventory?" + AuroraGlowCard "Sell Luck to a client" with form (toEmail, amount, saleMmk) + ShimmerButton "Transfer {amount} Luck".

**Transfer history (premium)**: AuroraGlowCard with arrow-up-right icons per row, max-h-72 overflow-y-auto with lumina-scroll, NumberTicker per transfer amount, recipient email, saleMmk + timestamp.

**BrandedCertificatesSection** (verified FULL implementation):
- 3 AuroraGlowCards: Welcome (Sparkles, green #7A8B6F), Tier Promotion (Award, gold #C5A572), Promotional (Megaphone, purple #9E8AC9)
- Each: icon + title + desc + tier GlowPill (only on tier card) + "Generate & Download" ShimmerButton
- On click: POST /api/reseller/certificate → Dialog with SVG via dangerouslySetInnerHTML → "Download PNG" ShimmerButton
- `certBusy` state disables all 3 buttons during generation AND during PNG download
- Hidden BrandedImageCard mount at `position: fixed; left: -99999; top: 0; pointerEvents: none; opacity: 0`

**PartnerResources** (verified FULL implementation):
- Marketing kit → useBrandedImageDownload + hidden BrandedImageCard variant="certificate-welcome"
- Terms & Policies → Sheet with 6-section agreement (full RESELLER_AGREEMENT_SECTIONS)
- Partner support → mailto:partners@baydin.app
- All wrapped in AuroraGlowCard

**RecentCertificates**: GET /api/reseller/certificate/history, merge issuedToMe+issuedByMe, dedupe by id, sort by createdAt desc, last 5. Each row has kind-specific icon (Sparkles/Award/Megaphone), tier GlowPill, Clock icon + timestamp.

**Gate**: AnimatedGradientBackground variant="warm" + StarField count={24} for non-reseller users.

### File 2: profile-view.tsx

**Bug fix**: removed dynamic-import `setView` hack — now uses `useStore` hook directly in component.

**Hero**: LiquidMetalText "{user.name}" + GlowPills "Your journey" / archetype / member since. Backdrop variant="warm" + StarField count={36}.

**Profile hero card** (ShellCard): avatar with Crown badge + GlowPill role + GlowPill archetype + member since + description + "Full analytics" ShimmerButton → setView("analytics").

**Lifetime stats — 4 AuroraGlowCards** (LifetimeStat component):
- Luck Balance (CloverIcon, gold)
- Days Active (Calendar, leaf) — sub: "{streak} day streak"
- Total Readings (Sparkles, purple) — sub: "Across all practices"
- Day Streak (Flame, orange) — sub: "Daily ritual chain"

**Practice breakdown — 6 AuroraGlowCards** (PracticeStat component):
- Tarot (Sparkles, #C5A87C)
- Chats (MessageCircle, #5FA9C7)
- Frequency (Moon, #9E8AC9)
- Manifest (Target, #B5CD7E)
- Rituals (Flame, #F09A3D)
- Mood (Heart, #D876A0)
Each: AuroraGlowCard (glowColor=color, glowIntensity=0.08) + colored icon + NumberTicker (serif-display 1.4rem).

**BirthDataCard** (ShellCard): CloverPNG watermark + GlowPill "zodiac" (inferZodiac function based on Western sun signs, with year-boundary Capricorn handling) + birth fields grid (dob, tob, place, coords, gender, timezone) + "Edit birth data" ShimmerButton → setView("birth-chart").

**7-Day Activity** (ShellCard): heatmap grid with day labels (S/M/T/W/T/F/S per JS weekday narrow) + intensity colors (rgba(197,168,124,{0.2-0.8})) + legend (Less/More).

**Achievements** (ShellCard): grid of badge images with unlocked/locked states + progress to next achievement text. evaluateAchievements for unlock count.

**ReferralEarningsCard** (verified FULL implementation):
- AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12} + CloverPNG watermark
- 4 stat cards (RefStatCard with NumberTicker): Total referees, Luck earned, Signup bonus, First-purchase bonus
- 6-month ReferralBarChart (custom SVG, gold gradient, "ref-bar-gold" linear gradient, baseline rule, value labels, x-axis month labels)
- Top referees list (top 5): rank + name/email + NumberTicker for totalLuck + CloverIcon + signup date
- Referral code prominent display (serif-display 1.25rem gold, tracking-[0.2em], tabular-nums)
- Copy code / Share / Download Referral Card ShimmerButton (useBrandedImageDownload + hidden BrandedImageCard variant="referral-share")

**SavedInsights** (ShellCard): bookmarked readings with expand/collapse, max-h-80 overflow-y-auto.

**Settings** (ShellCard): 
- Language Select (5 options: my, en, th, kh, lo) → PATCH /api/account with toast
- Theme indicator (read-only GlowPill "Dark" — forced by ThemeProvider)
- Notifications Switch (toggles notifications state via PATCH /api/account, reverts on error)
- Privacy link (toast info)

**Account info** (ShellCard): email, member since, language, referral code + Export (ShimmerButton, opens /api/export in new tab) + Delete (red button → DeleteAccountModal).

### File 3: luck-store-view.tsx

**Hero**: GlowPill "In-app credit" + LiquidMetalText title + description + Luck balance display: AuroraGlowCard with CloverPNG watermark + CloverIcon + NumberTicker + "Luck in your account" label. Backdrop variant="cosmic" + StarField count={30}.

**Ways to Earn — 3 AuroraGlowCards** (EarnMethodCard component):
- Daily Reward (Gift, gold #C5A572)
- Refer Friends (Sparkles, leaf #7A8B6F) — cta: user.referralCode
- Practice Daily (Sparkles, purple #9E8AC9)

Each: AuroraGlowCard (glowColor=color) + 9x9 colored icon box + title + body + cta (serif-italic gold).

**What Luck Buys**: FEATURE_COSTS list with AuroraGlowCard per feature (glowIntensity=0.06). Each shows icon + feature name + CloverIcon + cost number.

**Referral Program** (AuroraGlowCard glowColor="#7A8B6F"): CloverPNG watermark + Gift icon + "Share your referral code" + cta + referral code (serif-display gold tracking-[0.2em]) + Copy link + Share buttons.

**Luck Packs grid**: TierCard component, each wrapped in AuroraGlowCard:
- Popular GlowPill ("Popular") if tier.popular
- Wholesale GlowPill if reseller
- Campaign override GlowPill ("✦ {name}") if campaign active
- Bonus pill "+{bonusPct}% bonus ✦" (with "incl. campaign bonus" subtitle if campaign)
- "Campaign valid until {MMM D, YYYY}" footnote (red #D8788A if expiring ≤3 days)
- CloverPNG watermark
- NumberTicker for total Luck (serif-display 2rem gold)
- ShimmerButton "Purchase" / "Selected" (Check icon when selected)

**Reseller packs**: same TierCard layout, GlowPill "Wholesale" #9E8AC9, only shown if user has reseller packs.

**Payment panel** (AuroraGlowCard, glowColor shifts to #D8788A if expiringSoon):
- Tier name + Luck total (NumberTicker) + MMK price
- Payment method buttons (5: KBZ/Wave/AYA/CB/Cash)
- Transaction reference input
- Campaign info banner (CalendarClock icon + "✦ {name}" + override details + expiry text)
- "Confirm purchase" ShimmerButton

**Gate**: AuroraGlowCard backdrop for unauthenticated users.

### File 4: analytics-dashboard-view.tsx

**Hero**: GlowPill "Your practice" + GlowPill "{daysActive} days active" + LiquidMetalText "Your Practice Insights" + description. Backdrop variant="cosmic" + StarField count={30}.

**8 Stat Cards** (AuroraGlowCard StatCard component):
- Dreams (Moon, #C5A87C)
- Tarot (Sparkles, #D4A0B8)
- Chat turns (MessageCircle, #9CB4D1)
- Days active (Calendar, #7A8B6F)
- Rituals (Flame, #B8553F)
- Frequencies (Waves, #6F8BA0)
- Affirmations (Heart, #D58FA3)
- Goals (Target, #8FA37E)

Each: AuroraGlowCard (glowColor=accent, glowIntensity=0.1) + colored icon + NumberTicker (serif-display 2rem).

**Luck Economy** (AuroraGlowCard glowColor="#C5A572" glowIntensity={0.12}):
- CloverPNG watermark in corner
- GlowPill "Live" with CloverIcon
- 3 LuckStat cards (Balance / Total Earned / Total Spent) — each with CloverIcon + NumberTicker (color via parent span style)
- Spent by Feature bar chart (gold gradient bars, max amount normalized)
- Earned by Source pills (leaf color)

**Ritual Streak** (AuroraGlowCard glowColor="#F09A3D"):
- Current NumberTicker (36px gold) + longest NumberTicker (24px dim)
- 7-day grid with DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"] labels
- Each day: rounded-md box, completed = gold border + ✦, empty = dim border + ·

**Practice Activity** (AuroraGlowCard glowColor="#C5A572"): 14-day heatmap with day-of-month labels + intensity colors + legend.

**Dream Patterns** (only if dreams > 0):
- Dreams by Mood: AuroraGlowCard with emoji + label + colored bar + count NumberTicker
- Dreams by Moon Phase: AuroraGlowCard with emoji + phase name + gold gradient bar + count NumberTicker
- Top Dream Symbols: AuroraGlowCard with hashtag pills (top symbol highlighted gold)

**Tarot Spreads Used**: TarotSpreadChart (hand-rolled horizontal bar chart, gold gradient bars, count NumberTicker overlay).

**Mood Trend**: MoodTrendChart (30-day SVG line chart with area gradient, grid lines 1-5, gold stroke, parchment points).

### Lint / TypeScript fixes applied during build

1. `react-hooks/rules-of-hooks` — `React.useMemo(() => buildMonthlySales(...), [inventory])` was called AFTER early returns in ResellerView. Replaced with direct call `buildMonthlySales(inventory?.transfersOut ?? [])` (the function is pure and cheap — no memoization needed since it's called once per render).
2. `react-hooks/rules-of-hooks` — `React.useState` in `RecentCertificates` was broken (`const istory, setHistory]`). Fixed to `const [history, setHistory]`.
3. TS2322 — `NumberTicker` does not accept `style` prop. Wrapped NumberTicker in `<span style={{ color: accent }}>` for `LuckStat` in analytics-dashboard-view.
4. Removed dynamic-import `setView` hack in profile-view. Now uses `const { setView } = useStore()` directly in the component.

### Constraints honored

- ✓ TypeScript strict throughout — no `as any` on these files (only legacy `as any` on API response shapes that match admin-view pattern)
- ✓ NO test code
- ✓ NO recharts — TarotSpreadChart, SalesTrendChart, ReferralBarChart, MoodTrendChart are all hand-rolled SVG
- ✓ NO new packages installed (all imports from existing `@/components/lumina/*`, `@/components/ui/*`, `@/lib/*`, `lucide-react`, `framer-motion`, `sonner`)
- ✓ All hidden BrandedImageCard mounts use exact spec style `position: fixed; left: -99999; top: 0; pointerEvents: none; opacity: 0`
- ✓ PRESERVED existing functionality — every API endpoint (POST /api/reseller/transfer, GET /api/reseller/inventory, POST /api/reseller/certificate, GET /api/reseller/certificate/history, GET /api/referral/earnings, GET /api/luck/tiers, POST /api/luck/purchase, GET /api/activity, GET /api/insights/save, DELETE /api/account, PATCH /api/account, GET /api/export, DELETE /api/insights/save, GET /api/analytics) is still called
- ✓ PRESERVED all existing components: TermsSheet, RESELLER_AGREEMENT_SECTIONS, CERT_CARDS, DeleteAccountModal, SavedInsights, ReferralEarningsCard, RefStatCard, ReferralBarChart, MoodTrendChart
- ✓ Premium UI primitives reused consistently
- ✓ Dark theme colors used consistently (#0A0908 bg, #C5A572 gold, #E8E2D5 text, #9C9489 dim, #2A2722 border)
- ✓ Mobile-first responsive — `sm:`, `md:`, `lg:` breakpoints throughout

### Verification

- `bun run lint` → exit 0, 0 errors, 0 warnings
- `bunx tsc --noEmit` → 0 errors in `src/` (only pre-existing out-of-scope errors in `repo-scan/` and `examples/`)
- Dev server stable: `✓ Compiled in 792ms`, `✓ Compiled in 171ms`, `GET /?view=today 200 in 729ms`, no compile errors in dev.log

### Notes for downstream agents

1. **NumberTicker doesn't accept `style` prop** — only `className`. To apply dynamic colors (e.g. per-stat accent color), wrap NumberTicker in a parent `<span style={{ color: accent }}>` and let the child inherit.
2. **`buildMonthlySales()` is pure and cheap** — no `useMemo` needed; calling it once per render is fine. Avoid `useMemo` AFTER early returns to satisfy `react-hooks/rules-of-hooks`.
3. **Forced dark theme** — `ThemeProvider attribute="class" forcedTheme="dark"` means a theme toggle would be misleading. The Settings card shows a read-only GlowPill "Dark" indicator instead.
4. **AuroraGlowCard + nested clickable elements**: in luck-store-view's TierCard, I use an absolute-positioned overlay button (z-10) for click-anywhere selection + a nested ShimmerButton (z-40, pointer-events-auto) for the explicit Purchase CTA. The ShimmerButton's onClick calls `e?.stopPropagation?.()` then `onSelect()` — both click paths trigger the same onSelect.
5. **`inferZodiac(dob)` in profile-view**: simple Western sun sign lookup from "YYYY-MM-DD" string. Handles Capricorn's year-boundary case (Dec 22 - Jan 19) via `s.from[0] > s.to[0]` check.
6. **Settings updates** — `PATCH /api/account` accepts `{ language, notifications }`. The frontend calls it eagerly (optimistic update); on error, reverts the local state and shows a toast.
7. **Dream Patterns section** only renders if `analytics.totals.dreams > 0`. The empty-state on analytics is the same AuroraGlowCard as before with the "Start using Baydin…" prompt.
8. **StarField count consistency** — 36 for reseller (warm), 30 for analytics (cosmic), 24 for non-auth gates and small views. Matches the spec's recommendation.

---

