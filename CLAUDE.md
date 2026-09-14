# CLAUDE.md — Live Pull Fundraising Platform

## Mission
Build a transparent nonprofit e-commerce fundraising application where each supporter purchases a real physical product or pack, the assigned physical pack is opened live or on recorded video, and the actual contents are attributed to that supporter.

Read `PRODUCT_BUILD_SPEC.md` before making architectural or workflow changes.

## Non-Negotiable Product Rules
- No gambling, betting, raffles, sweepstakes, cash-out, wallet, stored value, instant buyback, peer-to-peer resale, speculative trading, or chance-based cash prize features.
- Every individually tracked physical pack has a permanent unique Pack ID.
- Preserve the full chain of custody:
  Inventory → Product → Pack ID → Order Item → Customer → Opening Session → Pulled Items → Ship / Donate Back → Final Disposition.
- Never silently reassign a pack.
- Never silently reassign a pulled item.
- Sensitive corrections require append-only audit history.
- Stripe webhook confirmation is authoritative for successful payment, not the browser redirect.
- Inventory reservation and pack assignment must be database-safe and resistant to race conditions.
- Use database migrations for schema changes.
- Use Supabase Row Level Security plus server-side authorization.
- Keep service-role keys and Stripe secrets server-side only.
- Mobile-first UX for supporters and opening staff.
- Build inventory receiving directly in this application; do not create or depend on AppSheet as a second system of record.
- Do not rewrite unrelated working functionality.

## Preferred MVP Stack
- Next.js App Router
- React
- TypeScript
- Tailwind CSS
- PostgreSQL / Supabase
- Supabase Auth
- Stripe Checkout + verified webhooks
- Vercel
- Resend or SendGrid
- GitHub
- Vitest/Jest + Playwright

## Development Method
For every task:
1. Inspect existing code before editing.
2. State which build phase and requirement you are implementing.
3. Make the smallest coherent change that preserves working functionality.
4. Add or update database migrations.
5. Add or update automated tests.
6. Run lint, typecheck, unit tests, and relevant E2E tests.
7. Summarize changes, migrations, tests, manual setup, known risks, and next step.

## High-Risk Actions
Stop and explain before implementing any change that materially alters:
- chain of custody,
- customer ownership of opened contents,
- Pack ID assignment,
- Stripe/payment finalization,
- Ship / Donate Back behavior,
- role permissions,
- audit-history requirements,
- compliance boundaries.

Do not delete or rewrite applied shared migrations. Do not bypass safeguards to make tests pass.

## Definition of Done for a Phase
- App builds.
- Typecheck passes.
- Lint passes.
- Migrations apply cleanly to a fresh database.
- Relevant tests pass.
- No secrets are committed.
- RLS/role behavior for the affected feature is verified.
- Chain of custody remains intact.
- Mobile layout is checked.
- README / implementation notes are updated.

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
