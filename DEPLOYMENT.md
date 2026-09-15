# Deployment Checklist

Tracks what's needed to take this app from local development to a real production deployment. See `TODO.md` for the broader open-items list.

## Hosting

- [x] Vercel project created (`l-ive-pull-fundraiser`), linked to `samoanfro/LIve-Pull-Fundraiser` on GitHub.
- [x] First successful production deployment.
- [x] Custom domain `socialhealthmarketplace.com` connected and verified (apex `A` record to `216.198.79.1`, `www` `CNAME` to the per-domain Vercel target) — confirmed live in-browser, storefront correctly renders real campaign data from Supabase, `/admin` correctly redirects unauthenticated visitors.
- [ ] Set `NEXT_PUBLIC_APP_URL=https://socialhealthmarketplace.com` in Vercel and redeploy (still needed — see below).
- [ ] Add the production domain to Supabase Auth's allowed redirect URLs (still needed — see below).

## Environment Variables (Vercel → Project → Settings → Environment Variables)

| Variable | Scope | Notes |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Production + Preview | `https://tccqeiohsiilvumrjtgp.supabase.co` |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Production + Preview | Full value starting with `sb_publishable_` |
| `SUPABASE_SECRET_KEY` | Production + Preview | Full value starting with `sb_secret_` — **never** expose this with a `NEXT_PUBLIC_` prefix |
| `NEXT_PUBLIC_APP_URL` | Production + Preview | Set to the production URL once known (`https://socialhealthmarketplace.com` after the domain is connected, or the `*.vercel.app` URL until then) |
| `STRIPE_SECRET_KEY` | Production + Preview | Blank until a real Stripe account exists (see `TODO.md`) |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | Production + Preview | Blank until then |
| `STRIPE_WEBHOOK_SECRET` | Production + Preview | Blank until then; set after creating the webhook endpoint in Stripe pointed at `/api/stripe/webhook` |
| `EMAIL_PROVIDER_API_KEY` | Production + Preview | Blank until a Resend account exists |
| `EMAIL_FROM_ADDRESS` | Production + Preview | Blank until then |

Note: the Vercel↔Supabase marketplace integration also adds its own `SUPABASE_*`/`POSTGRES_*` variables (no `NEXT_PUBLIC_` prefix). The app does not read those — they're harmless but unused; safe to ignore or remove later for cleanliness.

## Custom Domain (when ready)

1. In Vercel: Project → Settings → Domains → add `socialhealthmarketplace.com`.
2. Vercel will show the DNS records to add (typically an `A` record or `CNAME`, depending on whether you use the apex domain or a subdomain).
3. In Squarespace (the domain registrar): turn off Domain Lock temporarily, then add/update those DNS records under DNS Settings.
4. Wait for DNS propagation (Vercel's dashboard will show when it's verified).
5. Turn Domain Lock back on in Squarespace.
6. Update `NEXT_PUBLIC_APP_URL` in Vercel to `https://socialhealthmarketplace.com` and redeploy.
7. Update the Supabase Auth allowed redirect URLs (Supabase dashboard → Authentication → URL Configuration) to include the production domain.
8. Once Stripe is live, update Stripe webhook endpoint URL and Checkout success/cancel URLs to the production domain.

## Pre-Launch Security Review

- [ ] Confirm RLS is enabled on every table (see `supabase/migrations/` — every table added since Phase 1 has `alter table ... enable row level security`).
- [ ] Confirm no `.env.local` or other secret-bearing file is committed to git (`.gitignore` already excludes `.env*.local`).
- [ ] Confirm `SUPABASE_SECRET_KEY` and `STRIPE_SECRET_KEY` are never referenced from any file under `app/` without a server-only guard (`lib/supabase/service-role.ts` and `lib/stripe/client.ts` both use `import "server-only"`).
- [ ] Confirm the Phase 8 EXECUTE-grant restrictions on internal-only RPC functions are still in place after any future migration (query `information_schema.role_routine_grants` for `finalize_paid_order` etc. — should show only `service_role` and `postgres`, not `anon`/`authenticated`).
- [ ] Run a fresh RLS smoke test with a second real organization once one exists (not yet done — see `TODO.md`).

## Monitoring

- [ ] Error monitoring (e.g. Sentry) — not yet set up. Requires its own account signup; ask before creating one.
- [ ] Confirm Supabase project has backups enabled (Supabase dashboard → Database → Backups) before any real customer data exists.

## Accessibility & Responsive QA

- [ ] Manual pass on mobile widths (common breakpoints: 375px, 390px, 428px) for: storefront, cart, checkout, My Pulls, Receive Inventory, Host Console.
- [ ] Keyboard navigation check on forms (login, checkout, Receive Inventory).
- [ ] Color contrast check on the dark-mode palette.

None of the above accessibility/monitoring items have been done yet — this file exists to track them, not to claim they're complete.
