# Handoff Doc — Live Pull Fundraising Platform

Single point of re-entry if a session, tool, or laptop crashes and someone (you, or a fresh Claude session) needs to pick this project back up with zero prior context. Everything here is also true in git history and the other docs below — this file exists to save you from having to reconstruct it by reading commits.

**Read order for a fresh start:** this file → `CLAUDE.md` (rules) → `PRODUCT_BUILD_SPEC.md` (full spec) → `TODO.md` (open items) → `DEPLOYMENT.md` (infra checklist).

## What this project is

A nonprofit e-commerce platform for **Social Health Initiative (SHi)**. Supporters buy a real sealed collectible pack (Pokemon/One Piece/Magic-style hobby boxes), their specific physical pack is opened live/on video, and they either receive what was pulled or donate it back. Not a raffle or chance-based prize — real product, disclosed price, real chain of custody per Pack ID. "Live Pull" is the platform/brand; SHi is the 501(c)(3) beneficiary. Full rules are in `CLAUDE.md`; full spec in `PRODUCT_BUILD_SPEC.md`.

## Where everything lives

| What | Where |
| --- | --- |
| Code | `github.com/samoanfro/LIve-Pull-Fundraiser`, branch `main` (this local clone: `~/dev/live-pull-fundraising-platform`) |
| Hosting | Vercel project `l-ive-pull-fundraiser`, auto-deploys on push to `main` |
| Production URL | `https://socialhealthmarketplace.com` (registered via Squarespace Domains; domain lock normally ON) |
| Database/Auth/Storage | Supabase project ref `tccqeiohsiilvumrjtgp` (`https://tccqeiohsiilvumrjtgp.supabase.co`), linked via the `supabase` CLI in this repo |
| Payments | No live Stripe account yet — see "Blocking on you" below |
| Email | No Resend account yet |
| Git identity used for commits | `samoanfro` / `fred.siaosi@gmail.com` (must match a verified GitHub email or Vercel rejects the deploy) |

## Current status (as of 2026-09-18)

All 10 build phases from `PRODUCT_BUILD_SPEC.md` have been implemented and deployed to production:

1. Auth/orgs, 2. Campaigns/products/inventory, 3. Public storefront, 4. Stripe Checkout + inventory reservation, 5. Opening sessions/queue, 6. Supporter pull results (Ship/Donate), 7. Shipping + Donate Back fulfillment, 8. Audit log + admin exception tools, 9. Reporting/CSV export, 10. Production deploy + custom domain.

Beyond the original 10 phases, two more rounds of work have landed:
- **Visual design pass** — replaced the original placeholder dark theme with SHi's real brand palette (light theme; navy `#0A5572`, teal `#2FA9B6`, orange `#EA942C`), plus a placeholder hero illustration (`app/hero-art.tsx` — original shapes in brand colors, explicitly NOT real product art, since Pokemon/One Piece/Magic artwork is trademarked).
- **ACH payment support** — Checkout now offers both card and ACH (`us_bank_account`); webhook and a new `extend_order_reservations()` DB function handle ACH's multi-day settlement so a pack's inventory hold survives a pending bank transfer instead of expiring after the normal 15-minute checkout window.

**Everything currently in the codebase is unit/e2e/typecheck/lint/build clean** and has been verified live in-browser on the production domain wherever the sandbox's browser tool is able to reach it (it cannot complete a real Supabase magic-link sign-in, so admin pages are verified by direct SQL against the live DB instead of a logged-in screenshot — see `TODO.md` known risks).

Demo/seed inventory exists right now for click-through testing: 20 sealed "2026 Collectible Hobby Pack" units ($29) and 1 "Rare Chase Box" unit ($99) under the "Fall Fundraiser 2026" campaign. These are placeholder products/pricing, not real SHi inventory.

## Blocking on you (nothing else can proceed on these without your action)

1. **Create the real Stripe account** (test mode first) and provide `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET`. You've already decided (2026-09-18-ish) on **Stripe for card + ACH for larger-ticket items**, and chose to always offer both rather than gating ACH by order size — the code already supports this, it just has never run against a real Stripe account.
2. **Turn on ACH (`us_bank_account`) in the Stripe Dashboard** once the account exists — this is an account/business-verification step on Stripe's side, not code.
3. **Create a Resend account** (or equivalent) and provide `EMAIL_PROVIDER_API_KEY` / `EMAIL_FROM_ADDRESS` — until this exists, no order confirmation, shipping, or donation-disposition emails send, and a guest who loses their `/orders/[token]` link has no way back into their order.
4. **Legal/compliance review** — two open questions logged in `TODO.md`, not yet acted on:
   - Whether the purchase itself can ever be framed as "a donation" (tax-deductibility implications — needs a CPA/lawyer, not just a product-copy tweak).
   - The SHi/Live Pull business relationship (SHi donates inventory, Live Pull sells it and pays SHi a fee) doesn't match the current single-tenant `organizations` schema assumption. Doesn't block anything today, but affects future reporting and "who is the nonprofit beneficiary" disclosure language.
5. Optional but recommended before real customer traffic: Sentry (or similar) error monitoring — no account exists yet, ask before creating one (per the standing rule below).

## Standing rules from you (do not relitigate these without asking)

- **Keep `TODO.md` as the living list of open items** — you asked for this explicitly; every phase/decision that leaves something open gets logged there rather than lost in chat.
- **Don't create paid third-party accounts (Stripe, Resend, Sentry, etc.) without asking first** — you create these yourself; I only wire in the resulting keys.
- Real product photography replaces the placeholder hero illustration once physical inventory exists to photograph — not before.
- Fix-forward on migrations: never edit an already-applied migration file, always add a new one.

## Architecture notes worth knowing before touching the backend

- **RLS + `SECURITY DEFINER` functions are the only mutation path** for anything sensitive (checkout, pack assignment, opening sessions, shipping, donation disposition, refunds). The app's authenticated/anon Supabase clients cannot write these tables directly.
- **Every sensitive function must have its `EXECUTE` grant explicitly revoked from `anon`, `authenticated`, AND `PUBLIC`.** Postgres grants `EXECUTE` to `PUBLIC` by default on function creation — revoking only from `anon`/`authenticated` looks right but does nothing, because `PUBLIC` grants apply regardless of role. This bit us twice already (Phase 8's `finalize_paid_order` etc., and Phase 9's `extend_order_reservations`) — always verify with:
  ```sql
  select grantee, privilege_type from information_schema.role_routine_grants where routine_name = '<fn>';
  ```
  Should show only `service_role` and `postgres`.
- **Stripe webhook is the sole authority for payment success** — never the browser's checkout success redirect. `checkout.session.completed` now branches on `session.payment_status`: `'paid'` finalizes immediately (card); `'unpaid'` means a delayed method (ACH) is pending, so it records `payments.status = 'processing'` and extends the reservation instead of finalizing. `checkout.session.async_payment_succeeded` / `async_payment_failed` resolve that pending state later.
- **`FOR UPDATE SKIP LOCKED`** is how concurrent checkouts race-safely claim distinct physical inventory units (`reserve_inventory_for_order_item`).
- **Guest customers** (no Supabase Auth account) get a random `guest_access_token` to look up their order at `/orders/[token]` — this is the only way a non-staff customer can view their order today (see "no supporter sign-in" in `TODO.md`).
- **Append-only audit log** (`record_audit_log`, `audit_logs` table) — no role has UPDATE/DELETE on it, by design.
- The Supabase CLI is linked to production (`supabase db push` / `supabase db query --linked "..."`) — there's no local Docker Postgres stack, so all migrations apply directly to the live database. Be careful with ad hoc `db query` writes outside of migrations (used deliberately for the demo inventory seed, documented in `TODO.md`).

## Known limitations (short version — full list in `TODO.md`)

- No live end-to-end Stripe test yet (no real account).
- No transactional email at all yet (no Resend account).
- Admin pages (`/admin/*`) are functional but only lightly re-skinned — no full design pass.
- No supporter sign-in/account page — guest-token lookup only.
- No CSV bulk inventory import — one unit at a time via the Receive Inventory form (or direct SQL, as used for the demo seed).
- No refund-initiation UI (refunds are recorded after being issued manually in the Stripe dashboard).
- Reports page has no date-range filter or per-campaign breakdown, and its "Estimated Net Funds Raised" doesn't subtract processing fees or shipping cost.
- Out of MVP scope entirely, by design: QR/barcode scanning, SMS, native mobile app, Shopify integration, card grading, multi-nonprofit SaaS.

## If you're a fresh Claude session reading this cold

1. Run `git log --oneline -20` and `cat TODO.md` to confirm this doc isn't stale — TODO.md is updated more frequently than this one.
2. Confirm the Supabase CLI is still linked: `supabase projects list` should show `tccqeiohsiilvumrjtgp` with `"linked": true`.
3. Don't assume any `STRIPE_*` or `EMAIL_*` env var has a real value — check `TODO.md`'s "Blocking / needs your input" section first, it tracks this precisely.
4. Before writing a new migration, check `supabase/migrations/` for the latest timestamp and read the last 2-3 files to see the current schema state and naming convention (`YYYYMMDDHHMMSS_phaseN_description.sql`).
5. Full gate before considering any change done: `npm run typecheck && npm run lint && npm run test && npm run build && npm run test:e2e`.
