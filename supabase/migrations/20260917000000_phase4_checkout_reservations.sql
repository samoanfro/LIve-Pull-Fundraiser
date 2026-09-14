-- Phase 4: Stripe Checkout & Inventory Reservations
-- Tables: customers, orders, order_items, inventory_reservations,
-- order_inventory_assignments, payments, stripe_webhook_events.
--
-- Chain of custody so far: inventory_units -> products (Phase 2).
-- This migration extends it: inventory_units -> order_items -> orders ->
-- customers, and (on payment) inventory_units -> order_inventory_assignments.
-- Do not weaken the uniqueness constraints below; they are what prevents a
-- pack from being sold to two customers.

-- ---------------------------------------------------------------------------
-- customers
-- ---------------------------------------------------------------------------
create table public.customers (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  profile_id uuid references public.profiles (id) on delete set null,
  email text not null,
  name text,
  phone text,
  guest_access_token text,
  guest_token_expires_at timestamptz,
  created_at timestamptz not null default now()
);

create index customers_org_email_idx on public.customers (organization_id, email);
create unique index customers_guest_access_token_unique
  on public.customers (guest_access_token)
  where guest_access_token is not null;

-- ---------------------------------------------------------------------------
-- orders
-- ---------------------------------------------------------------------------
create type public.order_status as enum (
  'PENDING_PAYMENT',
  'PAID',
  'PACK_ASSIGNED',
  'QUEUED_FOR_OPENING',
  'OPENING_IN_PROGRESS',
  'OPENED',
  'AWAITING_CUSTOMER_DECISION',
  'SHIP_REQUESTED',
  'DONATE_BACK_SELECTED',
  'FULFILLMENT_IN_PROGRESS',
  'SHIPPED',
  'COMPLETED',
  'CANCELLED',
  'REFUND_PENDING',
  'REFUNDED',
  'DISPUTED'
);

create table public.orders (
  id uuid primary key default gen_random_uuid(),
  organization_id uuid not null references public.organizations (id) on delete cascade,
  campaign_id uuid references public.campaigns (id) on delete set null,
  customer_id uuid not null references public.customers (id) on delete restrict,
  status public.order_status not null default 'PENDING_PAYMENT',
  subtotal_cents integer not null default 0 check (subtotal_cents >= 0),
  shipping_cents integer not null default 0 check (shipping_cents >= 0),
  total_cents integer not null default 0 check (total_cents >= 0),
  currency text not null default 'usd',
  stripe_checkout_session_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint orders_stripe_checkout_session_id_unique unique (stripe_checkout_session_id)
);

create index orders_customer_status_idx on public.orders (customer_id, status);
create index orders_org_status_idx on public.orders (organization_id, status);

-- ---------------------------------------------------------------------------
-- order_items
-- ---------------------------------------------------------------------------
create table public.order_items (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price_cents integer not null check (unit_price_cents >= 0),
  status text not null default 'pending' check (status in ('pending', 'fulfilled', 'cancelled')),
  created_at timestamptz not null default now()
);

create index order_items_order_idx on public.order_items (order_id);
create index order_items_product_idx on public.order_items (product_id);

-- ---------------------------------------------------------------------------
-- inventory_reservations
-- ---------------------------------------------------------------------------
create table public.inventory_reservations (
  id uuid primary key default gen_random_uuid(),
  inventory_unit_id uuid not null references public.inventory_units (id) on delete cascade,
  order_id uuid not null references public.orders (id) on delete cascade,
  order_item_id uuid not null references public.order_items (id) on delete cascade,
  status text not null default 'active' check (status in ('active', 'expired', 'released', 'converted')),
  reserved_at timestamptz not null default now(),
  expires_at timestamptz not null
);

-- Exactly one ACTIVE reservation may exist per inventory unit at a time.
-- This, combined with FOR UPDATE SKIP LOCKED in reserve_inventory_for_order_item,
-- is what prevents two checkouts from claiming the same pack.
create unique index inventory_reservations_active_unit_unique
  on public.inventory_reservations (inventory_unit_id)
  where status = 'active';

create index inventory_reservations_order_idx on public.inventory_reservations (order_id);
create index inventory_reservations_expires_idx
  on public.inventory_reservations (expires_at)
  where status = 'active';

-- ---------------------------------------------------------------------------
-- order_inventory_assignments (final, post-payment custody link)
-- ---------------------------------------------------------------------------
create table public.order_inventory_assignments (
  id uuid primary key default gen_random_uuid(),
  order_item_id uuid not null references public.order_items (id) on delete restrict,
  inventory_unit_id uuid not null references public.inventory_units (id) on delete restrict,
  assigned_at timestamptz not null default now(),
  assigned_by uuid references public.profiles (id),
  constraint order_inventory_assignments_unit_unique unique (inventory_unit_id)
);

comment on table public.order_inventory_assignments is
  'Append-only: a pack is assigned to at most one order item, ever. A correction must add an audited replacement row (Phase 8), never overwrite this one.';

create index order_inventory_assignments_order_item_idx
  on public.order_inventory_assignments (order_item_id);

-- ---------------------------------------------------------------------------
-- payments
-- ---------------------------------------------------------------------------
create table public.payments (
  id uuid primary key default gen_random_uuid(),
  order_id uuid not null references public.orders (id) on delete restrict,
  stripe_payment_intent_id text,
  stripe_charge_id text,
  status text not null check (status in ('succeeded', 'failed', 'refunded', 'partially_refunded')),
  amount_cents integer not null check (amount_cents >= 0),
  currency text not null default 'usd',
  created_at timestamptz not null default now(),
  constraint payments_stripe_payment_intent_id_unique unique (stripe_payment_intent_id)
);

create index payments_order_idx on public.payments (order_id);

-- ---------------------------------------------------------------------------
-- stripe_webhook_events (idempotency only, not a business table)
-- ---------------------------------------------------------------------------
create table public.stripe_webhook_events (
  stripe_event_id text primary key,
  event_type text not null,
  processed_at timestamptz not null default now()
);

-- ---------------------------------------------------------------------------
-- Reservation function: atomically claim one AVAILABLE unit for a product.
-- ---------------------------------------------------------------------------
create function public.reserve_inventory_for_order_item(
  target_product_id uuid,
  target_order_id uuid,
  target_order_item_id uuid,
  ttl_minutes integer default 15
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  claimed_unit_id uuid;
begin
  -- Lazily release any reservations that expired before we got here, scoped
  -- to this product so this is cheap and doesn't need a global cron to run
  -- correctly (a dedicated sweep function still exists for a scheduled job).
  update public.inventory_units iu
  set status = 'AVAILABLE'
  from public.inventory_reservations ir
  where ir.inventory_unit_id = iu.id
    and ir.status = 'active'
    and ir.expires_at < now()
    and iu.product_id = target_product_id;

  update public.inventory_reservations
  set status = 'expired'
  where status = 'active'
    and expires_at < now()
    and inventory_unit_id in (
      select id from public.inventory_units where product_id = target_product_id
    );

  -- Atomically claim one available unit. FOR UPDATE SKIP LOCKED means a
  -- concurrent call for the same product picks a different row instead of
  -- blocking or double-claiming.
  select id into claimed_unit_id
  from public.inventory_units
  where product_id = target_product_id
    and status = 'AVAILABLE'
  order by received_at asc
  for update skip locked
  limit 1;

  if claimed_unit_id is null then
    return null;
  end if;

  update public.inventory_units
  set status = 'CHECKOUT_RESERVED'
  where id = claimed_unit_id;

  insert into public.inventory_reservations (
    inventory_unit_id, order_id, order_item_id, expires_at
  )
  values (
    claimed_unit_id,
    target_order_id,
    target_order_item_id,
    now() + make_interval(mins => ttl_minutes)
  );

  return claimed_unit_id;
end;
$$;

comment on function public.reserve_inventory_for_order_item is
  'Atomically reserves one AVAILABLE inventory unit for a product using FOR UPDATE SKIP LOCKED. Returns the claimed inventory_unit id, or null if none available (sold out). This is the sole safeguard against two checkouts claiming the same pack -- do not bypass it with a plain SELECT + UPDATE from application code.';

-- ---------------------------------------------------------------------------
-- Release function: return all active reservations for an order to AVAILABLE.
-- Used on checkout expiration/cancellation.
-- ---------------------------------------------------------------------------
create function public.release_order_reservations(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.inventory_units iu
  set status = 'AVAILABLE'
  from public.inventory_reservations ir
  where ir.order_id = target_order_id
    and ir.status = 'active'
    and ir.inventory_unit_id = iu.id;

  update public.inventory_reservations
  set status = 'released'
  where order_id = target_order_id
    and status = 'active';
end;
$$;

-- ---------------------------------------------------------------------------
-- Sweep function: release ALL expired active reservations, org-wide.
-- Intended to be called by a scheduled job (e.g. Vercel Cron) as a backstop
-- in addition to the lazy per-product sweep inside the reserve function.
-- ---------------------------------------------------------------------------
create function public.release_expired_reservations()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  released_count integer;
begin
  with expired as (
    select id, inventory_unit_id
    from public.inventory_reservations
    where status = 'active'
      and expires_at < now()
  )
  update public.inventory_units iu
  set status = 'AVAILABLE'
  from expired
  where expired.inventory_unit_id = iu.id;

  update public.inventory_reservations
  set status = 'expired'
  where status = 'active'
    and expires_at < now();

  get diagnostics released_count = row_count;
  return released_count;
end;
$$;

-- ---------------------------------------------------------------------------
-- Finalize function: convert an order's reservations into sold/assigned
-- inventory on confirmed payment. Called only from the Stripe webhook
-- handler after signature verification. Idempotent: if the order is
-- already PAID or further along, this is a no-op.
-- ---------------------------------------------------------------------------
create function public.finalize_paid_order(target_order_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
declare
  current_status public.order_status;
begin
  select status into current_status from public.orders where id = target_order_id for update;

  if current_status is null then
    raise exception 'Order % not found', target_order_id;
  end if;

  if current_status <> 'PENDING_PAYMENT' then
    -- Already finalized (webhook redelivery) or in a state finalization
    -- should not touch. No-op keeps this idempotent.
    return;
  end if;

  -- Convert each active reservation on this order into a sold + assigned unit.
  update public.inventory_units iu
  set status = 'SOLD'
  from public.inventory_reservations ir
  where ir.order_id = target_order_id
    and ir.status = 'active'
    and ir.inventory_unit_id = iu.id;

  insert into public.order_inventory_assignments (order_item_id, inventory_unit_id)
  select ir.order_item_id, ir.inventory_unit_id
  from public.inventory_reservations ir
  where ir.order_id = target_order_id
    and ir.status = 'active'
  on conflict (inventory_unit_id) do nothing;

  update public.inventory_units iu
  set status = 'ASSIGNED'
  from public.order_inventory_assignments oia
  join public.order_items oi on oi.id = oia.order_item_id
  where oi.order_id = target_order_id
    and oia.inventory_unit_id = iu.id
    and iu.status = 'SOLD';

  update public.inventory_reservations
  set status = 'converted'
  where order_id = target_order_id
    and status = 'active';

  update public.orders
  set status = 'PACK_ASSIGNED', updated_at = now()
  where id = target_order_id;
end;
$$;

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------
alter table public.customers enable row level security;
alter table public.orders enable row level security;
alter table public.order_items enable row level security;
alter table public.inventory_reservations enable row level security;
alter table public.order_inventory_assignments enable row level security;
alter table public.payments enable row level security;
alter table public.stripe_webhook_events enable row level security;

-- customers: a signed-in customer can read their own row (matched by
-- profile_id); org staff can read customers within their org. No public/anon
-- access -- guest order lookup goes through a server-side secure-token
-- function, not direct table RLS, since guests are not auth.uid().
create policy customers_select_self
  on public.customers for select
  to authenticated
  using (profile_id = auth.uid());

create policy customers_select_org_staff
  on public.customers for select
  to authenticated
  using (public.is_org_member(organization_id));

-- orders: a signed-in customer can read their own orders; org staff can read
-- orders within their org. No direct client writes -- orders are created and
-- finalized only via server-side code using the service role.
create policy orders_select_own
  on public.orders for select
  to authenticated
  using (
    exists (
      select 1 from public.customers c
      where c.id = public.orders.customer_id
        and c.profile_id = auth.uid()
    )
  );

create policy orders_select_org_staff
  on public.orders for select
  to authenticated
  using (public.is_org_member(organization_id));

-- order_items: readable by the owning customer or org staff, via the parent
-- order. No direct client writes.
create policy order_items_select_own
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      join public.customers c on c.id = o.customer_id
      where o.id = public.order_items.order_id
        and c.profile_id = auth.uid()
    )
  );

create policy order_items_select_org_staff
  on public.order_items for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.order_items.order_id
        and public.is_org_member(o.organization_id)
    )
  );

-- inventory_reservations: staff-only visibility (operational detail, not
-- customer-facing). No client writes -- only the SECURITY DEFINER functions
-- above touch this table.
create policy inventory_reservations_select_org_staff
  on public.inventory_reservations for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.inventory_reservations.order_id
        and public.is_org_member(o.organization_id)
    )
  );

-- order_inventory_assignments: readable by the owning customer (this is
-- their custody record) or org staff. No direct client writes.
create policy order_inventory_assignments_select_own
  on public.order_inventory_assignments for select
  to authenticated
  using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      join public.customers c on c.id = o.customer_id
      where oi.id = public.order_inventory_assignments.order_item_id
        and c.profile_id = auth.uid()
    )
  );

create policy order_inventory_assignments_select_org_staff
  on public.order_inventory_assignments for select
  to authenticated
  using (
    exists (
      select 1 from public.order_items oi
      join public.orders o on o.id = oi.order_id
      where oi.id = public.order_inventory_assignments.order_item_id
        and public.is_org_member(o.organization_id)
    )
  );

-- payments: staff-only (financial detail). No direct client writes.
create policy payments_select_org_staff
  on public.payments for select
  to authenticated
  using (
    exists (
      select 1 from public.orders o
      where o.id = public.payments.order_id
        and public.is_org_member(o.organization_id)
    )
  );

-- stripe_webhook_events: no client access at all; only the webhook route
-- (service role) touches this table.
create policy stripe_webhook_events_no_access
  on public.stripe_webhook_events for all
  to authenticated
  using (false)
  with check (false);
