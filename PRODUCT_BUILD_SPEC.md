LIVE PULL FUNDRAISING PLATFORM

Product, Technical & Claude Code Build Specification

Version 2.0 — MVP Build Source of Truth


Purpose: Give Claude Code or a software development team enough detail to build a reliable, mobile-first nonprofit fundraising application without inventing core business rules.


Core principle: This is an e-commerce fundraising platform. A supporter buys a real physical product, the supporter’s assigned pack is opened, and the actual contents are assigned to that supporter.


# 1. Executive Summary

Build a simple, trustworthy, mobile-first web application for nonprofit fundraising through the sale of real collectible packs, curated packs, boxes, or fundraiser bundles. After a supporter purchases a product, a specific physical pack is assigned to the order. That assigned pack is opened live or by recorded video. The actual items pulled are recorded against the pack and order. The supporter then chooses physical shipment or voluntarily donates the items back to the nonprofit.

The MVP must emphasize transparent e-commerce, auditable physical inventory, accurate opening operations, simple fulfillment, and clear fundraising reporting.

# 2. Non-Negotiable Product Rules

- Every purchase corresponds to a real physical product or pack.

- Every individually tracked physical pack has a permanent unique Pack ID.

- A paid order must be linked to the specific inventory unit(s) assigned to it.

- Once assigned, a pack cannot be silently reassigned.

- The exact contents opened from the assigned pack belong to that supporter unless a documented refund/correction applies.

- Every pulled item remains linked to Pack ID, Order, Customer, and Opening Session.

- The supporter may choose Ship or Donate Back after opening.

- Important admin corrections must create immutable audit-history records.

- No cash-out, wallet, stored value, instant buyback, customer resale, wagering, raffle, sweepstakes, or chance-based cash prize mechanics.

- The system must be usable on a phone by both supporters and staff.

# 3. Product Positioning & Compliance Boundary

Position the platform as standard e-commerce used for nonprofit fundraising. The supporter buys a disclosed physical product at a disclosed price. Contents may vary, but the supporter receives the actual contents of the specific physical pack assigned to the order.

## Do not introduce in MVP

- Cash-out or withdrawal features

- Stored-value wallets or monetary credits

- Instant or guaranteed buybacks

- Peer-to-peer resale or speculative trading

- Paid raffles, lotteries, sweepstakes, or purchase-linked prize drawings

- Cash prizes based on chance

- Casino-style mechanics, slot animations, roulette, or spin wheels tied to purchases

- Cryptocurrency, tokenized ownership, or fractional ownership

- Guaranteed value, guaranteed profit, or investment-return claims

Compliance note: Product design should flag possible charitable-solicitation, tax, consumer-protection, payment-processing, shipping, and gambling-law questions for professional review. The application should not claim legal compliance merely because another platform uses similar mechanics.

# 4. Core Customer Promise

Purchase a real pack. Watch us open your assigned pack. Receive exactly what is pulled, or donate those items back to support the nonprofit.

# 5. Success Criteria for MVP

- Create and publish campaigns and products.

- Load individually tracked pack inventory.

- Sell products securely through Stripe.

- Prevent overselling and double assignment.

- Assign specific inventory units to paid order items.

- Operate an opening queue and opening sessions.

- Confirm the physical Pack ID before opening.

- Record pulled items and optional item photos.

- Notify the customer when pull results are available.

- Allow Ship or Donate Back decision.

- Track shipping and donation-back disposition.

- Show useful campaign, inventory, fulfillment, and financial reporting.

- Preserve an audit trail for sensitive changes.

# 6. Primary Users & Permissions

| Role | Can Do | Cannot Do |
| --- | --- | --- |
| Supporter / Guest | Browse, buy, view own orders/pulls, choose Ship/Donate, confirm shipping | View other customers, change assignments, admin actions |
| Event Host | View opening queue, confirm pack, start/complete opening, record pulls | Change pricing, issue refunds, silently reassign packs |
| Fulfillment Staff | View shipping queue, create/update shipping records, tracking, mark shipped | Modify pulls or pack assignment |
| Support Staff | Search orders, resend communications, add internal notes | High-risk financial or custody changes unless explicitly granted |
| Admin | Manage campaigns, products, inventory, orders, sessions, reporting, approved corrections | Bypass audit requirements |
| Org Owner / Super Admin | Manage organization settings, staff roles, sensitive controls | Bypass immutable audit history |

# 7. Customer Journey

1. Browse nonprofit campaign.

1. Open a product page and review product, price, campaign purpose, contents disclosure, opening method, shipping terms, and refund policy.

1. Add product to cart.

1. Begin checkout; inventory is temporarily reserved.

1. Complete Stripe Checkout.

1. Stripe webhook confirms successful payment.

1. Reservation converts to sold/assigned inventory.

1. Customer receives order confirmation.

1. Order enters opening queue.

1. Customer watches live session or later recording.

1. Assigned pack is confirmed and opened.

1. Pulled items are recorded.

1. Customer receives results notification.

1. Customer views My Pulls or secure guest-order link.

1. Customer chooses Ship My Items or Donate Back.

1. Fulfillment or donation-back disposition is completed.

1. Order moves to Completed.

# 8. Admin Operations Journey

1. Create campaign and fundraising purpose.

1. Create product and required disclosures.

1. Receive inventory and create unique inventory units / Pack IDs.

1. Publish product.

1. Monitor paid orders and exceptions.

1. Create opening session and load eligible paid orders into opening queue.

1. Host confirms expected Pack ID against physical pack.

1. Host records pulls and completes opening.

1. Supporter is notified and makes fulfillment choice.

1. Fulfillment team processes shipment or donation-back record.

1. Admin monitors exceptions, inventory, campaign totals, and audit logs.

# 9. Chain of Custody

Chain of custody is a primary product requirement, not an optional reporting feature.

Inventory → Product → Pack ID → Order Item → Customer → Opening Session → Pulled Items → Ship / Donate Back → Final Disposition

All relationships above must be queryable. Historical relationships must remain visible after authorized corrections.

# 10. Product vs. Inventory Unit

| Concept | Meaning | Example |
| --- | --- | --- |
| Product | The public item being sold; reusable catalog definition. | 2026 Collectible Hobby Pack — $29.00 |
| Inventory Unit / Pack | One specific physical unit that can be assigned to one order. | PACK-000482 |
| Order Item | The customer's purchased line item. | Order 1047, line 1, qty 2 |
| Opened Pack | Record of the opening of one assigned physical inventory unit. | PACK-000482 opened in SESSION-003 |
| Pulled Item | A physical item found in that opened pack. | Card / collectible / item record |

Do not implement individually tracked inventory as quantity-only stock. Quantity may be used for catalog availability, but any product configured as pack-tracked must have one inventory-unit row per physical unit.

# 11. Inventory Lifecycle

| Status | Meaning |
| --- | --- |
| AVAILABLE | Unit is physically present and can be sold. |
| CHECKOUT_RESERVED | Temporarily held for an active checkout. |
| SOLD | Payment confirmed. |
| ASSIGNED | Linked to a specific paid order item. |
| QUEUED | Scheduled for opening. |
| OPENING | Opening is in progress. |
| OPENED | Physical pack has been opened. |
| FULFILLMENT_PENDING | Waiting for Ship/Donate decision or processing. |
| SHIPPED | Physical pulled items shipped. |
| DONATED_BACK | Supporter elected to return/retain items with nonprofit. |
| DAMAGED | Removed from sale due to physical condition. |
| MISSING | Unit cannot be located; exception requires audit. |
| VOIDED | Administrative closure with reason and audit history. |

# 12. Checkout Reservation Rules

- When checkout starts, eligible physical inventory units may be placed in CHECKOUT_RESERVED.

- Default reservation target: 15 minutes, configurable later.

- A reserved unit cannot be sold to another checkout while the reservation is active.

- On successful Stripe payment webhook, reservation becomes SOLD and then ASSIGNED to the paid order item.

- On checkout expiration or failed payment, release the reservation back to AVAILABLE.

- Assignment must be transaction-safe at the database level to prevent race conditions.

- Never trust browser success redirects as proof of payment; Stripe webhook is authoritative.

# 13. Order Lifecycle

| Order Status | Meaning |
| --- | --- |
| PENDING_PAYMENT | Checkout created; not paid. |
| PAID | Payment confirmed by Stripe webhook. |
| PACK_ASSIGNED | Specific pack(s) linked to order item(s). |
| QUEUED_FOR_OPENING | Order/packs queued for a session. |
| OPENING_IN_PROGRESS | At least one assigned pack currently being opened. |
| OPENED | All pack openings recorded. |
| AWAITING_CUSTOMER_DECISION | Waiting for Ship or Donate Back. |
| SHIP_REQUESTED | Customer requested shipment. |
| DONATE_BACK_SELECTED | Customer selected donation-back. |
| FULFILLMENT_IN_PROGRESS | Shipping or donation-back processing underway. |
| SHIPPED | Shipment sent with tracking where applicable. |
| COMPLETED | Operational lifecycle complete. |
| CANCELLED | Cancelled under policy before completion. |
| REFUND_PENDING | Refund initiated. |
| REFUNDED | Refund completed. |
| DISPUTED | Chargeback/payment dispute or related exception. |

# 14. Opening Session & Queue

Opening Session fields:

- session_id

- organization_id

- campaign_id

- event_id (optional)

- host_user_id

- scheduled_at

- started_at

- ended_at

- status

- livestream_url

- recording_url

- internal_notes

Opening Queue records should include:

- queue_id

- opening_session_id

- order_id

- order_item_id

- inventory_unit_id / Pack ID

- sequence_number

- queue_status

- queued_at

- started_at

- completed_at

# 15. Pack Confirmation Before Opening

The host must verify the physical pack before the opening begins. MVP may use manual entry and a confirm button; architecture must be ready for QR/barcode scanning.

- Display expected Pack ID prominently.

- Require host to confirm the physical Pack ID.

- If entered/scanned Pack ID does not match, block normal opening flow and show an exception.

- Do not silently substitute another available pack.

- Record host, confirmation time, and confirmed Pack ID.

# 16. Opening & Pull Recording

- Start opening only after pack confirmation.

- Create an Opened Pack record tied to session, order, order item, customer, and inventory unit.

- Allow host to add one or more Pulled Item records.

- Pulled Item fields: item_id, opened_pack_id, pack_id, order_id, customer_id, title/name, category, description/notes, quantity, optional image URL, optional external reference, created_by, created_at.

- MVP does not require automated valuation or grading.

- Completing an opening locks the normal host workflow from casual editing.

- Corrections after completion must preserve before/after values in audit history.

# 17. Supporter Pull Results

The pull-results screen should prioritize confidence and simplicity:

- Product and Pack ID

- Opening date/session

- Opening video or livestream recording link when available

- Each pulled item with photo if available

- Order status

- Large Ship My Items button

- Large Donate Back button

- Clear explanation that the decision applies to the physical items shown

# 18. Ship vs. Donate Back

## Ship

- Supporter confirms shipping address.

- Create Shipping Request linked to order and customer pulls.

- Track status: REQUESTED, ADDRESS_CONFIRMED, LABEL_CREATED, PACKED, SHIPPED, DELIVERED, EXCEPTION.

- Store carrier, service, tracking number, label/reference ID if used, shipped_at, delivered_at where available.

- Do not store unnecessary payment-card data.

## Donate Back

- Require explicit supporter confirmation.

- Record Donation Back with supporter, order, pack, pulled item(s), timestamp, and policy/version accepted.

- Do not automatically claim tax deductibility or assign a charitable fair-market value.

- Preserve original item provenance even if the nonprofit later reuses or disposes of the item.

- Track final disposition separately.

# 19. Donation-Back Disposition

- RECEIVED / RETAINED

- STORED

- REUSED_IN_FUNDRAISER

- SOLD_SEPARATELY_WHERE_ALLOWED

- DONATED_EXTERNALLY

- DISPOSED

- OTHER_WITH_NOTE

Never destroy the historical link to the original supporter, order, Pack ID, opening, and pulled item.

# 20. Refund & Cancellation Rules

- Refund behavior must depend on the published fundraiser/refund policy.

- Do not automatically return an already-opened pack to available inventory.

- A refund after opening is an exception and should not erase the opening or pull records.

- Stripe refund IDs and statuses should be stored.

- Cancellation or refund must create audit entries and preserve the original transaction history.

- If a payment dispute occurs after opening, set order to DISPUTED and route to admin exception handling.

# 21. Audit Log Requirements

Audit at minimum:

- Pack assignment and reassignment

- Opening confirmation

- Opening completion

- Pull creation / correction / reassignment

- Inventory status adjustment

- Refund / cancellation

- Shipping-address correction

- Tracking changes

- Donation-back selection or admin correction

- Staff role/permission changes

Each audit row should capture:

- audit_id

- organization_id

- actor_user_id

- action

- entity_type

- entity_id

- previous_value JSON

- new_value JSON

- reason

- created_at

- request/session metadata where appropriate

Audit records should be append-only through normal application permissions. Do not build an admin UI that can delete audit history.

# 22. Core Data Model

| Entity | Purpose |
| --- | --- |
| organizations | Nonprofit/operator tenant data |
| profiles | Application users mapped to auth users |
| organization_members | Role and organization membership |
| campaigns | Fundraising campaigns |
| events | Scheduled fundraiser/opening events |
| products | Catalog definitions |
| inventory_units | Individual physical Pack IDs |
| customers | Supporter/customer profile |
| orders | Commerce order |
| order_items | Purchased product lines |
| inventory_reservations | Temporary checkout holds |
| order_inventory_assignments | Specific pack-to-order-item linkage |
| payments | Stripe payment identifiers/status |
| opening_sessions | Live/recorded opening event |
| opening_queue | Pack-level queue entries |
| opened_packs | Completed/in-progress pack opening record |
| pulled_items | Actual items from opened pack |
| customer_pulls | Customer ownership/attribution layer if needed |
| shipping_requests | Ship choice and fulfillment data |
| donation_backs | Donate-back election |
| donation_back_items | Specific donated-back pulled items |
| refunds | Refund records |
| notifications | Email/SMS notification log |
| internal_notes | Authorized staff notes |
| audit_logs | Append-only sensitive action history |

# 23. Key Database Constraints

- inventory_units.pack_id must be unique within the platform or organization according to chosen ID strategy.

- One inventory unit cannot be actively assigned to two paid order items.

- A completed opened_pack must reference exactly one inventory unit and one order item.

- Pulled items must inherit or validate Pack ID / order relationships from the opened pack.

- Foreign keys should be used for custody relationships.

- Use database transactions for reservation conversion and pack assignment.

- Use soft-archive/status patterns rather than deleting material custody records.

- Use created_at and updated_at consistently; sensitive changes also require audit rows.

# 24. Authentication & Row-Level Security

- Use Supabase Auth or equivalent.

- Support email/password or magic-link authentication; guest purchasers can use secure order-access links.

- Use organization membership and roles for staff authorization.

- Enable Row Level Security on exposed Supabase tables.

- Supporters can only read records belonging to their own authenticated identity or valid secure order token.

- Hosts can only perform opening functions granted to their role.

- Fulfillment staff cannot alter pulls or pack assignments.

- Service-role secrets must remain server-side only.

- Never trust client-side role checks as the only authorization control.

# 25. Payments

- Stripe Checkout is the preferred MVP payment flow.

- Store Stripe customer ID, checkout session ID, payment intent/charge identifiers as appropriate, status, amount, currency, timestamps.

- Do not store raw card numbers or CVC.

- Use server-side Stripe webhook signature verification.

- Webhook processing must be idempotent.

- Payment success webhook triggers paid-order finalization and reservation conversion.

- Implement failure/expiration paths without overselling inventory.

- Support refunds through approved admin workflow.

# 26. Notifications

MVP email events:

- Order confirmation

- Opening reminder when scheduled

- Opening results available

- Ship/Donate decision reminder

- Donation-back confirmation

- Shipment/tracking confirmation

- Refund/cancellation confirmation where applicable

Use a transactional email provider such as Resend or SendGrid. Notification failures must not corrupt order state.

# 27. Public Screens

- Home / mission

- Campaign listing

- Campaign detail

- Event listing/detail where used

- Product catalog

- Product detail

- Cart

- Stripe Checkout handoff

- Checkout success/status

- FAQ

- Contact/support

- Terms

- Privacy

- Shipping policy

- Refund policy

- Fundraising disclosures

# 28. Supporter Screens

- Sign in / magic link

- Order history

- Order detail

- Opening queue/status

- Opening video/link

- My Pulls

- Pull detail

- Ship My Items

- Donate Back confirmation

- Shipping status

# 29. Admin Screens

- Dashboard / work queues

- Campaigns

- Products

- Inventory / Pack IDs

- Orders

- Customers

- Opening Sessions

- Opening Queue / Host Console

- Pull entry/corrections

- Shipping queue

- Donation-back queue/disposition

- Refunds/exceptions

- Reports

- Audit history

- Staff / roles

# 30. Admin Dashboard Priorities

Favor operational queues over a complicated navigation-heavy back office.

| Card / Queue | Purpose |
| --- | --- |
| Paid / Needs Pack Assignment | Orders that need a physical unit assigned |
| Waiting for Opening | Assigned orders not yet queued/opened |
| Ready to Open | Opening-session queue |
| Opening Exceptions | Pack mismatch or interrupted opening |
| Awaiting Customer Decision | Opened orders waiting for Ship/Donate |
| Ready to Ship | Confirmed shipping requests |
| Donation Back Pending | Items awaiting disposition |
| Refund / Payment Exceptions | Failed, disputed, or refunded transactions |

# 31. Reporting Requirements

## Campaign / Financial

- Gross sales

- Orders

- Packs sold

- Average order value

- Refunds

- Payment processing fees where known

- Shipping collected

- Shipping cost where known

- Product cost where maintained

- Gross fundraising revenue

- Estimated net funds raised

## Operations

- Waiting for opening

- Packs opened

- Awaiting customer decision

- Shipping pending

- Shipped

- Donation-back count/items

- Unresolved exceptions

## Inventory

- Received/created

- Available

- Reserved

- Sold/assigned

- Opened

- Damaged

- Missing

- Adjusted

Support CSV export for core reports. Do not label gross sales as net funds raised.

# 32. Mobile-First UX Rules

- Design customer and host screens for phone use first.

- Use large tap targets and minimal typing.

- Keep purchase and Ship/Donate flows short.

- Use clear product photography and opening video.

- Show progress/status in plain language.

- Host console should display one pack/order task at a time during opening.

- Avoid casino imagery, jackpot language, flashing chance mechanics, and gambling-style urgency.

- Use a modern collectible + nonprofit fundraising visual style.

# 33. Required Disclosures on Product Detail

- What the supporter is buying

- Purchase price

- Whether contents vary

- Product/set/category

- Statement that supporter receives actual contents of assigned physical pack

- Live or recorded opening method

- Expected opening timing where known

- Shipping terms/costs

- Donate-back option

- Refund/cancellation policy

- Nonprofit beneficiary

- Fundraising purpose when appropriate

- Tax-deductibility wording only where legally reviewed and applicable

# 34. Edge Cases & Required Behavior

| Scenario | Required Behavior |
| --- | --- |
| Two buyers attempt last pack | Database-safe reservation/assignment allows only one to secure it; second checkout gets sold-out/unavailable response. |
| Customer buys multiple packs | Assign one unique inventory unit per tracked pack quantity; show each separately in custody/opening records. |
| Host has wrong physical pack | Block opening, show mismatch, create exception; do not substitute silently. |
| Pack damaged before opening | Mark DAMAGED with reason/photo if available; audited replacement process. |
| Livestream fails | Opening workflow remains usable; recording URL can be added later; no custody data loss. |
| Host enters wrong pulled item | Authorized correction preserves original and new values in audit history. |
| Customer never chooses Ship/Donate | Send reminders according to configured policy; do not invent automatic disposition without published policy. |
| Stripe success page loads before webhook | Show processing state until authoritative webhook finalizes order. |
| Webhook delivered twice | Idempotent processing; no duplicate order, assignment, or payment state. |
| Refund after opening | Keep opening/pulls; mark order/refund state; route disposition to exception handling. |
| Chargeback after opening | Set DISPUTED; preserve custody and fulfillment history. |
| Inventory unit missing | Mark MISSING through authorized audited action and route order to exception queue. |

# 35. Technical Architecture

| Layer | Recommended MVP |
| --- | --- |
| Frontend | Next.js App Router + React + TypeScript |
| Styling | Tailwind CSS; shadcn/ui optional |
| Database | PostgreSQL via Supabase |
| Authentication | Supabase Auth |
| Authorization | RLS + server-side role checks |
| Payments | Stripe Checkout + verified webhooks |
| Hosting | Vercel |
| Media | YouTube Unlisted, Vimeo, Mux, or Cloudinary; MVP may store URLs only |
| Email | Resend or SendGrid |
| Shipping | Manual tracking first or Shippo/EasyPost integration when implemented |
| Source Control | GitHub |
| Testing | Vitest/Jest for logic + Playwright for critical end-to-end flows |

# 36. Repository Structure

Suggested structure (Claude may adjust if it documents the reason):

```text
app/
  (public)/
  account/
  admin/
  api/
components/
  public/
  supporter/
  admin/
lib/
  auth/
  db/
  stripe/
  inventory/
  audit/
  permissions/
  notifications/
types/
supabase/
  migrations/
  seed.sql
tests/
  unit/
  e2e/
docs/
  PRODUCT_BUILD_SPEC.md
  DATA_MODEL.md
  WORKFLOWS.md
CLAUDE.md
.env.example
README.md
```

# 37. Development Rules for Claude Code

- Read this specification before making architectural changes.

- Do not add excluded gambling, wallet, resale, or cash-out features.

- Work in small phases and keep the app runnable after each phase.

- Before editing working code, inspect existing structure and preserve unrelated functionality.

- Use database migrations; do not rely on undocumented manual schema changes.

- Do not delete or rewrite prior migrations after they have been applied to shared environments.

- Use TypeScript strict mode where practical.

- Validate external inputs server-side.

- Treat Stripe webhooks as untrusted until signature verified.

- Use idempotency for payment webhooks and sensitive background actions.

- Never place service-role or Stripe secret keys in browser code.

- Use RLS and server-side authorization.

- Log sensitive admin changes.

- Never silently reassign a pack or pull.

- Add automated tests for custody rules and payment/reservation race conditions.

- Run lint, typecheck, unit tests, and relevant end-to-end tests before marking a phase complete.

- Update README and handoff notes as implementation decisions are made.

# 38. CLAUDE.md Project Guardrails

Create a repository-root CLAUDE.md containing at minimum:

```text
PROJECT: Live Pull Fundraising Platform

MISSION
Build a transparent nonprofit e-commerce fundraising application where each supporter purchases a real physical product/pack, the assigned pack is opened, and the actual contents are attributed to that supporter.

NON-NEGOTIABLES
- No gambling, raffle, sweepstakes, cash-out, wallet, stored value, instant buyback, peer-to-peer resale, or chance-based cash prize features.
- Preserve pack-to-order-to-opening-to-pull chain of custody.
- Never silently reassign packs or pulls.
- Sensitive corrections require append-only audit history.
- Stripe webhook is authoritative for payment.
- Use database-safe inventory reservation and assignment.
- Protect customer data with RLS and server-side authorization.
- Keep secrets server-side.
- Mobile-first UX.
- Do not rewrite unrelated working functionality.

WORKING METHOD
1. Inspect existing code.
2. State the phase/task being implemented.
3. Make the smallest coherent change.
4. Add/update migrations and tests.
5. Run lint/typecheck/tests.
6. Summarize files changed, migrations added, tests run, and any remaining risks.
```

# 39. MVP Build Phases

| Phase | Deliverable |
| --- | --- |
| Phase 0 — Foundation | Repo, Next.js/TypeScript/Tailwind, Supabase project wiring, env handling, lint/test setup, CLAUDE.md, README. |
| Phase 1 — Auth & Organization | Auth, profiles, organization, staff membership, roles, RLS baseline. |
| Phase 2 — Campaign/Product/Inventory | Campaign CRUD, product CRUD, Pack ID inventory units, status model, admin inventory UI. |
| Phase 3 — Storefront | Campaign pages, product detail, catalog, cart, guest/account purchase handoff. |
| Phase 4 — Stripe & Reservations | Checkout reservation, Stripe Checkout, webhook verification/idempotency, paid order finalization, pack assignment. |
| Phase 5 — Opening Operations | Opening sessions, queue, host console, pack confirmation, opened-pack record, pull entry. |
| Phase 6 — Supporter Pulls | Order lookup/account, My Pulls, video links, Ship/Donate choice. |
| Phase 7 — Fulfillment | Shipping request/status/tracking, donation-back records/disposition. |
| Phase 8 — Audit & Exceptions | Append-only audit UI, mismatch/correction flows, refund/dispute exception handling. |
| Phase 9 — Reporting & Export | Campaign/ops/inventory metrics, CSV export. |
| Phase 10 — Production Hardening | Security review, RLS tests, accessibility, responsive QA, end-to-end tests, error monitoring, deployment checklist. |

# 40. Phase Acceptance Gates

- App builds successfully.

- Typecheck passes.

- Lint passes.

- New migrations apply cleanly to a fresh database.

- Relevant automated tests pass.

- No secrets are committed.

- Role and RLS behavior is verified for the affected area.

- Custody relationships remain intact.

- Mobile screen reviewed at common phone widths.

- README / implementation notes updated.

# 41. Critical Automated Tests

- Two concurrent checkouts cannot successfully assign the same inventory unit.

- Expired reservation releases inventory.

- Duplicate Stripe webhook does not duplicate order finalization.

- Unauthenticated user cannot read arbitrary orders or pulls.

- Customer A cannot read Customer B pulls.

- Host cannot change completed pack assignment through normal host permissions.

- Fulfillment user cannot edit pull records.

- Pack mismatch blocks opening.

- Completed opening creates correct pack/order/customer/pull relationships.

- Audited correction retains original value and new value.

- Donate-back retains provenance.

- Refund after opening does not erase custody records.

# 42. Seed / Demo Data

Provide safe demo seed data for local development:

- 1 nonprofit

- 2 campaigns

- 3 products

- 20 unique inventory units

- several customers/orders in different lifecycle states

- 1 opening session with queue

- sample pulled items

- sample shipping and donation-back records

Never seed real customer/payment data.

# 43. Environment Variables

- NEXT_PUBLIC_SUPABASE_URL

- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

- SUPABASE_SECRET_KEY or service-role equivalent (server only)

- STRIPE_SECRET_KEY

- NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY

- STRIPE_WEBHOOK_SECRET

- NEXT_PUBLIC_APP_URL

- EMAIL_PROVIDER_API_KEY

- EMAIL_FROM_ADDRESS

Create .env.example with placeholder values. Never commit real secrets.

# 44. Security & Privacy Baseline

- Use least privilege for staff roles.

- RLS enabled for exposed tables.

- Server-only secrets.

- Validate and sanitize external inputs.

- Use Stripe-hosted checkout to reduce card-data scope.

- Rate-limit sensitive public endpoints where appropriate.

- Secure guest-order links with high-entropy tokens and expiration/revocation strategy.

- Avoid exposing customer full names in public livestream UI unless expressly intended and appropriately disclosed.

- Do not expose internal notes publicly.

- Backups and database recovery should be enabled before production.

# 45. Performance & Reliability Baseline

- Do not make opening operations depend on a video provider being available.

- Use optimistic UI carefully; custody-changing actions require confirmed server response.

- Paginate large admin tables.

- Add useful database indexes for order status, Pack ID, customer/order lookup, queue position, campaign/product, and audit entity lookup.

- Gracefully handle failed email, shipping API, or video-link operations without corrupting core order state.

# 46. Features Explicitly Deferred

- Native iOS/Android apps

- QR/barcode scanning implementation (prepare schema/UI hooks now)

- Automated card/item identification

- Automated market value/reference pricing

- Card grading integration

- Shopify integration

- SMS notifications

- Advanced loyalty/referrals

- Leaderboards

- Sponsorship modules

- Multi-location fulfillment

- Multi-nonprofit self-service SaaS onboarding

- Peer resale/trading

- Any wallet/cash-out/buyback mechanics

# 47. Definition of MVP Complete

The MVP is complete when a nonprofit staff member can create a campaign/product, load real Pack IDs, a supporter can securely buy a product, exactly one physical pack is assigned without overselling, a host can confirm and open that exact pack, record the pulls, the supporter can view those pulls and select Ship or Donate Back, staff can complete fulfillment, and an administrator can report on the transaction while the full chain of custody and sensitive change history remains auditable.

# 48. First Instruction to Claude Code

```text
Read this entire build specification and the repository-root CLAUDE.md before coding.

First inspect the repository and report:
1. Current project structure and stack.
2. What already exists versus what is missing.
3. Any conflicts between existing code and this specification.
4. A proposed implementation plan mapped to Phases 0-10.
5. The database migrations you expect to need.
6. Security/RLS risks you see.
7. Tests required for chain of custody, inventory reservation, Stripe webhooks, and permissions.

Do not build the entire app in one pass.

After the assessment, begin with the earliest incomplete phase. Keep each phase runnable and tested. Do not add features that are excluded by the specification. Never silently alter pack assignments or pull assignments.

At the end of every phase, provide:
- files created/changed,
- migrations added,
- tests added and results,
- manual setup still required,
- known risks or TODOs,
- recommended next phase.
```

# 49. Product / Legal Review Checkpoints

Before production launch, obtain appropriate professional review for charitable solicitation, product disclosures, refund/cancellation terms, tax-deductibility statements, donation-back treatment, shipping restrictions, privacy/terms, and any mechanic that could be interpreted as a raffle, sweepstakes, lottery, gambling product, or prize promotion. Technical implementation should preserve the e-commerce model described in this specification.

# 50. Change Control

This specification is the MVP source of truth. If implementation requires a material change to chain of custody, customer ownership, payment flow, pack assignment, compliance boundary, Ship/Donate behavior, or audit requirements, stop and document the proposed change before implementing it. Minor UI implementation details may evolve without changing these core rules.

# 51. Receive Inventory — Mobile Intake Workflow

Receive Inventory is an MVP admin/operations feature and must be built directly into the main application. Do not use AppSheet or a separate spreadsheet/database as the operational source of truth. All received inventory must be written directly to PostgreSQL/Supabase so the same Pack ID later flows into checkout, assignment, opening, pulls, and fulfillment.

## 51.1 Business Goal
- Allow staff to catalog physical packs rapidly from a phone.
- Create or capture a permanent Pack ID at intake.
- Preserve supplier/source, lot/case reference, storage location, condition, cost, photo, notes, received-by, and received-at data.
- Minimize typing for repeated pack intake.
- Prepare for future QR/barcode scanning.

## 51.2 Required Mobile Screen
Create an admin screen named **Receive Inventory** with:
- Product *
- Pack ID * — Generate or Enter/Scan
- Supplier / Source
- Lot / Case / Box Reference
- Storage Location *
- Condition * — Sealed / Damaged / Other
- Unit Cost
- Photo / Take Photo
- Notes
- **Save & Add Next**
- **Save & Finish**

`Save & Add Next` should preserve Product, Supplier, Lot/Case reference, and Storage Location when appropriate, but always clear Pack ID after save.

## 51.3 Pack ID Rules
- Pack ID must be unique and protected by a database uniqueness constraint.
- Pack ID is immutable during normal operation; correction requires an authorized audited action.
- Prefer a human-readable Pack ID such as `PACK-000001` plus an internal UUID primary key.
- Do not use a database row number as the physical Pack ID.
- A vendor barcode may be stored separately as `vendor_barcode` if needed.
- Architecture must allow phone-camera QR/barcode scanning later without changing the inventory model.

## 51.4 Storage Locations
Use a simple `storage_locations` model rather than relying only on free text. Inventory units should reference `storage_location_id`. Support locations such as Warehouse, Room, Shelf, Bin, or Case.

## 51.5 Bulk / Repeated Intake
- MVP must support rapid sequential entry through Save & Add Next.
- A trusted-admin CSV import may be added, but it must create normal inventory-unit records and enforce the same uniqueness, ownership, validation, and audit rules.
- Future case-level receiving can generate multiple Pack IDs, but individually tracked inventory still requires one row per physical pack.

## 51.6 Acceptance Tests
- Phone intake works without horizontal scrolling.
- Duplicate Pack ID is rejected at the database level.
- Double-tapping Save cannot create duplicate inventory.
- Save & Add Next creates exactly one pack and resets Pack ID.
- Supporters cannot access inventory-receiving functions.
- New sealed inventory appears as AVAILABLE.
- Received Pack ID can later flow through reservation, order assignment, opening, pulls, and fulfillment.
- Sensitive corrections produce audit history.
- Photo failure does not duplicate the core inventory record.

## 51.7 Build Priority
Build Receive Inventory in **Phase 2**, immediately after Product and `inventory_units` schema creation. Do not build or maintain a separate AppSheet inventory system for this project.
