# Live Pull Fundraising Platform

**Status: Pre-Phase 0 (planning stage).** No application code exists yet. This repository currently holds the product/technical specification and the initial technical assessment. See `CLAUDE.md` and `PRODUCT_BUILD_SPEC.md` for the full source of truth before any implementation work begins.

## Project Purpose

A transparent, mobile-first nonprofit e-commerce platform. A supporter purchases a real physical collectible pack, the specific physical pack assigned to their order is opened live or on recorded video, and the actual contents pulled are attributed to that supporter. The supporter then chooses to have the items shipped or donated back to the nonprofit.

This is **not** a raffle, sweepstakes, gambling product, or chance-based prize mechanic — it is standard e-commerce with full chain-of-custody tracking from inventory receipt through final disposition. See `PRODUCT_BUILD_SPEC.md` §2–3 for the non-negotiable rules and compliance boundary.

## Stack (planned)

- **Frontend:** Next.js (App Router), React, TypeScript
- **Styling:** Tailwind CSS
- **Database:** PostgreSQL via Supabase
- **Auth:** Supabase Auth (+ Row Level Security)
- **Payments:** Stripe Checkout + verified, idempotent webhooks
- **Email:** Resend
- **Hosting:** Vercel
- **Testing:** Vitest (unit) + Playwright (E2E)
- **Source control:** GitHub

## Local Development Requirements

_To be finalized in Phase 0._ Expected baseline:

- Node.js 20+
- npm (or pnpm, to be decided in Phase 0)
- A Supabase project (local CLI or hosted)
- A Stripe account in test mode
- A Resend account (or equivalent transactional email provider) for local email testing

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

_To be established in Phase 0/1._ The plan is:

1. Create a Supabase project (or run Supabase locally via the Supabase CLI).
2. Apply migrations from `supabase/migrations/` in order.
3. Run `supabase/seed.sql` for safe, non-real demo data (see `PRODUCT_BUILD_SPEC.md` §42).
4. Verify Row Level Security policies are enabled on every exposed table before connecting a client.

## Running Migrations

```bash
supabase db reset      # local: recreate DB from migrations + seed
supabase db push       # push new migrations to a linked remote project
```

(Exact commands will be confirmed once the Supabase CLI is wired up in Phase 0.)

## Running the Application

```bash
npm install
npm run dev
```

(Scaffolding not yet created — this will work starting in Phase 0.)

## Running Tests

```bash
npm run test        # Vitest unit tests
npm run test:e2e     # Playwright end-to-end tests
```

(Not yet available — test tooling is part of Phase 0.)

## Development Method

See `CLAUDE.md` for the required working method (inspect before editing, state the phase, smallest coherent change, migrations + tests per change, no silent chain-of-custody or pack-assignment changes).
