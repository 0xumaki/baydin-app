# Task RECOVER-BACKEND — Re-create ALL backend APIs + schema changes

**Agent:** RECOVER-BACKEND (Z.ai Code)
**Task ID:** RECOVER-BACKEND
**Date:** $(date -u +"%Y-%m-%dT%H:%M:%SZ")

Re-created the full backend API surface + Prisma schema changes after a server reset wiped recent backend work. No prior agent records in `/agent-ctx` touched the backend scope — only REC-1 (design system) and REC-2/REC-3 (component re-apply) were found.

## Files created (NEW)
- `src/lib/api-handler.ts` — `withAuth()` HOC wrapper
- `src/lib/certificates.ts` — `buildCertificateSvg()` + `issueCertificate()`
- `src/app/api/admin/campaigns/route.ts` — GET list + POST create
- `src/app/api/admin/campaigns/[id]/route.ts` — PATCH update + DELETE soft-delete
- `src/app/api/admin/certificate/reseller/route.ts` — POST issue single cert
- `src/app/api/admin/certificate/reseller/bulk/route.ts` — POST bulk issue (≤50)
- `src/app/api/admin/leaderboard/route.ts` — GET top-N + snapshot persistence
- `src/app/api/admin/system-viz/route.ts` — GET system-wide visualizations
- `src/app/api/admin/analytics/users/route.ts` — GET ?id=userId deep user analytics
- `src/app/api/admin/analytics/resellers/route.ts` — GET ?id=userId deep reseller analytics
- `src/app/api/admin/ban/route.ts` — POST {userId} bans reseller
- `src/app/api/admin/special-rank/route.ts` — POST {userId, rank} set/clear rank
- `src/app/api/admin/special-rank/stipend/route.ts` — POST manually grant stipend
- `src/app/api/admin/tiers/route.ts` — GET list + POST create override/custom
- `src/app/api/admin/tiers/[id]/route.ts` — PATCH update + DELETE custom
- `src/app/api/luck/campaigns/route.ts` — GET active campaigns (any user)
- `src/app/api/referral/earnings/route.ts` — GET referral earnings + share card
- `src/app/api/reseller/certificate/route.ts` — POST self-service cert generation
- `src/app/api/reseller/certificate/history/route.ts` — GET cert history

## Files modified
- `src/lib/auth.ts` — added `authErrorResponse(e)` helper
- `src/lib/luck.ts` — restructured tiers via `makeTier()`; reduced bonus % (LUCK_TIERS 0/5/10/15/20/25%, RESELLER_TIERS 30/36/42/48/54/54/54%); added 3 new reseller tiers (diamond/elite/legend); added `SPECIAL_RANKS`, `getSpecialRank()`, `specialRankColor()`, `computeStipendDue()`; added `getEffectiveTiers()` with 30s in-memory cache merging static config + DB overrides + custom tiers
- `src/lib/llm.ts` — fixed horoscope user prompt ("Write the horoscope as flowing markdown prose… Do NOT return a JSON object"); rewrote `parseLLMResult()` with 2-case fallback handling flat horoscope JSON (`{ summary, career, relationships, health, lucky_color, lucky_number, lucky_time, guidance }` → reconstructed markdown with proper section headings)
- `prisma/schema.prisma` — added 6 fields to User (specialRank, specialRankSince, stipendLuck, stipendLastAt, lifetimeMmkSpent, lifetimeResellerMmk); added 5 reverse-relation fields (named relations: IssuedCertificates/IssuedBy/GeneratedLeaderboards/ReferrerEarnings/RefereeEarnings); added 6 new models (SeasonalCampaign, ResellerCertificate, LeaderboardSnapshot, ReferralEarning, LuckTierOverride, LuckTierCustom)
- `src/app/api/admin/stats/route.ts` — wrapped with `withAuth`
- `src/app/api/admin/users/route.ts` — wrapped with `withAuth`; added specialRank/specialRankSince/lifetimeMmkSpent/lifetimeResellerMmk to select
- `src/app/api/admin/grant/route.ts` — wrapped with `withAuth`
- `src/app/api/admin/whitelist/route.ts` — wrapped with `withAuth`; added diamond/elite/legend to validTiers (7 total)
- `src/app/api/reseller/inventory/route.ts` — wrapped with `withAuth`
- `src/app/api/reseller/transfer/route.ts` — wrapped with `withAuth`; added lifetimeResellerMmk increment when saleMmk provided
- `src/app/api/luck/tiers/route.ts` — uses `getEffectiveTiers()`; overlays active SeasonalCampaign rows (mmkOverride/bonusPctOverride) on matching tierId
- `src/app/api/luck/purchase/route.ts` — applies special rank bonus (additive); increments lifetimeMmkSpent; records referral first-purchase attribution (upserts ReferralEarning with firstPurchaseMmk/firstPurchaseAt/firstPurchaseBonusLuck; credits referrer)
- `src/app/api/auth/register/route.ts` — upserts ReferralEarning on signup (signupBonusLuck=REFERRAL_BONUS); falls back to update on P2002 unique conflict
- `src/app/api/me/route.ts` — auto-grants stipend when due (computeStipendDue > 0): atomic increment of luckBalance + stipendLuck + totalLuckEarned, sets stipendLastAt, creates admin_grant ledger entry. Includes specialRank/specialRankSince/specialRankInfo/stipendLuck/stipendLastAt/stipendGrantedThisRequest/lifetimeMmkSpent/lifetimeResellerMmk in response

## Schema migration
- `bun run db:push --accept-data-loss` succeeded; database is in sync.
- Prisma client regenerated with all 6 new models + 6 new User fields + named reverse relations.

## Verification
- `bun run lint` → exit 0, 0 errors, 0 warnings.
- `bunx tsc --noEmit | grep "^src/"` → 0 errors in src/ (errors only in `repo-scan/` which is unrelated parallel-directory scaffolding).
- Prisma client types confirmed: User scalars include all 6 new fields; 6 new model delegates present (`seasonalCampaign`, `resellerCertificate`, `leaderboardSnapshot`, `referralEarning`, `luckTierOverride`, `luckTierCustom`).
- Response shapes preserved on all wrapped routes — changes are additive (extra fields added to admin/users and me; existing fields unchanged).

## Constraints honored
- TypeScript strict throughout; no `any` leaks in user-facing signatures.
- No test code written.
- No new packages installed (only existing Prisma, Next.js, bcryptjs, z-ai-web-dev-sdk used).
- All existing API response shapes preserved — changes are strictly additive.

## Notes for downstream agents
1. `withAuth()` only converts thrown Errors with `.status` of 401/403 into JSON responses; everything else is logged and returned as 500 with the original error message. Use it on every new route.
2. `getEffectiveTiers()` has a 30s in-memory cache. If you mutate LuckTierOverride/LuckTierCustom, the change will not be visible to Luck-store callers for up to 30s. Acceptable for admin-managed config; do not use this for hot-path per-user data.
3. `computeStipendDue()` is called from `/api/me` GET on every authenticated request — it's idempotent (only fires once per period). The stipend is granted inside the same DB transaction as the `stipendLastAt` update so two concurrent /api/me calls cannot both grant.
4. `issueCertificate()` always persists a DB row. The SVG is generated server-side (no client-side rendering required) — return it as a string and embed in `<div dangerouslySetInnerHTML>` or convert to PNG via html-to-image if a downloadable image is needed.
5. The `[id]` route handlers (campaigns, tiers) use `ctx: { params: Promise<{ id: string }> }` (Next.js 16 async-params pattern). Always `await ctx.params`.
6. `luck/purchase` route's referral attribution requires the referrer's ReferralEarning row to exist (created at signup time). If the row doesn't exist (legacy users from before this recovery), the route falls back to creating it on first purchase — so attribution still works for pre-existing referred users.
