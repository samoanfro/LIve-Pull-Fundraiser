# Project TODO

Living list of open items across phases. Updated as each phase completes. Check items off as you address them — I'll keep adding to this rather than losing items in chat history.

## ⚠️ Needs your action before Stripe sign-up

- [ ] **Review payment portal options before signing up for Stripe.** You asked to be reminded of this once Phase 6 is done — don't create the Stripe account until you've compared alternatives (fees, payout timing, dispute handling, nonprofit-specific terms) and confirmed Stripe is the right fit for a nonprofit fundraising use case.

## Compliance decisions needing your (and likely legal) input

- [ ] **No automatic donation tax receipts exist, by design.** This platform is structured as e-commerce (real product, disclosed price), not a charitable donation at purchase time — spec §18/§33/§49 explicitly prohibit automatically claiming tax deductibility or fair-market value. If you want real tax-deductible receipts (e.g. for the Donate Back path), that needs CPA/legal review of the quid-pro-quo calculation before any code is written.
- [ ] **Question to revisit: can the purchase itself be framed as "a donation" (e.g. "all proceeds go to SHi") since the boxes/packs are donated by donors and resold to fund the cause?** Two different things bundled in this question worth separating when we discuss it:
  - Saying "100% of proceeds support SHi" is a true statement about fund use, not a tax claim — the spec already supports this via the campaign's `beneficiary_statement` field and §33's required "nonprofit beneficiary" / "fundraising purpose" disclosures. That part is likely fine as-is, low risk.
  - Calling the *purchase itself* "a donation" in a way that implies the buyer's payment is tax-deductible is the same compliance boundary as the receipts question above (quid pro quo: buyer receives real goods equal to what they paid) — that framing needs legal review before it goes on any product page, regardless of whether the inventory was donor-sourced.
  - Worth discussing: donor-sourced inventory (near-$0 cost basis) could support an accurate, non-deductible-implying claim like "because these boxes were donated to us, nearly all of your purchase price goes directly to the mission" — that's a factual statement about margins, not a tax claim.

## Blocking / needs your input

- [ ] Create a real Stripe account (test mode) and provide `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`, `STRIPE_WEBHOOK_SECRET` — Phase 4 (Checkout/reservations) is built and verified at the database level but not yet live-tested end-to-end.
- [ ] For local Stripe webhook testing you'll need either the Stripe CLI (`stripe listen --forward-to localhost:3000/api/stripe/webhook`) or a deployed environment — plan which before testing Phase 4 live.
- [ ] Set `git config --global user.name` / `user.email` to your real identity — commits are currently attributed to an auto-detected `fredsiaosi@Davids-iMac-Pro.local`.
- [ ] When ready for real transactional email, create a Resend account and provide `EMAIL_PROVIDER_API_KEY` / `EMAIL_FROM_ADDRESS`.

## Known risks / technical debt

- No local Postgres/Docker dev stack (`supabase start`) — all migrations apply directly to the linked hosted project. Fine while pre-launch; revisit before real customer data exists.
- No RLS cross-tenant isolation test yet with a second real organization (only single-org testing so far).
- Campaign/product slugs are unique per-organization, not globally — a multi-org public storefront will eventually need an org-scoped URL path (e.g. `/o/[orgSlug]/campaigns/[slug]`).
- Inventory/campaign/product writes are admin/owner-only in RLS — spec doesn't explicitly assign inventory receiving to other staff roles, so this was scoped conservatively. Widen later if desired.
- No CSV bulk-import for inventory (spec allows deferring this).
- Small crash window in the Stripe webhook handler: if processing fails between claiming the event ID and finishing `finalize_paid_order`, the order could stay stuck at `PENDING_PAYMENT` with the event marked "already processed" (Stripe won't retry). Acceptable for MVP; worth a periodic reconciliation job before real money flows through.
- `record_refund()` only records a refund that staff already issued manually via the Stripe dashboard — it does not call Stripe's Refund API itself. Real refund initiation from the admin UI is a fast-follow, not yet built.
- No admin UI yet for `correct_pulled_item()`, `set_inventory_status()`, or `set_member_role()` — these exist and are audited at the database level (verified directly) but are only callable via SQL/RPC right now, not from a form. Host console still lets a host retry a mismatched Pack ID directly, so the common case is covered; these are for less-common corrections.
- Multi-item order advancement (all items must be opened before the order moves to `AWAITING_CUSTOMER_DECISION`) is implemented but only tested with single-item orders so far.
- Guest order-access link (`/orders/[token]`) is only ever shown on the checkout success page right now — with no Resend/email wired up, a guest who closes that tab without bookmarking the link has no way to get back in. This needs to be fixed once email notifications exist (Phase 4/6 dependency on Resend).
- No dedicated supporter sign-in flow yet — only the guest-access-token path exists for customers; a signed-in customer account path (via the same Supabase Auth used by staff) isn't built.
- Shipping/donation admin queues (Shipping Queue, Donation Back Queue) have no pagination or filtering — fine for low volume, will need it once real order volume grows.
- No shipping cost/carrier API integration (Shippo/EasyPost) — tracking is entered manually by staff, per spec's MVP allowance (§39 Phase 7).
- No notification is sent to the customer when their shipment ships or their donation disposition is recorded (Resend/email dependency, same as the guest-link issue above).

## Deferred by design (per PRODUCT_BUILD_SPEC.md)

- QR/barcode scanning (architecture ready, not implemented)
- SMS notifications, native mobile apps, Shopify integration, card grading, multi-nonprofit SaaS onboarding — all explicitly out of MVP scope (§46)
