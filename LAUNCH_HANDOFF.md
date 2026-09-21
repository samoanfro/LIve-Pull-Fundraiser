# Live Pull Launch Handoff

Last updated: September 18, 2026

Use this document to continue launch preparation from another computer. It contains no passwords or secret keys.

## Project Snapshot

- Repository: `https://github.com/samoanfro/LIve-Pull-Fundraiser`
- Production site: `https://socialhealthmarketplace.com`
- Local development URL: `http://localhost:3000`
- Hosting: Vercel project `l-ive-pull-fundraiser`
- Database, authentication, and storage: Supabase project `tccqeiohsiilvumrjtgp`
- Business: Live Pull is owned and operated by Social Health Marketplace LLC, a Utah for-profit company.
- Intended relationship: Live Pull will provide contracted selling and fulfillment services for Social Health Initiative (SHi).
- Current storefront campaign: Fall Fundraiser 2026

The application includes a storefront, cart, Stripe checkout code, inventory reservations, opening-session tools, guest order results, fulfillment workflows, reporting, and a YouTube Live page. The production domain is connected, but the project is not ready for real customer transactions yet.

## Start Here At Home

1. Install Git and the current Node.js LTS release.
2. Clone the repository:

   ```bash
   git clone https://github.com/samoanfro/LIve-Pull-Fundraiser.git
   cd LIve-Pull-Fundraiser
   npm install
   ```

3. Create `.env.local` in the repository root. Obtain each value directly from its provider; never put keys in chat or commit this file.

   ```dotenv
   NEXT_PUBLIC_SUPABASE_URL=
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
   SUPABASE_SECRET_KEY=

   STRIPE_SECRET_KEY=
   NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=
   STRIPE_WEBHOOK_SECRET=

   NEXT_PUBLIC_APP_URL=http://localhost:3000

   EMAIL_PROVIDER_API_KEY=
   EMAIL_FROM_ADDRESS=
   ```

4. Start the application:

   ```bash
   npm run dev
   ```

5. Open `http://localhost:3000`.
6. Before changing code, read `HANDOFF.md`, `TODO.md`, and `DEPLOYMENT.md`.

## Important Transfer Note

This computer currently has uncommitted storefront, footer, cart, YouTube Live, styling, and test changes. They must be reviewed, committed, and pushed to GitHub before relying on a fresh clone at home. Google Drive may copy the working folder, but GitHub should be the source of truth.

## Launch Blockers

Complete these before accepting real payments.

- [ ] Have a Utah attorney review the business structure, fundraising classification, purchase flow, livestream mechanics, and customer disclosures.
- [ ] Sign an agreement between SHi and Social Health Marketplace LLC covering inventory ownership, custody, sales proceeds, service fees, refunds, fulfillment, customer data, liability, and termination.
- [ ] Decide and document which entity is the merchant of record and which entity owns the inventory at each stage.
- [ ] Determine whether Live Pull must register as a professional fundraiser, fundraising consultant, commercial coventurer, or fundraising platform.
- [ ] Approve Terms of Service, Privacy Policy, Refund Policy, Shipping Policy, and livestream rules.
- [ ] Create and verify the correct Stripe business account.
- [ ] Add Stripe test keys locally and in Vercel.
- [ ] Enable card and ACH payments in Stripe.
- [ ] Configure and test the Stripe webhook.
- [ ] Create a Resend account, verify the sending domain, and configure transactional email.
- [ ] Replace all demonstration products, prices, and inventory with verified physical inventory.
- [ ] Photograph the actual products and verify descriptions, condition, quantity, and Pack IDs.
- [ ] Complete one private end-to-end rehearsal from checkout through livestream and fulfillment.

## Legal And Accounting

- [ ] Establish donor acknowledgment procedures that describe donated property without assigning the donor's tax value.
- [ ] Determine the required SHi board approval and documentation for Live Pull's compensation.
- [ ] Decide whether optional contributions will be accepted separately from merchandise purchases.
- [ ] If contributions are accepted, add separate checkout lines, receipts, accounting, refund handling, and reporting.
- [ ] Determine sales-tax registrations and collection rules.
- [ ] Choose the initial sales territory. Start with a limited US pilot unless counsel approves broader sales.
- [ ] Review international consumer protection, taxes, customs, privacy, and charitable-solicitation obligations before enabling worldwide shipping.
- [ ] Confirm permitted use of product names, logos, photographs, and other trademarks.
- [ ] Create a process for Stripe-to-order reconciliation and Live Pull service-fee accounting.

## Payments

- [ ] Test successful card and ACH payments in Stripe test mode.
- [ ] Test declined, abandoned, duplicated, delayed, and failed payments.
- [ ] Test full and partial refunds.
- [ ] Confirm inventory reservations expire correctly after abandoned or failed payments.
- [ ] Confirm pending ACH reservations remain active until settlement or failure.
- [ ] Verify checkout separately displays merchandise, optional contribution, shipping, taxes, fees, and total.
- [ ] Confirm the Stripe account name and checkout statement descriptor match the approved merchant-of-record structure.

## Products And Inventory

- [ ] Record the donor/source, custody date, owner, storage location, condition, and Pack ID for every unit.
- [ ] Decide which items are ordinary sealed-product sales and which are eligible for live opening.
- [ ] Establish procedures for damaged, missing, counterfeit, or incorrectly identified inventory.
- [ ] Test two customers attempting to buy the final available item.
- [ ] Verify sold-out products cannot be added or purchased from stale carts.
- [ ] Remove all placeholder product text and artwork before advertising the site.

## YouTube Live

- [ ] Create or verify the official Live Pull YouTube channel.
- [ ] Schedule a private or unlisted rehearsal stream.
- [ ] Add the scheduled YouTube URL through the admin opening-session workflow.
- [ ] Test scheduled, offline, live, ended, and replay states on the website.
- [ ] Establish written Pack ID selection, opening order, customer identification, and dispute rules.
- [ ] Decide what customer information may be spoken or displayed on stream.
- [ ] Create a backup process for an interrupted stream or failed recording.
- [ ] Retain a log connecting every order, Pack ID, opening, recording, and disposition choice.

## Email And Support

- [ ] Send order, payment, opening, shipping, donation-disposition, cancellation, and refund emails.
- [ ] Give guest customers a secure way to recover a lost order link.
- [ ] Publish and monitor a customer-support email address.
- [ ] Prepare support templates for delays, damaged products, disputed openings, address changes, and refunds.

## Shipping And Fulfillment

- [ ] Define supported shipping regions and rates.
- [ ] Account for packaging, insurance, signature confirmation, and carrier costs.
- [ ] State who pays customs duties and import taxes.
- [ ] Test ship-sealed, open-live-and-ship, and donate-back workflows.
- [ ] Define procedures for incorrect addresses, returned packages, loss, and damage.
- [ ] Add tracking numbers and shipment notifications.

## Security And Reliability

- [ ] Confirm `.env.local` and all secret-bearing files are excluded from Git.
- [ ] Confirm secret keys are only used in server-side modules.
- [ ] Set `NEXT_PUBLIC_APP_URL=https://socialhealthmarketplace.com` in Vercel.
- [ ] Add the production domain to Supabase Auth redirect URLs.
- [ ] Confirm Row Level Security is enabled on every Supabase table.
- [ ] Test data isolation with two organizations or accounts.
- [ ] Verify internal database functions cannot be executed by anonymous or authenticated browser roles.
- [ ] Enable and verify Supabase backups.
- [ ] Add error monitoring and alerts for failed webhooks, email failures, and payment discrepancies.
- [ ] Document recovery steps for a failed deployment or database migration.

## Quality Assurance

- [ ] Run the full automated gate:

  ```bash
  npm run typecheck
  npm run lint
  npm run test
  npm run build
  npm run test:e2e
  ```

- [ ] Test the complete customer journey on desktop and mobile.
- [ ] Test admin inventory, campaign, opening-session, fulfillment, and refund-recording workflows.
- [ ] Test multiple-item orders and every fulfillment choice.
- [ ] Check mobile widths of 375px, 390px, and 428px.
- [ ] Check keyboard navigation, form labels, errors, loading states, and color contrast.
- [ ] Test slow connections, refreshes, duplicate clicks, stale carts, and expired sessions.
- [ ] Check every footer, legal, support, and policy link.
- [ ] Have a person unfamiliar with the project complete a test purchase without guidance.

## Production Launch

- [ ] Add all approved production environment variables to Vercel.
- [ ] Configure the production Stripe webhook URL.
- [ ] Run a production smoke test without charging an unapproved real transaction.
- [ ] Obtain legal, operational, payment, inventory, and fulfillment signoff.
- [ ] Freeze nonessential changes before launch.
- [ ] Run a controlled pilot of approximately 5-10 orders.
- [ ] Reconcile every pilot order, payment, Pack ID, video record, and shipment.
- [ ] Correct pilot findings before public advertising.
- [ ] Monitor Vercel, Supabase, Stripe, email, support, and YouTube during the first event.

## Recommended Work Order

1. Commit and push the current website improvements.
2. Complete the SHi/Live Pull agreement and legal review.
3. Configure Stripe test mode and run payment tests.
4. Configure Resend and transactional email.
5. Replace demo inventory with real photographed products.
6. Perform the private YouTube Live rehearsal.
7. Complete security, accessibility, mobile, and end-to-end QA.
8. Run a controlled pilot before the public launch.

## Do Not Share Or Commit

- Supabase secret keys
- Stripe secret or webhook keys
- Resend API keys
- Customer addresses, emails, or payment information
- `.env.local`

If a secret appears in a screenshot, chat, commit, or shared document, revoke it at the provider, create a replacement, update the environments, and restart or redeploy the application.
