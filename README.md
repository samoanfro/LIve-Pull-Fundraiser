# Live Pull Fundraising Platform

**Status: Phase 8 (Audit History & Exception Handling) done.** Every sensitive state transition (pack assignment, opening confirmation/mismatch, opening completion, pull creation, donation-back confirmation, shipping updates) writes an append-only, before/after audit row — no role, including admin, can update or delete an audit entry. Admin has an Audit History viewer, an Orders list with Record Refund / Mark Disputed, and authorized-correction functions for pulled items, inventory status, and staff roles. This phase also caught and fixed a real pre-existing authorization gap: several Phase 4/6/7 database functions had no internal permission check and were callable directly by any client — confirmed fixed with a real unauthenticated REST call. Phase 4 (Stripe Checkout & Inventory Reservations) is built and verified at the database level, but **still not live-tested against a real Stripe account** — `STRIPE_SECRET_KEY`/`STRIPE_WEBHOOK_SECRET` remain blank in `.env.local`. See `TODO.md` for the full running list of open items, `CLAUDE.md` and `PRODUCT_BUILD_SPEC.md` for the source of truth before any architectural changes.

## Project Purpose

A transparent, mobile-first nonprofit e-commerce platform. A supporter purchases a real physical collectible pack, the specific physical pack assigned to their order is opened live or on recorded video, and the actual contents pulled are attributed to that supporter. The supporter then chooses to have the items shipped or donated back to the nonprofit.

This is **not** a raffle, sweepstakes, gambling product, or chance-based prize mechanic — it is standard e-commerce with full chain-of-custody tracking from inventory receipt through final disposition. See `PRODUCT_BUILD_SPEC.md` §2–3 for the non-negotiable rules and compliance boundary.

## Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript — scaffolded and running
- **Styling:** Tailwind CSS 4 — scaffolded and running
- **Database:** PostgreSQL via Supabase — `organizations`/`profiles`/`organization_members` live, RLS enabled
- **Auth:** Supabase Auth (+ Row Level Security) — magic link sign-in working, role-gated admin shell
- **Payments:** Stripe Checkout + verified, idempotent webhooks — not yet wired up (Phase 4)
- **Email:** Resend — not yet wired up
- **Hosting:** Vercel — not yet deployed
- **Testing:** Vitest (unit) + Playwright (E2E) — installed and running with smoke tests
- **CI:** GitHub Actions (`.github/workflows/ci.yml`) — lint, typecheck, unit tests, build, E2E on every push/PR
- **Source control:** GitHub (`samoanfro/LIve-Pull-Fundraiser`)

## Local Development Requirements

- Node.js 24+ (matches CI; Node 20+ likely works but is untested here)
- npm
- A Supabase project (local CLI or hosted) — required starting Phase 1
- A Stripe account in test mode — required starting Phase 4
- A Resend account (or equivalent transactional email provider) — required starting Phase 4/6

## Environment Variables

Copy `.env.example` to `.env.local` and fill in real values. **Never commit `.env.local` or any file containing real secrets.**

| Variable | Purpose |
| --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (public) |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Supabase anon/publishable key (public) |
| `SUPABASE_SECRET_KEY` | Supabase service-role key — **server-side only, never expose to the browser** |
| `STRIPE_SECRET_KEY` | Stripe secret key — server-side only |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Stripe publishable key (public) |
| `STRIPE_WEBHOOK_SECRET` | Used to verify Stripe webhook signatures |
| `NEXT_PUBLIC_APP_URL` | Base URL of the app (for redirects, links in emails) |
| `EMAIL_PROVIDER_API_KEY` | Resend (or equivalent) API key — server-side only |
| `EMAIL_FROM_ADDRESS` | From-address for transactional email |

## Database Setup

1. Create a Supabase project (this repo is linked to a hosted project via `supabase link`; ask a maintainer for access, or create your own project and re-link for a personal dev environment).
2. `supabase login`, then `supabase link --project-ref <your-project-ref>`.
3. Apply migrations: `supabase db push`.
4. `supabase/seed.sql` (safe, non-real demo data per `PRODUCT_BUILD_SPEC.md` §42) does not exist yet — it lands with the Phase 2 campaign/product/inventory schema.
5. RLS is enabled on every table as of Phase 1 — verify new tables follow the same default-deny pattern (see `supabase/migrations/20260914000000_phase1_auth_org.sql` for the pattern: SECURITY DEFINER helper functions to avoid policy self-recursion).

## Running Migrations

```bash
supabase db push               # push new migrations to the linked project
supabase migration list        # confirm local/remote migration state match
supabase db query "<sql>" --linked   # run an ad-hoc query against the linked project (bypasses RLS — use with care)
```

There is no local Postgres/Docker stack running yet (`supabase start` is not part of the current workflow) — all migrations apply directly to the linked hosted project. This is fine for now (empty pre-launch project) but should be revisited before real customer data exists.

## Running the Application

```bash
npm install
npm run dev
```

Then open http://localhost:3000.

## Running Tests

```bash
npm run lint         # ESLint
npm run typecheck    # TypeScript, no emit
npm run test         # Vitest unit tests
npm run test:watch   # Vitest in watch mode
npm run test:e2e     # Playwright end-to-end tests (builds and runs the app first)
```

## Development Method

See `CLAUDE.md` for the required working method (inspect before editing, state the phase, smallest coherent change, migrations + tests per change, no silent chain-of-custody or pack-assignment changes).
